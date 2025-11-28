/*** ====== TARIFS_API – Lecture des tarifs & stats partenaires ====== ***/
// Fichier Google Sheets qui contient toutes les feuilles de tarifs
const SHEET_ID = '1aXVlqZugxCIKnVZucUrsXGDAV5q6COFs7otRfi6KUFM';
const ADMIN_SECRET = 'PROPAPO_ADMIN_2025';

/** Réponse JSON + CORS (pour ton site GitHub) */
function jsonCors_(obj) {
  var out = ContentService
    .createTextOutput(JSON.stringify(obj, null, 2))
    .setMimeType(ContentService.MimeType.JSON);

  out.setHeader('Access-Control-Allow-Origin', '*');
  out.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  out.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  return out;
}

/*** ====== API GET ====== ***/
function doGet(e){
  const path = (e && e.parameter && e.parameter.path || '').trim();

  if (path === 'tarifs'){
    const res = _readTarifs(e && e.parameter || {});
    return jsonCors_(res);
  }

  if (path === 'partner_get'){
    const pid = (e && e.parameter && e.parameter.pid || '').trim();
    if (!pid) {
      return jsonCors_({ok:false,error:'missing pid'});
    }
    const st = _ensurePartner(pid);
    return jsonCors_({
      ok:true,
      stats:{
        partner_id: st.partner_id,
        assigned:   st.assigned,
        doneNoSav:  st.doneNoSav,
        updated_at: st.updated_at
      }
    });
  }

  if (path === 'ping'){
    return jsonCors_({ok:true, ts:_nowISO()});
  }

  return jsonCors_({ok:false,error:'Bad path'});
}

/**
 * Lecture des tarifs dans toutes les feuilles du fichier.
 * Version tolérante sur les noms de colonnes.
 */
function _readTarifs(params){
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheets = ss.getSheets();
  const out = [];

  sheets.forEach(function(sh){
    const cat = sh.getName();
    const values = sh.getDataRange().getValues();
    if (!values.length) return;

    const headersRaw  = values[0];
    const headersNorm = headersRaw.map(_norm);

    function findCol(aliases, defaultIndex){
      const aliasesNorm = aliases.map(_norm);
      for (let i = 0; i < headersNorm.length; i++){
        const h = headersNorm[i];
        for (let j = 0; j < aliasesNorm.length; j++){
          if (h === aliasesNorm[j]) return i;
        }
      }
      return (typeof defaultIndex === 'number') ? defaultIndex : -1;
    }

    const iTask = findCol(
      ['tâche','tache','tâches','taches','prestation','intitulé','intitule'],
      0
    );
    const iMin  = findCol(
      ['prix min','prix_min','prix minimum','prixmini','prix mini'],
      1
    );
    const iUnit = findCol(
      ['unité','unite','unites','unités'],
      2
    );
    const iNote = findCol(
      ['notes','note','commentaire','commentaires','description'],
      3
    );
    const iPPart = findCol(
      ['prix particulier','prix client','prix public','prix_particulier'],
      4
    );

    for (let r = 1; r < values.length; r++){
      const row = values[r];
      const tache    = (iTask  >= 0) ? row[iTask]   : '';
      const prixMin  = (iMin   >= 0) ? row[iMin]    : '';
      const unite    = (iUnit  >= 0) ? row[iUnit]   : '';
      const notes    = (iNote  >= 0) ? row[iNote]   : '';
      const prixPart = (iPPart >= 0) ? row[iPPart]  : '';

      if (!tache) continue;

      out.push({
        categorie:          cat,
        tache:              tache,
        prix_min:           prixMin,
        unite:              unite,
        notes:              notes,
        'Prix particulier': prixPart
      });
    }
  });

  return { tarifs: out };
}

/*** ====== PARTNERS / STATS ====== ***/
function _ensurePartner(pid){
  const opened = _open();
  const stats  = opened.stats;
  const row = _getRowByPid(stats, pid) || stats.getLastRow() + 1;
  stats.getRange(row,1,1,5).setValues([[pid,0,0,_nowISO(),'[]']]);
  return {
    partner_id: pid,
    assigned:   0,
    doneNoSav:  0,
    updated_at: _nowISO()
  };
}

function _getRowByPid(sh, pid){
  const data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++){
    if (data[i][0] == pid) return i + 1;
  }
  return null;
}

function _nowISO(){
  return new Date().toISOString();
}

function _open(){
  const ss = SpreadsheetApp.openById(SHEET_ID);
  return {
    ss:    ss,
    stats: ss.getSheetByName('partner_stats') || ss.insertSheet('partner_stats'),
    logs:  ss.getSheetByName('partner_logs')  || ss.insertSheet('partner_logs'),
  };
}

/*** ====== HELPERS ====== ***/
function _norm(str){
  return (str || '')
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}
