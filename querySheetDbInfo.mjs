import fetch from 'node-fetch';

async function getSheetDbInfo() {
  console.log('[+] Inspecting SheetDB API endpoints for original Google Sheet links...\n');

  const apis = ['f5m3eu25aobp3', 'wqiphi0bug49j'];

  for (const apiId of apis) {
    try {
      const res = await fetch(`https://sheetdb.io/api/v1/${apiId}`);
      console.log(`API ID: ${apiId}`);
      console.log(`Status: ${res.status}`);
      const headers = res.headers.raw();
      console.log(`Headers:`, headers);
      if (res.ok) {
        const data = await res.json();
        console.log(`Sample row (first 1):`, data.slice(0, 1));
      }
    } catch (e) {
      console.error(`Error on ${apiId}:`, e.message);
    }
    console.log('\n----------------------------------------------------\n');
  }
}

getSheetDbInfo();
