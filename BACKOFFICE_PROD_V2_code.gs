/****************************************************
 * PAPORENOV_BACKOFFICE_PROD_V2 - CODE.GS ULTIME
 ****************************************************/

/** ID du fichier Google Sheets BACKOFFICE */
const SPREADSHEET_ID = '1yZpkRyUV4m5qvGlnnUpAA3WVMql_iHZqopd2WLpuJnk';

/** Noms des onglets */
const SHEET_CLIENTS       = 'clients';
const SHEET_DEVIS         = 'devis';
const SHEET_CHANTIERS     = 'chantiers';
const SHEET_DOCS          = 'docs';
const SHEET_NOTES         = 'notes';
const SHEET_PARTENAIRES   = 'partenaires';
const SHEET_FACTURES      = 'factures';
const SHEET_PAIEMENTS     = 'paiements';
const SHEET_NOTIFICATIONS = 'notifications';

/** IDs pour PDF (déjà configurés pour ton Drive) */
const TEMPLATE_DEVIS_DOC_ID   = '1QK0jK6UrgzjNoTmP-X4Lq79UF1jDxWxlw0IF6qKosT4'; // Modèle Google Docs du devis
const TEMPLATE_FACTURE_DOC_ID = 'ID_DOC_MODELE_FACTURE';                      // À remplir si tu veux aussi les factures
const FOLDER_PDF_ID           = '1Xl1n6g0L2p5xIsZC7gEyVHwY8UNH06dk';          // Dossier Drive où stocker les PDF

/****************************************************
 * DOGET / DOPOST
 ****************************************************/
function doGet(e) {
  const path     = (e && e.parameter && e.parameter.path)     || '';
  const resource = (e && e.parameter && e.parameter.resource) || '';

  try {
    if (path === 'ping') {
      return jsonResponse({
        ok: true,
        message: 'Connexion Sheets OK 🔥',
        spreadsheet: SpreadsheetApp.openById(SPREADSHEET_ID).getName(),
        sheet_devis: SHEET_DEVIS
      });
    }

    if (path === 'bo') {
      switch (resource) {
        case 'dashboard':     return handleGetDashboard_();
        case 'clients':       return handleGetAll_(SHEET_CLIENTS);
        case 'devis':         return handleGetAll_(SHEET_DEVIS);
        case 'chantiers':     return handleGetAll_(SHEET_CHANTIERS);
        case 'docs':          return handleGetAll_(SHEET_DOCS);
        case 'notes':         return handleGetAll_(SHEET_NOTES);
        case 'partenaires':   return handleGetAll_(SHEET_PARTENAIRES);
        case 'factures':      return handleGetAll_(SHEET_FACTURES);
        case 'paiements':     return handleGetAll_(SHEET_PAIEMENTS);
        case 'notifications': return handleGetAll_(SHEET_NOTIFICATIONS);
        case 'stats':         return handleGetStats_();
        default:
          return jsonResponse({ ok:false, error:'Resource inconnue : ' + resource });
      }
    }

    return jsonResponse({ ok:false, error:'Path invalide : ' + path });
  } catch (err) {
    return jsonResponse({ ok:false, error:String(err && err.message || err) });
  }
}

