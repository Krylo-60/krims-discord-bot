import fetch from 'node-fetch';

async function test() {
  console.log("Testing KVdb...");
  try {
    const val = { test: 123, time: Date.now() };
    const putRes = await fetch('https://kvdb.io/krims_code_db_7812/config', {
      method: 'POST',
      body: JSON.stringify(val)
    });
    console.log("PUT status:", putRes.status);
    
    const getRes = await fetch('https://kvdb.io/krims_code_db_7812/config');
    console.log("GET status:", getRes.status);
    console.log("GET body:", await getRes.json());
  } catch (err) {
    console.error("KVdb test failed:", err.message);
  }
}

test();
