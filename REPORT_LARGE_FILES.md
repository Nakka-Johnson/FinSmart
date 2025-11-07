# Large Files Report

**Generated:** 2025-11-05

**Summary:** No files over 10MB found in git-tracked files.

## Scan Details

- **Threshold:** 10 MB
- **Scope:** All files tracked by git
- **Result:** ✅ Clean repository - no large binary files detected

## Best Practices

- Keep binary assets out of git (use Git LFS if needed)
- Avoid committing:
  - Compiled artifacts (`.jar`, `.war`, `target/`)
  - Node modules (`node_modules/`)
  - Build outputs (`dist/`, `build/`)
  - Database dumps
  - Large datasets
  - Video/audio files

## Current Protections

The `.gitignore` file already excludes common large file patterns:
- `backend/target/` - Maven build outputs
- `frontend/node_modules/` - npm dependencies  
- `frontend/dist/` - Vite build outputs
- `ai/.venv/` - Python virtual environment

---
*This report is auto-generated. Run `git ls-files | ForEach-Object { if (Test-Path $_) { $size = (Get-Item $_).Length; if ($size -gt 10MB) { "$_ ($size bytes)" } } }` to regenerate.*
