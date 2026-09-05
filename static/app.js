/**
 * app.js — Logica frontend completa per il Generatore di Ricevute Sanitarie.
 *
 * Funzionalità aggiornate:
 *   1. Toolbar in alto a sinistra con font coerente alle sezioni del form (uppercase, letter-spacing).
 *   2. In modalità Modifica, il tasto "Modifica" SCOMPARE e compare "Annulla" a destra di "Salva".
 *      Quando si salva o si annulla, "Modifica" RIAPPARE e "Annulla" scompare.
 *   3. Nell'Archivio la toolbar dei pulsanti fattura si nasconde completamente; tornando su Fattura
 *      tutti i dati compilati restano intatti senza perdere nulla.
 *   4. Il box prestazioni si espande naturalmente per tutte le righe (fino a 8) senza scrollbox interno.
 *   5. Modale di esportazione Excel (.xlsx) con range di date e colonne contabili conformi alla foto:
 *      DATA | COGNOME NOME | VIA CITTA' CAP | CODICE FISCALE | PRESTAZIONE | IMPORTO
 */

const MAX_PRESTAZIONI = 8;

// =========================================================================
// Stato globale
// =========================================================================
const state = {
    config: null,
    prossimoNumero: null,
    prestazioni: [],
    sogliaBollo: 77.47,
    importoBollo: 2.00,
    statoRicevuta: 'nuova',        // 'nuova' | 'salvata' | 'modifica'
    ricevutaCorrenteId: null,      // ID della ricevuta salvata/visualizzata
    datiRicevutaCorrente: null,    // Copia per eventuale "Annulla modifica"
    eliminazioneInCorso: null,     // { id, anno, numero, paziente }
};

// =========================================================================
// Riferimenti DOM
// =========================================================================
const dom = {};

function cacheDom() {
    // Header & Toolbar azioni in alto a sinistra
    dom.appHeader = document.getElementById('app-header');
    dom.headerActions = document.getElementById('header-actions');
    dom.btnHdrSalva = document.getElementById('btn-hdr-salva');
    dom.btnHdrAnnulla = document.getElementById('btn-hdr-annulla');
    dom.btnHdrModifica = document.getElementById('btn-hdr-modifica');
    dom.btnHdrStampa = document.getElementById('btn-hdr-stampa');
    dom.btnHdrNuova = document.getElementById('btn-hdr-nuova');

    // Pannello form & Banner
    dom.formPanel = document.getElementById('form-panel');
    dom.modificaBanner = document.getElementById('modifica-banner');
    dom.modificaNumeroDisplay = document.getElementById('modifica-numero-display');

    // Form — Ricevuta
    dom.inpNumero = document.getElementById('inp-numero');
    dom.numeroWarning = document.getElementById('numero-warning');
    dom.inpData = document.getElementById('inp-data');

    // Form — Paziente
    dom.inpTitolo = document.getElementById('inp-titolo');
    dom.inpCognome = document.getElementById('inp-cognome');
    dom.inpNome = document.getElementById('inp-nome');
    dom.inpIndirizzo = document.getElementById('inp-indirizzo');
    dom.inpCitta = document.getElementById('inp-citta');
    dom.inpCap = document.getElementById('inp-cap');
    dom.inpCf = document.getElementById('inp-cf');
    dom.inpPivaPaz = document.getElementById('inp-piva-paz');

    // Form — Bollo e pagamento
    dom.inpBollo = document.getElementById('inp-bollo');
    dom.inpBolloCarico = document.getElementById('inp-bollo-carico');
    dom.bolloCaricoRow = document.getElementById('bollo-carico-row');
    dom.inpPagamento = document.getElementById('inp-pagamento');

    // Form — Totali
    dom.formSubtotale = document.getElementById('form-subtotale');
    dom.formTotale = document.getElementById('form-totale');

    // Form — Prestazioni
    dom.prestazioniList = document.getElementById('prestazioni-list');
    dom.btnAddPrestazione = document.getElementById('btn-add-prestazione');
    dom.prestazioniCounter = document.getElementById('prestazioni-counter');
    dom.prestazioniMaxAlert = document.getElementById('prestazioni-max-alert');

    // A4 — Intestazione
    dom.a4MedicoNome = document.getElementById('a4-medico-nome');
    dom.a4MedicoQualifica = document.getElementById('a4-medico-qualifica');
    dom.a4MedicoSpec = document.getElementById('a4-medico-spec');
    dom.a4MedicoDettaglio = document.getElementById('a4-medico-dettaglio');
    dom.a4Numero = document.getElementById('a4-numero');
    dom.a4Data = document.getElementById('a4-data');

    // A4 — Paziente
    dom.a4TitoloLabel = document.getElementById('a4-titolo-label');
    dom.a4PazienteNome = document.getElementById('a4-paziente-nome');
    dom.a4PazienteIndirizzo = document.getElementById('a4-paziente-indirizzo');
    dom.a4PazienteCf = document.getElementById('a4-paziente-cf');
    dom.a4PazientePiva = document.getElementById('a4-paziente-piva');

    // A4 — Prestazioni e totali
    dom.a4PrestazioniBody = document.getElementById('a4-prestazioni-body');
    dom.a4Subtotale = document.getElementById('a4-subtotale');
    dom.a4BolloRow = document.getElementById('a4-bollo-row');
    dom.a4BolloBox = document.getElementById('a4-bollo-box');
    dom.a4Totale = document.getElementById('a4-totale');
    dom.a4Pagamento = document.getElementById('a4-pagamento');
    dom.a4PagamentoValore = document.getElementById('a4-pagamento-valore');

    // Archivio
    dom.filtroAnno = document.getElementById('filtro-anno');
    dom.filtroRicerca = document.getElementById('filtro-ricerca');
    dom.btnResetFiltri = document.getElementById('btn-reset-filtri');
    dom.btnApriExportExcel = document.getElementById('btn-apri-export-excel');
    dom.archivioTableBody = document.getElementById('archivio-table-body');
    dom.archivioEmpty = document.getElementById('archivio-empty');
    dom.archivioEmptyMsg = document.getElementById('archivio-empty-msg');

    // Modal eliminazione
    dom.modalElimina = document.getElementById('modal-elimina');
    dom.modalEliminaMsg = document.getElementById('modal-elimina-msg');
    dom.modalBtnAnnulla = document.getElementById('modal-btn-annulla');
    dom.modalBtnConferma = document.getElementById('modal-btn-conferma');

    // Modal Esportazione Dati (CSV ed Excel)
    dom.modalExportExcel = document.getElementById('modal-export-excel');
    dom.modalAnniContainer = document.getElementById('modal-anni-container');
    dom.modalPeriodiContainer = document.getElementById('modal-periodi-container');
    dom.excelDataInizio = document.getElementById('excel-data-inizio');
    dom.excelDataFine = document.getElementById('excel-data-fine');
    dom.modalExcelBtnAnnulla = document.getElementById('modal-excel-btn-annulla');
    dom.modalExcelBtnConferma = document.getElementById('modal-excel-btn-conferma');
    dom.modalXlsxBtnConferma = document.getElementById('modal-xlsx-btn-conferma');

    // Modal Conferma Nuova Fattura (se ci sono modifiche pendenti)
    dom.modalConfermaNuova = document.getElementById('modal-conferma-nuova');
    dom.modalNuovaBtnAnnulla = document.getElementById('modal-nuova-btn-annulla');
    dom.modalNuovaBtnScarta = document.getElementById('modal-nuova-btn-scarta');
    dom.modalNuovaBtnSalva = document.getElementById('modal-nuova-btn-salva');
}

// =========================================================================
// Inizializzazione
// =========================================================================
document.addEventListener('DOMContentLoaded', async () => {
    cacheDom();
    await caricaConfig();
    impostaDataOdierna();
    aggiungiRigaPrestazione();
    await caricaProssimoNumero();
    collegaEventi();
    impostaStato('nuova');
    aggiornaAnteprima();
});

// =========================================================================
// Gestione Stati Form & Tema
// =========================================================================

