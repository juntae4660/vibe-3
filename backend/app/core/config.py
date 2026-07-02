from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = BASE_DIR / "data"
DATABASE_PATH = DATA_DIR / "app.db"
UPLOADS_DIR = DATA_DIR / "uploads"
MANUALS_DIR = DATA_DIR / "manuals"
VECTORSTORE_DIR = DATA_DIR / "vectorstores"
