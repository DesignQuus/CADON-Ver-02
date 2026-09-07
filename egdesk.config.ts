/**
 * EGDesk User Data Configuration
 * Generated at: 2026-09-07T22:34:23.524Z
 *
 * This file contains type-safe definitions for your EGDesk tables.
 */

export const EGDESK_CONFIG = {
  apiUrl: 'http://localhost:8080',
  tunnelUrl: 'https://tunneling-service.onrender.com/t/lee-mac-pc',
  apiKey: '1468e8f0-0b9b-447c-b5b0-d7c9a29817d8',
} as const;

export interface TableDefinition {
  name: string;
  displayName: string;
  description?: string;
  /** Omitted or unknown until synced / counted */
  rowCount?: number;
  columnCount: number;
  columns: string[];
}

export const TABLES = {
  table1: {
    name: 'users',
    displayName: '사용자 계정 대장',
    description: '시스템 사용자 및 권한',
    rowCount: 2,
    columnCount: 11,
    columns: ['id', '_version', 'login_id', 'password_hash', 'name', 'role', 'company_id', 'is_active', 'last_login_at', 'created_at', 'updated_at']
  } as TableDefinition,
  table2: {
    name: 'user_company_access',
    displayName: '사용자-회사 접근 권한',
    description: '테넌트별 사용자 접근 권한',
    rowCount: 1,
    columnCount: 5,
    columns: ['user_id', '_version', 'company_id', 'access_role', 'is_active']
  } as TableDefinition,
  table3: {
    name: 'uploaded_files',
    displayName: '업로드/파생 파일 관리',
    description: '도면(DWG/DXF/SVG) 파일 메타데이터',
    rowCount: 12,
    columnCount: 14,
    columns: ['id', '_version', 'quotation_case_id', 'original_file_name', 'stored_file_name', 'storage_path', 'file_type', 'file_role', 'derived_from_file_id', 'file_size', 'checksum', 'upload_status', 'uploaded_by_user_id', 'created_at']
  } as TableDefinition,
  table4: {
    name: 'system_baselines',
    displayName: '골든 기준선 벤치마크',
    description: '파서 정확도 및 회귀 검증 지표',
    rowCount: 1,
    columnCount: 8,
    columns: ['id', '_version', 'golden_case_id', 'baseline_name', 'parser_version', 'metrics_json', 'created_by', 'created_at']
  } as TableDefinition,
  table5: {
    name: 'raw_bom_items',
    displayName: 'CAD 추출 Raw BOM',
    description: '도면에서 추출된 원본 BOM 행 아이템',
    rowCount: 1386,
    columnCount: 17,
    columns: ['id', '_version', 'quotation_case_id', 'drawing_no', 'row_index', 'item_no_raw', 'part_no_raw', 'name_raw', 'specification_raw', 'material_raw', 'quantity_raw', 'quantity_numeric', 'unit_raw', 'remark_raw', 'source_handles_json', 'status', 'created_at']
  } as TableDefinition,
  table6: {
    name: 'quotes',
    displayName: '견적서 마스터',
    description: '견적 헤더, 할인율, 부가세, 총액, 버전',
    rowCount: 8,
    columnCount: 24,
    columns: ['id', '_version', 'quotation_case_id', 'quote_no', 'quote_version', 'company_id', 'project_id', 'status', 'currency', 'subtotal', 'discount_type', 'discount_rate', 'discount_amount', 'tax_rate', 'tax_amount', 'total_amount', 'quote_date', 'is_locked', 'created_by_user_id', 'approved_by_user_id', 'approved_at', 'override_reason', 'created_at', 'updated_at']
  } as TableDefinition,
  table7: {
    name: 'quote_items',
    displayName: '견적서 명세 품목',
    description: '견적 행별 단가, 금액, 포함 여부',
    rowCount: 101,
    columnCount: 19,
    columns: ['id', '_version', 'quote_id', 'final_bom_item_id', 'master_id', 'item_no', 'master_code', 'item_name', 'specification', 'material', 'quantity', 'unit', 'unit_price', 'amount', 'price_source', 'price_status', 'remark', 'created_at', 'is_included']
  } as TableDefinition,
  table8: {
    name: 'quote_exports',
    displayName: '견적서 엑셀 발행 이력',
    description: '발행된 견적서 엑셀 파일 메타데이터',
    rowCount: 2,
    columnCount: 12,
    columns: ['id', '_version', 'quote_id', 'quote_version', 'template_id', 'file_name', 'storage_path', 'file_size', 'export_status', 'is_draft', 'exported_by_user_id', 'exported_at']
  } as TableDefinition,
  table9: {
    name: 'quotation_cases',
    displayName: '견적의뢰 건 관리',
    description: '도면 등록 및 견적의뢰 건',
    rowCount: 2,
    columnCount: 13,
    columns: ['id', '_version', 'case_no', 'company_id', 'project_id', 'case_name', 'request_date', 'status', 'revision', 'quote_readiness', 'created_by_user_id', 'created_at', 'updated_at']
  } as TableDefinition,
  table10: {
    name: 'projects',
    displayName: '프로젝트 관리',
    description: '고객사별 프로젝트',
    rowCount: 1,
    columnCount: 9,
    columns: ['id', '_version', 'company_id', 'project_code', 'project_name', 'description', 'status', 'created_at', 'updated_at']
  } as TableDefinition,
  table11: {
    name: 'product_masters',
    displayName: '표준 마스터 품목 대장',
    description: '표준 부품 마스터 코드 및 규격',
    rowCount: 7,
    columnCount: 12,
    columns: ['id', '_version', 'company_id', 'master_code', 'standard_name', 'category', 'specification', 'material', 'unit', 'status', 'created_at', 'updated_at']
  } as TableDefinition,
  table12: {
    name: 'price_masters',
    displayName: '기준 단가 마스터',
    description: '표준 부품별 기본 단가표',
    rowCount: 7,
    columnCount: 12,
    columns: ['id', '_version', 'master_id', 'company_id', 'price_type', 'unit_price', 'currency', 'effective_from', 'effective_to', 'is_active', 'created_at', 'updated_at']
  } as TableDefinition,
  table13: {
    name: 'normalized_bom_items',
    displayName: '정규화 BOM 아이템',
    description: '약어 확장, 방향, 규격/재질 표준화 아이템',
    rowCount: 115,
    columnCount: 14,
    columns: ['id', '_version', 'quotation_case_id', 'raw_item_id', 'raw_name', 'normalized_name', 'search_name', 'direction', 'spec_candidate', 'material_candidate', 'quantity', 'unit', 'status', 'created_at']
  } as TableDefinition,
  table14: {
    name: 'master_candidates',
    displayName: '마스터 추천 매칭 후보',
    description: '유사도 채점 및 긍정/부정 근거',
    rowCount: 54,
    columnCount: 14,
    columns: ['id', '_version', 'normalized_item_id', 'master_id', 'master_code', 'standard_name', 'specification', 'material', 'rank', 'total_score', 'positive_evidence_json', 'negative_evidence_json', 'candidate_status', 'created_at']
  } as TableDefinition,
  table15: {
    name: 'master_aliases',
    displayName: '마스터 품목 별칭 대장',
    description: '품목 이명 및 동의어 매핑',
    rowCount: 1,
    columnCount: 11,
    columns: ['id', '_version', 'company_id', 'master_id', 'alias_name', 'alias_normalized', 'approval_count', 'rejection_count', 'scope', 'created_at', 'updated_at']
  } as TableDefinition,
  table16: {
    name: 'manual_price_pool',
    displayName: '수기 단가 지식 풀',
    description: '수기 입력된 단가 누적 학습 풀',
    rowCount: 23,
    columnCount: 10,
    columns: ['id', '_version', 'item_name', 'specification', 'material', 'unit_price', 'remark', 'quotation_case_id', 'created_by_user_id', 'created_at']
  } as TableDefinition,
  table17: {
    name: 'golden_cases',
    displayName: '골든 데이터셋 케이스',
    description: '파서 검증용 표준 벤치마크 케이스',
    rowCount: 1,
    columnCount: 15,
    columns: ['id', '_version', 'project_id', 'quotation_case_id', 'case_code', 'name', 'description', 'data_classification', 'source_checksum', 'status', 'actual_drawing_count', 'actual_bom_count', 'actual_item_count', 'created_by', 'created_at']
  } as TableDefinition,
  table18: {
    name: 'flattened_bom_items',
    displayName: '다단계 집계 BOM',
    description: '조립 구조가 반영된 롤업 BOM 아이템',
    rowCount: 115,
    columnCount: 13,
    columns: ['id', '_version', 'quotation_case_id', 'item_key', 'part_no', 'name', 'specification', 'material', 'total_quantity', 'unit', 'source_drawings_json', 'source_item_ids_json', 'created_at']
  } as TableDefinition,
  table19: {
    name: 'final_bom_items',
    displayName: '최종 확정 견적 BOM',
    description: '승인 완료된 최종 견적 대상 품목',
    rowCount: 43,
    columnCount: 15,
    columns: ['id', '_version', 'quotation_case_id', 'normalized_item_id', 'final_master_id', 'final_master_code', 'final_name', 'final_spec', 'final_material', 'final_quantity', 'final_unit', 'approval_status', 'approved_by_user_id', 'approved_at', 'created_at']
  } as TableDefinition,
  table20: {
    name: 'excel_templates',
    displayName: '엑셀 템플릿 관리',
    description: '공식 견적서 엑셀 양식 관리',
    rowCount: 1,
    columnCount: 13,
    columns: ['id', '_version', 'company_id', 'template_name', 'original_file_name', 'storage_path', 'template_type', 'version', 'is_active', 'is_default', 'created_by_user_id', 'created_at', 'updated_at']
  } as TableDefinition,
  table21: {
    name: 'dwg_conversion_runs',
    displayName: 'DWG 변환 실행 이력',
    description: 'LibreDWG 변환 실행 로그',
    rowCount: 13,
    columnCount: 19,
    columns: ['id', '_version', 'source_file_id', 'derived_file_id', 'provider', 'converter_version', 'source_dwg_signature', 'source_dwg_version', 'output_dxf_version', 'status', 'started_at', 'completed_at', 'duration_ms', 'exit_code', 'warning_count', 'warnings_json', 'error_code', 'error_message', 'created_at']
  } as TableDefinition,
  table22: {
    name: 'drawings',
    displayName: '도면 시트 및 표제란',
    description: '도면 번호, 품명, 규격, 척도, 리비전',
    rowCount: 175,
    columnCount: 17,
    columns: ['id', '_version', 'quotation_case_id', 'drawing_index', 'drawing_no_raw', 'drawing_no_normalized', 'drawing_name_raw', 'drawing_name_normalized', 'revision', 'material', 'scale', 'drawing_type', 'frame_bbox_json', 'title_block_bbox_json', 'confidence_score', 'status', 'created_at']
  } as TableDefinition,
  table23: {
    name: 'drawing_relationships',
    displayName: '도면 계층 관계',
    description: '조립도-부조립도-단품 종속 관계',
    rowCount: 117,
    columnCount: 8,
    columns: ['id', '_version', 'quotation_case_id', 'parent_drawing_no', 'child_drawing_no', 'relationship_type', 'confidence_score', 'created_at']
  } as TableDefinition,
  table24: {
    name: 'companies',
    displayName: '고객사/협력사 대장',
    description: '고객사 정보 및 테넌트 식별',
    rowCount: 2,
    columnCount: 8,
    columns: ['id', '_version', 'company_code', 'company_name', 'company_type', 'is_active', 'created_at', 'updated_at']
  } as TableDefinition,
  table25: {
    name: 'case_archives',
    displayName: '분석 스냅샷 아카이브',
    description: '견적 건 분석 상태 스냅샷',
    rowCount: 2,
    columnCount: 10,
    columns: ['id', '_version', 'quotation_case_id', 'archive_version', 'archive_name', 'drawings_count', 'bom_items_count', 'snapshot_data_json', 'created_by_user_id', 'created_at']
  } as TableDefinition,
  table26: {
    name: 'cad_parse_runs',
    displayName: 'CAD 파싱 실행 이력',
    description: 'CAD 엔티티 파싱 통계 및 결과',
    rowCount: 21,
    columnCount: 10,
    columns: ['id', '_version', 'source_file_id', 'dxf_version', 'total_entities', 'entity_counts_json', 'global_bounds_json', 'status', 'duration_ms', 'created_at']
  } as TableDefinition,
  table27: {
    name: 'cad_objects',
    displayName: 'CAD 객체 기하 데이터',
    description: '도면 개별 CAD 엔티티 캐시',
    rowCount: 931845,
    columnCount: 11,
    columns: ['id', '_version', 'parse_run_id', 'handle', 'entity_type', 'layer', 'color', 'raw_text', 'bounding_box_json', 'geometry_data_json', 'created_at']
  } as TableDefinition,
  table28: {
    name: 'cad_app_settings',
    displayName: '로컬 CAD 실행 경로',
    description: 'AutoCAD / DWG FastView / TrueView 경로',
    rowCount: 0,
    columnCount: 4,
    columns: ['key', '_version', 'value', 'updated_at']
  } as TableDefinition,
  table29: {
    name: 'bom_areas',
    displayName: 'BOM 검출 영역',
    description: '도면 내 BOM 테이블 영역 바운딩 박스',
    rowCount: 136,
    columnCount: 9,
    columns: ['id', '_version', 'quotation_case_id', 'drawing_no', 'table_type', 'bbox_json', 'confidence_score', 'status', 'created_at']
  } as TableDefinition,
  table30: {
    name: 'bom_approval_records',
    displayName: 'BOM 승인/수정 이력',
    description: '사용자 승인 결정 및 마스터 오버라이드',
    rowCount: 38,
    columnCount: 12,
    columns: ['id', '_version', 'quotation_case_id', 'normalized_item_id', 'selected_master_id', 'decision_type', 'decision_reason', 'difference_notes', 'is_override', 'approved_by_user_id', 'approved_at', 'created_at']
  } as TableDefinition,
  table31: {
    name: 'example_table',
    displayName: 'Example Table',
    rowCount: 0,
    columnCount: 4,
    columns: ['id', '_version', 'name', 'created_at']
  } as TableDefinition
} as const;


