async function testDbObject() {
  console.log('[🚀 TESTING RESTFUL-API OBJECT]...');
  const res = await fetch('https://api.restful-api.dev/objects/ff8081819d82fab6019f3d7966d42bd0');
  console.log('Status:', res.status);
  console.log('Body:', await res.text());
}
testDbObject();