function doPost(e) {
  const path   = (e && e.parameter && e.parameter.path)   || '';
  const action = (e && e.parameter && e.parameter.action) || '';
  let data = {};

  if (e && e.parameter) {
    data = {};
    Object.keys(e.parameter).forEach(function (key) {
      if (key === 'path' || key === 'action') return;
      data[key] = e.parameter[key];
    });
  }

  if (e && e.postData && e.postData.contents) {
    var cType = String(e.postData.type || '').toLowerCase();
    if (cType.indexOf('application/json') !== -1) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        return jsonResponse({ ok:false, error:'JSON invalide dans le corps de requête' });
      }
    }
  }

  try {
    if (path === 'bo') {
      switch (action) {
        case 'create_client':       return handleCreate_(SHEET_CLIENTS, data);
        case 'create_devis':        return handleCreateDevis_(data);
        case 'create_chantier':     return handleCreate_(SHEET_CHANTIERS, data);
        case 'create_document':     return handleCreate_(SHEET_DOCS, data);
        case 'create_note':         return handleCreate_(SHEET_NOTES, data);
        case 'create_partenaire':   return handleCreate_(SHEET_PARTENAIRES, data);
        case 'create_facture':      return handleCreateFacture_(data);
        case 'create_paiement':     return handleCreatePaiement_(data);
        case 'create_notification': return handleCreateNotification_(data);

        case 'update_client':       return handleUpdate_(SHEET_CLIENTS, 'id_client', data);
        case 'update_devis':        return handleUpdate_(SHEET_DEVIS, 'id_devis', data);
        case 'update_chantier':     return handleUpdate_(SHEET_CHANTIERS, 'id_chantier', data);
        case 'update_doc':          return handleUpdate_(SHEET_DOCS, 'id_doc', data);
        case 'update_note':         return handleUpdate_(SHEET_NOTES, 'id_note', data);
        case 'update_partenaire':   return handleUpdate_(SHEET_PARTENAIRES, 'id_partenaire', data);
        case 'update_facture':      return handleUpdate_(SHEET_FACTURES, 'id_facture', data);
        case 'update_paiement':     return handleUpdate_(SHEET_PAIEMENTS, 'id_paiement', data);
        case 'update_notification': return handleUpdate_(SHEET_NOTIFICATIONS, 'id_notification', data);

        case 'export_devis_pdf':
        case 'generate_pdf':
          return handleExportDevisPdf_(data);

        case 'export_facture_pdf':
        case 'generate_pdf_facture':
          return handleExportFacturePdf_(data);

        default:
          return jsonResponse({ ok:false, error:'Action inconnue : ' + action });
      }
    }

    return jsonResponse({ ok:false, error:'Path invalide : ' + path });
  } catch (err) {
    return jsonResponse({ ok:false, error:String(err && err.message || err) });
  }
}

/******** LECTURE / DASHBOARD / STATS ********/
function handleGetAll_(sheetName) {
  const data = readTableSafe_(sheetName);
  return jsonResponse({ ok:true, data:data });
}

function handleGetDashboard_() {
  const clients     = readTableSafe_(SHEET_CLIENTS);
  const devis       = readTableSafe_(SHEET_DEVIS);
  const chantiers   = readTableSafe_(SHEET_CHANTIERS);
  const docs        = readTableSafe_(SHEET_DOCS);
  const notes       = readTableSafe_(SHEET_NOTES);
  const partenaires = readTableSafe_(SHEET_PARTENAIRES);

  const chantiersEnCours = chantiers.filter(c => {
    const s = (c.statut || '').toString().toLowerCase();
    return s.indexOf('cours') !== -1;
  }).length;

  const devisAttente = devis.filter(d => {
    const s = (d.statut || '').toString().toLowerCase();
    return s.indexOf('attente') !== -1 || s.indexOf('envoy') !== -1;
  }).length;

  const clientsActifs = clients.filter(c => {
    const s = (c.statut || '').toString().toLowerCase();
    return !s || s === 'actif' || s === 'prospect';
  }).length;

  const demandesSite = clients.filter(c => {
    const src = (c.source || '').toString().toLowerCase();
    return src.indexOf('site') !== -1 || src.indexOf('web') !== -1;
  }).length;

  const kpi = {
    chantiersEnCours: chantiersEnCours,
    devisAttente:     devisAttente,
    clientsActifs:    clientsActifs,
    demandesSite:     demandesSite,
    nbDevis:          devis.length,
    nbChantiers:      chantiers.length,
    nbDocs:           docs.length,
    nbNotes:          notes.length,
    nbPartenaires:    partenaires.length
  };

  const flow = [
    '📌 ' + clients.length     + ' fiches clients',
    '📄 ' + devis.length       + ' devis',
    '🏗️ ' + chantiers.length  + ' chantiers',
    '🤝 ' + partenaires.length + ' partenaires'
  ].map(function(l){
    return '<div class="flow-item">' + l + '</div>';
  }).join('');

  var notesHtml = '';
  if (notes.length) {
    const top3 = notes.slice(0,3);
    notesHtml = top3.map(function(n){
      const titre   = n.titre || n.tag || 'Note';
      const contenu = n.contenu || n.message || '';
      return '<div class="note-item"><strong>'+escapeHtml_(titre)+'</strong><br><span>'+escapeHtml_(contenu)+'</span></div>';
    }).join('');
  }

  return jsonResponse({
    ok:true,
    data:{
      kpi:       kpi,
      flow:      flow,
      notesHtml: notesHtml
    }
  });
}

