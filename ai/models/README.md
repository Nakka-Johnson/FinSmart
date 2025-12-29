# Model artefacts directory

This directory stores trained model artefacts.

## Structure

```
models/
└── v<YYYYMMDD_HHMMSS>/
    ├── manifest.json           # Version metadata
    ├── embedding_service.joblib
    ├── merchant_service.joblib
    ├── category_service.joblib
    └── anomaly_service.joblib
```

## Usage

Models are automatically loaded at server startup from the latest version.

To train new models:
```bash
cd ai
python scripts/train_all.py
```
