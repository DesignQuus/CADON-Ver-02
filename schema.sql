--
-- CADON-BOM AI Ver-02 — Database Schema DDL
-- Target: EGDesk My DB (SQLite) & PostgreSQL compatible
-- Total Tables: 30 Application Tables + Metadata Tables
--

-- TABLE: bom_approval_records
CREATE TABLE bom_approval_records ( "_version" INTEGER NOT NULL DEFAULT 1, 
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

-- TABLE: bom_areas
CREATE TABLE bom_areas ( "_version" INTEGER NOT NULL DEFAULT 1, 
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

-- TABLE: cad_app_settings
CREATE TABLE cad_app_settings ( "_version" INTEGER NOT NULL DEFAULT 1, 
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

-- TABLE: cad_objects
CREATE TABLE cad_objects ( "_version" INTEGER NOT NULL DEFAULT 1, 
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

-- TABLE: cad_parse_runs
CREATE TABLE cad_parse_runs ( "_version" INTEGER NOT NULL DEFAULT 1, 
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

-- TABLE: case_archives
CREATE TABLE case_archives ( "_version" INTEGER NOT NULL DEFAULT 1, 
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

-- TABLE: companies
CREATE TABLE companies ( "_version" INTEGER NOT NULL DEFAULT 1, 
      id TEXT PRIMARY KEY,
      company_code TEXT UNIQUE NOT NULL,
      company_name TEXT NOT NULL,
      company_type TEXT NOT NULL DEFAULT 'CUSTOMER',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

-- TABLE: drawing_relationships
CREATE TABLE drawing_relationships ( "_version" INTEGER NOT NULL DEFAULT 1, 
      id TEXT PRIMARY KEY,
      quotation_case_id TEXT NOT NULL,
      parent_drawing_no TEXT NOT NULL,
      child_drawing_no TEXT NOT NULL,
      relationship_type TEXT NOT NULL,
      confidence_score REAL NOT NULL DEFAULT 1.0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (quotation_case_id) REFERENCES quotation_cases(id) ON DELETE CASCADE
    );

-- TABLE: drawings
CREATE TABLE drawings ( "_version" INTEGER NOT NULL DEFAULT 1, 
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
      created_at TEXT NOT NULL,
      FOREIGN KEY (quotation_case_id) REFERENCES quotation_cases(id) ON DELETE CASCADE
    );

-- TABLE: dwg_conversion_runs
CREATE TABLE dwg_conversion_runs ( "_version" INTEGER NOT NULL DEFAULT 1, 
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

-- TABLE: excel_templates
CREATE TABLE excel_templates ( "_version" INTEGER NOT NULL DEFAULT 1, 
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

-- TABLE: final_bom_items
CREATE TABLE final_bom_items ( "_version" INTEGER NOT NULL DEFAULT 1, 
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

-- TABLE: flattened_bom_items
CREATE TABLE flattened_bom_items ( "_version" INTEGER NOT NULL DEFAULT 1, 
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

-- TABLE: golden_cases
CREATE TABLE golden_cases ( "_version" INTEGER NOT NULL DEFAULT 1, 
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

-- TABLE: import_operations
CREATE TABLE import_operations (
      id TEXT PRIMARY KEY,
      table_id TEXT NOT NULL,
      file_name TEXT NOT NULL,
      status TEXT CHECK(status IN ('running', 'completed', 'failed')) NOT NULL,
      started_at TEXT NOT NULL,
      completed_at TEXT,
      rows_imported INTEGER DEFAULT 0,
      rows_skipped INTEGER DEFAULT 0,
      error_message TEXT,
      FOREIGN KEY (table_id) REFERENCES user_tables(id) ON DELETE CASCADE
    );

-- TABLE: manual_price_pool
CREATE TABLE manual_price_pool ( "_version" INTEGER NOT NULL DEFAULT 1, 
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

-- TABLE: master_aliases
CREATE TABLE master_aliases ( "_version" INTEGER NOT NULL DEFAULT 1, 
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

-- TABLE: master_candidates
CREATE TABLE master_candidates ( "_version" INTEGER NOT NULL DEFAULT 1, 
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

-- TABLE: normalized_bom_items
CREATE TABLE normalized_bom_items ( "_version" INTEGER NOT NULL DEFAULT 1, 
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
      created_at TEXT NOT NULL,
      FOREIGN KEY (quotation_case_id) REFERENCES quotation_cases(id) ON DELETE CASCADE
    );

-- TABLE: price_masters
CREATE TABLE price_masters ( "_version" INTEGER NOT NULL DEFAULT 1, 
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

-- TABLE: product_masters
CREATE TABLE product_masters ( "_version" INTEGER NOT NULL DEFAULT 1, 
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

-- TABLE: projects
CREATE TABLE projects ( "_version" INTEGER NOT NULL DEFAULT 1, 
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

-- TABLE: quotation_cases
CREATE TABLE quotation_cases ( "_version" INTEGER NOT NULL DEFAULT 1, 
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

-- TABLE: quote_exports
CREATE TABLE quote_exports ( "_version" INTEGER NOT NULL DEFAULT 1, 
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

-- TABLE: quote_items
CREATE TABLE quote_items ( "_version" INTEGER NOT NULL DEFAULT 1, 
      id TEXT PRIMARY KEY,
      quote_id TEXT NOT NULL,
      final_bom_item_id TEXT,
      master_id TEXT,
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
      created_at TEXT NOT NULL, is_included INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE
    );

-- TABLE: quotes
CREATE TABLE quotes ( "_version" INTEGER NOT NULL DEFAULT 1, 
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

-- TABLE: raw_bom_items
CREATE TABLE raw_bom_items ( "_version" INTEGER NOT NULL DEFAULT 1, 
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

-- TABLE: sheet_sync_configs
CREATE TABLE sheet_sync_configs (
      id TEXT PRIMARY KEY,
      source_table TEXT NOT NULL,
      target_sheet_id TEXT NOT NULL,
      target_tab_name TEXT NOT NULL,
      date_column TEXT,
      window_days INTEGER,
      fallback_mode TEXT NOT NULL DEFAULT 'all'
        CHECK (fallback_mode IN ('all', 'condition')),
      fallback_condition TEXT,
      enabled INTEGER NOT NULL DEFAULT 1,
      trigger_mode TEXT NOT NULL DEFAULT 'manual'
        CHECK (trigger_mode IN ('manual', 'periodic')),
      interval_ms INTEGER,
      last_run_at TEXT,
      last_run_status TEXT,
      last_run_error TEXT,
      last_row_count INTEGER,
      schedule_owner_device_id TEXT,
      schedule_version INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE (source_table, target_sheet_id, target_tab_name)
    );

-- TABLE: sheet_table_links
CREATE TABLE sheet_table_links (
      id TEXT PRIMARY KEY,
      user_table_id TEXT NOT NULL,
      spreadsheet_id TEXT NOT NULL,
      spreadsheet_url TEXT NOT NULL,
      data_tab_name TEXT NOT NULL,
      header_row INTEGER NOT NULL DEFAULT 1,
      sync_mode TEXT NOT NULL DEFAULT 'manual' CHECK(sync_mode IN ('manual', 'periodic')),
      periodic_interval_ms INTEGER,
      last_pulled_at TEXT,
      last_pushed_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_table_id) REFERENCES user_tables(id) ON DELETE CASCADE
    );

-- TABLE: sync_activity_log
CREATE TABLE sync_activity_log (
      id TEXT PRIMARY KEY,
      config_id TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      
      status TEXT NOT NULL CHECK(status IN ('success', 'failed', 'partial')),
      rows_imported INTEGER DEFAULT 0,
      rows_skipped INTEGER DEFAULT 0,
      duplicates_skipped INTEGER DEFAULT 0,
      error_message TEXT,
      
      started_at TEXT NOT NULL,
      completed_at TEXT,
      duration_ms INTEGER,
      
      FOREIGN KEY (config_id) REFERENCES sync_configurations(id) ON DELETE CASCADE
    );

-- TABLE: sync_configurations
CREATE TABLE sync_configurations (
      id TEXT PRIMARY KEY,
      script_folder_path TEXT UNIQUE NOT NULL,
      script_name TEXT NOT NULL,
      folder_name TEXT NOT NULL,
      
      -- Target SQL table
      target_table_id TEXT NOT NULL,
      
      -- Parsing configuration
      header_row INTEGER DEFAULT 1,
      skip_bottom_rows INTEGER DEFAULT 0,
      sheet_index INTEGER DEFAULT 0,
      
      -- Column mappings (JSON)
      column_mappings TEXT NOT NULL,
      applied_splits TEXT,

      -- File handling
      file_action TEXT DEFAULT 'archive' CHECK(file_action IN ('keep', 'archive', 'delete')),
      
      -- Auto-sync settings
      enabled BOOLEAN DEFAULT 1,
      auto_sync_enabled BOOLEAN DEFAULT 1,
      
      -- Duplicate detection
      unique_key_columns TEXT,
      duplicate_action TEXT DEFAULT 'skip' CHECK(duplicate_action IN ('skip', 'update', 'allow', 'replace-date-range', 'replace-all')),
      
      -- Status tracking
      last_sync_at TEXT,
      last_sync_status TEXT,
      last_sync_rows_imported INTEGER DEFAULT 0,
      last_sync_rows_skipped INTEGER DEFAULT 0,
      last_sync_duplicates INTEGER DEFAULT 0,
      last_sync_error TEXT,
      
      -- Metadata
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL, source TEXT DEFAULT 'browser' CHECK(source IN ('browser', 'desktop')), sync_target TEXT DEFAULT 'development' CHECK(sync_target IN ('development', 'production', 'both')),
      
      FOREIGN KEY (target_table_id) REFERENCES user_tables(id) ON DELETE CASCADE
    );

-- TABLE: system_baselines
CREATE TABLE system_baselines ( "_version" INTEGER NOT NULL DEFAULT 1, 
      id TEXT PRIMARY KEY,
      golden_case_id TEXT NOT NULL,
      baseline_name TEXT NOT NULL,
      parser_version TEXT NOT NULL,
      metrics_json TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (golden_case_id) REFERENCES golden_cases(id) ON DELETE CASCADE
    );

-- TABLE: uploaded_files
CREATE TABLE uploaded_files ( "_version" INTEGER NOT NULL DEFAULT 1, 
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

-- TABLE: user_company_access
CREATE TABLE user_company_access ( "_version" INTEGER NOT NULL DEFAULT 1, 
      user_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      access_role TEXT NOT NULL DEFAULT 'MEMBER',
      is_active INTEGER NOT NULL DEFAULT 1,
      PRIMARY KEY (user_id, company_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
    );

-- TABLE: user_data_cron_executions
CREATE TABLE user_data_cron_executions (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('running', 'success', 'failure')),
      started_at TEXT NOT NULL,
      completed_at TEXT,
      duration_ms INTEGER,
      result_message TEXT,
      error_message TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (job_id) REFERENCES user_data_cron_jobs(id) ON DELETE CASCADE
    );

-- TABLE: user_data_cron_jobs
CREATE TABLE user_data_cron_jobs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1,
      action_type TEXT NOT NULL CHECK(action_type IN ('sync_config', 'browser_recording', 'backup', 'script')),
      action_payload TEXT NOT NULL,
      scheduled_time TEXT NOT NULL,
      frequency_type TEXT NOT NULL CHECK(frequency_type IN ('daily', 'weekly', 'monthly', 'custom', 'cron')),
      day_of_week INTEGER,
      day_of_month INTEGER,
      custom_interval_days INTEGER,
      cron_expression TEXT,
      last_run TEXT,
      next_run TEXT,
      run_count INTEGER NOT NULL DEFAULT 0,
      success_count INTEGER NOT NULL DEFAULT 0,
      failure_count INTEGER NOT NULL DEFAULT 0,
      last_error TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

-- TABLE: user_data_files
CREATE TABLE user_data_files (
      id TEXT PRIMARY KEY,
      table_id TEXT NOT NULL,
      row_id INTEGER NOT NULL,
      column_name TEXT NOT NULL,

      -- File metadata
      filename TEXT NOT NULL,
      mime_type TEXT,
      size_bytes INTEGER NOT NULL,

      -- Storage details
      storage_type TEXT CHECK(storage_type IN ('blob', 'filesystem')) NOT NULL,
      file_data BLOB,
      file_path TEXT,

      -- Compression
      is_compressed INTEGER DEFAULT 0,
      compression_type TEXT DEFAULT 'none',
      original_size INTEGER,

      -- Metadata
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, metadata_json TEXT,

      FOREIGN KEY (table_id) REFERENCES user_tables(id) ON DELETE CASCADE,
      UNIQUE(table_id, row_id, column_name)
    );

-- TABLE: user_data_queue_jobs
CREATE TABLE user_data_queue_jobs (
      id TEXT PRIMARY KEY,
      name TEXT,
      action_type TEXT NOT NULL CHECK(action_type IN ('sync_config', 'browser_recording', 'backup', 'script')),
      action_payload TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending'
        CHECK(status IN ('pending', 'running', 'completed', 'failed', 'cancelled', 'dead')),
      priority INTEGER NOT NULL DEFAULT 0,
      attempts INTEGER NOT NULL DEFAULT 0,
      max_attempts INTEGER NOT NULL DEFAULT 3,
      run_after TEXT,
      started_at TEXT,
      completed_at TEXT,
      last_error TEXT,
      result_message TEXT,
      idempotency_key TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

-- TABLE: user_data_queue_runs
CREATE TABLE user_data_queue_runs (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL,
      attempt INTEGER NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('running', 'success', 'failure')),
      started_at TEXT NOT NULL,
      completed_at TEXT,
      duration_ms INTEGER,
      result_message TEXT,
      error_message TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (job_id) REFERENCES user_data_queue_jobs(id) ON DELETE CASCADE
    );

-- TABLE: user_tables
CREATE TABLE user_tables (
      id TEXT PRIMARY KEY,
      table_name TEXT UNIQUE NOT NULL,
      display_name TEXT NOT NULL,
      description TEXT,
      created_from_file TEXT,
      row_count INTEGER DEFAULT 0,
      column_count INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      schema_json TEXT NOT NULL
    , unique_key_columns TEXT, duplicate_action TEXT DEFAULT 'skip' CHECK(duplicate_action IN ('skip', 'update', 'allow', 'replace-date-range', 'replace-all')), has_imported_at_column INTEGER DEFAULT 0);

-- TABLE: users
CREATE TABLE users ( "_version" INTEGER NOT NULL DEFAULT 1, 
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

-- INDEX: idx_bom_areas_case
CREATE INDEX idx_bom_areas_case ON bom_areas(quotation_case_id);

-- INDEX: idx_cad_objects_parse_run
CREATE INDEX idx_cad_objects_parse_run ON cad_objects(parse_run_id);

-- INDEX: idx_cad_parse_runs_file
CREATE INDEX idx_cad_parse_runs_file ON cad_parse_runs(source_file_id);

-- INDEX: idx_drawing_rel_case
CREATE INDEX idx_drawing_rel_case ON drawing_relationships(quotation_case_id);

-- INDEX: idx_drawings_case
CREATE INDEX idx_drawings_case ON drawings(quotation_case_id);

-- INDEX: idx_final_bom_case
CREATE INDEX idx_final_bom_case ON final_bom_items(quotation_case_id);

-- INDEX: idx_flattened_bom_case
CREATE INDEX idx_flattened_bom_case ON flattened_bom_items(quotation_case_id);

-- INDEX: idx_import_operations_started_at
CREATE INDEX idx_import_operations_started_at ON import_operations(started_at);

-- INDEX: idx_import_operations_status
CREATE INDEX idx_import_operations_status ON import_operations(status);

-- INDEX: idx_import_operations_table_id
CREATE INDEX idx_import_operations_table_id ON import_operations(table_id);

-- INDEX: idx_normalized_bom_case
CREATE INDEX idx_normalized_bom_case ON normalized_bom_items(quotation_case_id);

-- INDEX: idx_raw_bom_case
CREATE INDEX idx_raw_bom_case ON raw_bom_items(quotation_case_id);

-- INDEX: idx_sheet_sync_configs_enabled
CREATE INDEX idx_sheet_sync_configs_enabled
      ON sheet_sync_configs(enabled);

-- INDEX: idx_sheet_table_links_spreadsheet_id
CREATE INDEX idx_sheet_table_links_spreadsheet_id
      ON sheet_table_links(spreadsheet_id);

-- INDEX: idx_sheet_table_links_user_table_id
CREATE INDEX idx_sheet_table_links_user_table_id
      ON sheet_table_links(user_table_id);

-- INDEX: idx_sync_activity_config_id
CREATE INDEX idx_sync_activity_config_id ON sync_activity_log(config_id);

-- INDEX: idx_sync_activity_started_at
CREATE INDEX idx_sync_activity_started_at ON sync_activity_log(started_at);

-- INDEX: idx_sync_activity_status
CREATE INDEX idx_sync_activity_status ON sync_activity_log(status);

-- INDEX: idx_sync_configs_auto_sync
CREATE INDEX idx_sync_configs_auto_sync ON sync_configurations(auto_sync_enabled);

-- INDEX: idx_sync_configs_enabled
CREATE INDEX idx_sync_configs_enabled ON sync_configurations(enabled);

-- INDEX: idx_sync_configs_script_folder
CREATE INDEX idx_sync_configs_script_folder ON sync_configurations(script_folder_path);

-- INDEX: idx_sync_configs_table_id
CREATE INDEX idx_sync_configs_table_id ON sync_configurations(target_table_id);

-- INDEX: idx_uploaded_files_case
CREATE INDEX idx_uploaded_files_case ON uploaded_files(quotation_case_id);

-- INDEX: idx_user_data_cron_executions_job_id
CREATE INDEX idx_user_data_cron_executions_job_id
      ON user_data_cron_executions(job_id);

-- INDEX: idx_user_data_cron_executions_started_at
CREATE INDEX idx_user_data_cron_executions_started_at
      ON user_data_cron_executions(started_at);

-- INDEX: idx_user_data_cron_jobs_enabled
CREATE INDEX idx_user_data_cron_jobs_enabled
      ON user_data_cron_jobs(enabled);

-- INDEX: idx_user_data_files_storage_type
CREATE INDEX idx_user_data_files_storage_type
      ON user_data_files(storage_type);

-- INDEX: idx_user_data_files_table_row
CREATE INDEX idx_user_data_files_table_row
      ON user_data_files(table_id, row_id);

-- INDEX: idx_user_data_queue_jobs_idempotency
CREATE UNIQUE INDEX idx_user_data_queue_jobs_idempotency
      ON user_data_queue_jobs(idempotency_key)
      WHERE idempotency_key IS NOT NULL;

-- INDEX: idx_user_data_queue_jobs_run_after
CREATE INDEX idx_user_data_queue_jobs_run_after
      ON user_data_queue_jobs(run_after);

-- INDEX: idx_user_data_queue_jobs_status_priority
CREATE INDEX idx_user_data_queue_jobs_status_priority
      ON user_data_queue_jobs(status, priority DESC, created_at ASC);

-- INDEX: idx_user_data_queue_runs_job_id
CREATE INDEX idx_user_data_queue_runs_job_id
      ON user_data_queue_runs(job_id);

-- INDEX: idx_user_tables_created_at
CREATE INDEX idx_user_tables_created_at ON user_tables(created_at);

-- INDEX: idx_user_tables_table_name
CREATE INDEX idx_user_tables_table_name ON user_tables(table_name);

-- TRIGGER: update_sheet_sync_configs_timestamp
CREATE TRIGGER update_sheet_sync_configs_timestamp
    AFTER UPDATE ON sheet_sync_configs
    BEGIN
      UPDATE sheet_sync_configs SET updated_at = datetime('now') WHERE id = NEW.id;
    END;

-- TRIGGER: update_sheet_table_links_timestamp
CREATE TRIGGER update_sheet_table_links_timestamp
    AFTER UPDATE ON sheet_table_links
    BEGIN
      UPDATE sheet_table_links SET updated_at = datetime('now') WHERE id = NEW.id;
    END;

-- TRIGGER: update_sync_configs_timestamp
CREATE TRIGGER update_sync_configs_timestamp
    AFTER UPDATE ON sync_configurations
    BEGIN
      UPDATE sync_configurations SET updated_at = datetime('now') WHERE id = NEW.id;
    END;

-- TRIGGER: update_user_tables_timestamp
CREATE TRIGGER update_user_tables_timestamp
    AFTER UPDATE ON user_tables
    BEGIN
      UPDATE user_tables SET updated_at = datetime('now') WHERE id = NEW.id;
    END;
