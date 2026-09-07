import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

export function resolveDatabasePath(): string {
  // 1. Explicit override via env
  if (process.env.EGDESK_USER_DATA_DB_PATH && fs.existsSync(process.env.EGDESK_USER_DATA_DB_PATH)) {
    return process.env.EGDESK_USER_DATA_DB_PATH;
  }

  // 2. EGDesk project user_data.db in APPDATA
  const projectId = process.env.NEXT_PUBLIC_EGDESK_PROJECT_ID || '5883d2d5-7b0a-4947-a4fa-1f702c1dbc2f';
  const envName = process.env.NEXT_PUBLIC_EGDESK_ENV || 'development';
  const appData = process.env.APPDATA || path.join(process.env.USERPROFILE || 'C:\\Users\\SteveLee', 'AppData', 'Roaming');
  
  const egdeskDbPath = path.join(appData, 'egdesk', 'user-data', envName, 'projects', projectId, 'user_data.db');
  if (fs.existsSync(egdeskDbPath)) {
    return egdeskDbPath;
  }

  // 3. Fallback to local storage/cadon_bom.db
  const storageDir = path.join(process.cwd(), 'storage');
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }
  return path.join(storageDir, 'cadon_bom.db');
}

export const dbPath = resolveDatabasePath();
export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');