function handleGetStats_() {
  const devis     = readTableSafe_(SHEET_DEVIS);
  const factures  = readTableSafe_(SHEET_FACTURES);
  const paiements = readTableSafe_(SHEET_PAIEMENTS);

  let caPotentiel = 0;
  let caFacture   = 0;
  let caEncaisse  = 0;
  let nbDevisTot  = devis.length;
  let nbDevisOk   = 0;

  devis.forEach(function(d){
    const s = (d.statut || '').toString().toLowerCase();
    const m = Number(d.montant_ttc || 0);
    if (s.indexOf('accept') !== -1 || s.indexOf('sign') !== -1 || s.indexOf('valid') !== -1) {
      caPotentiel += m;
      nbDevisOk++;
    }
  });

  factures.forEach(function(f){
    caFacture += Number(f.montant_ttc || 0);
  });

  paiements.forEach(function(p){
    caEncaisse += Number(p.montant || 0);
  });

  const tauxTransformation = nbDevisTot ? (nbDevisOk * 100 / nbDevisTot) : 0;

  const monthsMap = {};
  function addToMonth_(dateVal, type, amount) {
    if (!dateVal) return;
    var d = dateVal;
    if (Object.prototype.toString.call(dateVal) !== '[object Date]') {
      try{
        d = new Date(dateVal);
      }catch(e){
        return;
      }
    }
    if (!d || isNaN(d.getTime())) return;
    const ym = d.getFullYear() + '-' + ('0'+(d.getMonth()+1)).slice(-2);
    if (!monthsMap[ym]) {
      monthsMap[ym] = { mois:ym, devis:0, factures:0, paiements:0 };
    }
    monthsMap[ym][type] += Number(amount || 0);
  }

  devis.forEach(function(d){
    addToMonth_(d.date_devis || d.date_creation, 'devis', d.montant_ttc);
  });
  factures.forEach(function(f){
    addToMonth_(f.date_facture, 'factures', f.montant_ttc);
  });
  paiements.forEach(function(p){
    addToMonth_(p.date_paiement, 'paiements', p.montant);
  });

  const months = Object.keys(monthsMap).sort().map(function(k){ return monthsMap[k]; });

  return jsonResponse({
    ok:true,
    data:{
      kpi:{
        caPotentiel:       caPotentiel,
        caFacture:         caFacture,
        caEncaisse:        caEncaisse,
        tauxTransformation: tauxTransformation
      },
      months: months
    }
  });
}

/******** CREATION / UPDATE ********/
function handleCreate_(sheetName, obj) {
  const sheet   = openSheet_(sheetName);
  const headers = getHeaders_(sheet);
  const row = headers.map(function(h){ return obj.hasOwnProperty(h) ? obj[h] : ''; });
  sheet.appendRow(row);
  return jsonResponse({ ok:true, message:'Création réussie dans "'+sheetName+'"', data:obj });
}

function handleCreateDevis_(obj) {
  const sheet   = openSheet_(SHEET_DEVIS);
  const headers = getHeaders_(sheet);
  const idField = 'id_devis';
  const newId   = generateIncrementalId_(sheet, idField, 'DV-');
  obj[idField]  = newId;
  obj.date_creation = obj.date_creation || new Date();

  const row = headers.map(function(h){ return obj.hasOwnProperty(h) ? obj[h] : ''; });
  sheet.appendRow(row);
  return jsonResponse({ ok:true, id_devis:newId, data:obj });
}

