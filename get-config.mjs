import fetch from 'node-fetch';

async function test() {
  try {
    const dbRes = await fetch('https://api.restful-api.dev/objects/ff8081819d82fab6019f3d7966d42bd0');
    console.log("DB Status:", dbRes.status);
    if (dbRes.ok) {
      const dbData = await dbRes.json();
      console.log("DB Config Data:", JSON.stringify(dbData.data, null, 2));
    }
  } catch (err) {
    console.error(err);
  }
}

test();
