const token = "..."; // wait, the token is in local storage, I can't easily get it. 
// Let's create a new user, get a token, create a bunker, and GET it.
async function test() {
  const res = await fetch('http://localhost:3000/api/v1/auth/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '+91 9999999999', otp: '000000' })
  });
  const auth = await res.json();
  if(!auth.token) { console.log("Login failed", auth); return; }
  
  const token = auth.token;
  
  // on board
  if(auth.is_new_user) {
     await fetch('http://localhost:3000/api/v1/auth/onboard', {
       method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
       body: JSON.stringify({ phone: '+91 9999999999', username: 'TestUser123', armyId: 'CSK' })
     });
  }

  // Get active match
  const matchesRes = await fetch('http://localhost:3000/api/v1/matches/live', { headers: { 'Authorization': `Bearer ${token}` } });
  const matchesData = await matchesRes.json();
  const matchId = matchesData.matches[0].id;

  // Create bunker
  const createRes = await fetch('http://localhost:3000/api/v1/bunkers', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ name: 'Test Bunker', matchId })
  });
  const createData = await createRes.json();
  console.log("Create Bunker Response:", createData);
  
  if (!createData.bunker) return;

  // Get bunker
  const getRes = await fetch(`http://localhost:3000/api/v1/bunkers/${createData.bunker.id}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const getData = await getRes.json();
  console.log("Get Bunker Response:", getRes.status, getData);
}
test().catch(console.error);
