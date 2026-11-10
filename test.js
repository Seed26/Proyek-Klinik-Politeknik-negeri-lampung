import assert from 'node:assert';

// ponytail: self-check minimalis berbasis node stdlib test runner tanpa framework
const PORT = 3001;
process.env.PORT = String(PORT);

await import('./backend/server.js');

const resMeds = await fetch(`http://localhost:${PORT}/api/medicines`);
assert.strictEqual(resMeds.status, 200);
const meds = await resMeds.json();
assert(Array.isArray(meds) && meds.length >= 6);

const resLogin = await fetch(`http://localhost:${PORT}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ identifier: 'admin', password: 'klinik123', role: 'admin' })
});
assert.strictEqual(resLogin.status, 200);
const admin = await resLogin.json();
assert.strictEqual(admin.role, 'admin');

const uniqueEmail = `test_${Date.now()}@example.com`;
const resRegister = await fetch(`http://localhost:${PORT}/api/auth/register`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Pasien Test', email: uniqueEmail, password: 'password123', phone: '08123456789' })
});
assert.strictEqual(resRegister.status, 201);

const resPatientLogin = await fetch(`http://localhost:${PORT}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ identifier: uniqueEmail, password: 'password123', role: 'patient' })
});
assert.strictEqual(resPatientLogin.status, 200);
const patientUser = await resPatientLogin.json();

const resUpdateUser = await fetch(`http://localhost:${PORT}/api/users/${patientUser.id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Pasien Update', email: uniqueEmail, phone: '0899999999', bio: 'Bio test', age: 25, status: 'mahasiswa' })
});
assert.strictEqual(resUpdateUser.status, 200);

const resUpdateAdmin = await fetch(`http://localhost:${PORT}/api/users/${admin.id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Admin Klinik', email: admin.email, phone: '0812-3456-7890', bio: 'Catatan admin', status: 'administrator' })
});
assert.strictEqual(resUpdateAdmin.status, 200);

// Test queues
const resQueue = await fetch(`http://localhost:${PORT}/api/queues`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    number: 'A-999',
    name: 'Pasien Test',
    doctor: 'dr. Dian',
    clinic: 'Poli Umum',
    time: '08:00',
    date: '2026-11-08',
    status: 'Menunggu',
    patientEmail: uniqueEmail,
    complaint: 'Demam'
  })
});
assert.strictEqual(resQueue.status, 201);
const queue = await resQueue.json();
assert.strictEqual(queue.number, 'A-999');

const resGetQueues = await fetch(`http://localhost:${PORT}/api/queues`);
assert.strictEqual(resGetQueues.status, 200);
const allQueues = await resGetQueues.json();
assert(Array.isArray(allQueues) && allQueues.some(q => q.id === queue.id));

const resPatchQueue = await fetch(`http://localhost:${PORT}/api/queues/${queue.id}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status: 'Diperiksa' })
});
assert.strictEqual(resPatchQueue.status, 200);

const resPutQueue = await fetch(`http://localhost:${PORT}/api/queues/${queue.id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Pasien Test Diubah',
    clinic: 'Poli Umum',
    doctor: 'dr. Tya',
    time: '09:00',
    date: '2026-11-08',
    status: 'Diperiksa',
    complaint: 'Pusing dan demam'
  })
});
assert.strictEqual(resPutQueue.status, 200);

const resDeleteQueue = await fetch(`http://localhost:${PORT}/api/queues/${queue.id}`, {
  method: 'DELETE'
});
assert.strictEqual(resDeleteQueue.status, 200);

// Test orders
const orderId = `RX-TEST-${Date.now()}`;
const resOrder = await fetch(`http://localhost:${PORT}/api/orders`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: orderId,
    userId: patientUser.id,
    name: 'Pasien Test',
    items: [{ id: 1, name: 'Paracetamol 500 mg', qty: 2 }],
    status: 'Menunggu Pengambilan',
    date: new Date().toISOString()
  })
});
assert.strictEqual(resOrder.status, 201);

const resGetOrders = await fetch(`http://localhost:${PORT}/api/orders`);
assert.strictEqual(resGetOrders.status, 200);
const ordersList = await resGetOrders.json();
assert(ordersList.some(o => o.id === orderId));

const resPatchOrder = await fetch(`http://localhost:${PORT}/api/orders/${orderId}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status: 'Selesai' })
});
assert.strictEqual(resPatchOrder.status, 200);

const resStatic = await fetch(`http://localhost:${PORT}/`);
assert.strictEqual(resStatic.status, 200);
const indexHtml = await resStatic.text();
assert(indexHtml.includes('id="admin-home-nav"') && indexHtml.includes('id="patient-home-nav"'));
assert(indexHtml.includes('id="patient-jadwal-nav"'));

const resHomeHtml = await fetch(`http://localhost:${PORT}/pages/home.html`);
assert.strictEqual(resHomeHtml.status, 200);
const homeHtml = await resHomeHtml.text();
assert(homeHtml.includes('id="admin-home-dashboard"') && homeHtml.includes('id="patient-home-dashboard"'));

const resJadwalHtml = await fetch(`http://localhost:${PORT}/pages/jadwal.html`);
assert.strictEqual(resJadwalHtml.status, 200);
const jadwalHtml = await resJadwalHtml.text();
assert(jadwalHtml.includes('id="jadwal-admin-table"') && jadwalHtml.includes('id="jadwal-patient-grid"'));

console.log('Self-check passed: Backend, SQLite DB, dan Frontend static OK.');
process.exit(0);
