const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dbPath = 'C:\\Users\\SteveLee\\AppData\\Roaming\\egdesk\\user-data\\development\\projects\\5883d2d5-7b0a-4947-a4fa-1f702c1dbc2f\\user_data.db';

// 1. 안전 백업 생성
const backupPath = dbPath + '.bak_before_cleanup_' + Date.now();
fs.copyFileSync(dbPath, backupPath);
console.log('✅ 데이터베이스 안전 백업 완료:', backupPath);

const db = new Database(dbPath);

const keepCaseId = 'case_1788656891118';
const keepCompanyId = 'comp_sechang';

console.log('\n--- [정리 전] 상태 확인 ---');
const totalCasesBefore = db.prepare('SELECT id, case_name, company_id FROM quotation_cases').all();
console.log('견적 케이스 목록 (' + totalCasesBefore.length + '건):');
totalCasesBefore.forEach(c => console.log(` - [${c.id}] ${c.case_name} (회사: ${c.company_id})`));

const companiesBefore = db.prepare('SELECT id, company_name FROM companies').all();
console.log('\n업체 목록 (' + companiesBefore.length + '개):');
companiesBefore.forEach(c => console.log(` - [${c.id}] ${c.company_name}`));

const projectsBefore = db.prepare('SELECT id, project_name, company_id FROM projects').all();
console.log('\n프로젝트 목록 (' + projectsBefore.length + '개):');
projectsBefore.forEach(p => console.log(` - [${p.id}] ${p.project_name} (회사: ${p.company_id})`));

const priceMasterCount = db.prepare('SELECT count(*) as count FROM price_masters').get().count;
const productMasterCount = db.prepare('SELECT count(*) as count FROM product_masters').get().count;
console.log(`\n기준정보 상태 (보존 대상): price_masters=${priceMasterCount}건, product_masters=${productMasterCount}건`);

// 2. 삭제 트랜잭션 실행
const deleteTransaction = db.transaction(() => {
  // 가상 케이스 ID 추출 (세창인터내셔널의 실제 DWG 케이스 제외)
  const deletedCases = db.prepare('SELECT id FROM quotation_cases WHERE id != ?').all(keepCaseId);
  const deletedCaseIds = deletedCases.map(c => c.id);

  console.log('\n--- 삭제 작업 시작 ---');
  console.log('삭제 대상 케이스 수:', deletedCaseIds.length);

  if (deletedCaseIds.length > 0) {
    const placeholders = deletedCaseIds.map(() => '?').join(',');

    // 연관 테이블 삭제
    const tablesWithCaseId = [
      'quote_items',
      'quotes',
      'final_bom_items',
      'bom_approval_records',
      'master_candidates',
      'normalized_bom_items',
      'flattened_bom_items',
      'raw_bom_items',
      'bom_areas',
      'drawing_relationships',
      'drawings',
      'cad_objects',
      'cad_parse_runs',
      'quotation_case_files'
    ];

    for (const table of tablesWithCaseId) {
      try {
        const info = db.prepare(`PRAGMA table_info(${table})`).all();
        const hasCaseId = info.some(col => col.name === 'case_id');
        if (hasCaseId) {
          const res = db.prepare(`DELETE FROM ${table} WHERE case_id IN (${placeholders})`).run(...deletedCaseIds);
          console.log(` - [${table}] 삭제된 행: ${res.changes}개`);
        }
      } catch (err) {
        // 테이블이 없을 경우 패스
      }
    }

    // quotation_cases 삭제
    const caseRes = db.prepare(`DELETE FROM quotation_cases WHERE id IN (${placeholders})`).run(...deletedCaseIds);
    console.log(` - [quotation_cases] 삭제된 행: ${caseRes.changes}개`);
  }

  // 가상 프로젝트 삭제 (comp_sechang 제외)
  const projRes = db.prepare('DELETE FROM projects WHERE company_id != ?').run(keepCompanyId);
  console.log(` - [projects] 삭제된 가상 프로젝트: ${projRes.changes}개`);

  // 가상 회사 삭제 (comp_sechang 제외)
  const compRes = db.prepare('DELETE FROM companies WHERE id != ?').run(keepCompanyId);
  console.log(` - [companies] 삭제된 가상 업체: ${compRes.changes}개`);
});

deleteTransaction();

console.log('\n--- [정리 후] 최종 상태 확인 ---');
const totalCasesAfter = db.prepare('SELECT id, case_name, company_id FROM quotation_cases').all();
console.log('남은 견적 케이스 (' + totalCasesAfter.length + '건):');
totalCasesAfter.forEach(c => console.log(` - [${c.id}] ${c.case_name} (회사: ${c.company_id})`));

const companiesAfter = db.prepare('SELECT id, company_name FROM companies').all();
console.log('\n남은 업체 (' + companiesAfter.length + '개):');
companiesAfter.forEach(c => console.log(` - [${c.id}] ${c.company_name}`));

const projectsAfter = db.prepare('SELECT id, project_name, company_id FROM projects').all();
console.log('\n남은 프로젝트 (' + projectsAfter.length + '개):');
projectsAfter.forEach(p => console.log(` - [${p.id}] ${p.project_name}`));

const priceMasterAfter = db.prepare('SELECT count(*) as count FROM price_masters').get().count;
const productMasterAfter = db.prepare('SELECT count(*) as count FROM product_masters').get().count;
console.log(`\n기준정보 보존 확인: price_masters=${priceMasterAfter}건, product_masters=${productMasterAfter}건`);

db.close();
console.log('\n🎉 가상 데이터 정리 및 세창인터내셔널 DWG 데이터 단독 유지 완료!');
