import fetch from 'node-fetch';

/**
 * 📊 FETCH GOOGLE SHEET DATA AUDITOR (.MJS)
 */

async function fetchSheetData() {
  console.log('[+] Fetching Google Sheet Data via SheetDB API...\n');

  try {
    const res = await fetch('https://sheetdb.io/api/v1/f5m3eu25aobp3?sheet=TicketData');
    if (res.ok) {
      const data = await res.json();
      console.log(`=======================================================`);
      console.log(`📊 GOOGLE SHEET DATABASE TRANSCRIPT (${data.length} Total Rows)`);
      console.log(`=======================================================\n`);
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.error(`[-] SheetDB API returned status ${res.status}`);
    }
  } catch (err) {
    console.error('[-] Error fetching sheet data:', err.message);
  }
}

fetchSheetData();