// Initialize schema and seed data
export function initializeDatabase() {
  db.exec(`
    -- 1. Users & Roles (PROMPT 01)
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      login_id TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('SUPER_ADMIN', 'SALES_USER', 'REVIEWER')),
      company_id TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      last_login_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- 2. Companies & Tenants (PROMPT 02)
    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      company_code TEXT UNIQUE NOT NULL,
      company_name TEXT NOT NULL,
      company_type TEXT NOT NULL DEFAULT 'CUSTOMER',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_company_access (
      user_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      access_role TEXT NOT NULL DEFAULT 'MEMBER',
      is_active INTEGER NOT NULL DEFAULT 1,
      PRIMARY KEY (user_id, company_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
    );

    -- 3. Projects (PROMPT 02)
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      project_code TEXT NOT NULL,
      project_name TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
    );

    -- 4. Quotation Cases (PROMPT 02, 13, 14)
    CREATE TABLE IF NOT EXISTS quotation_cases (
      id TEXT PRIMARY KEY,
      case_no TEXT UNIQUE NOT NULL,
      company_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      case_name TEXT NOT NULL,
      request_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'DRAFT',
      revision TEXT NOT NULL DEFAULT '0',
      quote_readiness TEXT NOT NULL DEFAULT 'NOT_READY',
      created_by_user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );
  `);
  try {
    db.prepare("ALTER TABLE quotation_cases ADD COLUMN visibility TEXT NOT NULL DEFAULT 'SHARED'").run();
    db.prepare("ALTER TABLE quotation_cases ADD COLUMN visibility_reason TEXT").run();
  } catch (e) {
    // Ignore if columns already exist
  }

  db.exec(`
    -- 5. Uploaded Files (PROMPT 03, 18)
    CREATE TABLE IF NOT EXISTS uploaded_files (
      id TEXT PRIMARY KEY,
      quotation_case_id TEXT NOT NULL,
      original_file_name TEXT NOT NULL,
      stored_file_name TEXT NOT NULL,
      storage_path TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_role TEXT NOT NULL DEFAULT 'SOURCE',
      derived_from_file_id TEXT,
      file_size INTEGER NOT NULL,
      checksum TEXT NOT NULL,
      upload_status TEXT NOT NULL DEFAULT 'UPLOADED',
      uploaded_by_user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (quotation_case_id) REFERENCES quotation_cases(id) ON DELETE CASCADE
    );

    -- 6. DWG Conversion Runs (PROMPT 18, 18-R1, 18-R2)
    CREATE TABLE IF NOT EXISTS dwg_conversion_runs (
      id TEXT PRIMARY KEY,
      source_file_id TEXT NOT NULL,
      derived_file_id TEXT,
      provider TEXT NOT NULL DEFAULT 'LIBREDWG',
      converter_version TEXT,
      source_dwg_signature TEXT,
      source_dwg_version TEXT,
      output_dxf_version TEXT,
      status TEXT NOT NULL,
      started_at TEXT NOT NULL,
      completed_at TEXT,
      duration_ms INTEGER,
      exit_code INTEGER,
      warning_count INTEGER DEFAULT 0,
      warnings_json TEXT,
      error_code TEXT,
      error_message TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (source_file_id) REFERENCES uploaded_files(id) ON DELETE CASCADE
    );

    -- 7. CAD Parse Runs & CAD Objects (PROMPT 04)
    CREATE TABLE IF NOT EXISTS cad_parse_runs (
      id TEXT PRIMARY KEY,
      source_file_id TEXT NOT NULL,
      dxf_version TEXT,
      total_entities INTEGER NOT NULL,
      entity_counts_json TEXT,
      global_bounds_json TEXT,
      status TEXT NOT NULL,
      duration_ms INTEGER,
      created_at TEXT NOT NULL,
      FOREIGN KEY (source_file_id) REFERENCES uploaded_files(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS cad_objects (
      id TEXT PRIMARY KEY,
      parse_run_id TEXT NOT NULL,
      handle TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      layer TEXT NOT NULL,
      color INTEGER,
      raw_text TEXT,
      bounding_box_json TEXT,
      geometry_data_json TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (parse_run_id) REFERENCES cad_parse_runs(id) ON DELETE CASCADE
    );

    -- 8. Drawings & Sheet Candidates (PROMPT 05, 06, 07)
    CREATE TABLE IF NOT EXISTS drawings (
      id TEXT PRIMARY KEY,
      quotation_case_id TEXT NOT NULL,
      drawing_index INTEGER NOT NULL,
      drawing_no_raw TEXT NOT NULL,
      drawing_no_normalized TEXT NOT NULL,
      drawing_name_raw TEXT NOT NULL,
      drawing_name_normalized TEXT NOT NULL,
      revision TEXT NOT NULL DEFAULT '0',
      material TEXT,
      scale TEXT,
      drawing_type TEXT NOT NULL DEFAULT 'PART',
      frame_bbox_json TEXT,
      title_block_bbox_json TEXT,
      confidence_score REAL NOT NULL DEFAULT 1.0,
      status TEXT NOT NULL DEFAULT 'CONFIRMED',
      is_quote_included INTEGER NOT NULL DEFAULT 1,
      exclude_reason TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (quotation_case_id) REFERENCES quotation_cases(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS drawing_relationships (
      id TEXT PRIMARY KEY,
      quotation_case_id TEXT NOT NULL,
      parent_drawing_no TEXT NOT NULL,
      child_drawing_no TEXT NOT NULL,
      relationship_type TEXT NOT NULL,
      confidence_score REAL NOT NULL DEFAULT 1.0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (quotation_case_id) REFERENCES quotation_cases(id) ON DELETE CASCADE
    );

    -- 9. BOM Areas, Rows & Multi-Level BOM (PROMPT 08, 09, 10)
    CREATE TABLE IF NOT EXISTS bom_areas (
      id TEXT PRIMARY KEY,
      quotation_case_id TEXT NOT NULL,
      drawing_no TEXT NOT NULL,
      table_type TEXT NOT NULL DEFAULT 'BOM_TABLE',
      bbox_json TEXT NOT NULL,
      confidence_score REAL NOT NULL DEFAULT 1.0,
      status TEXT NOT NULL DEFAULT 'APPROVED',
      created_at TEXT NOT NULL,
      FOREIGN KEY (quotation_case_id) REFERENCES quotation_cases(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS raw_bom_items (
      id TEXT PRIMARY KEY,
      quotation_case_id TEXT NOT NULL,
      drawing_no TEXT NOT NULL,
      row_index INTEGER NOT NULL,
      item_no_raw TEXT,
      part_no_raw TEXT,
      name_raw TEXT NOT NULL,
      specification_raw TEXT,
      material_raw TEXT,
      quantity_raw TEXT NOT NULL,
      quantity_numeric REAL NOT NULL DEFAULT 1.0,
      unit_raw TEXT NOT NULL DEFAULT 'EA',
      remark_raw TEXT,
      source_handles_json TEXT,
      status TEXT NOT NULL DEFAULT 'EXTRACTED',
      created_at TEXT NOT NULL,
      FOREIGN KEY (quotation_case_id) REFERENCES quotation_cases(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS flattened_bom_items (
      id TEXT PRIMARY KEY,
      quotation_case_id TEXT NOT NULL,
      item_key TEXT NOT NULL,
      part_no TEXT,
      name TEXT NOT NULL,
      specification TEXT,
      material TEXT,
      total_quantity REAL NOT NULL DEFAULT 1.0,
      unit TEXT NOT NULL DEFAULT 'EA',
      source_drawings_json TEXT,
      source_item_ids_json TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (quotation_case_id) REFERENCES quotation_cases(id) ON DELETE CASCADE
    );

    -- 10. Normalized BOM Items (PROMPT 11)
    CREATE TABLE IF NOT EXISTS normalized_bom_items (
      id TEXT PRIMARY KEY,
      quotation_case_id TEXT NOT NULL,
      raw_item_id TEXT,
      raw_name TEXT NOT NULL,
      normalized_name TEXT NOT NULL,
      search_name TEXT NOT NULL,
      direction TEXT,
      spec_candidate TEXT,
      material_candidate TEXT,
      quantity REAL NOT NULL DEFAULT 1.0,
      unit TEXT NOT NULL DEFAULT 'EA',
      status TEXT NOT NULL DEFAULT 'NORMALIZED',
      is_quote_included INTEGER NOT NULL DEFAULT 1,
      exclude_reason TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (quotation_case_id) REFERENCES quotation_cases(id) ON DELETE CASCADE
    );

    -- 11. Product Masters & Aliases (PROMPT 12, 13)
    CREATE TABLE IF NOT EXISTS product_masters (
      id TEXT PRIMARY KEY,
      company_id TEXT,
      master_code TEXT UNIQUE NOT NULL,
      standard_name TEXT NOT NULL,
      category TEXT NOT NULL,
      specification TEXT,
      material TEXT,
      unit TEXT NOT NULL DEFAULT 'EA',
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS master_aliases (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      master_id TEXT NOT NULL,
      alias_name TEXT NOT NULL,
      alias_normalized TEXT NOT NULL,
      approval_count INTEGER NOT NULL DEFAULT 1,
      rejection_count INTEGER NOT NULL DEFAULT 0,
      scope TEXT NOT NULL DEFAULT 'COMPANY',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
      FOREIGN KEY (master_id) REFERENCES product_masters(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS master_candidates (
      id TEXT PRIMARY KEY,
      normalized_item_id TEXT NOT NULL,
      master_id TEXT,
      master_code TEXT NOT NULL,
      standard_name TEXT NOT NULL,
      specification TEXT,
      material TEXT,
      rank INTEGER NOT NULL,
      total_score INTEGER NOT NULL,
      positive_evidence_json TEXT,
      negative_evidence_json TEXT,
      candidate_status TEXT NOT NULL DEFAULT 'TOP_CANDIDATE',
      created_at TEXT NOT NULL,
      FOREIGN KEY (normalized_item_id) REFERENCES normalized_bom_items(id) ON DELETE CASCADE
    );

    -- 12. Human Approvals & Final BOM (PROMPT 13)
    CREATE TABLE IF NOT EXISTS bom_approval_records (
      id TEXT PRIMARY KEY,
      quotation_case_id TEXT NOT NULL,
      normalized_item_id TEXT NOT NULL,
      selected_master_id TEXT,
      decision_type TEXT NOT NULL,
      decision_reason TEXT,
      difference_notes TEXT,
      is_override INTEGER NOT NULL DEFAULT 0,
      approved_by_user_id TEXT NOT NULL,
      approved_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (quotation_case_id) REFERENCES quotation_cases(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS final_bom_items (
      id TEXT PRIMARY KEY,
      quotation_case_id TEXT NOT NULL,
      normalized_item_id TEXT,
      final_master_id TEXT,
      final_master_code TEXT,
      final_name TEXT NOT NULL,
      final_spec TEXT,
      final_material TEXT,
      final_quantity REAL NOT NULL DEFAULT 1.0,
      final_unit TEXT NOT NULL DEFAULT 'EA',
      approval_status TEXT NOT NULL DEFAULT 'APPROVED',
      approved_by_user_id TEXT NOT NULL,
      approved_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (quotation_case_id) REFERENCES quotation_cases(id) ON DELETE CASCADE
    );

    -- 13. Price Masters & Quotes (PROMPT 14)
    CREATE TABLE IF NOT EXISTS price_masters (
      id TEXT PRIMARY KEY,
      master_id TEXT NOT NULL,
      company_id TEXT,
      price_type TEXT NOT NULL DEFAULT 'STANDARD',
      unit_price REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'KRW',
      effective_from TEXT,
      effective_to TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (master_id) REFERENCES product_masters(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS quotes (
      id TEXT PRIMARY KEY,
      quotation_case_id TEXT NOT NULL,
      quote_no TEXT UNIQUE NOT NULL,
      quote_version INTEGER NOT NULL DEFAULT 1,
      company_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'DRAFT',
      currency TEXT NOT NULL DEFAULT 'KRW',
      subtotal REAL NOT NULL DEFAULT 0,
      discount_type TEXT NOT NULL DEFAULT 'AMOUNT',
      discount_rate REAL NOT NULL DEFAULT 0,
      discount_amount REAL NOT NULL DEFAULT 0,
      tax_rate REAL NOT NULL DEFAULT 0.10,
      tax_amount REAL NOT NULL DEFAULT 0,
      total_amount REAL NOT NULL DEFAULT 0,
      quote_date TEXT NOT NULL,
      is_locked INTEGER NOT NULL DEFAULT 0,
      created_by_user_id TEXT NOT NULL,
      approved_by_user_id TEXT,
      approved_at TEXT,
      override_reason TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (quotation_case_id) REFERENCES quotation_cases(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS quote_items (
      id TEXT PRIMARY KEY,
      quote_id TEXT NOT NULL,
      final_bom_item_id TEXT,
      master_id TEXT,
      drawing_no TEXT,
      item_no INTEGER NOT NULL,
      master_code TEXT,
      item_name TEXT NOT NULL,
      specification TEXT,
      material TEXT,
      quantity REAL NOT NULL DEFAULT 1.0,
      unit TEXT NOT NULL DEFAULT 'EA',
      unit_price REAL NOT NULL DEFAULT 0,
      amount REAL NOT NULL DEFAULT 0,
      price_source TEXT NOT NULL DEFAULT 'STANDARD_PRICE',
      price_status TEXT NOT NULL DEFAULT 'READY',
      remark TEXT,
      is_included INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE
    );

    -- 13-1. Manual Price Pool (누적 수기 단가 지식 베이스 / 방안 A)
    CREATE TABLE IF NOT EXISTS manual_price_pool (
      id TEXT PRIMARY KEY,
      item_name TEXT NOT NULL,
      specification TEXT,
      material TEXT,
      unit_price REAL NOT NULL,
      remark TEXT,
      quotation_case_id TEXT,
      created_by_user_id TEXT,
      created_at TEXT NOT NULL
    );

    -- 14. Excel Templates & Exports (PROMPT 15)
    CREATE TABLE IF NOT EXISTS excel_templates (
      id TEXT PRIMARY KEY,
      company_id TEXT,
      template_name TEXT NOT NULL,
      original_file_name TEXT NOT NULL,
      storage_path TEXT NOT NULL,
      template_type TEXT NOT NULL DEFAULT 'STANDARD',
      version TEXT NOT NULL DEFAULT 'V1',
      is_active INTEGER NOT NULL DEFAULT 1,
      is_default INTEGER NOT NULL DEFAULT 0,
      created_by_user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS quote_exports (
      id TEXT PRIMARY KEY,
      quote_id TEXT NOT NULL,
      quote_version INTEGER NOT NULL DEFAULT 1,
      template_id TEXT NOT NULL,
      file_name TEXT NOT NULL,
      storage_path TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      export_status TEXT NOT NULL DEFAULT 'COMPLETED',
      is_draft INTEGER NOT NULL DEFAULT 0,
      exported_by_user_id TEXT NOT NULL,
      exported_at TEXT NOT NULL,
      FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE
    );

    -- 15. Case Analysis Archives & Snapshots
    CREATE TABLE IF NOT EXISTS case_archives (
      id TEXT PRIMARY KEY,
      quotation_case_id TEXT NOT NULL,
      archive_version TEXT NOT NULL,
      archive_name TEXT NOT NULL,
      drawings_count INTEGER NOT NULL DEFAULT 0,
      bom_items_count INTEGER NOT NULL DEFAULT 0,
      snapshot_data_json TEXT NOT NULL,
      created_by_user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (quotation_case_id) REFERENCES quotation_cases(id) ON DELETE CASCADE
    );

    -- 14-2. CAD External App Settings (AutoCAD / DWG FastView / TrueView Custom Paths)
    CREATE TABLE IF NOT EXISTS cad_app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- 15. Golden Dataset & Baseline Validation (PROMPT 17)
    CREATE TABLE IF NOT EXISTS golden_cases (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      quotation_case_id TEXT,
      case_code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      data_classification TEXT NOT NULL DEFAULT 'TEST_EVIDENCE',
      source_checksum TEXT,
      status TEXT NOT NULL DEFAULT 'READY',
      actual_drawing_count INTEGER NOT NULL DEFAULT 1,
      actual_bom_count INTEGER NOT NULL DEFAULT 1,
      actual_item_count INTEGER NOT NULL DEFAULT 5,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS system_baselines (
      id TEXT PRIMARY KEY,
      golden_case_id TEXT NOT NULL,
      baseline_name TEXT NOT NULL,
      parser_version TEXT NOT NULL,
      metrics_json TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (golden_case_id) REFERENCES golden_cases(id) ON DELETE CASCADE
    );

    -- 16. User Activity Logs (감사 로그: 누가 로그인해서 어떤 일을 했는지 기록)
    CREATE TABLE IF NOT EXISTS user_activity_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      user_login_id TEXT NOT NULL,
      user_role TEXT NOT NULL,
      activity_type TEXT NOT NULL,
      quotation_case_id TEXT,
      case_name TEXT,
      details TEXT NOT NULL,
      ip_address TEXT,
      created_at TEXT NOT NULL
    );

    -- 17. Approval & Permission Settings (최고관리자 승인권한 설정 및 결재 관리)
    CREATE TABLE IF NOT EXISTS system_approval_settings (
      id TEXT PRIMARY KEY,
      cross_user_edit_policy TEXT NOT NULL DEFAULT 'REQUIRE_APPROVAL', -- 'REQUIRE_APPROVAL' | 'ALLOW' | 'DENY'
      cross_user_approve_policy TEXT NOT NULL DEFAULT 'REQUIRE_APPROVAL',
      require_admin_final_quote_approval INTEGER NOT NULL DEFAULT 0,
      approval_valid_hours INTEGER NOT NULL DEFAULT 48,
      is_approval_suspended INTEGER NOT NULL DEFAULT 1, -- 1: 최고관리자 결재 보류 모드(자유 견적 진행), 0: 결재 필수
      updated_by_user_id TEXT,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_approval_permissions (
      user_id TEXT PRIMARY KEY,
      can_edit_own INTEGER NOT NULL DEFAULT 1,
      can_approve_own INTEGER NOT NULL DEFAULT 1,
      can_edit_others TEXT NOT NULL DEFAULT 'REQUIRE_APPROVAL', -- 'REQUIRE_APPROVAL' | 'ALLOW' | 'DENY'
      can_approve_others TEXT NOT NULL DEFAULT 'REQUIRE_APPROVAL',
      can_edit_price INTEGER NOT NULL DEFAULT 1,
      can_approve_quote INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS approval_requests (
      id TEXT PRIMARY KEY,
      request_type TEXT NOT NULL DEFAULT 'EDIT_CASE', -- 'EDIT_CASE' | 'APPROVE_BOM' | 'APPROVE_QUOTE'
      quotation_case_id TEXT NOT NULL,
      requester_user_id TEXT NOT NULL,
      owner_user_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING' | 'APPROVED' | 'REJECTED'
      reviewed_by_user_id TEXT,
      reviewed_at TEXT,
      review_comment TEXT,
      created_at TEXT NOT NULL,
      expires_at TEXT,
      FOREIGN KEY (quotation_case_id) REFERENCES quotation_cases(id) ON DELETE CASCADE,
      FOREIGN KEY (requester_user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Performance Indexes
    CREATE INDEX IF NOT EXISTS idx_approval_requests_case ON approval_requests(quotation_case_id);
    CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON approval_requests(status);
    CREATE INDEX IF NOT EXISTS idx_approval_requests_requester ON approval_requests(requester_user_id);
    CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON user_activity_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON user_activity_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_activity_logs_type ON user_activity_logs(activity_type);
    CREATE INDEX IF NOT EXISTS idx_cad_objects_parse_run ON cad_objects(parse_run_id);
    CREATE INDEX IF NOT EXISTS idx_cad_parse_runs_file ON cad_parse_runs(source_file_id);
    CREATE INDEX IF NOT EXISTS idx_uploaded_files_case ON uploaded_files(quotation_case_id);
    CREATE INDEX IF NOT EXISTS idx_drawings_case ON drawings(quotation_case_id);
    CREATE INDEX IF NOT EXISTS idx_flattened_bom_case ON flattened_bom_items(quotation_case_id);
    CREATE INDEX IF NOT EXISTS idx_raw_bom_case ON raw_bom_items(quotation_case_id);
    CREATE INDEX IF NOT EXISTS idx_normalized_bom_case ON normalized_bom_items(quotation_case_id);
    CREATE INDEX IF NOT EXISTS idx_bom_areas_case ON bom_areas(quotation_case_id);
    CREATE INDEX IF NOT EXISTS idx_drawing_rel_case ON drawing_relationships(quotation_case_id);
    CREATE INDEX IF NOT EXISTS idx_final_bom_case ON final_bom_items(quotation_case_id);
  `);

  // Dynamic Column Migrations for Quote Inclusion
  try { db.exec('ALTER TABLE drawings ADD COLUMN is_quote_included INTEGER NOT NULL DEFAULT 1;'); } catch {}
  try { db.exec('ALTER TABLE drawings ADD COLUMN exclude_reason TEXT;'); } catch {}
  try { db.exec('ALTER TABLE quote_items ADD COLUMN drawing_no TEXT;'); } catch {}
  try { db.exec('ALTER TABLE normalized_bom_items ADD COLUMN is_quote_included INTEGER NOT NULL DEFAULT 1;'); } catch {}
  try { db.exec('ALTER TABLE normalized_bom_items ADD COLUMN exclude_reason TEXT;'); } catch {}

  // Ensure 5 demo users (김견적, 이견적, 최견적, 송견적, 박견적) and admin are registered
  const now = new Date().toISOString();
  const defaultPassHash = bcrypt.hashSync('Cadon1234!@', 10);
  const adminPassHash = bcrypt.hashSync('Cadon1234!@', 10);

  const demoUsers = [
    { id: 'usr_kim', login_id: 'kim', name: '김견적 과장', role: 'SALES_USER' },
    { id: 'usr_lee', login_id: 'lee', name: '이견적 대리', role: 'SALES_USER' },
    { id: 'usr_choi', login_id: 'choi', name: '최견적 차장', role: 'SALES_USER' },
    { id: 'usr_song', login_id: 'song', name: '송견적 주임', role: 'SALES_USER' },
    { id: 'usr_park', login_id: 'park', name: '박견적 대리', role: 'SALES_USER' },
  ];

  for (const u of demoUsers) {
    db.prepare(`
      INSERT INTO users (id, login_id, password_hash, name, role, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 1, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        password_hash = excluded.password_hash,
        role = excluded.role,
        is_active = 1
    `).run(u.id, u.login_id, defaultPassHash, u.name, u.role, now, now);

    // Grant company access to all customer companies
    for (const compId of ['comp_sechang', 'comp_001', 'comp_002', 'comp_003', 'comp_004']) {
      db.prepare(`
        INSERT OR IGNORE INTO user_company_access (user_id, company_id, access_role, is_active)
        VALUES (?, ?, 'MANAGER', 1)
      `).run(u.id, compId);
    }
  }

  // Admin user
  db.prepare(`
    INSERT INTO users (id, login_id, password_hash, name, role, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 1, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      password_hash = excluded.password_hash,
      role = excluded.role,
      is_active = 1
  `).run('usr_admin', 'admin', adminPassHash, '시스템 최고관리자', 'SUPER_ADMIN', now, now);

  for (const compId of ['comp_sechang', 'comp_001', 'comp_002', 'comp_003', 'comp_004']) {
    db.prepare(`
      INSERT OR IGNORE INTO user_company_access (user_id, company_id, access_role, is_active)
      VALUES ('usr_admin', ?, 'MANAGER', 1)
    `).run(compId);
  }

  // Seed Global Approval Settings
  db.prepare(`
    INSERT INTO system_approval_settings (
      id, cross_user_edit_policy, cross_user_approve_policy,
      require_admin_final_quote_approval, approval_valid_hours, updated_by_user_id, updated_at
    ) VALUES ('GLOBAL_CONFIG', 'REQUIRE_APPROVAL', 'REQUIRE_APPROVAL', 0, 48, 'usr_admin', ?)
    ON CONFLICT(id) DO NOTHING
  `).run(now);

  // Seed default permissions for 5 managers + admin
  const allUsers = [...demoUsers, { id: 'usr_admin', name: '시스템 최고관리자' }];
  for (const u of allUsers) {
    const isSuperAdmin = u.id === 'usr_admin';
    db.prepare(`
      INSERT INTO user_approval_permissions (
        user_id, can_edit_own, can_approve_own, can_edit_others, can_approve_others, can_edit_price, can_approve_quote, updated_at
      ) VALUES (?, 1, 1, ?, ?, 1, 1, ?)
      ON CONFLICT(user_id) DO NOTHING
    `).run(
      u.id,
      isSuperAdmin ? 'ALLOW' : 'REQUIRE_APPROVAL',
      isSuperAdmin ? 'ALLOW' : 'REQUIRE_APPROVAL',
      now
    );
  }

  // Seed default data if companies table is empty
  const companyCount = db.prepare('SELECT COUNT(*) as cnt FROM companies').get() as { cnt: number };
  if (companyCount.cnt === 0) {

    // Seed Companies
    db.prepare(`
      INSERT INTO companies (id, company_code, company_name, company_type, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run('comp_sechang', 'CUST-SECHANG', '(주)세창인터내셔널', 'CUSTOMER', 1, now, now);

    db.prepare(`
      INSERT INTO companies (id, company_code, company_name, company_type, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run('comp_001', 'CUST-0001', 'A기계공업 (주)', 'CUSTOMER', 1, now, now);

    db.prepare(`
      INSERT INTO companies (id, company_code, company_name, company_type, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run('comp_002', 'CUST-0002', 'B자동화시스템 (주)', 'CUSTOMER', 1, now, now);

    // Access
    db.prepare(`
      INSERT INTO user_company_access (user_id, company_id, access_role, is_active)
      VALUES (?, ?, ?, ?)
    `).run('usr_sales1', 'comp_001', 'MANAGER', 1);

    // Projects
    db.prepare(`
      INSERT INTO projects (id, company_id, project_code, project_name, description, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run('proj_001', 'comp_001', 'PRJ-2026-01', '2026 고속 가이드레일 및 프레임 증설라인', 'A기계 메인 생산라인 증설 견적 건', 'ACTIVE', now, now);

    // Quotation Case
    db.prepare(`
      INSERT INTO quotation_cases (id, case_no, company_id, project_id, case_name, request_date, status, revision, quote_readiness, created_by_user_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run('case_001', 'QT-20260901-001', 'comp_001', 'proj_001', 'A기계 고속라인 가이드레일/모터베이스 제작 견적의뢰', '2026-09-01', 'DRAFT', '0', 'NOT_READY', 'usr_sales1', now, now);

    // Standard Product Masters
    const masters = [
      { id: 'mst_001', code: 'GR-1200', name: 'GUIDE RAIL ASSY 1200', cat: 'GUIDE_RAIL', spec: '1200L', mat: 'AL6063', unit: 'EA', price: 120000 },
      { id: 'mst_002', code: 'GR-1000', name: 'GUIDE RAIL ASSY 1000', cat: 'GUIDE_RAIL', spec: '1000L', mat: 'AL6063', unit: 'EA', price: 95000 },
      { id: 'mst_003', code: 'MB-001', name: 'MOTOR BASE BRACKET', cat: 'BRACKET', spec: '150x120x10T', mat: 'SS400', unit: 'EA', price: 45000 },
      { id: 'mst_004', code: 'FR-101-LH', name: 'MAIN FRAME LH', cat: 'FRAME', spec: '800x600', mat: 'SS400', unit: 'EA', price: 65000 },
      { id: 'mst_005', code: 'FR-101-RH', name: 'MAIN FRAME RH', cat: 'FRAME', spec: '800x600', mat: 'SS400', unit: 'EA', price: 65000 },
      { id: 'mst_006', code: 'SF-102', name: 'DRIVE SHAFT D25', cat: 'SHAFT', spec: 'DIA 25x300L', mat: 'S45C', unit: 'EA', price: 28000 },
      { id: 'mst_007', code: 'BK-003', name: 'GUIDE BRACKET SIDE', cat: 'BRACKET', spec: '50x50x5T', mat: 'SUS304', unit: 'EA', price: 18000 }
    ];

    for (const m of masters) {
      db.prepare(`
        INSERT INTO product_masters (id, master_code, standard_name, category, specification, material, unit, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(m.id, m.code, m.name, m.cat, m.spec, m.mat, m.unit, 'ACTIVE', now, now);

      db.prepare(`
        INSERT INTO price_masters (id, master_id, price_type, unit_price, currency, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(`prc_${m.id}`, m.id, 'STANDARD', m.price, 'KRW', 1, now, now);
    }

    // Customer Aliases
    db.prepare(`
      INSERT INTO master_aliases (id, company_id, master_id, alias_name, alias_normalized, approval_count, scope, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run('als_001', 'comp_001', 'mst_001', 'AL G/R 1200', 'GUIDE RAIL 1200', 14, 'COMPANY', now, now);

    // Excel Default Template
    const templateStorage = path.join(process.cwd(), 'storage', 'templates');
    fs.mkdirSync(templateStorage, { recursive: true });
    const defaultTemplatePath = path.join(templateStorage, 'standard_quote_template.xlsx');

    db.prepare(`
      INSERT INTO excel_templates (id, company_id, template_name, original_file_name, storage_path, template_type, version, is_active, is_default, created_by_user_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run('tmpl_001', null, '표준 엑셀 견적서 양식 V1', 'standard_quote_template.xlsx', defaultTemplatePath, 'STANDARD', 'V1', 1, 1, 'usr_admin', now, now);

    // Golden Case
    db.prepare(`
      INSERT INTO golden_cases (id, project_id, quotation_case_id, case_code, name, description, data_classification, actual_drawing_count, actual_bom_count, actual_item_count, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run('gcase_001', 'proj_001', 'case_001', 'GOLDEN-DXF-001', 'A기계 표준 도면 정답 세트 (DEMO FREEZE)', '인간 검증 완료된 5개 부품 및 1개 조립도 정답 세트', 'TEST_EVIDENCE', 1, 1, 5, 'usr_admin', now);
  }

  // Seed Manual Price Pool (방안 A: 수기 단가 누적 풀)
  const mppCount = (db.prepare('SELECT COUNT(*) as count FROM manual_price_pool').get() as any)?.count || 0;
  if (mppCount === 0) {
    const now = new Date().toISOString();
    const initialManualPrices = [
      { id: 'mpp_001', name: 'GUIDE RAIL ASSY', spec: '1200L', mat: 'AL6063', price: 115000, remark: '외주 압출/가공 협의 단가' },
      { id: 'mpp_002', name: 'MOTOR BASE BRACKET', spec: '150x120x10T', mat: 'SS400', price: 48000, remark: '레이저 절단 및 벤딩 임가공비 반영' },
      { id: 'mpp_003', name: 'FLANGE COUPLING', spec: 'PCD 120 / 4-M10', mat: 'S45C', price: 35000, remark: '정밀 선반 2차가공비 포함' },
      { id: 'mpp_004', name: 'MAIN FRAME LH', spec: '800x600', mat: 'SS400', price: 68000, remark: '용접 제관 및 제청 도장 포함' },
      { id: 'mpp_005', name: 'DRIVE SHAFT', spec: 'DIA 25x300L', mat: 'S45C', price: 29000, remark: '연마 및 키홈 가공 단가' },
      { id: 'mpp_006', name: 'TOP_FRAME', spec: '500x300', mat: 'SUS304', price: 82000, remark: 'SUS 레이저 정밀 가공비' },
      { id: 'mpp_007', name: 'PINION SHAFT', spec: 'M2.5 Z18', mat: 'SCM440', price: 42000, remark: '기어 치절 및 고주파 열처리 단가' }
    ];

    for (const mpp of initialManualPrices) {
      db.prepare(`
        INSERT INTO manual_price_pool (id, item_name, specification, material, unit_price, remark, quotation_case_id, created_by_user_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(mpp.id, mpp.name, mpp.spec, mpp.mat, mpp.price, mpp.remark, 'case_001', 'usr_admin', now);
    }
  }
}

// Auto-initialize on import
initializeDatabase();