/**
 * Gestisce la transizione tra gli stati:
 * - 'nuova': prima del salvataggio. Campi editabili, Salva abilitato, Modifica visibile ma sbiadito, Annulla nascosto, Tema Blu.
 * - 'salvata': fattura salvata/aperta. Campi NON cliccabili, Salva disabilitato, Modifica visibile e abilitato, Annulla nascosto, Tema Blu.
 * - 'modifica': premuto Modifica. Campi editabili, Salva abilitato, Modifica SCOMPARE, compare Annulla a destra di Salva, Tema Arancione.
 */
function impostaStato(nuovoStato) {
    state.statoRicevuta = nuovoStato;

    if (nuovoStato === 'nuova') {
        document.body.classList.remove('theme-modifica-arancione');
        dom.formPanel.classList.remove('form-locked');
        dom.modificaBanner.style.display = 'none';

        dom.btnHdrSalva.style.display = 'inline-flex';
        dom.btnHdrSalva.disabled = false;
        dom.btnHdrSalva.textContent = '💾 Salva';

        dom.btnHdrAnnulla.style.display = 'none';

        dom.btnHdrModifica.style.display = 'inline-flex';
        dom.btnHdrModifica.disabled = true;
        dom.btnHdrModifica.title = 'Disponibile solo dopo il salvataggio della fattura';

        dom.btnHdrStampa.disabled = false;
        dom.btnHdrNuova.disabled = false;
    } else if (nuovoStato === 'salvata') {
        document.body.classList.remove('theme-modifica-arancione');
        dom.formPanel.classList.add('form-locked');
        dom.modificaBanner.style.display = 'none';

        dom.btnHdrSalva.style.display = 'inline-flex';
        dom.btnHdrSalva.disabled = true;
        dom.btnHdrSalva.textContent = '✓ Salvata';

        dom.btnHdrAnnulla.style.display = 'none';

        // Tasto Modifica RIAPPARE ed è abilitato!
        dom.btnHdrModifica.style.display = 'inline-flex';
        dom.btnHdrModifica.disabled = false;
        dom.btnHdrModifica.title = 'Modifica questa fattura';

        dom.btnHdrStampa.disabled = false;
        dom.btnHdrNuova.disabled = false;
    } else if (nuovoStato === 'modifica') {
        document.body.classList.add('theme-modifica-arancione');
        dom.formPanel.classList.remove('form-locked');
        dom.modificaBanner.style.display = 'flex';

        const numDisp = state.datiRicevutaCorrente ? state.datiRicevutaCorrente.numero : (dom.inpNumero.value || dom.inpNumero.placeholder);
        dom.modificaNumeroDisplay.textContent = String(numDisp);

        dom.btnHdrSalva.style.display = 'inline-flex';
        dom.btnHdrSalva.disabled = false;
        dom.btnHdrSalva.textContent = '💾 Salva';

        // Tasto Annulla compare a destra di Salva
        dom.btnHdrAnnulla.style.display = 'inline-flex';

        // Tasto Modifica SCOMPARE durante la modifica!
        dom.btnHdrModifica.style.display = 'none';

        dom.btnHdrStampa.disabled = false;
        dom.btnHdrNuova.disabled = false;
    }

    if (dom.prestazioniList) {
        aggiornaStatoPulsanteAggiungi();
    }
}

// =========================================================================
// Caricamento configurazione e numero progressivo
// =========================================================================

async function caricaConfig() {
    try {
        const resp = await fetch('/api/config');
        state.config = await resp.json();
        popolaIntestazioneMedico(state.config.medico);
        state.prestazioni = state.config.prestazioni_frequenti || [];
        state.sogliaBollo = state.config.bollo?.soglia ?? 77.47;
        state.importoBollo = state.config.bollo?.importo ?? 2.00;
    } catch (err) {
        console.error('Errore caricamento config:', err);
        showToast('Errore di connessione al server', 'error');
    }
}

function popolaIntestazioneMedico(medico) {
    dom.a4MedicoNome.textContent = `Dott. ${medico.nome} ${medico.cognome}`;
    dom.a4MedicoQualifica.textContent = medico.qualifica;
    dom.a4MedicoSpec.textContent = medico.specializzazione;
    dom.a4MedicoDettaglio.innerHTML =
        `${medico.indirizzo} — ${medico.cap} ${medico.citta}<br>` +
        `Tel. ${medico.telefono}<br>` +
        `C.F. ${medico.codice_fiscale}<br>` +
        `P.IVA ${medico.partita_iva}`;
}

function impostaDataOdierna() {
    dom.inpData.value = new Date().toISOString().slice(0, 10);
}

/**
 * Calcola il primo numero progressivo disponibile (riempie i buchi)
 * e lo mostra come placeholder in grigio chiaro.
 */
async function caricaProssimoNumero() {
    if (state.statoRicevuta === 'modifica') return;
    try {
        const anno = new Date(dom.inpData.value || Date.now()).getFullYear();
        const resp = await fetch(`/api/ricevute/prossimo-numero?anno=${anno}`);
        const data = await resp.json();
        state.prossimoNumero = data.prossimo_numero;

        dom.inpNumero.placeholder = String(data.prossimo_numero);

        if (!dom.inpNumero.value) {
            dom.a4Numero.textContent = String(data.prossimo_numero);
        }
    } catch (err) {
        console.error('Errore caricamento numero progressivo:', err);
    }
}

async function controllaDisponibilitaNumero() {
    const val = dom.inpNumero.value.trim();
    if (!val) {
        dom.numeroWarning.style.display = 'none';
        dom.inpNumero.style.borderColor = '';
        dom.a4Numero.textContent = dom.inpNumero.placeholder || '—';
        return true;
    }

    const numero = parseInt(val, 10);
    if (isNaN(numero) || numero < 1) {
        dom.numeroWarning.textContent = 'Numero non valido';
        dom.numeroWarning.style.display = 'block';
        dom.inpNumero.style.borderColor = 'var(--accent)';
        return false;
    }

    dom.a4Numero.textContent = String(numero);

    const anno = new Date(dom.inpData.value || Date.now()).getFullYear();
    const escludi = state.ricevutaCorrenteId ? `&escludi_id=${state.ricevutaCorrenteId}` : '';

    try {
        const resp = await fetch(`/api/ricevute/verifica-numero?anno=${anno}&numero=${numero}${escludi}`);
        const data = await resp.json();
        if (!data.disponibile) {
            dom.numeroWarning.textContent = `⚠️ Ricevuta n. ${numero} già esistente nel ${anno}!`;
            dom.numeroWarning.style.display = 'block';
            dom.inpNumero.style.borderColor = 'var(--accent)';
            return false;
        } else {
            dom.numeroWarning.style.display = 'none';
            dom.inpNumero.style.borderColor = '';
            return true;
        }
    } catch (err) {
        console.error('Errore verifica numero:', err);
        return true;
    }
}

// =========================================================================
// Eventi
// =========================================================================