// Main table (first table by default)
export const MAIN_TABLE = TABLES.table1;


// Helper to get table by name
export function getTableByName(tableName: string): TableDefinition | undefined {
  return Object.values(TABLES).find(t => t.name === tableName);
}

// Export table names for easy access
export const TABLE_NAMES = {
  table1: 'users',
  table2: 'user_company_access',
  table3: 'uploaded_files',
  table4: 'system_baselines',
  table5: 'raw_bom_items',
  table6: 'quotes',
  table7: 'quote_items',
  table8: 'quote_exports',
  table9: 'quotation_cases',
  table10: 'projects',
  table11: 'product_masters',
  table12: 'price_masters',
  table13: 'normalized_bom_items',
  table14: 'master_candidates',
  table15: 'master_aliases',
  table16: 'manual_price_pool',
  table17: 'golden_cases',
  table18: 'flattened_bom_items',
  table19: 'final_bom_items',
  table20: 'excel_templates',
  table21: 'dwg_conversion_runs',
  table22: 'drawings',
  table23: 'drawing_relationships',
  table24: 'companies',
  table25: 'case_archives',
  table26: 'cad_parse_runs',
  table27: 'cad_objects',
  table28: 'cad_app_settings',
  table29: 'bom_areas',
  table30: 'bom_approval_records',
  table31: 'example_table'
} as const;
