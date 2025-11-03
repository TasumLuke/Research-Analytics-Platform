# BUILDING THE WINDOWS EXECUTABLE, from the authors

**Author:** Luke Rimmo Lego, Denver Baptiste

This README describes, step-by-step, how to replicate my workflow to build the Windows executable (installer + portable EXE) for the *Research Analytics Platform, AI Model Trainer* from source. It includes exact commands run on my Windows 10 machine, common fixes I encountered, and quick troubleshooting notes so you can reproduce the build reliably.

---

## TL;DR (quick commands)

1. Clone the repo and install dev deps:

```bash
git clone <repo-url>
cd Research-Analytics-Platform-Chem-Bio
npm install
# ensure electron & electron-builder are devDependencies
npm uninstall electron electron-builder --save
npm install --save-dev electron electron-builder wait-on concurrently cross-env
```

2. Make the Electron main process CommonJS (recommended):

```powershell
# from project root (PowerShell)
Rename-Item electron\main.js electron\main.cjs
npm pkg set main="electron/main.cjs"
```

3. Build (Windows portable + installer):

```bash
npm run electron:build -- --win
# or if NSIS errors, build portable only:
npm run electron:build -- --win portable
```

---

# 1. Environment & prerequisites

- Windows 10/11 with **enough free disk space**, We recommend **≥ 5 GB** free on the drive where the project and build cache live (usually `C:`). NSIS and packaging produce large temporary files.
- Node.js (LTS) and npm.
- Git.
- Optional but recommended: Visual Studio Build Tools (for native dependency builds) and Windows SDK (for `signtool.exe` if you want to sign installers locally).

> Note: On modern Windows builds `wmic` may be missing — use PowerShell `Get-CimInstance Win32_LogicalDisk` to inspect free disk space.

---

# 2. Clone & install

```bash
# clone (replace URL)
git clone <repo-url>
cd Research-Analytics-Platform-Chem-Bio

# install regular deps
npm install
```

If you see warnings about `electron` / `electron-builder` being in `dependencies`, move them to `devDependencies` (see next section). If `npm` reports vulnerable packages, `npm audit` and `npm audit fix` are good follow-ups but not required to build.

---

# 3. package.json, minimal required fields & scripts

Make sure your `package.json` includes the following **scripts** (adapt `dev` / `build` to your project if you use a different bundler):

```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "start": "electron .",
  "electron": "wait-on http://localhost:8080 && electron .",
  "electron:dev": "concurrently \"npm run dev\" \"npm run electron\"",
  "electron:build": "npm run build && electron-builder"
}
```

Top-level `main` and a `build` config (this can sit in `package.json` or in `electron-builder.json`):

```json
"main": "electron/main.cjs",
"build": {
  "appId": "com.student.aitrainer",
  "productName": "AI Model Trainer",
  "files": [
    "dist/**",
    "electron/**",
    "node_modules/**",
    "package.json"
  ],
  "directories": {
    "buildResources": "electron"
  },
  "win": { "target": ["nsis","portable","zip"] },
  "nsis": { "oneClick": true, "perMachine": false }
}
```

> Tip: Set `appId`, `productName`, `companyName`, `version`, `description`, and `author` in `package.json` so installers show proper metadata.

---

# 4. Fix Common problems we hit (and the exact fixes)

## Problem A, `electron` and `electron-builder` listed under `dependencies`
**Error:** `Package "electron" is only allowed in "devDependencies". Please remove it from the "dependencies" section.`

**Fix (quick):** run:

```bash
npm uninstall electron electron-builder --save
npm install --save-dev electron electron-builder wait-on concurrently cross-env
```

Or edit `package.json` and move entries from `dependencies` to `devDependencies` and run `npm install`.

---

## Problem B — `require is not defined in ES module scope` (main process crash)
**Cause:** Your `package.json` contains `"type": "module"` (ESM), but `electron/main.js` uses `require(...)` (CommonJS). The Electron main process crashed with the `ReferenceError: require is not defined`.

**Recommended fix (I used this):** keep your renderer/modern code ESM, but make the Electron main process CommonJS by renaming it to `.cjs` and updating `package.json.main`.

Commands (PowerShell):

```powershell
Set-Location 'C:\Users\Luke\Downloads\Research-Analytics-Platform-Chem-Bio'
Rename-Item -Path .\electron\main.js -NewName main.cjs
npm pkg set main="electron/main.cjs"
```

And use this minimal CommonJS `electron/main.cjs`
If your `preload` script uses `require`, rename it to `preload.cjs` and make sure the path above matches.

---

# 5. Building the executable

**Build (normal, preferred):**

```bash
npm run electron:build -- --win
```

This will produce:

