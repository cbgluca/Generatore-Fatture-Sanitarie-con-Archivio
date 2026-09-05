"""Test di integrazione per tutte le API della Fase 2."""

import urllib.request
import json

BASE = "http://127.0.0.1:8000"


def api_get(path):
    r = urllib.request.urlopen(f"{BASE}{path}")
    return json.loads(r.read())


def api_post(path, data):
    payload = json.dumps(data).encode()
    req = urllib.request.Request(
        f"{BASE}{path}",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    r = urllib.request.urlopen(req)
    return json.loads(r.read())


# TEST 1: Prossimo numero (anno 2026, deve essere 1)
data = api_get("/api/ricevute/prossimo-numero?anno=2026")
print(f"TEST 1 - Prossimo numero 2026: {data}")
assert data["prossimo_numero"] == 1

# TEST 2: Crea prima ricevuta (subtotale 90, bollo applicato -> totale 92)
ric1 = api_post("/api/ricevute", {
    "data_emissione": "2026-09-03",
    "paziente": {
        "titolo": "Sig.",
        "cognome": "Bianchi",
        "nome": "Marco",
        "indirizzo": "Via Verdi 10",
        "citta": "Milano",
        "cap": "20100",
        "codice_fiscale": "BNCMRC80A01F205X",
    },
    "righe": [
        {"ordine": 1, "descrizione": "Prima visita oculistica", "importo": "60.00"},
        {"ordine": 2, "descrizione": "Tonometria", "importo": "30.00"},
    ],
    "bollo_applicato": True,
    "bollo_a_carico_paziente": True,
    "metodo_pagamento": "pos",
})
print(f"TEST 2 - Ricevuta: {ric1['anno']}/{ric1['numero']} Totale: {ric1['totale_da_pagare']}")
assert ric1["numero"] == 1
assert float(ric1["totale_da_pagare"]) == 92.00

# TEST 3: Prossimo numero ora deve essere 2
data = api_get("/api/ricevute/prossimo-numero?anno=2026")
print(f"TEST 3 - Prossimo numero 2026: {data}")
assert data["prossimo_numero"] == 2

# TEST 4: Crea seconda ricevuta (50 EUR, niente bollo)
ric2 = api_post("/api/ricevute", {
    "data_emissione": "2026-09-03",
    "paziente": {
        "titolo": "Sig.ra",
        "cognome": "Verdi",
        "nome": "Anna",
        "indirizzo": "Via Roma 5",
        "citta": "Roma",
        "cap": "00100",
        "codice_fiscale": "VRDNNA90B41H501Z",
    },
    "righe": [
        {"ordine": 1, "descrizione": "Controllo della vista", "importo": "50.00"},
    ],
    "bollo_applicato": False,
    "metodo_pagamento": "contanti",
})
print(f"TEST 4 - Ricevuta: {ric2['anno']}/{ric2['numero']} Totale: {ric2['totale_da_pagare']}")
assert ric2["numero"] == 2
assert float(ric2["totale_da_pagare"]) == 50.00

# TEST 5: Lista ricevute
lista = api_get("/api/ricevute")
print(f"TEST 5 - Archivio: {len(lista)} ricevute")
assert len(lista) == 2

# TEST 6: Dettaglio ricevuta (per ristampa)
det = api_get(f"/api/ricevute/{ric1['id']}")
print(f"TEST 6 - Dettaglio: {det['anno']}/{det['numero']} Paziente: {det['paziente']['cognome']} Righe: {len(det['righe'])}")
assert len(det["righe"]) == 2

# TEST 7: Cerca paziente per CF
paz = api_get("/api/pazienti/cerca?cf=BNCMRC80A01F205X")
print(f"TEST 7 - Paziente: {paz['cognome']} {paz['nome']}")

# TEST 8: Export CSV
r = urllib.request.urlopen(f"{BASE}/api/ricevute/esporta-csv?anno=2026")
csv_data = r.read().decode()
csv_lines = csv_data.strip().split("\n")
print(f"TEST 8 - CSV: {len(csv_lines)} righe (1 header + {len(csv_lines)-1} dati)")
assert len(csv_lines) == 3

# TEST 9: Modifica ricevuta (PUT)
payload_mod = {
    "data_emissione": "2026-09-03",
    "paziente": {
        "titolo": "Sig.",
        "cognome": "Bianchi",
        "nome": "Marco Modificato",
        "indirizzo": "Via Verdi 12",
        "citta": "Milano",
        "cap": "20100",
        "codice_fiscale": "BNCMRC80A01F205X",
    },
    "righe": [
        {"ordine": 1, "descrizione": "Visita e controllo", "importo": "100.00"},
    ],
    "bollo_applicato": True,
    "bollo_a_carico_paziente": True,
    "metodo_pagamento": "bonifico",
}
req_put = urllib.request.Request(
    f"{BASE}/api/ricevute/{ric1['id']}",
    data=json.dumps(payload_mod).encode(),
    headers={"Content-Type": "application/json"},
    method="PUT",
)
r_put = urllib.request.urlopen(req_put)
ric_mod = json.loads(r_put.read())
print(f"TEST 9 - Ricevuta modificata: {ric_mod['paziente']['nome']} - Totale: {ric_mod['totale_da_pagare']}")
assert ric_mod["paziente"]["nome"] == "Marco Modificato"
assert float(ric_mod["totale_da_pagare"]) == 102.00
assert ric_mod["numero"] == 1  # il progressivo non cambia

# TEST 10: Elimina ricevuta (DELETE)
req_del = urllib.request.Request(
    f"{BASE}/api/ricevute/{ric2['id']}",
    method="DELETE",
)
r_del = urllib.request.urlopen(req_del)
res_del = json.loads(r_del.read())
print(f"TEST 10 - Ricevuta eliminata: {res_del['message']}")
lista_post_del = api_get("/api/ricevute")
assert len(lista_post_del) == 1

print()
print("=== TUTTI I TEST SUPERATI (INCLUSI MODIFICA ED ELIMINAZIONE) ===")