function collegaEventi() {
    // Toolbar Header
    dom.btnHdrSalva.addEventListener('click', salvaRicevuta);
    dom.btnHdrAnnulla.addEventListener('click', annullaModifica);
    dom.btnHdrModifica.addEventListener('click', attivaModifica);
    dom.btnHdrStampa.addEventListener('click', stampaRicevuta);
    dom.btnHdrNuova.addEventListener('click', richiediNuovaFattura);

    // Modal Conferma Nuova Fattura
    if (dom.modalNuovaBtnAnnulla) {
        dom.modalNuovaBtnAnnulla.addEventListener('click', chiudiModalConfermaNuova);
    }
    if (dom.modalNuovaBtnScarta) {
        dom.modalNuovaBtnScarta.addEventListener('click', gestisciNuovaScarta);
    }
    if (dom.modalNuovaBtnSalva) {
        dom.modalNuovaBtnSalva.addEventListener('click', gestisciNuovaSalva);
    }
    if (dom.modalConfermaNuova) {
        dom.modalConfermaNuova.addEventListener('click', (e) => {
            if (e.target === dom.modalConfermaNuova) chiudiModalConfermaNuova();
        });
    }

    // Numero manuale
    dom.inpNumero.addEventListener('input', () => {
        aggiornaAnteprima();
        debounce(controllaDisponibilitaNumero, 300)();
    });
    dom.inpNumero.addEventListener('blur', controllaDisponibilitaNumero);

    // Campi paziente
    const campiPaziente = [
        dom.inpTitolo, dom.inpCognome, dom.inpNome,
        dom.inpIndirizzo, dom.inpCitta, dom.inpCap,
        dom.inpCf, dom.inpPivaPaz,
    ];
    campiPaziente.forEach(el => {
        el.addEventListener('input', aggiornaAnteprima);
        el.addEventListener('change', aggiornaAnteprima);
    });

    // Data
    dom.inpData.addEventListener('change', () => {
        aggiornaAnteprima();
        if (state.statoRicevuta !== 'modifica') {
            caricaProssimoNumero().then(() => {
                controllaDisponibilitaNumero();
                aggiornaAnteprima();
            });
        }
    });

    // Bollo & Pagamento
    dom.inpBollo.addEventListener('change', () => {
        dom.bolloCaricoRow.style.display = dom.inpBollo.checked ? 'flex' : 'none';
        ricalcolaTotali();
        aggiornaAnteprima();
    });
    dom.inpBolloCarico.addEventListener('change', () => {
        ricalcolaTotali();
        aggiornaAnteprima();
    });
    dom.inpPagamento.addEventListener('change', aggiornaAnteprima);

    // Prestazioni
    dom.btnAddPrestazione.addEventListener('click', () => {
        aggiungiRigaPrestazione();
        aggiornaAnteprima();
    });

    // Ricerca CF
    dom.inpCf.addEventListener('blur', cercaPazientePerCf);

    // Filtri Archivio
    dom.filtroAnno.addEventListener('change', caricaArchivio);
    dom.filtroRicerca.addEventListener('input', debounce(caricaArchivio, 250));
    dom.btnResetFiltri.addEventListener('click', () => {
        dom.filtroAnno.value = '';
        dom.filtroRicerca.value = '';
        caricaArchivio();
    });

    // Modal Esportazione CSV con Selezione Rapida Anni
    if (dom.btnApriExportExcel) {
        dom.btnApriExportExcel.addEventListener('click', apriModalExportExcel);
    }
    if (dom.modalExcelBtnAnnulla) {
        dom.modalExcelBtnAnnulla.addEventListener('click', chiudiModalExportExcel);
    }
    if (dom.modalExcelBtnConferma) {
        dom.modalExcelBtnConferma.addEventListener('click', eseguiExportCSV);
    }
    if (dom.modalXlsxBtnConferma) {
        dom.modalXlsxBtnConferma.addEventListener('click', eseguiExportXLSX);
    }
    if (dom.modalPeriodiContainer) {
        const periodBtns = dom.modalPeriodiContainer.querySelectorAll('.btn-period-badge');
        periodBtns.forEach(btn => {
            const mesi = parseInt(btn.getAttribute('data-periodo'), 10);
            btn.addEventListener('click', () => selezionaPeriodoRecente(mesi, btn));
        });
    }
    if (dom.excelDataInizio) {
        dom.excelDataInizio.addEventListener('input', deselezionaAnniRapidi);
        dom.excelDataInizio.addEventListener('change', deselezionaAnniRapidi);
    }
    if (dom.excelDataFine) {
        dom.excelDataFine.addEventListener('input', deselezionaAnniRapidi);
        dom.excelDataFine.addEventListener('change', deselezionaAnniRapidi);
    }
    if (dom.modalExportExcel) {
        dom.modalExportExcel.addEventListener('click', (e) => {
            if (e.target === dom.modalExportExcel) chiudiModalExportExcel();
        });
    }

    // Modal eliminazione
    dom.modalBtnAnnulla.addEventListener('click', chiudiModalElimina);
    dom.modalBtnConferma.addEventListener('click', eseguiEliminazioneConfermata);
    dom.modalElimina.addEventListener('click', (e) => {
        if (e.target === dom.modalElimina) chiudiModalElimina();
    });
}

// =========================================================================
// Gestione Prestazioni (fino a 8 righe con espansione naturale)
// =========================================================================

let rigaCounter = 0;

function aggiornaStatoPulsanteAggiungi() {
    const conteggio = dom.prestazioniList.children.length;
    dom.prestazioniCounter.textContent = `${conteggio} / ${MAX_PRESTAZIONI} max`;

    if (conteggio >= MAX_PRESTAZIONI) {
        dom.btnAddPrestazione.disabled = true;
        dom.prestazioniMaxAlert.style.display = 'block';
    } else {
        dom.btnAddPrestazione.disabled = false;
        dom.prestazioniMaxAlert.style.display = 'none';
    }

    // Le maniglie di trascinamento sono attive sia durante la compilazione di una nuova fattura ('nuova'),
    // sia in modalità modifica ('modifica'), purché ci siano almeno 2 prestazioni.
    // Sono invece nascoste e bloccate quando la fattura è salvata in sola lettura ('salvata').
    const puoModificare = (state.statoRicevuta === 'nuova' || state.statoRicevuta === 'modifica');
    if (puoModificare && conteggio > 1) {
        dom.prestazioniList.classList.add('can-drag');
        dom.prestazioniList.classList.remove('no-drag');
    } else {
        dom.prestazioniList.classList.remove('can-drag');
        dom.prestazioniList.classList.add('no-drag');
    }
}

function attivaDragDropRiga(row) {
    const handle = row.querySelector('.drag-handle');
    if (!handle) return;

    let startY = 0;
    let initialTops = [];
    let initialHeights = [];
    let startIndex = -1;
    let targetIndex = -1;
    let isDragging = false;
    let allRows = [];
    let rowHeight = 0;
    let gap = 8;

    handle.addEventListener('pointerdown', (e) => {
        // Spostamento consentito sia in nuova fattura non salvata ('nuova') sia in modifica ('modifica')
        if (state.statoRicevuta !== 'nuova' && state.statoRicevuta !== 'modifica') return;
        if (e.button !== 0 || dom.prestazioniList.children.length <= 1) return;

        allRows = Array.from(dom.prestazioniList.children);
        startIndex = allRows.indexOf(row);
        if (startIndex === -1) return;

        targetIndex = startIndex;
        startY = e.clientY;

        const rects = allRows.map(r => r.getBoundingClientRect());
        initialTops = rects.map(r => r.top);
        initialHeights = rects.map(r => r.height);
        rowHeight = initialHeights[startIndex];

        if (allRows.length > 1) {
            gap = Math.max(4, rects[1].top - rects[0].bottom);
        }

        isDragging = true;
        handle.setPointerCapture(e.pointerId);
        row.classList.add('is-dragging');
        dom.prestazioniList.classList.add('is-sorting');
    });

    handle.addEventListener('pointermove', (e) => {
        if (!isDragging) return;
        e.preventDefault();

        const dy = e.clientY - startY;
        row.style.transform = `translateY(${dy}px)`;

        const currentCenterY = initialTops[startIndex] + (rowHeight / 2) + dy;
        let newTarget = startIndex;

        for (let i = 0; i < allRows.length; i++) {
            if (i === startIndex) continue;
            const otherCenter = initialTops[i] + (initialHeights[i] / 2);
            if (startIndex < i && currentCenterY > otherCenter) {
                newTarget = i;
            } else if (startIndex > i && currentCenterY < otherCenter) {
                newTarget = i;
                break;
            }
        }

        targetIndex = newTarget;

        // Anima gli altri elementi: scivolano facendosi spazio con lo spostamento del mouse
        allRows.forEach((r, i) => {
            if (i === startIndex) return;
            const itemHeight = initialHeights[startIndex];
            const shift = itemHeight + gap;

            if (startIndex < targetIndex && i > startIndex && i <= targetIndex) {
                r.style.transform = `translateY(-${shift}px)`;
            } else if (startIndex > targetIndex && i < startIndex && i >= targetIndex) {
                r.style.transform = `translateY(${shift}px)`;
            } else {
                r.style.transform = 'translateY(0px)';
            }
        });
    });

    const terminaDrag = (e) => {
        if (!isDragging) return;
        isDragging = false;

        try {
            handle.releasePointerCapture(e.pointerId);
        } catch (_) {}

        row.classList.remove('is-dragging');
        dom.prestazioniList.classList.remove('is-sorting');

        // Reset transforms
        allRows.forEach(r => {
            r.style.transform = '';
            r.style.transition = '';
        });

        // Se la posizione è cambiata, riordina nel DOM
        if (targetIndex !== startIndex && targetIndex >= 0 && targetIndex < allRows.length) {
            if (targetIndex > startIndex) {
                allRows[targetIndex].after(row);
            } else {
                allRows[targetIndex].before(row);
            }
            aggiornaStatoPulsanteAggiungi();
            aggiornaAnteprima();
            ricalcolaTotali();
        }
    };

    handle.addEventListener('pointerup', terminaDrag);
    handle.addEventListener('pointercancel', terminaDrag);
}

