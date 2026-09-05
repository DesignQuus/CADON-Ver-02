import path from 'path';
import fs from 'fs';

export function getEgdeskStorageDir(): string {
  if (process.env.EGDESK_STORAGE_DIR && fs.existsSync(process.env.EGDESK_STORAGE_DIR)) {
    return process.env.EGDESK_STORAGE_DIR;
  }

  const projectId = process.env.NEXT_PUBLIC_EGDESK_PROJECT_ID || '5883d2d5-7b0a-4947-a4fa-1f702c1dbc2f';
  const envName = process.env.NEXT_PUBLIC_EGDESK_ENV || 'development';
  const appData = process.env.APPDATA || path.join(process.env.USERPROFILE || 'C:\\Users\\SteveLee', 'AppData', 'Roaming');
  
  const egdeskProjectDir = path.join(appData, 'egdesk', 'user-data', envName, 'projects', projectId);
  if (fs.existsSync(egdeskProjectDir)) {
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
