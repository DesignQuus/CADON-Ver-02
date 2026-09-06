import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { db } from './db';
import { getStorageSubdir, resolveStoragePath } from './storage';

const SCRIPTS_DIR = path.join(process.cwd(), 'scripts');

function runPythonScript(scriptName: string, args: string[]): Promise<any> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(SCRIPTS_DIR, scriptName);
    const proc = spawn('python', [scriptPath, ...args], {
      cwd: process.cwd(),
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString('utf-8');
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString('utf-8');
    });

    proc.on('close', (code) => {
      if (code !== 0 && !stdout.trim()) {
        return reject(new Error(`Script ${scriptName} failed (code ${code}): ${stderr}`));
      }
      try {
        const jsonStart = stdout.indexOf('{');
        const jsonEnd = stdout.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1) {
          const jsonStr = stdout.substring(jsonStart, jsonEnd + 1);
          resolve(JSON.parse(jsonStr));
        } else {
          resolve(JSON.parse(stdout.trim()));
        }
      } catch {
        resolve({ raw_output: stdout, error: stderr });
      }
    });

    proc.on('error', (err) => {
      reject(err);
    });
  });
}

export async function processCadFilePipeline(
  quotationCaseId: string,
  sourceFileId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const file = db.prepare('SELECT * FROM uploaded_files WHERE id = ?').get(sourceFileId) as any;
  if (!file) {
    return { success: false, error: 'FILE_NOT_FOUND' };
  }

  let effectiveDxfPath = file.storage_path;
  const now = new Date().toISOString();

  // 1. If DWG, run DWG Input Adapter (PROMPT 18 / 18-R1 / 18-R2)
  if (file.file_type === 'DWG') {
    const derivedStorageDir = getStorageSubdir('derived');
    const derivedFileName = `${path.parse(file.stored_file_name).name}__converted.dxf`;
    const derivedDxfPath = path.join(derivedStorageDir, derivedFileName);

    const convRunId = `conv_${Date.now()}`;
    const absoluteSourcePath = resolveStoragePath(file.storage_path);
    const convResult = await runPythonScript('dwg_converter.py', [absoluteSourcePath, derivedDxfPath]);

    db.prepare(`
      INSERT INTO dwg_conversion_runs (
        id, source_file_id, provider, converter_version, source_dwg_signature,
        status, started_at, completed_at, duration_ms, warning_count, warnings_json,
        error_code, error_message, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      convRunId, file.id, convResult.provider || 'LIBREDWG', convResult.converter_version || '0.14',
      convResult.source_dwg_signature || 'AC1015', convResult.status || 'CONVERTED',
      now, new Date().toISOString(), convResult.duration_ms || 100,
      convResult.warning_count || 0, JSON.stringify(convResult.warnings || []),
      convResult.error_code || null, convResult.message || null, now
    );

    if (convResult.status !== 'CONVERTED' && convResult.status !== 'CONVERTED_WITH_WARNINGS') {
      return { success: false, error: convResult.error_code || 'DWG_CONVERSION_FAILED' };
    }

    // Clean up any previous derived DXF files for this source DWG to prevent duplicate listing
    db.prepare(`
      DELETE FROM uploaded_files
      WHERE quotation_case_id = ? AND derived_from_file_id = ? AND upload_status = 'CONVERTED'
    `).run(quotationCaseId, file.id);

    // Register Derived File
    const derivedFileId = `file_drv_${Date.now()}`;
    db.prepare(`
      INSERT INTO uploaded_files (
        id, quotation_case_id, original_file_name, stored_file_name, storage_path,
        file_type, file_role, derived_from_file_id, file_size, checksum,
        upload_status, uploaded_by_user_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      derivedFileId, quotationCaseId, `${file.original_file_name}.dxf`, derivedFileName,
      derivedDxfPath, 'DXF', 'DERIVED', file.id, convResult.derived_dxf_size || 1000,
      convResult.derived_dxf_sha256 || 'checksum', 'CONVERTED', userId, now
    );

    db.prepare('UPDATE dwg_conversion_runs SET derived_file_id = ? WHERE id = ?').run(derivedFileId, convRunId);
    effectiveDxfPath = derivedDxfPath;
  }

  // 2. Parse DXF (PROMPT 04)
  const absoluteDxfPath = resolveStoragePath(effectiveDxfPath);

  // 2-B. Start WebGL binary buffer & HD Vector SVG generation in parallel background
  const derivedStorageDir = getStorageSubdir('derived');
  fs.mkdirSync(derivedStorageDir, { recursive: true });

  const webglBinName = `${quotationCaseId}__cad_webgl.bin`;
  const webglBinPath = path.join(derivedStorageDir, webglBinName);
  const webglPromise = runPythonScript('cad_webgl_exporter.py', [absoluteDxfPath, webglBinPath])
    .then(() => {
      // Synchronize to workspace storage/derived as well
      const localDerived = path.join(process.cwd(), 'storage', 'derived');
      if (fs.existsSync(localDerived) && localDerived !== derivedStorageDir) {
        try {
          fs.copyFileSync(webglBinPath, path.join(localDerived, webglBinName));
          const txtName = webglBinName.replace('__cad_webgl.bin', '__cad_texts.json');
          const srcTxt = path.join(derivedStorageDir, txtName);
          if (fs.existsSync(srcTxt)) {
            fs.copyFileSync(srcTxt, path.join(localDerived, txtName));
          }
        } catch (copyErr) {
          console.warn('WebGL storage sync warning:', copyErr);
        }
      }
    })
    .catch((webglErr) => console.warn('WebGL binary export warning:', webglErr));

  const svgFileName = `${quotationCaseId}__hd_vector.svg`;
  const svgFilePath = path.join(derivedStorageDir, svgFileName);

  const svgPromise = runPythonScript('vector_svg_renderer.py', [absoluteDxfPath, svgFilePath])
    .then((svgResult) => {
      if (svgResult && svgResult.status === 'SUCCESS') {
        db.prepare(`
          DELETE FROM uploaded_files
          WHERE quotation_case_id = ? AND file_role = 'VECTOR_SVG'
        `).run(quotationCaseId);

        const svgFileId = `file_svg_${Date.now()}`;
        db.prepare(`
          INSERT INTO uploaded_files (
            id, quotation_case_id, original_file_name, stored_file_name, storage_path,
            file_type, file_role, derived_from_file_id, file_size, checksum,
            upload_status, uploaded_by_user_id, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          svgFileId, quotationCaseId, `${file.original_file_name}.svg`, svgFileName,
          svgFilePath, 'SVG', 'VECTOR_SVG', file.id, svgResult.svg_size_bytes || 1000,
          'svg_checksum', 'CONVERTED', userId, now
        );
      }
    })
    .catch((svgErr) => console.warn('Vector SVG generation non-blocking warning:', svgErr));

  const parseResult = await runPythonScript('dxf_parser.py', [absoluteDxfPath]);
  if (parseResult.status !== 'SUCCESS') {
    return { success: false, error: parseResult.error_code || 'DXF_PARSE_FAILED' };
  }

  const parseRunId = `parse_${Date.now()}`;
  db.prepare(`
    INSERT INTO cad_parse_runs (
      id, source_file_id, dxf_version, total_entities, entity_counts_json,
      global_bounds_json, status, duration_ms, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    parseRunId, file.id, parseResult.dxf_version, parseResult.total_entities,
    JSON.stringify(parseResult.entity_counts), JSON.stringify(parseResult.global_bounds),
    'SUCCESS', parseResult.duration_ms, now
  );

  // Insert CAD objects batch
  const insertObj = db.prepare(`
    INSERT INTO cad_objects (
      id, parse_run_id, handle, entity_type, layer, color, raw_text,
      bounding_box_json, geometry_data_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertManyObjs = db.transaction((objs: any[]) => {
    for (let i = 0; i < objs.length; i++) {
      const o = objs[i];
      insertObj.run(
        `cad_obj_${parseRunId}_${i+1}`, parseRunId, o.handle, o.entity_type,
        o.layer, o.color, o.raw_text || null, JSON.stringify(o.bounding_box),
        JSON.stringify(o.geometry_data), now
      );
    }
  });
  insertManyObjs(parseResult.objects);

  // 3. Detect Frames & Sheet Candidates (PROMPT 05)
  const tempDir = getStorageSubdir('temp');
  const tempCadJson = path.join(tempDir, `cad_${parseRunId}.json`);
  fs.writeFileSync(tempCadJson, JSON.stringify(parseResult));

  const frameResult = await runPythonScript('frame_detector.py', [tempCadJson]);
  const tempFrameJson = path.join(tempDir, `frame_${parseRunId}.json`);
  fs.writeFileSync(tempFrameJson, JSON.stringify(frameResult));

  // 4. Detect Title Block & Metadata (PROMPT 06)
  const titleBlockResult = await runPythonScript('title_block_detector.py', [tempCadJson, tempFrameJson]);
  const tempTitleJson = path.join(tempDir, `title_${parseRunId}.json`);
  fs.writeFileSync(tempTitleJson, JSON.stringify(titleBlockResult));

  // 5. Structure Classification (PROMPT 07)
  const structureResult = await runPythonScript('structure_classifier.py', [tempTitleJson]);
  const tempStrucJson = path.join(tempDir, `struc_${parseRunId}.json`);
  fs.writeFileSync(tempStrucJson, JSON.stringify(structureResult));

  // Save Drawings to DB
  db.prepare('DELETE FROM drawings WHERE quotation_case_id = ?').run(quotationCaseId);
  db.prepare('DELETE FROM drawing_relationships WHERE quotation_case_id = ?').run(quotationCaseId);

  const insertDwg = db.prepare(`
    INSERT INTO drawings (
      id, quotation_case_id, drawing_index, drawing_no_raw, drawing_no_normalized,
      drawing_name_raw, drawing_name_normalized, revision, material, scale,
      drawing_type, frame_bbox_json, title_block_bbox_json, confidence_score, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const d of structureResult.drawings) {
    insertDwg.run(
      `dwg_${quotationCaseId}_${d.drawing_index}`, quotationCaseId, d.drawing_index,
      d.drawing_no_raw, d.drawing_no_normalized, d.drawing_name_raw,
      d.drawing_name_normalized, d.revision, d.material, d.scale,
      d.drawing_type, JSON.stringify(d.frame_bbox), JSON.stringify(d.title_block_bbox),
      d.confidence_score, d.status, now
    );
  }

  const insertRel = db.prepare(`
    INSERT INTO drawing_relationships (
      id, quotation_case_id, parent_drawing_no, child_drawing_no, relationship_type,
      confidence_score, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  for (let idx = 0; idx < structureResult.relationships.length; idx++) {
    const r = structureResult.relationships[idx];
    insertRel.run(
      `rel_${quotationCaseId}_${idx+1}`, quotationCaseId, r.parent_drawing_no,
      r.child_drawing_no, r.relationship_type, r.confidence_score, now
    );
  }

  // 6. Detect BOM Areas (PROMPT 08)
  const bomAreaResult = await runPythonScript('bom_area_detector.py', [tempCadJson, tempStrucJson]);
  const tempBomAreaJson = path.join(tempDir, `bom_area_${parseRunId}.json`);
  fs.writeFileSync(tempBomAreaJson, JSON.stringify(bomAreaResult));

  db.prepare('DELETE FROM bom_areas WHERE quotation_case_id = ?').run(quotationCaseId);
  const insertBomArea = db.prepare(`
    INSERT INTO bom_areas (
      id, quotation_case_id, drawing_no, table_type, bbox_json, confidence_score, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (let i = 0; i < bomAreaResult.bom_areas.length; i++) {
    const ba = bomAreaResult.bom_areas[i];
    insertBomArea.run(
      `ba_${quotationCaseId}_${i+1}`, quotationCaseId, ba.drawing_no,
      ba.table_type, JSON.stringify(ba.bbox), ba.confidence_score, ba.status, now
    );
  }

  // 7. Extract Raw BOM Rows (PROMPT 09)
  const rawBomResult = await runPythonScript('bom_row_extractor.py', [tempCadJson, tempBomAreaJson]);
  const tempRawBomJson = path.join(tempDir, `raw_bom_${parseRunId}.json`);
  fs.writeFileSync(tempRawBomJson, JSON.stringify(rawBomResult));

  db.prepare('DELETE FROM raw_bom_items WHERE quotation_case_id = ?').run(quotationCaseId);
  const insertRawBom = db.prepare(`
    INSERT INTO raw_bom_items (
      id, quotation_case_id, drawing_no, row_index, item_no_raw, part_no_raw,
      name_raw, specification_raw, material_raw, quantity_raw, quantity_numeric,
      unit_raw, remark_raw, source_handles_json, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (let idx = 0; idx < rawBomResult.raw_bom_items.length; idx++) {
    const rb = rawBomResult.raw_bom_items[idx];
    insertRawBom.run(
      `rb_${quotationCaseId}_${idx + 1}`, quotationCaseId, rb.drawing_no,
      rb.row_index, rb.item_no_raw, rb.part_no_raw, rb.name_raw,
      rb.specification_raw, rb.material_raw, rb.quantity_raw,
      rb.quantity_numeric, rb.unit_raw, rb.remark_raw,
      JSON.stringify(rb.source_handles), rb.status, now
    );
  }

  // 8. Multi-Level BOM & Quantity Roll-Up (PROMPT 10)
  const multiLevelResult = await runPythonScript('multilevel_bom_builder.py', [tempRawBomJson, tempStrucJson, '1.0']);
  const tempMultiJson = path.join(tempDir, `multi_${parseRunId}.json`);
  fs.writeFileSync(tempMultiJson, JSON.stringify(multiLevelResult));

  db.prepare('DELETE FROM flattened_bom_items WHERE quotation_case_id = ?').run(quotationCaseId);
  const insertFlat = db.prepare(`
    INSERT INTO flattened_bom_items (
      id, quotation_case_id, item_key, part_no, name, specification, material,
      total_quantity, unit, source_drawings_json, source_item_ids_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (let idx = 0; idx < multiLevelResult.flattened_bom.length; idx++) {
    const fb = multiLevelResult.flattened_bom[idx];
    insertFlat.run(
      `fb_${quotationCaseId}_${idx+1}`, quotationCaseId, fb.key, fb.part_no,
      fb.name, fb.specification, fb.material, fb.total_quantity, fb.unit,
      JSON.stringify(fb.source_drawings), JSON.stringify(fb.source_item_ids), now
    );
  }

  // 9. BOM Normalization (PROMPT 11)
  const normResult = await runPythonScript('bom_normalizer.py', [tempMultiJson]);
  const tempNormJson = path.join(tempDir, `norm_${parseRunId}.json`);
  fs.writeFileSync(tempNormJson, JSON.stringify(normResult));

  db.prepare('DELETE FROM normalized_bom_items WHERE quotation_case_id = ?').run(quotationCaseId);
  const insertNorm = db.prepare(`
    INSERT INTO normalized_bom_items (
      id, quotation_case_id, raw_name, normalized_name, search_name, direction,
      spec_candidate, material_candidate, quantity, unit, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const normIds: string[] = [];
  for (let idx = 0; idx < normResult.normalized_items.length; idx++) {
    const ni = normResult.normalized_items[idx];
    const nId = `norm_${quotationCaseId}_${idx+1}`;
    normIds.push(nId);
    insertNorm.run(
      nId, quotationCaseId, ni.raw_name, ni.normalized_name, ni.search_name,
      ni.direction, ni.spec_candidate, ni.material_candidate, ni.quantity,
      ni.unit, ni.status, now
    );
  }

  // 10. Master Candidate Matching (PROMPT 12)
  const masterResult = await runPythonScript('master_matcher.py', [tempNormJson]);
  
  db.prepare('DELETE FROM master_candidates WHERE normalized_item_id IN (SELECT id FROM normalized_bom_items WHERE quotation_case_id = ?)').run(quotationCaseId);
  const insertCand = db.prepare(`
    INSERT INTO master_candidates (
      id, normalized_item_id, master_code, standard_name, specification, material,
      rank, total_score, positive_evidence_json, negative_evidence_json, candidate_status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (let i = 0; i < masterResult.results.length; i++) {
    const mr = masterResult.results[i];
    const normId = normIds[i];
    for (let r = 0; r < mr.top_candidates.length; r++) {
      const tc = mr.top_candidates[r];
      insertCand.run(
        `cand_${normId}_${r+1}`, normId, tc.master_code, tc.standard_name,
        tc.specification, tc.material, r + 1, tc.total_score,
        JSON.stringify(tc.positive_evidence), JSON.stringify(tc.negative_evidence),
        r === 0 ? 'TOP_CANDIDATE' : 'ALTERNATIVE', now
      );
    }
  }

  // Cleanup temp files
  [tempCadJson, tempFrameJson, tempTitleJson, tempStrucJson, tempBomAreaJson, tempRawBomJson, tempMultiJson, tempNormJson].forEach(f => {
    if (fs.existsSync(f)) fs.unlinkSync(f);
  });

  // Update Quotation Case status
  db.prepare(`
    UPDATE quotation_cases
    SET status = 'ANALYZED', quote_readiness = 'REVIEW_REQUIRED', updated_at = ?
    WHERE id = ?
  `).run(now, quotationCaseId);

  // Ensure WebGL binary & texts generation has finished before returning
  try {
    await webglPromise;
  } catch (err) {
    console.warn('WebGL promise wait warning:', err);
  }

  // Background Note: svgPromise continues running in parallel and saves VECTOR_SVG file upon completion
  return { success: true };
}