function aggiungiRigaPrestazione(dati = null) {
    if (dom.prestazioniList.children.length >= MAX_PRESTAZIONI) {
        showToast('Limite massimo di 8 prestazioni per pagina A4 raggiunto', 'error');
        return;
    }

    rigaCounter++;
    const id = rigaCounter;

    let opzioniHtml = '<option value="">— Scrivi o seleziona —</option>';
    let prestazioneInLista = false;
    for (const p of state.prestazioni) {
        const selected = dati && dati.descrizione === p ? 'selected' : '';
        if (selected) prestazioneInLista = true;
        opzioniHtml += `<option value="${escapeHtml(p)}" ${selected}>${escapeHtml(p)}</option>`;
    }

    const customSelected = dati && !prestazioneInLista && dati.descrizione ? 'selected' : '';
    opzioniHtml += `<option value="__custom__" ${customSelected}>✏️ Testo libero…</option>`;

    const valImporto = (dati && dati.importo !== undefined && dati.importo !== null) ? dati.importo : '';

    const row = document.createElement('div');
    row.className = 'prestazione-row';
    row.id = `prest-row-${id}`;
    row.innerHTML = `
        <div class="drag-handle" title="Trascina per spostare di posizione" aria-label="Sposta prestazione">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <circle cx="5" cy="3" r="1.5"/>
                <circle cx="11" cy="3" r="1.5"/>
                <circle cx="5" cy="8" r="1.5"/>
                <circle cx="11" cy="8" r="1.5"/>
                <circle cx="5" cy="13" r="1.5"/>
                <circle cx="11" cy="13" r="1.5"/>
            </svg>
        </div>
        <div class="form-group form-group-desc">
            <label>Prestazione</label>
            <select id="prest-sel-${id}" data-riga="${id}">
                ${opzioniHtml}
            </select>
            <input type="text" id="prest-txt-${id}" data-riga="${id}"
                   placeholder="Descrizione libera"
                   value="${dati && !prestazioneInLista && dati.descrizione ? escapeHtml(dati.descrizione) : ''}"
                   style="${dati && !prestazioneInLista && dati.descrizione ? 'display:block;' : 'display:none;'} margin-top:0.25rem;">
        </div>
        <div class="form-group form-group-imp">
            <label>Importo (&euro;)</label>
            <input type="number" id="prest-imp-${id}" data-riga="${id}"
                   placeholder="0,00" min="0" step="0.01"
                   value="${valImporto}">
        </div>
        <button type="button" class="btn-remove-row"
                data-riga="${id}" title="Rimuovi">&times;</button>
    `;

    dom.prestazioniList.appendChild(row);
    attivaDragDropRiga(row);
    aggiornaStatoPulsanteAggiungi();

    const sel = document.getElementById(`prest-sel-${id}`);
    const txt = document.getElementById(`prest-txt-${id}`);
    const imp = document.getElementById(`prest-imp-${id}`);
    const btnRem = row.querySelector('.btn-remove-row');

    sel.addEventListener('change', () => {
        if (sel.value === '__custom__') {
            txt.style.display = 'block';
            txt.focus();
        } else {
            txt.style.display = 'none';
            txt.value = '';
        }
        aggiornaAnteprima();
    });

    txt.addEventListener('input', aggiornaAnteprima);

    imp.addEventListener('input', () => {
        ricalcolaTotali();
        aggiornaAnteprima();
    });

    btnRem.addEventListener('click', () => {
        if (dom.prestazioniList.children.length <= 1) {
            showToast('Serve almeno una prestazione nella ricevuta', 'error');
            return;
        }
        row.remove();
        aggiornaStatoPulsanteAggiungi();
        ricalcolaTotali();
        aggiornaAnteprima();
    });
}

function leggiRighePrestazione() {
    const righe = [];
    const rows = dom.prestazioniList.querySelectorAll('.prestazione-row');

    rows.forEach((row, index) => {
        const id = row.id.replace('prest-row-', '');
        const sel = document.getElementById(`prest-sel-${id}`);
        const txt = document.getElementById(`prest-txt-${id}`);
        const imp = document.getElementById(`prest-imp-${id}`);

        const tipoSelezionato = sel ? sel.value : '';
        const isCustom = (tipoSelezionato === '__custom__');

        let descrizione = '';
        if (isCustom) {
            descrizione = txt ? txt.value.trim() : '';
        } else {
            descrizione = tipoSelezionato;
        }

        const rawVal = imp ? imp.value.trim() : '';
        const importo = rawVal !== '' ? parseFloat(rawVal) : null;

        righe.push({
            ordine: index + 1,
            tipoSelezionato,
            isCustom,
            descrizione,
            importo,
            importoScritto: rawVal !== '',
        });
    });

    return righe;
}

// =========================================================================
// Calcoli e Live-Binding Anteprima A4
// =========================================================================

function ricalcolaTotali() {
    const righe = leggiRighePrestazione();
    const subtotale = righe.reduce((acc, r) => acc + (r.importo !== null && !isNaN(r.importo) ? r.importo : 0), 0);

    if (subtotale > state.sogliaBollo && !dom.inpBollo.checked) {
        dom.inpBollo.checked = true;
        dom.bolloCaricoRow.style.display = 'flex';
    }

    let totale = subtotale;
    if (dom.inpBollo.checked && dom.inpBolloCarico.checked) {
        totale += state.importoBollo;
    }

    dom.formSubtotale.textContent = formattaEuro(subtotale);
    dom.formTotale.textContent = formattaEuro(totale);
}

function aggiornaAnteprima() {
    const numManuale = dom.inpNumero.value.trim();
    const numVisualizzato = numManuale || dom.inpNumero.placeholder || '—';
    dom.a4Numero.textContent = numVisualizzato;
    dom.a4Data.textContent = formattaDataItaliana(dom.inpData.value);

    // Paziente
    const titolo = dom.inpTitolo.value;
    const cognome = dom.inpCognome.value.trim();
    const nome = dom.inpNome.value.trim();
    const indirizzo = dom.inpIndirizzo.value.trim();
    const citta = dom.inpCitta.value.trim();
    const cap = dom.inpCap.value.trim();
    const cf = dom.inpCf.value.trim().toUpperCase();
    const piva = dom.inpPivaPaz.value.trim();

    dom.a4TitoloLabel.textContent = titolo || 'Sig.';
    dom.a4PazienteNome.textContent = [cognome, nome].filter(Boolean).join(' ') || '\u00A0';

    let indirizzoCompleto = indirizzo;
    if (cap || citta) {
        const parti = [indirizzo, [cap, citta].filter(Boolean).join(' ')].filter(Boolean);
        indirizzoCompleto = parti.join(' — ');
    }
    dom.a4PazienteIndirizzo.textContent = indirizzoCompleto || '\u00A0';
    dom.a4PazienteCf.textContent = cf || '\u00A0';
    dom.a4PazientePiva.textContent = piva || '\u00A0';

    // Prestazioni
    aggiornaPrestazioniA4();

    // Bollo
    const bolloApplicato = dom.inpBollo.checked;
    dom.a4BolloRow.style.display = bolloApplicato ? '' : 'none';
    dom.a4BolloBox.style.opacity = bolloApplicato ? '1' : '0.3';

    // Totali
    const righe = leggiRighePrestazione();
    const subtotale = righe.reduce((acc, r) => acc + (r.importo !== null && !isNaN(r.importo) ? r.importo : 0), 0);
    let totale = subtotale;
    if (bolloApplicato && dom.inpBolloCarico.checked) {
        totale += state.importoBollo;
    }

    dom.a4Subtotale.textContent = formattaEuro(subtotale);
    dom.a4Totale.textContent = formattaEuro(totale);

    // Pagamento
    const pagamento = dom.inpPagamento.value;
    if (pagamento) {
        dom.a4Pagamento.style.display = 'block';
        const etichette = {
            contanti: 'Contanti',
            pos: 'POS / Carta',
            bonifico: 'Bonifico Bancario',
        };
        dom.a4PagamentoValore.textContent = etichette[pagamento] || pagamento;
    } else {
        dom.a4Pagamento.style.display = 'none';
    }
}

