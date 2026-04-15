const email = 'date07112004@gmail.com';
const password = '123456';
fetch('http://localhost:3000/api/v1/auth/signin', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
}).then(res => res.json()).then(data => console.log('Response:', data)).catch(e => console.error(e));