function handleCreateFacture_(obj) {
  const sheet   = openSheet_(SHEET_FACTURES);
  const headers = getHeaders_(sheet);
  const idField = 'id_facture';
  const newId   = generateIncrementalId_(sheet, idField, 'FA-');
  obj[idField]      = newId;
  obj.date_facture  = obj.date_facture || new Date();
  obj.statut        = obj.statut || 'émise';

  const row = headers.map(function(h){ return obj.hasOwnProperty(h) ? obj[h] : ''; });
  sheet.appendRow(row);
  return jsonResponse({ ok:true, id_facture:newId, data:obj });
}

function handleCreatePaiement_(obj) {
  const sheet   = openSheet_(SHEET_PAIEMENTS);
  const headers = getHeaders_(sheet);
  const idField = 'id_paiement';
  const newId   = generateIncrementalId_(sheet, idField, 'PA-');
  obj[idField]      = newId;
  obj.date_paiement = obj.date_paiement || new Date();
  obj.statut        = obj.statut || 'payé';

  const row = headers.map(function(h){ return obj.hasOwnProperty(h) ? obj[h] : ''; });
  sheet.appendRow(row);
  return jsonResponse({ ok:true, id_paiement:newId, data:obj });
}

function handleCreateNotification_(obj) {
  const sheet   = openSheet_(SHEET_NOTIFICATIONS);
  const headers = getHeaders_(sheet);
  const idField = 'id_notification';
  const newId   = generateIncrementalId_(sheet, idField, 'NT-');
  obj[idField]          = newId;
  obj.date_notification = obj.date_notification || new Date();
  obj.lu                = obj.lu || false;

  const row = headers.map(function(h){ return obj.hasOwnProperty(h) ? obj[h] : ''; });
  sheet.appendRow(row);
  return jsonResponse({ ok:true, id_notification:newId, data:obj });
}

function handleUpdate_(sheetName, idField, obj) {
  const sheet = openSheet_(sheetName);
  const data  = sheet.getDataRange().getValues();
  if (data.length < 2) {
    return jsonResponse({ ok:false, error:'Aucune donnée dans "'+sheetName+'"' });
  }
  const headers = data[0];
  const idIndex = headers.indexOf(idField);
  if (idIndex === -1) {
    return jsonResponse({ ok:false, error:'Colonne ID "'+idField+'" introuvable dans "'+sheetName+'"' });
  }
  const idValue = obj[idField];
  if (!idValue && idValue !== 0) {
    return jsonResponse({ ok:false, error:'ID manquant pour "'+idField+'"' });
  }

  let rowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idIndex]) === String(idValue)) {
      rowIndex = i;
      break;
    }
  }
  if (rowIndex === -1) {
    return jsonResponse({ ok:false, error:'Ligne avec '+idField+'='+idValue+' introuvable dans "'+sheetName+'"' });
  }

  const row = data[rowIndex];
  headers.forEach(function(h, idx){
    if (obj.hasOwnProperty(h)) {
      row[idx] = obj[h];
    }
  });
  sheet.getRange(rowIndex+1, 1, 1, headers.length).setValues([row]);
  return jsonResponse({ ok:true, message:'Mise à jour réussie dans "'+sheetName+'"', data:obj });
}

/******** EXPORT PDF ********/
function handleExportDevisPdf_(data) {
  if (!TEMPLATE_DEVIS_DOC_ID || !FOLDER_PDF_ID) {
    return jsonResponse({ ok:false, error:'Templates PDF non configurés (TEMPLATE_DEVIS_DOC_ID / FOLDER_PDF_ID)' });
  }
  const idDevis = data && data.id_devis;
  if (!idDevis) {
    return jsonResponse({ ok:false, error:'id_devis manquant' });
  }

  const devisTable = readTableSafe_(SHEET_DEVIS);
  const d = devisTable.find(function(r){ return String(r.id_devis) === String(idDevis); });
  if (!d) {
    return jsonResponse({ ok:false, error:'Devis introuvable : '+idDevis });
  }

  const pdfUrl = generatePdfFromTemplate_(TEMPLATE_DEVIS_DOC_ID, FOLDER_PDF_ID, 'DEVIS_'+idDevis, d);
  return jsonResponse({ ok:true, pdfUrl:pdfUrl });
}