function aggiornaPrestazioniA4() {
    const righe = leggiRighePrestazione();
    const minRighe = 6;
    let html = '';

    for (const riga of righe) {
        if (riga.descrizione || riga.importoScritto) {
            const impDisplay = (riga.importo !== null && !isNaN(riga.importo))
                ? formattaEuro(riga.importo)
                : '&nbsp;';
            html += `<tr>
                <td>${escapeHtml(riga.descrizione) || '&nbsp;'}</td>
                <td>${impDisplay}</td>
            </tr>`;
        }
    }

    const righeCompilate = righe.filter(r => r.descrizione || r.importoScritto).length;
    const righeVuote = Math.max(0, minRighe - righeCompilate);
    for (let i = 0; i < righeVuote; i++) {
        html += '<tr class="empty-row"><td>&nbsp;</td><td>&nbsp;</td></tr>';
    }

    dom.a4PrestazioniBody.innerHTML = html;
}

// =========================================================================
// Ricerca Paziente per CF
// =========================================================================

let cfCercaTimeout = null;

async function cercaPazientePerCf() {
    const cf = dom.inpCf.value.trim().toUpperCase();
    if (cf.length !== 16) return;

    clearTimeout(cfCercaTimeout);
    cfCercaTimeout = setTimeout(async () => {
        try {
            const resp = await fetch(`/api/pazienti/cerca?cf=${encodeURIComponent(cf)}`);
            if (resp.ok) {
                const paz = await resp.json();
                dom.inpTitolo.value = paz.titolo || '';
                dom.inpCognome.value = paz.cognome || '';
                dom.inpNome.value = paz.nome || '';
                dom.inpIndirizzo.value = paz.indirizzo || '';
                dom.inpCitta.value = paz.citta || '';
                dom.inpCap.value = paz.cap || '';
                dom.inpPivaPaz.value = paz.partita_iva || '';
                showToast(`Paziente trovato in archivio: ${paz.cognome} ${paz.nome}`, 'success');
                aggiornaAnteprima();
            }
        } catch (err) {
            console.error('Errore ricerca paziente:', err);
        }
    }, 200);
}

// =========================================================================
// Salvataggio / Modifica Ricevuta
// =========================================================================

async function salvaRicevuta() {
    const errori = validaForm();
    if (errori.length > 0) {
        showToast(errori[0], 'error');
        return false;
    }

    const numValido = await controllaDisponibilitaNumero();
    if (!numValido) {
        showToast('Il numero di ricevuta indicato è già utilizzato. Scegline un altro.', 'error');
        dom.inpNumero.focus();
        return false;
    }

    const righe = leggiRighePrestazione().filter(r => r.isCustom || (r.tipoSelezionato && r.tipoSelezionato !== ''));
    const numManuale = dom.inpNumero.value.trim();

    const payload = {
        numero: numManuale ? parseInt(numManuale, 10) : null,
        data_emissione: dom.inpData.value,
        paziente: {
            titolo: dom.inpTitolo.value || null,
            cognome: dom.inpCognome.value.trim(),
            nome: dom.inpNome.value.trim(),
            indirizzo: dom.inpIndirizzo.value.trim(),
            citta: dom.inpCitta.value.trim(),
            cap: dom.inpCap.value.trim(),
            codice_fiscale: dom.inpCf.value.trim().toUpperCase(),
            partita_iva: dom.inpPivaPaz.value.trim() || null,
        },
        righe: righe.map(r => ({
            ordine: r.ordine,
            descrizione: r.descrizione,
            importo: (r.importo !== null ? r.importo : 0).toFixed(2),
        })),
        bollo_applicato: dom.inpBollo.checked,
        bollo_a_carico_paziente: dom.inpBolloCarico.checked,
        metodo_pagamento: dom.inpPagamento.value || null,
    };

    const isModifica = (state.statoRicevuta === 'modifica' && state.ricevutaCorrenteId);
    const url = isModifica ? `/api/ricevute/${state.ricevutaCorrenteId}` : '/api/ricevute';
    const method = isModifica ? 'PUT' : 'POST';

    try {
        dom.btnHdrSalva.disabled = true;
        dom.btnHdrSalva.textContent = 'Salvataggio...';

        const resp = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!resp.ok) {
            const err = await resp.json();
            throw new Error(err.detail || 'Errore durante l\'operazione');
        }

        const ricevuta = await resp.json();
        state.ricevutaCorrenteId = ricevuta.id;
        state.datiRicevutaCorrente = ricevuta;

        dom.inpNumero.value = ricevuta.numero;
        dom.inpNumero.placeholder = String(ricevuta.numero);
        dom.a4Numero.textContent = String(ricevuta.numero);

        // Transizione allo stato 'salvata' (campi bloccati, tema blu, Modifica riappare abilitato)
        impostaStato('salvata');
        showToast(`Ricevuta n. ${ricevuta.numero} salvata con successo!`, 'success');

        aggiornaAnteprima();
        caricaFiltroAnni();
        return true;
    } catch (err) {
        console.error('Errore salvataggio:', err);
        showToast(`Errore: ${err.message}`, 'error');
        dom.btnHdrSalva.disabled = false;
        dom.btnHdrSalva.textContent = '💾 Salva';
        return false;
    }
}

function validaForm() {
    const errori = [];

    if (!dom.inpData.value) {
        errori.push('Inserire la data di emissione');
    }
    if (!dom.inpCognome.value.trim()) {
        errori.push('Inserire il cognome del paziente');
    }
    if (!dom.inpNome.value.trim()) {
        errori.push('Inserire il nome del paziente');
    }

    // Obbligatorietà Indirizzo, Città e CAP
    if (!dom.inpIndirizzo.value.trim()) {
        errori.push("Inserire l'indirizzo (via e numero civico) del paziente");
    }
    if (!dom.inpCitta.value.trim()) {
        errori.push("Inserire la città di residenza del paziente");
    }
    const cap = dom.inpCap.value.trim();
    if (!cap) {
        errori.push("Inserire il CAP del paziente");
    } else if (!/^\d{5}$/.test(cap)) {
        errori.push("Il CAP deve essere composto da 5 cifre (es. 00100 o 20100)");
    }

    const cf = dom.inpCf.value.trim();
    if (!cf) {
        errori.push('Inserire il Codice Fiscale del paziente');
    } else if (cf.length !== 16) {
        errori.push('Il Codice Fiscale deve essere di 16 caratteri');
    }

    const righe = leggiRighePrestazione();
    if (righe.length === 0) {
        errori.push('Inserire almeno una prestazione sanitaria');
    }

    // Obbligatorietà tipo di prestazione:
    // L'unico modo per inserire una prestazione senza scrivere nulla è scegliere "Testo libero..." (isCustom) e lasciare vuoto.
    // Se la tendina è rimasta su '— Scrivi o seleziona —' (non scelta), restituisce errore!
    for (let i = 0; i < righe.length; i++) {
        const r = righe[i];
        if (!r.isCustom && (!r.tipoSelezionato || r.tipoSelezionato === '')) {
            errori.push(`Riga ${i + 1}: selezionare il tipo di prestazione oppure scegliere 'Testo libero…'`);
            break;
        }
    }

    // Controllo importi per ciascuna riga
    const righeSenzaImporto = righe.filter(r => r.importo === null || isNaN(r.importo) || r.importo < 0);
    if (righeSenzaImporto.length > 0) {
        errori.push('Inserire l\'importo (€) per ogni prestazione (può essere anche 0,00)');
    }

    return errori;
}

// =========================================================================
// Flusso Modifica & Annulla Modifica
// =========================================================================

/**
 * Premuto "Modifica" dall'header:
 * attiva tema arancione, sblocca i campi, Modifica SCOMPARE e compare Annulla a destra di Salva.
 */
function attivaModifica() {
    if (!state.ricevutaCorrenteId) return;
    impostaStato('modifica');
    showToast(`Modalità Modifica attiva per Ricevuta n. ${state.datiRicevutaCorrente ? state.datiRicevutaCorrente.numero : ''}`, '');
}

