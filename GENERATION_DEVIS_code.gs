/**
 * ============ GENERATION DEVIS – API =============
 * Écrit dans le fichier PAPORENOV_BACKOFFICE (onglet "devis")
 * ==================================================
 */

/** ID du fichier BACKOFFICE (Google Sheets) */
const BACKOFFICE_ID = '1yZpkRyUV4m5qvGlnnUpAA3WVMql_iHZqopd2WLpuJnk';

/**
 * GET pour tester le déploiement
 * URL : …/exec?path=ping
 */
function doGet(e) {
  const path = (e && e.parameter && e.parameter.path) || '';
  if (path === 'ping') {
    return json_({
      ok: true,
      message: 'Generation devis OK 🧾'
    });
  }
  return json_({
    ok: false,
    error: 'Bad path (GET)',
    path: path
  });
}

/**
 * Point d’entrée POST
 * Reçoit :
 *   path=bo
 *   action=create_devis
 *   + tous les champs du devis
 */
function doPost(e) {
  const path   = (e && e.parameter && e.parameter.path)   || '';
  const action = (e && e.parameter && e.parameter.action) || '';

  if (path === 'bo' && action === 'create_devis') {
    try {
      const res = createDevis_(e.parameter);
      return json_({ ok: true, id_devis: res.id_devis });
    } catch (err) {
      return json_({ ok: false, error: String(err) });
    }
  }

  return json_({
    ok: false,
    error: 'Bad path (POST)',
    path: path,
    action: action
  });
}

/**
 * Création d’un devis dans l’onglet "devis"
 */
function createDevis_(params) {
  const ss = SpreadsheetApp.openById(BACKOFFICE_ID);
  const sh = ss.getSheetByName('devis');
  if (!sh) throw new Error('Onglet "devis" introuvable dans BACKOFFICE');

  const headers = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
  const idDevis = generateId_('devis', 'id_devis', 'DEV');
  const now     = new Date();
  const map     = {};

  headers.forEach(function(h) {
    if (h === 'id_devis') {
      map[h] = idDevis;
    } else if (h === 'date_devis') {
      map[h] = params[h] || now;
    } else {
      map[h] = params[h] || '';
    }
  });

  const row = headers.map(function(h) { return map[h]; });
  sh.appendRow(row);
  return { id_devis: idDevis };
}

/**
 * Génère un ID incrémental DEV-0001, DEV-0002, etc.
 */
function generateId_(sheetName, idField, prefix) {
  const ss = SpreadsheetApp.openById(BACKOFFICE_ID);
  const sh = ss.getSheetByName(sheetName);
  if (!sh) throw new Error('Onglet "' + sheetName + '" introuvable');

  const lastRow = sh.getLastRow();
  if (lastRow < 2) return prefix + '-0001';

  const headers = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
  const colIdx  = headers.indexOf(idField);
  if (colIdx === -1) throw new Error('Colonne "' + idField + '" introuvable');

  const data = sh.getRange(2,1,lastRow-1,sh.getLastColumn()).getValues();
  const nums = data
    .map(function(r) {
      const m = String(r[colIdx]).match(/^.*?-(\d+)$/);
      return m ? Number(m[1]) : 0;
    })
    .filter(function(n) { return n > 0; });

  const next = (nums.length ? Math.max.apply(null, nums) : 0) + 1;
  return prefix + '-' + ('0000' + next).slice(-4);
}

/**
 * Réponse JSON standard + CORS
 */
function json_(obj) {
  var out = ContentService
    .createTextOutput(JSON.stringify(obj, null, 2))
    .setMimeType(ContentService.MimeType.JSON);

  out.setHeader('Access-Control-Allow-Origin', '*');
  out.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  out.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  return out;
}