function handleExportFacturePdf_(data) {
  if (!TEMPLATE_FACTURE_DOC_ID || !FOLDER_PDF_ID) {
    return jsonResponse({ ok:false, error:'Templates PDF non configurés (TEMPLATE_FACTURE_DOC_ID / FOLDER_PDF_ID)' });
  }
  const idFacture = data && data.id_facture;
  if (!idFacture) {
    return jsonResponse({ ok:false, error:'id_facture manquant' });
  }

  const factures = readTableSafe_(SHEET_FACTURES);
  const f = factures.find(function(r){ return String(r.id_facture) === String(idFacture); });
  if (!f) {
    return jsonResponse({ ok:false, error:'Facture introuvable : '+idFacture });
  }

  const pdfUrl = generatePdfFromTemplate_(TEMPLATE_FACTURE_DOC_ID, FOLDER_PDF_ID, 'FACTURE_'+idFacture, f);
  return jsonResponse({ ok:true, pdfUrl:pdfUrl });
}

function generatePdfFromTemplate_(templateId, folderId, baseName, dataObj) {
  const template = DriveApp.getFileById(templateId);
  const folder   = DriveApp.getFolderById(folderId);
  const copy     = template.makeCopy(baseName + ' - TMP', folder);
  const doc      = DocumentApp.openById(copy.getId());
  const body     = doc.getBody();

  Object.keys(dataObj).forEach(function(k){
    const token = '{{'+k+'}}';
    body.replaceText(token, String(dataObj[k] || ''));
  });
  doc.saveAndClose();

  const blob = copy.getAs(MimeType.PDF);
  const pdf  = folder.createFile(blob).setName(baseName + '.pdf');
  copy.setTrashed(true);
  return pdf.getUrl();
}

/******** HELPERS FEUILLES / TABLE ********/
function openSheet_(sheetName) {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    throw new Error('Onglet introuvable : ' + sheetName);
  }
  return sheet;
}

function getHeaders_(sheet) {
  const row = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  return row;
}

function readTableSafe_(sheetName) {
  try {
    const sheet  = openSheet_(sheetName);
    const values = sheet.getDataRange().getValues();
    if (values.length < 2) return [];
    const headers = values[0];
    const out = [];
    for (let i=1; i<values.length; i++) {
      const row = values[i];
      if (!row.join('').trim()) continue;
      const obj = {};
      headers.forEach(function(h, idx){ obj[h] = row[idx]; });
      out.push(obj);
    }
    return out;
  } catch(err) {
    return [];
  }
}

function generateIncrementalId_(sheet, idField, prefix) {
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return prefix + '0001';
  }
  const headers = data[0];
  const idIndex = headers.indexOf(idField);
  if (idIndex === -1) {
    const count = sheet.getLastRow() - 1;
    return prefix + Utilities.formatString('%04d', count);
  }
  let maxNum = 0;
  for (let i=1; i<data.length; i++) {
    const idVal = data[i][idIndex];
    if (!idVal) continue;
    const m = String(idVal).match(/^.+-(\d{4})$/);
    if (m) {
      const n = parseInt(m[1],10);
      if (n > maxNum) maxNum = n;
    }
  }
  const next = maxNum + 1;
  return prefix + Utilities.formatString('%04d', next);
}

/******** OUTILS DIVERS ********/
function jsonResponse(obj) {
  var out = ContentService
    .createTextOutput(JSON.stringify(obj, null, 2))
    .setMimeType(ContentService.MimeType.JSON);

  out.setHeader('Access-Control-Allow-Origin', '*');
  out.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  out.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  return out;
}

function escapeHtml_(str) {
  return String(str || '')
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}