/**
 * Premuto "Annulla" dall'header durante la modifica:
 * ripristina i dati salvati, riblocca i campi, torna al tema Blu, Modifica riappare.
 */
function annullaModifica() {
    if (state.datiRicevutaCorrente) {
        popolaCampiDaOggettoRicevuta(state.datiRicevutaCorrente);
    }
    impostaStato('salvata');
    showToast('Modifica annullata', '');
}

function popolaCampiDaOggettoRicevuta(r) {
    dom.inpNumero.value = r.numero;
    dom.inpNumero.placeholder = String(r.numero);
    dom.inpData.value = r.data_emissione;

    dom.inpTitolo.value = r.paziente.titolo || '';
    dom.inpCognome.value = r.paziente.cognome || '';
    dom.inpNome.value = r.paziente.nome || '';
    dom.inpIndirizzo.value = r.paziente.indirizzo || '';
    dom.inpCitta.value = r.paziente.citta || '';
    dom.inpCap.value = r.paziente.cap || '';
    dom.inpCf.value = r.paziente.codice_fiscale || '';
    dom.inpPivaPaz.value = r.paziente.partita_iva || '';

    dom.prestazioniList.innerHTML = '';
    rigaCounter = 0;
    if (r.righe && r.righe.length > 0) {
        r.righe.forEach(riga => {
            aggiungiRigaPrestazione({
                descrizione: riga.descrizione,
                importo: parseFloat(riga.importo),
            });
        });
    } else {
        aggiungiRigaPrestazione();
    }

    dom.inpBollo.checked = !!r.bollo_applicato;
    dom.inpBolloCarico.checked = !!r.bollo_a_carico_paziente;
    dom.bolloCaricoRow.style.display = r.bollo_applicato ? 'flex' : 'none';
    dom.inpPagamento.value = r.metodo_pagamento || '';

    dom.numeroWarning.style.display = 'none';
    dom.inpNumero.style.borderColor = '';

    ricalcolaTotali();
    aggiornaAnteprima();
}

/**
 * Avvia la modifica direttamente dall'Archivio.
 */
async function avviaModificaDaArchivio(id) {
    try {
        const resp = await fetch(`/api/ricevute/${id}`);
        if (!resp.ok) throw new Error('Ricevuta non trovata');
        const r = await resp.json();

        state.ricevutaCorrenteId = r.id;
        state.datiRicevutaCorrente = r;
        popolaCampiDaOggettoRicevuta(r);

        showView('nuova');
        impostaStato('modifica');
        showToast(`Modalità Modifica attiva per Ricevuta n. ${r.numero}`, '');
    } catch (err) {
        console.error('Errore avvio modifica:', err);
        showToast(`Impossibile caricare ricevuta: ${err.message}`, 'error');
    }
}

// =========================================================================
// Visualizzazione / Ristampa A4 dall'Archivio
// =========================================================================

async function visualizzaRicevuta(id) {
    try {
        const resp = await fetch(`/api/ricevute/${id}`);
        if (!resp.ok) throw new Error('Ricevuta non trovata');
        const r = await resp.json();

        state.ricevutaCorrenteId = r.id;
        state.datiRicevutaCorrente = r;
        popolaCampiDaOggettoRicevuta(r);

        impostaStato('salvata');
        showView('nuova');
        showToast(`Ricevuta n. ${r.numero} caricata`, 'success');
    } catch (err) {
        console.error('Errore visualizzazione:', err);
        showToast(`Impossibile aprire: ${err.message}`, 'error');
    }
}

// =========================================================================
// Eliminazione con Modal di Conferma
// =========================================================================

function richiediConfermaEliminazione(id, anno, numero, pazienteNome) {
    state.eliminazioneInCorso = { id, anno, numero, pazienteNome };
    dom.modalEliminaMsg.innerHTML =
        `Sei sicuro di voler eliminare definitivamente la <strong>Ricevuta n. ${numero}</strong> (${anno}) ` +
        `rilasciata a <strong>${escapeHtml(pazienteNome)}</strong>?<br><br>` +
        `<span style="color:#dc2626; font-size:0.85rem; font-weight:600;">` +
        `⚠️ Questa operazione è definitiva e rimuoverà la ricevuta dall'archivio.` +
        `</span>`;
    dom.modalElimina.style.display = 'flex';
}

function chiudiModalElimina() {
    dom.modalElimina.style.display = 'none';
    state.eliminazioneInCorso = null;
}

async function eseguiEliminazioneConfermata() {
    if (!state.eliminazioneInCorso) return;
    const { id, numero } = state.eliminazioneInCorso;

    try {
        dom.modalBtnConferma.disabled = true;
        dom.modalBtnConferma.textContent = 'Eliminazione...';

        const resp = await fetch(`/api/ricevute/${id}`, { method: 'DELETE' });
        if (!resp.ok) {
            const err = await resp.json();
            throw new Error(err.detail || 'Errore durante l\'eliminazione');
        }

        chiudiModalElimina();
        showToast(`Ricevuta n. ${numero} eliminata con successo`, 'success');

        if (state.ricevutaCorrenteId === id) {
            resetForm();
        }

        await caricaArchivio();
        await caricaFiltroAnni();
        await caricaProssimoNumero();
    } catch (err) {
        console.error('Errore eliminazione:', err);
        showToast(`Errore: ${err.message}`, 'error');
    } finally {
        dom.modalBtnConferma.disabled = false;
        dom.modalBtnConferma.textContent = 'Elimina Definitivamente';
    }
}

// =========================================================================
// =========================================================================
// Modal Esportazione CSV con Selezione Rapida Anno e Range di Date
// =========================================================================

async function caricaPulsantiAnniModal() {
    if (!dom.modalAnniContainer) return;
    try {
        const resp = await fetch('/api/ricevute/anni');
        if (!resp.ok) return;
        const data = await resp.json();
        const anni = data.anni || [];

        dom.modalAnniContainer.innerHTML = '';
        if (anni.length === 0) {
            dom.modalAnniContainer.innerHTML = '<span style="font-size:0.8rem; color:var(--text-muted);">Nessun anno presente nel database</span>';
            return;
        }

        anni.forEach(a => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'btn-year-badge';
            btn.textContent = String(a);
            btn.setAttribute('data-anno', String(a));
            btn.title = `Imposta range per tutto il ${a} (01/01/${a} - 31/12/${a})`;
            btn.addEventListener('click', () => selezionaAnnoExport(a, btn));
            dom.modalAnniContainer.appendChild(btn);
        });

        // Controlla se le date attuali corrispondono già a un anno
        deselezionaAnniRapidi();
    } catch (e) {
        console.error('Errore caricamento anni modale:', e);
    }
}

function calcolaDataOggi() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function calcolaDataMesiFa(mesi) {
    const now = new Date();
    const targetYear = now.getFullYear();
    const targetMonth = now.getMonth() - mesi;
    const targetDay = now.getDate();

    const d = new Date(targetYear, targetMonth, 1);
    const maxDays = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(targetDay, maxDays));

    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function deselezionaTuttiIBadge() {
    if (dom.modalAnniContainer) {
        const yearBtns = dom.modalAnniContainer.querySelectorAll('.btn-year-badge');
        yearBtns.forEach(b => b.classList.remove('active'));
    }
    if (dom.modalPeriodiContainer) {
        const periodBtns = dom.modalPeriodiContainer.querySelectorAll('.btn-period-badge');
        periodBtns.forEach(b => b.classList.remove('active'));
    }
}

function selezionaPeriodoRecente(mesi, btnElement) {
    deselezionaTuttiIBadge();
    if (btnElement) {
        btnElement.classList.add('active');
    }

    const dataFineStr = calcolaDataOggi();
    const dataInizioStr = calcolaDataMesiFa(mesi);

    if (dom.excelDataInizio) dom.excelDataInizio.value = dataInizioStr;
    if (dom.excelDataFine) dom.excelDataFine.value = dataFineStr;
}

function selezionaAnnoExport(anno, btnElement) {
    deselezionaTuttiIBadge();
    if (btnElement) {
        btnElement.classList.add('active');
    }

    // Imposta automaticamente il primo gennaio e il 31 dicembre dell'anno selezionato
    if (dom.excelDataInizio) dom.excelDataInizio.value = `${anno}-01-01`;
    if (dom.excelDataFine) dom.excelDataFine.value = `${anno}-12-31`;
}

