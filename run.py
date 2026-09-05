"""
run.py — Launcher dell'applicazione Generatore di Fatture.

Avvia il server Uvicorn e apre automaticamente il browser predefinito
(Opera, Chrome, Edge, Firefox, ecc.) in background senza bloccare il terminale.
"""

import sys
import time
import threading
import webbrowser
import uvicorn

URL = "http://127.0.0.1:8000"


def apri_browser():
    """Attende che il server sia pronto e apre l'URL nel browser predefinito."""
    time.sleep(1.0)
    import subprocess
    from pathlib import Path

    opera_exe = Path.home() / "AppData/Local/Programs/Opera/opera.exe"
    opera_gx = Path.home() / "AppData/Local/Programs/Opera GX/opera.exe"
    
    # 1. Se Opera è installato, avvialo direttamente passandogli l'URL
    for op in [opera_exe, opera_gx]:
        if op.exists():
            try:
                subprocess.Popen([str(op), URL])
                return
            except Exception:
                pass

    # 2. Altrimenti usa il gestore predefinito di sistema (Edge, Chrome, ecc.)
    try:
        webbrowser.open(URL)
    except Exception as err:
        print(f"[AVVISO] Impossibile avviare il browser automaticamente: {err}")


if __name__ == "__main__":
    print("=" * 60)
    print("   GENERATORE DI FATTURE - RICEVUTE SANITARIE")
    print("=" * 60)
    print(f"\n[INFO] Applicazione in esecuzione su: {URL}")
    print("[INFO] Sto aprendo il tuo browser...")
    print("[INFO] Se non dovesse aprirsi da solo, copia il link sopra nel browser.")
    print("[INFO] Per chiudere il programma: chiudi questa finestra o premi CTRL+C.\n")
    print("=" * 60)

    # Avvia l'apertura del browser in un thread secondario per non bloccare Uvicorn
    threading.Thread(target=apri_browser, daemon=True).start()

    # Avvia Uvicorn (bloccante sul main thread fino alla chiusura)
    uvicorn.run("main:app", host="127.0.0.1", port=8000, log_level="info", reload=False)
