import fetch from 'node-fetch';

async function test() {
  console.log("Testing SheetDB logging...");
  try {
    const res = await fetch('https://sheetdb.io/api/v1/wqiphi0bug49j', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: [
          {
            date: new Date().toISOString(),
            username: 'TestPlayer',
            discord_id: '1234567890',
            items: 'Test Item Bundle',
            final_total: 100,
            promo_code: 'TESTCODE',
            tax_amount: 3,
            client_ip: '127.0.0.1'
          }
        ]
      })
    });
    console.log("Status:", res.status);
    console.log("Response:", await res.text());
  } catch (err) {
    console.error("Test failed:", err.message);
  }
}

test();