function deselezionaAnniRapidi() {
    const inizio = dom.excelDataInizio ? dom.excelDataInizio.value : '';
    const fine = dom.excelDataFine ? dom.excelDataFine.value : '';

    deselezionaTuttiIBadge();

    // Controlla se corrisponde esattamente a un anno intero
    if (dom.modalAnniContainer && inizio && fine) {
        const yearBtns = dom.modalAnniContainer.querySelectorAll('.btn-year-badge');
        yearBtns.forEach(btn => {
            const a = btn.getAttribute('data-anno');
            if (inizio === `${a}-01-01` && fine === `${a}-12-31`) {
                btn.classList.add('active');
            }
        });
    }

    // Controlla se corrisponde esattamente a uno dei periodi recenti da oggi
    if (dom.modalPeriodiContainer && inizio && fine) {
        const oggi = calcolaDataOggi();
        const periodBtns = dom.modalPeriodiContainer.querySelectorAll('.btn-period-badge');
        periodBtns.forEach(btn => {
            const mesi = parseInt(btn.getAttribute('data-periodo'), 10);
            if (fine === oggi && inizio === calcolaDataMesiFa(mesi)) {
                btn.classList.add('active');
            }
        });
    }
}

function apriModalExportExcel() {
    dom.modalExportExcel.style.display = 'flex';
    caricaPulsantiAnniModal();
}

function chiudiModalExportExcel() {
    dom.modalExportExcel.style.display = 'none';
}

async function eseguiExportCSV() {
    const inizio = dom.excelDataInizio ? dom.excelDataInizio.value : '';
    const fine = dom.excelDataFine ? dom.excelDataFine.value : '';

    if (inizio && fine && inizio > fine) {
        showToast('La Data Inizio non può essere successiva alla Data Fine', 'error');
        return;
    }

    const params = new URLSearchParams();
    if (inizio) params.append('data_inizio', inizio);
    if (fine) params.append('data_fine', fine);

    let defaultFilename = 'ricevute';
    if (inizio && fine && inizio.slice(0, 4) === fine.slice(0, 4) && inizio.endsWith('-01-01') && fine.endsWith('-12-31')) {
        defaultFilename = `ricevute_${inizio.slice(0, 4)}`;
    } else {
        if (inizio) defaultFilename += `_da_${inizio.replace(/-/g, '')}`;
        if (fine) defaultFilename += `_a_${fine.replace(/-/g, '')}`;
    }
    defaultFilename += '.csv';

    const queryStr = params.toString() ? `?${params.toString()}` : '';
    const downloadUrl = `/api/ricevute/esporta-csv${queryStr}`;

    try {
        if (dom.modalExcelBtnConferma) {
            dom.modalExcelBtnConferma.disabled = true;
            dom.modalExcelBtnConferma.textContent = 'Esportazione in corso...';
        }

        const resp = await fetch(downloadUrl);
        if (!resp.ok) {
            throw new Error(`Errore HTTP ${resp.status}`);
        }

        const savedPath = resp.headers.get('X-Saved-Path') || '';
        const disposition = resp.headers.get('Content-Disposition') || '';
        let filename = defaultFilename;
        const match = disposition.match(/filename="?([^";]+)"?/);
        if (match && match[1]) {
            filename = match[1].trim();
        }

        chiudiModalExportExcel();
        if (savedPath) {
            showToast(`File ${filename} salvato in Download e aperto!`, 'success');
        } else {
            showToast(`File ${filename} scaricato con successo!`, 'success');
        }
    } catch (err) {
        console.error('Errore export CSV:', err);
        showToast(`Errore durante l'esportazione: ${err.message}`, 'error');
    } finally {
        if (dom.modalExcelBtnConferma) {
            dom.modalExcelBtnConferma.disabled = false;
            dom.modalExcelBtnConferma.textContent = '📥 Scarica CSV';
        }
    }
}

async function eseguiExportXLSX() {
    const inizio = dom.excelDataInizio ? dom.excelDataInizio.value : '';
    const fine = dom.excelDataFine ? dom.excelDataFine.value : '';

    if (inizio && fine && inizio > fine) {
        showToast('La Data Inizio non può essere successiva alla Data Fine', 'error');
        return;
    }

    const params = new URLSearchParams();
    if (inizio) params.append('data_inizio', inizio);
    if (fine) params.append('data_fine', fine);

    let defaultFilename = 'ricevute';
    if (inizio && fine && inizio.slice(0, 4) === fine.slice(0, 4) && inizio.endsWith('-01-01') && fine.endsWith('-12-31')) {
        defaultFilename = `ricevute_${inizio.slice(0, 4)}`;
    } else {
        if (inizio) defaultFilename += `_da_${inizio.replace(/-/g, '')}`;
        if (fine) defaultFilename += `_a_${fine.replace(/-/g, '')}`;
    }
    defaultFilename += '.xlsx';

    const queryStr = params.toString() ? `?${params.toString()}` : '';
    const downloadUrl = `/api/ricevute/esporta-excel.xlsx${queryStr}`;

    try {
        if (dom.modalXlsxBtnConferma) {
            dom.modalXlsxBtnConferma.disabled = true;
            dom.modalXlsxBtnConferma.textContent = 'Esportazione in corso...';
        }

        const resp = await fetch(downloadUrl);
        if (!resp.ok) {
            throw new Error(`Errore HTTP ${resp.status}`);
        }

        const savedPath = resp.headers.get('X-Saved-Path') || '';
        const disposition = resp.headers.get('Content-Disposition') || '';
        let filename = defaultFilename;
        const match = disposition.match(/filename="?([^";]+)"?/);
        if (match && match[1]) {
            filename = match[1].trim();
        }

        chiudiModalExportExcel();
        if (savedPath) {
            showToast(`File Excel ${filename} salvato in Download e aperto!`, 'success');
        } else {
            showToast(`File Excel ${filename} scaricato con successo!`, 'success');
        }
    } catch (err) {
        console.error('Errore export Excel:', err);
        showToast(`Errore durante l'esportazione: ${err.message}`, 'error');
    } finally {
        if (dom.modalXlsxBtnConferma) {
            dom.modalXlsxBtnConferma.disabled = false;
            dom.modalXlsxBtnConferma.textContent = '📊 Scarica Excel (.xlsx)';
        }
    }
}

// =========================================================================
// Archivio Ricevute & Filtri
// =========================================================================

/**
 * Carica l'elenco di TUTTI gli anni disponibili nel DB per la tendina dei filtri.
 * Risolve definitivamente il bug: la tendina contiene sempre tutti gli anni!
 */
async function caricaFiltroAnni() {
    try {
        const resp = await fetch('/api/ricevute/anni');
        if (!resp.ok) return;
        const data = await resp.json();
        const anni = data.anni || [];

        const valSelezionato = dom.filtroAnno.value;
        let html = '<option value="">Tutti gli anni</option>';
        anni.forEach(a => {
            const sel = valSelezionato === String(a) ? 'selected' : '';
            html += `<option value="${a}" ${sel}>${a}</option>`;
        });
        dom.filtroAnno.innerHTML = html;
    } catch (err) {
        console.error('Errore caricamento anni:', err);
    }
}

async function caricaArchivio() {
    try {
        const anno = dom.filtroAnno.value;
        const search = dom.filtroRicerca.value.trim();

        const params = new URLSearchParams();
        if (anno) params.append('anno', anno);
        if (search) params.append('paziente', search);

        const resp = await fetch(`/api/ricevute?${params.toString()}`);
        if (!resp.ok) throw new Error('Errore caricamento archivio');
        const ricevute = await resp.json();

        renderTabellaArchivio(ricevute);
    } catch (err) {
        console.error('Errore archivio:', err);
        showToast('Errore caricamento archivio', 'error');
    }
}

