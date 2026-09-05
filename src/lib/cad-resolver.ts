import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';

// Smart Resolver: Resolves directory paths, .lnk shortcuts, or .exe paths to real executable + workingDir
export function resolveExecutable(inputPath: string): { exePath: string; workingDir: string } | null {
  if (!inputPath) return null;
  let cleanPath = inputPath.trim().replace(/^["']|["']$/g, '');

  // 1. If it's a directory
  if (fs.existsSync(cleanPath) && fs.statSync(cleanPath).isDirectory()) {
    // Check known executables inside (explicitly prioritize gcStart.exe and GcLauncher.exe)
    const candidateExes = ['gcStart.exe', 'GcLauncher.exe', 'dwgfastview.exe', 'DWGFastView.exe', 'acad.exe', 'dwgviewr.exe'];
    for (const exe of candidateExes) {
      const full = path.join(cleanPath, exe);
      if (fs.existsSync(full)) {
        return { exePath: full, workingDir: cleanPath };
      }
    }
    // Check shortcuts inside (filter out uninstallers/setups)
    try {
      const files = fs.readdirSync(cleanPath);
      const lnk = files.find(f => {
        const lower = f.toLowerCase();
        return lower.endsWith('.lnk') && !lower.includes('제거') && !lower.includes('uninstall') && !lower.includes('setup');
      });
      if (lnk) {
        cleanPath = path.join(cleanPath, lnk);
      }
    } catch {}
  }

  // 2. If it's a .lnk shortcut file
  if (cleanPath.toLowerCase().endsWith('.lnk') && fs.existsSync(cleanPath)) {
    try {
      const psCmd = `powershell -NoProfile -Command "(New-Object -ComObject WScript.Shell).CreateShortcut('${cleanPath.replace(/'/g, "''")}').TargetPath"`;
      const target = execSync(psCmd, { encoding: 'utf-8' }).trim();
      if (target && fs.existsSync(target)) {
        return { exePath: target, workingDir: path.dirname(target) };
      }
    } catch {}
  }

  // 3. If it's a direct executable file
  if (fs.existsSync(cleanPath) && !fs.statSync(cleanPath).isDirectory()) {
    return { exePath: cleanPath, workingDir: path.dirname(cleanPath) };
  }

  return null;
}
