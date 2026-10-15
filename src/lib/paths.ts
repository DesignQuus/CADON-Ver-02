import fs from 'fs';
import os from 'os';
import path from 'path';

function appDataDir(): string {
  return process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
}

function egdeskProjectsRoot(): string {
  const envName = process.env.NEXT_PUBLIC_EGDESK_ENV || 'development';
  return path.join(appDataDir(), 'egdesk', 'user-data', envName, 'projects');
}

let cachedProjectDir: string | null | undefined;

/**
 * EGDesk 프로젝트 데이터 디렉터리(user_data.db, storage/ 포함).
 * 찾지 못하면 null — 호출부는 로컬 storage/ 로 대체한다.
 *
 * 우선순위:
 *  1. EGDESK_PROJECT_DIR
 *  2. NEXT_PUBLIC_EGDESK_PROJECT_ID (+ NEXT_PUBLIC_EGDESK_ENV)
 *  3. 프로젝트 ID 미지정 시, 프로젝트 폴더가 정확히 1개일 때만 자동 선택
 */
export function getEgdeskProjectDir(): string | null {
  if (cachedProjectDir !== undefined) return cachedProjectDir;
  cachedProjectDir = resolveEgdeskProjectDir();
  return cachedProjectDir;
}

function resolveEgdeskProjectDir(): string | null {
  const explicit = process.env.EGDESK_PROJECT_DIR;
  if (explicit) return fs.existsSync(explicit) ? explicit : null;

  const root = egdeskProjectsRoot();
  const projectId = process.env.NEXT_PUBLIC_EGDESK_PROJECT_ID;
  if (projectId) {
    const dir = path.join(root, projectId);
    return fs.existsSync(dir) ? dir : null;
  }

  try {
    const dirs = fs
      .readdirSync(root, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
    if (dirs.length === 1) return path.join(root, dirs[0]);
    if (dirs.length > 1) {
      console.warn(
        `[paths] EGDesk 프로젝트가 ${dirs.length}개라 자동 선택하지 않습니다. ` +
          'NEXT_PUBLIC_EGDESK_PROJECT_ID 또는 EGDESK_PROJECT_DIR 을 설정하세요. 로컬 storage/ 를 사용합니다.',
      );
    }
  } catch {
    // EGDesk 미설치 환경(리눅스 서버, Docker 등)
  }
  return null;
}