function renderTabellaArchivio(ricevute) {
    dom.archivioTableBody.innerHTML = '';

    if (!ricevute || ricevute.length === 0) {
        dom.archivioEmpty.style.display = 'block';
        dom.archivioTableBody.parentElement.style.display = 'none';
        return;
    }

    dom.archivioEmpty.style.display = 'none';
    dom.archivioTableBody.parentElement.style.display = 'table';

    ricevute.forEach(r => {
        const tr = document.createElement('tr');

        let badgePagamento = '<span class="badge-pagamento badge-nessuno">—</span>';
        if (r.metodo_pagamento === 'pos') {
            badgePagamento = '<span class="badge-pagamento badge-pos">POS / Carta</span>';
        } else if (r.metodo_pagamento === 'contanti') {
            badgePagamento = '<span class="badge-pagamento badge-contanti">Contanti</span>';
        } else if (r.metodo_pagamento === 'bonifico') {
            badgePagamento = '<span class="badge-pagamento badge-bonifico">Bonifico</span>';
        }

        const pazienteNomeCompleto = `${r.paziente_cognome} ${r.paziente_nome}`;

        tr.innerHTML = `
            <td><span class="ricevuta-badge">${r.numero}</span></td>
            <td>${formattaDataItaliana(r.data_emissione)}</td>
            <td><strong>${escapeHtml(r.paziente_cognome)}</strong> ${escapeHtml(r.paziente_nome)}</td>
            <td><span class="cf-mono">${escapeHtml(r.codice_fiscale)}</span></td>
            <td style="text-align: right;">${formattaEuro(parseFloat(r.subtotale))}</td>
            <td style="text-align: right;"><span class="totale-highlight">${formattaEuro(parseFloat(r.totale_da_pagare))}</span></td>
            <td style="text-align: center;">${badgePagamento}</td>
            <td style="text-align: center;">
                <div class="actions-cell">
                    <button type="button" class="btn-action btn-action-view" onclick="visualizzaRicevuta(${r.id})" title="Visualizza e ristampa su A4">
                        📄 Apri
                    </button>
                    <button type="button" class="btn-action btn-action-edit" onclick="avviaModificaDaArchivio(${r.id})" title="Modifica dati della ricevuta">
                        ✏️ Modifica
                    </button>
                    <button type="button" class="btn-action btn-action-delete" onclick="richiediConfermaEliminazione(${r.id}, ${r.anno}, ${r.numero}, '${escapeHtml(pazienteNomeCompleto).replace(/'/g, "\\'")}')" title="Elimina ricevuta dal database">
                        🗑️ Elimina
                    </button>
                </div>
            </td>
        `;

        dom.archivioTableBody.appendChild(tr);
    });
}

// =========================================================================
// Stampa e Reset
// =========================================================================

function stampaRicevuta() {
    window.print();
}

/**
 * Rileva se ci sono modifiche o dati non salvati nella fattura corrente.
 */
function ciSonoModificheNonSalvate() {
    // Se siamo in modalità modifica di una fattura esistente: ci sono modifiche pendenti
    if (state.statoRicevuta === 'modifica') {
        return true;
    }
    // Se la fattura è già salvata e non in modifica: nulla di non salvato
    if (state.statoRicevuta === 'salvata') {
        return false;
    }

    // Stato 'nuova': controlla se l'utente ha iniziato a compilare dati
    const haDatiPaziente = !!(
        dom.inpCognome.value.trim() ||
        dom.inpNome.value.trim() ||
        dom.inpIndirizzo.value.trim() ||
        dom.inpCitta.value.trim() ||
        dom.inpCap.value.trim() ||
        dom.inpCf.value.trim() ||
        dom.inpPivaPaz.value.trim()
    );

    const righe = leggiRighePrestazione();
    const haPrestazioni = righe.some(r =>
        (r.tipoSelezionato && r.tipoSelezionato !== '') ||
        (r.descrizione && r.descrizione.trim() !== '') ||
        (r.importo !== null && !isNaN(r.importo) && r.importo > 0)
    ) || righe.length > 1;

    const haNumeroPersonalizzato = !!dom.inpNumero.value.trim();

    return haDatiPaziente || haPrestazioni || haNumeroPersonalizzato;
}

/**
 * Gestore del click sul pulsante "+ Nuova":
 * se ci sono dati non salvati, apre il modale con Salva / Scarta / Annulla.
 */
function richiediNuovaFattura() {
    if (ciSonoModificheNonSalvate()) {
        apriModalConfermaNuova();
    } else {
        resetForm();
    }
}

function apriModalConfermaNuova() {
    if (dom.modalConfermaNuova) {
        dom.modalConfermaNuova.style.display = 'flex';
    }
}

function chiudiModalConfermaNuova() {
    if (dom.modalConfermaNuova) {
        dom.modalConfermaNuova.style.display = 'none';
    }
}

/**
 * Pulsante "Scarta": scarta tutte le modifiche e apre una nuova fattura pulita.
 */
async function gestisciNuovaScarta() {
    chiudiModalConfermaNuova();
    await resetForm();
    showToast('Modifiche scartate. Nuova ricevuta pronta.', '');
}

/**
 * Pulsante "Salva": tenta il salvataggio. Se valido, salva e poi apre la nuova fattura.
 */
async function gestisciNuovaSalva() {
    const salvato = await salvaRicevuta();
    if (!salvato) {
        // La validazione ha fallito: chiude il popup così l'utente può correggere l'errore mostrato a video
        chiudiModalConfermaNuova();
        return;
    }
    chiudiModalConfermaNuova();
    await resetForm();
    showToast('Fattura precedente salvata con successo! Pronto per nuova ricevuta.', 'success');
}

async function resetForm() {
    state.ricevutaCorrenteId = null;
    state.datiRicevutaCorrente = null;

    dom.inpData.value = new Date().toISOString().slice(0, 10);
    dom.inpNumero.value = '';
    dom.numeroWarning.style.display = 'none';
    dom.inpNumero.style.borderColor = '';

    dom.inpTitolo.value = 'Sig.';
    dom.inpCognome.value = '';
    dom.inpNome.value = '';
    dom.inpIndirizzo.value = '';
    dom.inpCitta.value = '';
    dom.inpCap.value = '';
    dom.inpCf.value = '';
    dom.inpPivaPaz.value = '';
    dom.inpBollo.checked = false;
    dom.inpBolloCarico.checked = true;
    dom.bolloCaricoRow.style.display = 'none';
    dom.inpPagamento.value = '';

    dom.prestazioniList.innerHTML = '';
    rigaCounter = 0;
    aggiungiRigaPrestazione();

    dom.formSubtotale.textContent = formattaEuro(0);
    dom.formTotale.textContent = formattaEuro(0);

    await caricaProssimoNumero();
    impostaStato('nuova');
    aggiornaAnteprima();

    showToast('Modulo pronto per nuova ricevuta', '');
}

// =========================================================================
// Navigazione tra viste
// =========================================================================

function showView(view) {
    const viewNuova = document.getElementById('view-nuova');
    const viewArchivio = document.getElementById('view-archivio');
    const btnNuova = document.getElementById('nav-nuova');
    const btnArchivio = document.getElementById('nav-archivio');

    if (view === 'nuova') {
        viewNuova.style.display = 'flex';
        viewArchivio.classList.remove('visible');
        btnNuova.classList.add('active');
        btnArchivio.classList.remove('active');

        // Mostra i tasti toolbar quando si torna in fattura!
        if (dom.headerActions) {
            dom.headerActions.style.display = 'flex';
        }
        // Nessun reset dei dati! I dati rimangono intatti.
    } else {
        viewNuova.style.display = 'none';
        viewArchivio.classList.add('visible');
        btnNuova.classList.remove('active');
        btnArchivio.classList.add('active');

        // Nasconde i tasti toolbar salva/stampa/modifica/nuova quando si è in archivio!
        if (dom.headerActions) {
            dom.headerActions.style.display = 'none';
        }

        caricaFiltroAnni();
        caricaArchivio();
    }
}

// =========================================================================
// Utilità
// =========================================================================

function formattaEuro(valore) {
    return '€ ' + (valore || 0).toLocaleString('it-IT', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function formattaDataItaliana(dataIso) {
    if (!dataIso) return '—';
    const [anno, mese, giorno] = dataIso.split('-');
    return `${giorno}/${mese}/${anno}`;
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function debounce(fn, delay) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

// =========================================================================
// Toast
// =========================================================================

let toastTimer = null;

function showToast(message, type = '', duration = 3500) {
    const toast = document.getElementById('toast');
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.className = 'toast show' + (type ? ` ${type}` : '');
    toastTimer = setTimeout(() => {
        toast.className = 'toast';
    }, duration);
}
