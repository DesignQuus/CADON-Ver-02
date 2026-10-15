import path from 'path';
import fs from 'fs';
import { getEgdeskProjectDir } from './paths';

export function getEgdeskStorageDir(): string {
  if (process.env.EGDESK_STORAGE_DIR && fs.existsSync(process.env.EGDESK_STORAGE_DIR)) {
    return process.env.EGDESK_STORAGE_DIR;
  }

  const egdeskProjectDir = getEgdeskProjectDir();
  if (egdeskProjectDir) {
    const egdeskStorage = path.join(egdeskProjectDir, 'storage');
    if (!fs.existsSync(egdeskStorage)) {
      fs.mkdirSync(egdeskStorage, { recursive: true });
    }
    return egdeskStorage;
  }

  // Fallback to local storage in workspace
  const localDir = path.join(process.cwd(), 'storage');
  if (!fs.existsSync(localDir)) {
    fs.mkdirSync(localDir, { recursive: true });
  }
  return localDir;
}

export function getStorageSubdir(subdir: 'files' | 'derived' | 'exports' | 'templates' | 'temp'): string {
  const base = getEgdeskStorageDir();
  const dir = path.join(base, subdir);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

/** EGDesk 프로젝트의 derived 디렉터리. EGDesk 프로젝트가 없으면 로컬 derived 와 동일. */
export function getEgdeskDerivedDir(): string {
  const projectDir = getEgdeskProjectDir();
  return projectDir ? path.join(projectDir, 'storage', 'derived') : getStorageSubdir('derived');
}

/** 파생 파일을 찾거나 지울 때 훑어야 하는 derived 디렉터리 후보(중복 제거). */
export function getDerivedSearchDirs(): string[] {
  return Array.from(new Set([
    getStorageSubdir('derived'),
    path.join(process.cwd(), 'storage', 'derived'),
    getEgdeskDerivedDir(),
  ]));
}

export function resolveStoragePath(storedPath: string): string {
  if (!storedPath) return '';
  if (fs.existsSync(storedPath)) return storedPath;

  const fileName = path.basename(storedPath);
  const base = getEgdeskStorageDir();

  // Check subdirectories in EGDesk storage
  for (const sub of ['files', 'derived', 'exports', 'templates', 'temp'] as const) {
    const candidate = path.join(base, sub, fileName);
    if (fs.existsSync(candidate)) return candidate;
  }

  // Fallback check in local workspace storage
  const localCandidate = path.resolve(process.cwd(), storedPath);
  if (fs.existsSync(localCandidate)) return localCandidate;

  return storedPath;
}
