# Cleanup Report: Removed Files

**Generated:** 2025-11-07  
**Branch:** chore/cleanup-structure

## Build Artifacts & Dependencies

The following build artifacts and dependency directories were removed:

### Root Level
- `node_modules/` - Root package dependencies (48.9 MB)
- `package-lock.json` - Root lock file (will be regenerated if needed)

### Backend (Spring Boot 3 / Maven)
- `backend/target/` - Compiled Java classes and JAR artifacts
- `backend/.idea/` - IntelliJ IDEA project files (if existed)

### Frontend (Vite React)
- `frontend/node_modules/` - npm dependencies (>500 MB)
- `frontend/dist/` - Production build output
- `frontend/.vite/` - Vite cache (if existed)

### AI (FastAPI / Python)
- `ai/.venv/` - Python virtual environment (>200 MB)
  - Contained large files: numpy.libs/libscipy_openblas64 (>10MB)
- `ai/__pycache__/` - Python bytecode cache

## Temporary & Cache Files

- `**/.DS_Store` - macOS metadata (none found)
- `**/*.log` - Log files (none found)
- `**/*.tmp` - Temporary files (none found)
- `Thumbs.db` - Windows thumbnail cache (none found)

## Total Space Reclaimed

Approximately **~800 MB** of build artifacts and dependencies removed.

## Restoration

To restore dependencies:

```powershell
# Backend
cd backend
mvn clean install

# Frontend
cd frontend
npm ci

# AI
cd ai
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

---

**Note:** All removed items are in .gitignore and should never be committed to version control.
