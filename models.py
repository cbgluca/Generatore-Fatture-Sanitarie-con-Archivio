"""
models.py — Modelli ORM SQLAlchemy per il database ricevute.db.

Tabelle:
  - pazienti: anagrafica paziente riutilizzabile tra ricevute diverse.
  - ricevute: testata della ricevuta emessa (numero progressivo annuale, data, totali).
  - righe_ricevuta: dettaglio delle singole prestazioni per ciascuna ricevuta.

Il numero progressivo è calcolato per anno solare: ogni nuovo anno riparte da 1.
"""

from sqlalchemy import (
    Column,
    Integer,
    String,
    Date,
    Numeric,
    Boolean,
    Text,
    ForeignKey,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from database import Base


class Paziente(Base):
    """Anagrafica paziente — riutilizzabile per ricevute diverse."""

    __tablename__ = "pazienti"

    id = Column(Integer, primary_key=True, autoincrement=True)
    titolo = Column(String(10), nullable=True)              # Sig. / Sig.ra / Dott.
    cognome = Column(String(100), nullable=False)
    nome = Column(String(100), nullable=False)
    indirizzo = Column(String(200), nullable=True)           # Via e numero civico
    citta = Column(String(100), nullable=True)
    cap = Column(String(5), nullable=True)
    codice_fiscale = Column(String(16), nullable=False, unique=True)
    partita_iva = Column(String(11), nullable=True)

    # Relazione inversa: tutte le ricevute di questo paziente
    ricevute = relationship("Ricevuta", back_populates="paziente")

    def __repr__(self):
        return f"<Paziente {self.cognome} {self.nome} – CF: {self.codice_fiscale}>"


class Ricevuta(Base):
    """
    Testata della ricevuta sanitaria.

    Il numero progressivo (`numero`) è univoco per anno (`anno`).
    La coppia (anno, numero) identifica la ricevuta in modo inequivocabile.
    """

    __tablename__ = "ricevute"
    __table_args__ = (
        UniqueConstraint("anno", "numero", name="uq_anno_numero"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    anno = Column(Integer, nullable=False)                   # Anno solare di emissione
    numero = Column(Integer, nullable=False)                 # Progressivo annuale (1, 2, 3…)
    data_emissione = Column(Date, nullable=False)

    # Riferimento al paziente
    paziente_id = Column(Integer, ForeignKey("pazienti.id"), nullable=False)
    paziente = relationship("Paziente", back_populates="ricevute")

    # Totali calcolati al momento del salvataggio (per ristampa fedele)
    subtotale = Column(Numeric(10, 2), nullable=False)       # Somma delle righe
    bollo_applicato = Column(Boolean, default=False)          # True se bollo > soglia 77,47 €
    bollo_a_carico_paziente = Column(Boolean, default=False)  # True = incluso nel "da pagare"
    importo_bollo = Column(Numeric(10, 2), default=0)        # 2.00 € se applicato
    totale_da_pagare = Column(Numeric(10, 2), nullable=False) # Importo finale

    # Metodo di pagamento: "contanti" | "pos" | "bonifico"
    metodo_pagamento = Column(String(30), nullable=True)

    # Note aggiuntive libere (opzionale)
    note = Column(Text, nullable=True)

    # Righe di dettaglio
    righe = relationship(
        "RigaRicevuta",
        back_populates="ricevuta",
        cascade="all, delete-orphan",
        order_by="RigaRicevuta.ordine",
    )

    def __repr__(self):
        return f"<Ricevuta {self.anno}/{self.numero} del {self.data_emissione}>"


class RigaRicevuta(Base):
    """Singola riga di prestazione sanitaria all'interno di una ricevuta."""

    __tablename__ = "righe_ricevuta"

    id = Column(Integer, primary_key=True, autoincrement=True)
    ricevuta_id = Column(Integer, ForeignKey("ricevute.id"), nullable=False)
    ordine = Column(Integer, nullable=False, default=1)      # Ordine di visualizzazione
    descrizione = Column(String(300), nullable=False)         # Testo della prestazione
    importo = Column(Numeric(10, 2), nullable=False)          # Importo singolo (€)

    ricevuta = relationship("Ricevuta", back_populates="righe")

    def __repr__(self):
        return f"<Riga #{self.ordine}: {self.descrizione} – €{self.importo}>"
