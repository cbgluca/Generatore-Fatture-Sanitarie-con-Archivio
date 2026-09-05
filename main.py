"""
main.py — Entry point dell'applicazione FastAPI.

Avvia il server, crea le tabelle SQLite al primo avvio,
e serve i file statici del frontend.
"""

import json
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse

from database import engine, Base

# Importa i modelli per registrarli nel metadata di SQLAlchemy
import models  # noqa: F401
from routes import router as api_router

# ---------------------------------------------------------------------------
# Caricamento configurazione medico
# ---------------------------------------------------------------------------
CONFIG_PATH = Path(__file__).parent / "config.json"

with open(CONFIG_PATH, "r", encoding="utf-8") as f:
    CONFIG = json.load(f)

# ---------------------------------------------------------------------------
# Inizializzazione FastAPI
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Generatore di Fatture – Ricevute Sanitarie",
    version="1.0.0",
    description="WebApp locale per emissione e archiviazione ricevute sanitarie oculistiche.",
)

# Registra le route API (CRUD ricevute, pazienti, export)
app.include_router(api_router)

# ---------------------------------------------------------------------------
# Creazione tabelle al primo avvio (se non esistono già)
# ---------------------------------------------------------------------------
@app.on_event("startup")
def on_startup():
    """Crea le tabelle nel database SQLite se non esistono."""
    Base.metadata.create_all(bind=engine)


# ---------------------------------------------------------------------------
# Servizio file statici (frontend)
# ---------------------------------------------------------------------------
# La cartella "static" conterrà HTML, CSS e JS del frontend (Fasi successive)
STATIC_DIR = Path(__file__).parent / "static"
STATIC_DIR.mkdir(exist_ok=True)

app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


# ---------------------------------------------------------------------------
# Route di base
# ---------------------------------------------------------------------------
@app.get("/")
async def root():
    """Serve la pagina principale del frontend disabilitando la cache."""
    index_path = STATIC_DIR / "index.html"
    if index_path.exists():
        return FileResponse(
            str(index_path),
            headers={
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0",
            },
        )
    return {"message": "Generatore di Fatture – Backend attivo. Frontend in arrivo nella Fase 3."}


@app.get("/api/config")
async def get_config():
    """Restituisce la configurazione del medico e le prestazioni preimpostate ricaricando config.json."""
    try:
        with open(CONFIG_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
            return JSONResponse(
                content=data,
                headers={"Cache-Control": "no-cache, no-store, must-revalidate"},
            )
    except Exception as e:
        print(f"Errore lettura config.json: {e}")
        return CONFIG
