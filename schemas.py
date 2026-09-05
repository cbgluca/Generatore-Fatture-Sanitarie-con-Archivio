"""
schemas.py — Schemi Pydantic per validazione dati in ingresso/uscita delle API.

Separati dai modelli ORM per mantenere la logica di trasporto (API)
disaccoppiata dalla logica di persistenza (DB).
"""

from datetime import date
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field, field_validator


# ---------------------------------------------------------------------------
# Paziente
# ---------------------------------------------------------------------------

class PazienteBase(BaseModel):
    """Campi comuni per la creazione e la lettura di un paziente."""
    titolo: Optional[str] = None
    cognome: str = Field(..., min_length=1, max_length=100)
    nome: str = Field(..., min_length=1, max_length=100)
    indirizzo: str = Field(..., min_length=1, max_length=200)
    citta: str = Field(..., min_length=1, max_length=100)
    cap: str = Field(..., min_length=5, max_length=5)
    codice_fiscale: str = Field(..., min_length=16, max_length=16)
    partita_iva: Optional[str] = Field(None, max_length=11)

    @field_validator("codice_fiscale")
    @classmethod
    def codice_fiscale_uppercase(cls, v: str) -> str:
        """Normalizza il Codice Fiscale in maiuscolo."""
        return v.upper().strip()

    @field_validator("partita_iva")
    @classmethod
    def partita_iva_strip(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if v == "":
                return None
        return v


class PazienteOut(PazienteBase):
    """Schema di risposta per un paziente (include l'ID dal DB)."""
    id: int

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Riga Ricevuta (prestazione singola)
# ---------------------------------------------------------------------------

class RigaRicevutaIn(BaseModel):
    """Una singola riga di prestazione in ingresso."""
    ordine: int = Field(1, ge=1)
    descrizione: str = Field("", min_length=0, max_length=300)
    importo: Decimal = Field(..., ge=0)


class RigaRicevutaOut(RigaRicevutaIn):
    """Riga di prestazione in uscita (include l'ID)."""
    id: int

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Ricevuta
# ---------------------------------------------------------------------------

class RicevutaIn(BaseModel):
    """
    Payload per la creazione o modifica di una ricevuta.

    Il numero progressivo può essere fornito manualmente (opzionale),
    oppure viene calcolato automaticamente dal backend.
    """
    numero: Optional[int] = Field(None, ge=1)
    data_emissione: date

    # Dati paziente (inline — il backend cerca o crea il paziente)
    paziente: PazienteBase

    # Righe di prestazione (almeno una)
    righe: list[RigaRicevutaIn] = Field(..., min_length=1)

    # Bollo
    bollo_applicato: bool = False
    bollo_a_carico_paziente: bool = False

    # Pagamento
    metodo_pagamento: Optional[str] = None

    # Note
    note: Optional[str] = None


class RicevutaOut(BaseModel):
    """Schema completo di una ricevuta in uscita (per dettaglio e ristampa)."""
    id: int
    anno: int
    numero: int
    data_emissione: date
    paziente: PazienteOut
    righe: list[RigaRicevutaOut]
    subtotale: Decimal
    bollo_applicato: bool
    bollo_a_carico_paziente: bool
    importo_bollo: Decimal
    totale_da_pagare: Decimal
    metodo_pagamento: Optional[str]
    note: Optional[str]

    model_config = {"from_attributes": True}


class RicevutaListItem(BaseModel):
    """Schema sintetico per la lista archivio ricevute."""
    id: int
    anno: int
    numero: int
    data_emissione: date
    paziente_cognome: str
    paziente_nome: str
    codice_fiscale: str
    subtotale: Decimal
    totale_da_pagare: Decimal
    metodo_pagamento: Optional[str] = None

    model_config = {"from_attributes": True}