- `release\AI Model Trainer Setup <version>.exe` (NSIS installer)
- `release\AI Model Trainer <version>.exe` (portable EXE)
- `release\win-unpacked\` (unpacked app)

**Build only a portable or zip without NSIS (workaround if NSIS fails):**

```bash
npm run electron:build -- --win portable
npm run electron:build -- --win zip
```

Portable/zip are faster and often don't hit the `makensis.exe` write errors.

---

# 6. Common packaging/troubleshooting (detailed)

### 6.1 Insufficient disk space / makensis write errors
**Symptoms:** `Error: can't write ... bytes to output` from `makensis.exe` (NSIS), or build aborts.

**Cause:** Not enough free space on the drive where the project and electron-builder cache live (commonly `C:`). NSIS writes the installer and temp files before finishing.

**Checks (PowerShell):**

```powershell
Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='C:'" | Select-Object DeviceID,@{Name='FreeGB';Expression={"{0:N2}" -f ($_.FreeSpace/1GB)}}
```

**Quick fixes:**

- Free up space (delete large files, empty Recycle Bin). I recommend freeing **≥ 2–5 GB**.
- Move the project to a drive with more space (example `D:\projects`) and run `npm install` again there.
- Remove stale `release/` outputs and NSIS cache so builder can re-download a clean NSIS:

```powershell
# from project root
Remove-Item -LiteralPath .\release -Recurse -Force -ErrorAction SilentlyContinue
$r = Join-Path $env:LOCALAPPDATA "electron-builder\Cache\nsis"
if (Test-Path $r) { Remove-Item -LiteralPath $r -Recurse -Force -ErrorAction SilentlyContinue }
```

- Temporarily disable antivirus or add exclusions for the project folder and `%LOCALAPPDATA%\electron-builder\Cache` (Windows Security → Virus & threat protection → Exclusions).
- Run the build in an elevated shell (Run as Administrator).

If you need immediate distributable output while debugging NSIS, run the `portable` or `zip` targets described earlier.

---

### 6.2 `electron` listed in dependencies (fix)
If builder complains, move `electron` and `electron-builder` to `devDependencies`. Use `npm uninstall ... --save` then `npm install --save-dev ...` (see quick commands above).

---

### 6.3 `require is not defined` (fix recap)
Make the main process `.cjs` or convert `main.js` to ESM using `import`. I found `.cjs` easiest.

---

# 7. After the build — what to test

- Run the **portable** EXE from `release` — this runs the app without installation.
- Run the **installer** and verify install/uninstall flows. Check Start Menu shortcut and the installed executable.
- Test the apps on another Windows account or VM to ensure nothing is missing.

---

# 8. Polish & distribution tips

- **Set an application icon**: place your `.ico` in the `electron` build resources directory and set `icon` in `build` config. Without it the default Electron icon is used.
- **Code signing**: to avoid SmartScreen warnings, use a code signing certificate and configure `signing` (you will need the Windows SDK `signtool.exe` or CI signing). I signed artifacts locally with `signtool.exe`; for public distribution use an official cert.
- **Versioning**: update `version` in `package.json` before building releases.
- **CI**: use GitHub Actions or another CI that runs Windows, macOS, and Linux runners for reproducible multi-OS builds and secure signing (store signing secrets in your repository secrets).

---

# 9. Example GitHub Actions (short)

If you want a quick start, here is a minimal workflow snippet for Windows builds (place in `.github/workflows/build-windows.yml`):

```yaml
name: build-windows
on: [push, workflow_dispatch]
jobs:
  build:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install deps
        run: npm ci
      - name: Build
        run: npm run electron:build -- --win
      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: windows-release
          path: release
```

This builds on a Windows runner so NSIS and code-signing tools are available (if you add secrets and certificates to the runner for signing).

---

# 10. Handy commands & reference snippets

Rename main (CMD):

```cmd
ren electron\main.js main.cjs
```

Rename main (PowerShell):

```powershell
Rename-Item -Path .\electron\main.js -NewName main.cjs
npm pkg set main="electron/main.cjs"
```

Remove old release & NSIS cache (PowerShell):

```powershell
Remove-Item -LiteralPath .\release -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath "$env:LOCALAPPDATA\electron-builder\Cache\nsis" -Recurse -Force -ErrorAction SilentlyContinue
```

Portable build (no NSIS):

```bash
npm run electron:build -- --win portable
```

Verbose debug build (electron-builder debug logs):

```cmd
set DEBUG=electron-builder
npm run electron:build -- --win
```

Check drive free space (PowerShell):

```powershell
Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='C:'" | Select-Object DeviceID,@{Name='FreeGB';Expression={"{0:N2}" -f ($_.FreeSpace/1GB)}}
```

---
