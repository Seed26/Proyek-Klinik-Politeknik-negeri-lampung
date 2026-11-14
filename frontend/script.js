const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

let medicines = [];
let queues = [];
let schedules = [];
let currentUser = null;
let toastTimer;
const todayKey = localDateKey(new Date());
let selectedDashboardDate = todayKey;

// Penyimpanan lokal: aplikasi berjalan langsung lewat Live Server tanpa Node.js/database.
const STORE = 'klinik-polinela-v1';
const DEFAULT_SCHEDULES = [
  { id: 1, doctor_name: 'dr. Dian', clinic: 'Poli Umum', day: 'Senin', start_time: '08:00', end_time: '14:00', is_active: 1, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 2, doctor_name: 'dr. Dian', clinic: 'Poli Umum', day: 'Rabu', start_time: '08:00', end_time: '14:00', is_active: 1, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 3, doctor_name: 'dr. Tya', clinic: 'Poli Umum', day: 'Selasa', start_time: '09:00', end_time: '15:00', is_active: 1, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 4, doctor_name: 'dr. Tya', clinic: 'Poli Umum', day: 'Kamis', start_time: '09:00', end_time: '15:00', is_active: 1, createdAt: '2026-01-01T00:00:00.000Z' }
];

const DEFAULT_MEDICINES = [
  { id: 1, name: 'Paracetamol 500 mg', category: 'Analgesik', form: 'Tablet', stock: 120, description: 'Meredakan demam dan nyeri ringan hingga sedang seperti sakit kepala, sakit gigi, dan nyeri otot.', dosage: 'Dewasa: 1 tablet 3-4 kali sehari setelah makan. Anak 6-12 tahun: 1/2 - 1 tablet 3-4 kali sehari.', sideEffects: 'Jarang terjadi; pemakaian berlebih dapat merusak fungsi hati.', image: '' },
  { id: 2, name: 'Amoxicillin 500 mg', category: 'Antibiotik', form: 'Kapsul', stock: 18, description: 'Antibiotik untuk mengobati infeksi bakteri pada saluran pernapasan, telinga, dan saluran kemih.', dosage: 'Dewasa: 1 kapsul tiap 8 jam sesudah makan. Harus dihabiskan sesuai anjuran dokter.', sideEffects: 'Mual, diare, ruam kulit, atau reaksi alergi.', image: '' },
  { id: 3, name: 'Vitamin C 500 mg', category: 'Vitamin', form: 'Tablet', stock: 75, description: 'Suplemen untuk menjaga daya tahan tubuh dan membantu proses penyembuhan.', dosage: '1 tablet sekali sehari setelah makan.', sideEffects: 'Dosis berlebih dapat memicu kram perut atau diare.', image: '' },
  { id: 4, name: 'Antasida', category: 'Antasida', form: 'Tablet kunyah', stock: 42, description: 'Menetralkan asam lambung berlebih, meredakan maag dan heartburn.', dosage: '1-2 tablet dikunyah 1-2 jam setelah makan dan menjelang tidur.', sideEffects: 'Sembelit, diare ringan, atau kembung.', image: '' },
  { id: 5, name: 'Cetirizine 10 mg', category: 'Antihistamin', form: 'Tablet', stock: 8, description: 'Meredakan gejala alergi seperti bersin, gatal, dan mata berair.', dosage: 'Dewasa & anak >12 tahun: 1 tablet sekali sehari pada malam hari.', sideEffects: 'Kantuk, mulut kering, lelah, atau pusing.', image: '' },
  { id: 6, name: 'Oralit', category: 'Rehidrasi', form: 'Serbuk', stock: 30, description: 'Larutan rehidrasi oral untuk mengganti cairan dan elektrolit yang hilang akibat diare.', dosage: 'Larutkan 1 sachet ke dalam 200 ml air matang. Minum bertahap setiap diare.', sideEffects: 'Umumnya aman jika takaran air tepat.', image: '' }
];

const readStore = () => {
  const raw = localStorage.getItem(STORE);
  const data = raw ? JSON.parse(raw) : { users: [], medicines: [], queues: [], schedules: [], orders: [] };
  let changed = false;

  if (!data.users) {
    data.users = [
      { id: 1, name: 'Admin', email: 'admin', password: 'admin', role: 'admin', status: 'administrator' },
      { id: 2, name: 'Mahasiswa Polinela', email: 'mahasiswa@student.polinela.ac.id', password: '123', role: 'patient', status: 'mahasiswa' },
      { id: 3, name: 'Dosen Polinela', email: 'dosen@polinela.ac.id', password: '123', role: 'patient', status: 'dosen' }
    ];
    changed = true;
  }
  {
    // Pastikan akun mahasiswa dan dosen selalu ada di mock/localStorage
    const ensureUser = (u) => {
      const idx = data.users.findIndex(x => x.email.toLowerCase() === u.email.toLowerCase());
      if (idx === -1) {
        data.users.push(u);
        changed = true;
      } else if (data.users[idx].password !== u.password) {
        data.users[idx].password = u.password;
        changed = true;
      }
    };
    ['26783118','26783121','26783110','26783130','26783113','25783035','25783036','25783058','25783065','25783066','25783110','24783010','24783031','24783018','24783020'].forEach(nim => ensureUser({ name: `Mahasiswa ${nim}`, email: `${nim}@student.polinela.ac.id`, password: 'Polinela123', role: 'patient', status: 'mahasiswa', nim }));
    ensureUser({ name: 'Dosen Fathurrahman', email: 'fathurrahman@polinela.ac.id', password: 'Polinela123', role: 'patient', status: 'dosen' });
  }

  if (!data.medicines || !data.medicines.length) {
    data.medicines = DEFAULT_MEDICINES;
    changed = true;
  } else {
    data.medicines.forEach(m => {
      const def = DEFAULT_MEDICINES.find(d => d.id === m.id);
      if (def) {
        if (!m.dosage) { m.dosage = def.dosage; changed = true; }
        if (!m.sideEffects) { m.sideEffects = def.sideEffects; changed = true; }
      }
    });
  }

  if (!data.schedules || !data.schedules.length) {
    data.schedules = [...DEFAULT_SCHEDULES];
    changed = true;
  }

  if (!data.orders) {
    data.orders = [];
    changed = true;
  }

  if (changed) writeStore(data);
  return data;
};
const writeStore = data => localStorage.setItem(STORE, JSON.stringify(data));
const bodyOf = options => options.body ? JSON.parse(options.body) : {};
const nextId = list => list.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;

const API_BASE = (window.location.protocol.startsWith('http') && window.location.port && !['3000', '3001', '3002', '3003', '3500'].includes(window.location.port))
  ? 'http://localhost:3500'
  : '';

let useMock = null;

async function api(path, options = {}) {
  if (useMock === true) {
    return mockApi(path, options);
  }
  try {
    const res = await fetch(API_BASE + path, {
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options,
    });
    const contentType = res.headers.get('content-type') || '';
    if (res.status === 404) {
      useMock = true;
      return mockApi(path, options);
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Terjadi kesalahan sistem');
    }
    useMock = false;
    return data;
  } catch (err) {
    if (useMock === null && (err.name === 'TypeError' || err.message.includes('fetch') || err.message.includes('NetworkError'))) {
      useMock = true;
      return mockApi(path, options);
    }
    throw err;
  }
}

function mockApi(path, options = {}) {
  const method = options.method || 'GET';
  const data = readStore();
  const body = bodyOf(options);
  const fail = (message, status = 400) => { const error = new Error(message); error.status = status; throw error; };

  if (path === '/api/auth/login' && method === 'POST') {
    const user = data.users.find(u => u.email.toLowerCase() === body.identifier.toLowerCase() && u.password === body.password);
    if (!user) fail('Email atau kata sandi salah.', 401);
    return { ...user, password: undefined };
  }

  if (path === '/api/auth/register' && method === 'POST') {
    if (!body.name || !body.email || !body.password) fail('Nama, email, dan kata sandi wajib diisi.');
    if (data.users.some(u => u.email.toLowerCase() === body.email.toLowerCase())) fail('Email sudah terdaftar. Gunakan email lain.', 409);
    const user = { id: nextId(data.users), name: body.name.trim(), email: body.email.trim().toLowerCase(), password: body.password, phone: body.phone || '', status: body.status || 'mahasiswa', bio: '', role: 'patient', createdAt: new Date().toISOString() };
    data.users.push(user);
    writeStore(data);
    return { ...user, password: undefined };
  }

  // OTP mock saat frontend dijalankan tanpa backend.
  if (path === '/api/auth/send-otp' && method === 'POST') {
    const user = data.users.find(u => Number(u.id) === Number(body.userId)) || data.users.find(u => (u.personal_email || '').toLowerCase() === String(body.email || '').toLowerCase());
    if (!user) fail('Data tidak ditemukan.', 404);
    user.personal_email = String(body.email).trim().toLowerCase();
    user.otp = '123456';
    writeStore(data);
    return { success: true, message: 'OTP simulasi: gunakan 123456.' };
  }
  if (path === '/api/auth/verify-otp' && method === 'POST') {
    const user = data.users.find(u => Number(u.id) === Number(body.userId)) || data.users.find(u => (u.personal_email || '').toLowerCase() === String(body.email || '').toLowerCase());
    if (!user || user.otp !== String(body.otp)) fail('Kode OTP salah. Gunakan 123456.');
    return { success: true };
  }
  if (path === '/api/auth/onboard' && method === 'POST') {
    const user = data.users.find(u => Number(u.id) === Number(body.userId) || (body.email && u.email.toLowerCase() === String(body.email).toLowerCase()));
    if (!user) fail('Data tidak ditemukan.', 404);
    user.password = body.newPassword;
    user.personal_email = body.personalEmail.toLowerCase();
    user.name = body.name || user.name;
    user.onboarded = 1;
    writeStore(data);
    return { success: true };
  }

  if (path === '/api/orders' && method === 'GET') {
    return (data.orders || []).slice().reverse();
  }

  if (path === '/api/orders' && method === 'POST') {
    if (!data.orders) data.orders = [];
    const order = { ...body, createdAt: body.date || new Date().toISOString() };
    data.orders.push(order);
    (body.items || []).forEach(it => {
      const med = (data.medicines || []).find(m => m.name === it.name || m.id === it.id);
      if (med) med.stock = Math.max(0, Number(med.stock) - (Number(it.qty) || 0));
    });
    writeStore(data);
    return order;
  }

  const orderMatch = path.match(/^\/api\/orders\/([^\/]+)$/);
  if (orderMatch && (method === 'PATCH' || method === 'PUT')) {
    const o = (data.orders || []).find(x => x.id === orderMatch[1]);
    if (!o) fail('Pesanan tidak ditemukan.', 404);
    if (body.status === 'Dibatalkan' && o.status !== 'Dibatalkan') {
      (o.items || []).forEach(it => {
        const med = (data.medicines || []).find(m => m.name === it.name || m.id === it.id);
        if (med) med.stock = Number(med.stock) + (Number(it.qty) || 0);
      });
    }
    Object.assign(o, body);
    writeStore(data);
    return o;
  }

  const match = path.match(/^\/api\/(medicines|queues|doctor-schedules|users)\/?(\d+)?$/);
  if (!match) fail('Data tidak ditemukan.', 404);
  const type = match[1], id = match[2] ? Number(match[2]) : null;
  const key = { medicines: 'medicines', queues: 'queues', 'doctor-schedules': 'schedules', users: 'users' }[type];

  if (type === 'users' && method === 'PUT') {
    let user = data.users.find(u => u.id === id);
    if (!user && id === 1) {
      user = { ...DEFAULT_ADMIN };
      data.users.unshift(user);
    }
    if (!user) fail('Pengguna tidak ditemukan.', 404);
    if (body.email && data.users.some(u => u.id !== id && u.email.toLowerCase() === body.email.toLowerCase())) {
      fail('Email sudah digunakan akun lain.', 409);
    }
    const prevEmail = user.email;
    Object.assign(user, body);
    if (prevEmail && body.email && prevEmail.toLowerCase() !== body.email.toLowerCase()) {
      data.queues.forEach(q => {
        if (q.patientEmail && q.patientEmail.toLowerCase() === prevEmail.toLowerCase()) {
          q.patientEmail = body.email;
          if (body.name) q.name = body.name;
        }
      });
    }
    writeStore(data);
    return { ...user, password: undefined };
  }

  if (method === 'GET') return key === 'queues' ? data.queues : data[key];
  if (method === 'DELETE') { data[key] = data[key].filter(item => item.id !== id); writeStore(data); return { ok: true }; }
  if (method === 'PUT' || method === 'PATCH') { const item = data[key].find(x => x.id === id); if (!item) fail('Data tidak ditemukan.', 404); Object.assign(item, body); writeStore(data); return item; }
  if (method === 'POST') { const item = { ...body, id: nextId(data[key]), createdAt: body.createdAt || new Date().toISOString() }; data[key].push(item); writeStore(data); return item; }
  fail('Metode tidak didukung.', 405);
}

async function refreshData() {
  try {
    const [meds, qList, sList] = await Promise.all([
      api('/api/medicines'),
      api('/api/queues'),
      api('/api/doctor-schedules')
    ]);
    medicines = meds;
    queues = qList;
    schedules = sList;
  } catch (err) {
    console.error('Gagal mengambil data:', err);
  }
}

function localDateKey(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return todayKey;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDateLong(dateKey) {
  if (!dateKey) return "Tanggal tidak diketahui";
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

function getQueuesForDate(dateKey) {
  return queues
    .filter(q => q.date === dateKey)
    .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")) || Number(b.id) - Number(a.id));
}

function getUniquePatientsForDate(dateKey, dateQueues) {
  const patientKeys = new Set();
  dateQueues.forEach(q =>
    patientKeys.add(q.patientEmail ? `email:${q.patientEmail.toLowerCase()}` : `name:${String(q.name).trim().toLowerCase()}`)
  );
  return patientKeys.size;
}

function toast(message) {
  const el = $("#toast");
  if (!el) return;
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2500);
}

function initials(name) {
  return String(name || "?")
    .trim()
    .split(/\s+/)
    .map(part => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatProfileStatus(status) {
    return String(status || "").replace(/\b\w/g, letter =>
        letter.toUpperCase()
    );
}

function renderAvatar(element, name, photo) {
    if (!element) return;

    if (photo) {
        element.innerHTML = `
            <img
                src="${photo}"
                alt="Foto profil"
                class="avatar-image"
            >
        `;
    } else {
        element.textContent = initials(name).slice(0, 1);
    }
}

function statusClass(status) {
  return status === "Menunggu" ? "waiting" : status === "Diperiksa" ? "process" : "done";
}

function statusBadge(status) {
  return `<span class="status ${statusClass(status)}">${escapeHTML(status)}</span>`;
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
}

function showError(selector, message) {
  const el = $(selector);
  el.textContent = message;
  el.classList.remove("hidden");
}

function clearError(selector) {
  const el = $(selector);
  el.textContent = "";
  el.classList.add("hidden");
}

function setLoginMode() {
  $("#login-email").placeholder = "Masukkan email terdaftar";
  $("#login-password").placeholder = "Masukkan kata sandi";
  clearError("#login-error");
}

$$(".toggle-password").forEach(btn => {
  btn.addEventListener("click", () => {
    const targetInput = document.getElementById(btn.dataset.target);
    if (!targetInput) return;
    const isPassword = targetInput.type === "password";
    targetInput.type = isPassword ? "text" : "password";
    btn.querySelector(".eye-icon").classList.toggle("hidden", isPassword);
    btn.querySelector(".eye-off-icon").classList.toggle("hidden", !isPassword);
    btn.setAttribute("aria-label", isPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi");
  });
});

// --- Notifikasi ---
const notificationBtn = $("#notification-btn");
const notificationMenu = $("#notification-menu");

let notifications = [
  { text: "Antrian baru telah ditambahkan", time: "Baru saja" },
  { text: "Stok obat Paracetamol menipis", time: "2 jam lalu" },
  { text: "Pasien telah check-in", time: "5 jam lalu" },
];

function renderNotifications() {
  const list = $("#notification-list");
  const empty = $("#notification-empty");
  if (!list) return;
  list.innerHTML = "";
  if (notifications.length === 0) {
    if (empty) empty.classList.remove("hidden");
  } else {
    if (empty) empty.classList.add("hidden");
    notifications.forEach(n => {
      const li = document.createElement("li");
      li.innerHTML = `<span>${escapeHTML(n.text)}</span><small>${escapeHTML(n.time)}</small>`;
      list.appendChild(li);
    });
  }
}

notificationBtn.addEventListener("click", e => {
  e.stopPropagation();
  const isHidden = notificationMenu.classList.contains("hidden");
  if (isHidden) renderNotifications();
  notificationMenu.classList.toggle("hidden");
});

$("#notification-clear").addEventListener("click", e => {
  e.stopPropagation();
  notifications = [];
  renderNotifications();
  notificationMenu.classList.add("hidden");
});

document.addEventListener("click", e => {
  if (!notificationBtn.contains(e.target) && !notificationMenu.contains(e.target)) {
    notificationMenu.classList.add("hidden");
  }
});

let tempOnboardUser = null;
let tempOnboardPassword = '';
let tempOnboardEmail = '';

let tempForgotEmail = '';

// Toggle lupa password
$("#show-forgot-password")?.addEventListener("click", () => {
  $("#login-screen").classList.add("hidden");
  $("#forgot-password-screen").classList.remove("hidden");
  $("#forgot-step-1").classList.remove("hidden");
  $("#forgot-step-2").classList.add("hidden");
  $("#forgot-step-3").classList.add("hidden");
  $("#forgot-step-4").classList.add("hidden");
  clearError("#forgot-step1-error");
});

$("#forgot-back-btn")?.addEventListener("click", () => {
  $("#forgot-password-screen").classList.add("hidden");
  $("#login-screen").classList.remove("hidden");
});

$("#forgot-done-btn")?.addEventListener("click", () => {
  $("#forgot-password-screen").classList.add("hidden");
  $("#login-screen").classList.remove("hidden");
  $("#login-password").value = "";
  toast("Silakan masuk dengan kata sandi baru Anda");
});

// Submit Form Lupa Password Step 1
$("#forgot-email-form")?.addEventListener("submit", async event => {
  event.preventDefault();
  clearError("#forgot-step1-error");
  const email = $("#forgot-personal-email").value.trim().toLowerCase();
  try {
    const res = await api('/api/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email, type: 'reset' })
    });
    tempForgotEmail = email;
    $("#forgot-step-1").classList.add("hidden");
    $("#forgot-step-2").classList.remove("hidden");
    $("#forgot-otp-email-label").textContent = email;
    toast(res.message || "OTP dikirim ke email");
  } catch (err) {
    showError("#forgot-step1-error", err.message);
  }
});

// Submit Form Lupa Password Step 2 (Verify OTP)
$("#forgot-otp-form")?.addEventListener("submit", async event => {
  event.preventDefault();
  clearError("#forgot-otp-error");
  const otp = $("#forgot-otp-input").value.trim();
  try {
    await api('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email: tempForgotEmail, otp, type: 'reset' })
    });
    $("#forgot-step-2").classList.add("hidden");
    $("#forgot-step-3").classList.remove("hidden");
    toast("OTP terverifikasi");
  } catch (err) {
    showError("#forgot-otp-error", err.message);
  }
});

$("#forgot-resend-otp")?.addEventListener("click", async () => {
  try {
    const res = await api('/api/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email: tempForgotEmail, type: 'reset' })
    });
    toast(res.message || "OTP dikirim ulang");
  } catch (err) {
    toast(err.message);
  }
});

// Submit Form Lupa Password Step 3 (New Password)
$("#forgot-newpass-form")?.addEventListener("submit", async event => {
  event.preventDefault();
  clearError("#forgot-newpass-error");
  const newPassword = $("#forgot-new-password").value;
  const confirmPassword = $("#forgot-confirm-password").value;
  if (newPassword !== confirmPassword) {
    showError("#forgot-newpass-error", "Konfirmasi kata sandi tidak cocok.");
    return;
  }
  try {
    await api('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email: tempForgotEmail, newPassword })
    });
    $("#forgot-step-3").classList.add("hidden");
    $("#forgot-step-4").classList.remove("hidden");
  } catch (err) {
    showError("#forgot-newpass-error", err.message);
  }
});

// Bypass sementara onboarding; akun tetap diminta onboarding pada login berikutnya.
$("#onboard-skip-btn")?.addEventListener("click", async () => {
  try {
    currentUser = tempOnboardUser;
    await refreshData();
    $("#onboarding-screen").classList.add("hidden");
    startSession();
  } catch (err) {
    showError("#onboard-step1-error", err.message);
  }
});

// Onboarding: Form Step 1
$("#onboard-password-form")?.addEventListener("submit", async event => {
  event.preventDefault();
  clearError("#onboard-step1-error");
  const fullName = $("#onboard-full-name").value.trim();
  const newPassword = $("#onboard-new-password").value;
  const confirmPassword = $("#onboard-confirm-password").value;
  const personalEmail = $("#onboard-personal-email").value.trim().toLowerCase();

  if (newPassword !== confirmPassword) {
    showError("#onboard-step1-error", "Konfirmasi kata sandi tidak cocok.");
    return;
  }

  try {
    await api('/api/auth/onboard', {
      method: 'POST',
      body: JSON.stringify({
        userId: tempOnboardUser.id,
        name: fullName,
        newPassword,
        personalEmail
      })
    });
    tempOnboardUser.name = fullName;
    tempOnboardUser.personal_email = personalEmail;
    $("#onboard-step-1").classList.add("hidden");
    $("#onboard-step-3").classList.remove("hidden");
    toast("Data onboarding berhasil disimpan");
  } catch (err) {
    showError("#onboard-step1-error", err.message);
  }
});

$("#onboard-done-btn")?.addEventListener("click", () => {
  $("#onboarding-screen").classList.add("hidden");
  $("#login-screen").classList.remove("hidden");
  $("#login-password").value = "";
  toast("Onboarding selesai. Silakan login kembali dengan password baru.");
});

$("#login-form").addEventListener("submit", async event => {
  event.preventDefault();
  clearError("#login-error");
  const identifier = $("#login-email").value.trim();
  const password = $("#login-password").value.trim();

  try {
    const user = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password })
    });

    // Cek apakah akun pasien belum onboarded
    if (user.role === 'patient' && !user.onboarded) {
      tempOnboardUser = user;
      $("#login-screen").classList.add("hidden");
      $("#onboarding-screen").classList.remove("hidden");
      $("#onboard-step-1").classList.remove("hidden");
      $("#onboard-step-2").classList.add("hidden");
      $("#onboard-step-3").classList.add("hidden");
      return;
    }

    currentUser = user;
    await refreshData();
    startSession();
  } catch (err) {
    showError("#login-error", err.message);
  }
});

function renderProfile() {
  if (!currentUser) return;
  const isAdmin = currentUser.role === "admin";

  // ponytail: diferensiasi UI profil berbasis role admin vs pasien
  const eyebrow = $("#profile-eyebrow");
  if (eyebrow) eyebrow.textContent = isAdmin ? "PENGATURAN AKUN ADMINISTRATOR" : "PROFIL PASIEN";
  const title = $("#profile-title");
  if (title) title.textContent = isAdmin ? "Profil Administrator" : "Profil Pasien";
  const desc = $("#profile-desc");
  if (desc) desc.textContent = isAdmin
    ? "Kelola akun staf pengelola dan akses sistem manajemen klinik."
    : "Informasi identitas diri, data kontak, dan riwayat kesehatan pasien.";

  const cover = $("#profile-cover");
  if (cover) {
    cover.style.background = isAdmin
      ? "linear-gradient(125deg, #17365d, #087db5)"
      : "linear-gradient(125deg, #1d7f72, #49b39b)";
  }

  const headingName = $("#profile-heading-name");
  if (headingName) headingName.textContent = currentUser.name || "Pengguna";

  const statusPreview = $("#profile-status-preview");
  if (statusPreview) {
    statusPreview.textContent = isAdmin
      ? "Administrator Sistem"
      : formatProfileStatus(currentUser.status || "mahasiswa");
  }

  const pillBadge = $("#profile-pill-badge");
  if (pillBadge) {
    pillBadge.className = `pill ${isAdmin ? "admin-pill" : "success-pill"}`;
    pillBadge.textContent = isAdmin ? "● Akun Administrator" : "● Pasien Terdaftar";
  }

  const emailPreview = $("#profile-email-preview");
  if (emailPreview) emailPreview.textContent = currentUser.email || "-";
  const personalEmailPreview = $("#profile-personal-email-preview");
  if (personalEmailPreview) personalEmailPreview.textContent = currentUser.personal_email || "-";

  const roleDetails = $("#profile-role-details");
  if (roleDetails) {
    if (isAdmin) {
      roleDetails.innerHTML = `
        <div class="profile-detail">
            <span>▦</span>
            <div>
                <small>Unit Kerja</small>
                <strong>Klinik Polinela</strong>
            </div>
        </div>
        <div class="profile-detail">
            <span>⚿</span>
            <div>
                <small>Hak Akses</small>
                <strong>Administrator Penuh</strong>
            </div>
        </div>
        <div class="profile-detail">
            <span>☎</span>
            <div>
                <small>Kontak Petugas</small>
                <strong>${escapeHTML(currentUser.phone || "-")}</strong>
            </div>
        </div>
      `;
    } else {
      const ownQueues = queues.filter(q => q.patientEmail && q.patientEmail.toLowerCase() === currentUser.email?.toLowerCase());
      roleDetails.innerHTML = `
        <div class="profile-detail">
            <span>☎</span>
            <div>
                <small>Nomor HP / WhatsApp</small>
                <strong>${escapeHTML(currentUser.phone || "-")}</strong>
            </div>
        </div>
        <div class="profile-detail">
            <span>🎓</span>
            <div>
                <small>NIM / Identitas</small>
                <strong>${escapeHTML(currentUser.nim || "-")}</strong>
            </div>
        </div>
        <div class="profile-detail">
            <span>🏫</span>
            <div>
                <small>Program Studi</small>
                <strong>${escapeHTML(currentUser.prodi || "-")}</strong>
            </div>
        </div>
        <div class="profile-detail">
            <span>⏳</span>
            <div>
                <small>Usia Pasien</small>
                <strong>${currentUser.age ? `${currentUser.age} Tahun` : "-"}</strong>
            </div>
        </div>
        <div class="profile-detail">
            <span>☷</span>
            <div>
                <small>Riwayat Antrean</small>
                <strong>${ownQueues.length} Kunjungan</strong>
            </div>
        </div>
      `;
    }
  }

  const formHeading = $("#profile-form-heading");
  if (formHeading) formHeading.textContent = isAdmin ? "Informasi Administrator" : "Informasi Pasien";
  const formDesc = $("#profile-form-desc");
  if (formDesc) formDesc.textContent = isAdmin
    ? "Perbarui informasi kontak dan identitas staf pengelola klinik."
    : "Perbarui identitas dan data kesehatan Anda untuk layanan klinik.";

  const labelName = $("#profile-label-name");
  if (labelName) labelName.textContent = isAdmin ? "Nama Lengkap Petugas" : "Nama Lengkap Pasien";

  const labelPhone = $("#profile-label-phone");
  if (labelPhone) labelPhone.textContent = isAdmin ? "Nomor HP Petugas" : "Nomor WhatsApp / HP";

  const labelBio = $("#profile-label-bio");
  if (labelBio) labelBio.textContent = isAdmin ? "Catatan / Deskripsi Petugas" : "Riwayat Alergi & Catatan Medis";

  const bioInput = $("#profile-bio");
  if (bioInput) {
    bioInput.value = currentUser.bio || "";
    bioInput.placeholder = isAdmin
      ? "Tuliskan deskripsi atau catatan tugas staf..."
      : "Tuliskan jika memiliki riwayat penyakit, alergi obat (contoh: alergi penisilin), atau catatan penting...";
  }

  $("#profile-group-status")?.classList.toggle("hidden", isAdmin);
  $("#profile-group-role")?.classList.toggle("hidden", !isAdmin);
  $("#profile-group-age")?.classList.toggle("hidden", isAdmin);
  $("#profile-group-unit")?.classList.toggle("hidden", !isAdmin);

  if ($("#profile-name")) $("#profile-name").value = currentUser.name || "";
  if ($("#profile-email")) $("#profile-email").value = currentUser.email || "";
  if ($("#profile-personal-email")) $("#profile-personal-email").value = currentUser.personal_email || "";
  if ($("#profile-phone")) $("#profile-phone").value = currentUser.phone || "";
  if ($("#profile-nim")) $("#profile-nim").value = currentUser.nim || "";
  if ($("#profile-prodi")) $("#profile-prodi").value = currentUser.prodi || "";
  if ($("#profile-age")) $("#profile-age").value = currentUser.age || "";
  if ($("#profile-status")) $("#profile-status").value = currentUser.status || (isAdmin ? "administrator" : "mahasiswa");
  if ($("#profile-photo")) $("#profile-photo").value = "";
  if ($("#profile-photo-remove-btn")) {
    $("#profile-photo-remove-btn").disabled = !currentUser.photo;
  }

  if ($("#top-user-name")) $("#top-user-name").textContent = currentUser.name;
  if ($("#profile-menu-name")) $("#profile-menu-name").textContent = currentUser.name;
  if ($("#profile-menu-email")) $("#profile-menu-email").textContent = currentUser.email || "-";
  if ($("#profile-menu-role")) $("#profile-menu-role").textContent = isAdmin ? "Administrator" : "Pengguna / Pasien";
  const userChipSmall = $(".user-chip small");
  if (userChipSmall) userChipSmall.textContent = isAdmin ? "Administrator" : "Pengguna / Pasien";

  $$(".avatar").forEach(el => renderAvatar(el, currentUser.name, currentUser.photo));
  renderAvatar($("#profile-avatar"), currentUser.name, currentUser.photo);
}

function startSession() {
  $("#login-screen").classList.add("hidden");
  $("#app").classList.remove("hidden");
  const isAdmin = currentUser.role === "admin";

  // Toggle navigation items based on role
  $("#admin-home-nav")?.classList.toggle("hidden", !isAdmin);
  $("#admin-antrian-nav")?.classList.toggle("hidden", !isAdmin);
  $("#admin-jadwal-nav")?.classList.toggle("hidden", !isAdmin);
  $("#admin-obat-nav")?.classList.toggle("hidden", !isAdmin);

  $("#patient-home-nav")?.classList.toggle("hidden", isAdmin);
  $("#patient-records-nav")?.classList.toggle("hidden", isAdmin);
  $("#patient-jadwal-nav")?.classList.toggle("hidden", isAdmin);
  $("#patient-lokasi-nav")?.classList.toggle("hidden", isAdmin);

  const brandSubtitle = $("#brand-role-subtitle");
  if (brandSubtitle) {
    brandSubtitle.textContent = isAdmin ? "Management System" : "Layanan Pasien";
  }

  renderProfile();

  $("#home-greeting").innerHTML = isAdmin
    ? 'Selamat datang, Admin! <span class="wave">✦</span>'
    : `Halo, ${escapeHTML(currentUser.name.split(" ")[0])}!`;
  $("#home-description").textContent = isAdmin
    ? "Berikut ringkasan aktivitas Klinik Polinela hari ini."
    : "Selamat datang di layanan pasien Klinik Polinela.";

  showPage("home");

  if (isAdmin) {
    renderHome();
    renderMedicines();
    renderQueues();
    renderSchedules();
  } else {
    renderPatientHome();
    renderPatientQueues();
    renderSchedules();
  }
  startPolling();
  toast(`Berhasil masuk sebagai ${isAdmin ? "Admin" : "Pengguna"}`);
}

$("#profile-menu-toggle").addEventListener("click", event => {
  event.preventDefault();
  event.stopPropagation();
  const menu = $("#profile-dropdown");
  const isOpening = menu.classList.contains("hidden");
  menu.classList.toggle("hidden", !isOpening);
  $("#profile-menu-toggle").setAttribute("aria-expanded", String(isOpening));
});

$("#profile-dropdown").addEventListener("click", event => event.stopPropagation());
$("#profile-dropdown [data-goto='profil']").addEventListener("click", () => {
  const dropdown = $("#profile-dropdown");
  const toggleBtn = $("#profile-menu-toggle");
  if (dropdown) dropdown.classList.add("hidden");
  if (toggleBtn) toggleBtn.setAttribute("aria-expanded", "false");
  showPage("profil");
});

const settingsMenuBtn = document.querySelector("#profile-dropdown .profile-menu-item:not([data-goto])");
if (settingsMenuBtn) {
  settingsMenuBtn.addEventListener("click", () => {
    const dropdown = $("#profile-dropdown");
    const toggleBtn = $("#profile-menu-toggle");
    if (dropdown) dropdown.classList.add("hidden");
    if (toggleBtn) toggleBtn.setAttribute("aria-expanded", "false");
    showPage("ubah-kata-sandi");
  });
}

// SUBMIT UBAH KATA SANDI
$("#change-password-form")?.addEventListener("submit", async event => {
    event.preventDefault();
    clearError("#cp-error");
    const currentPassword = $("#cp-current-password").value;
    const newPassword = $("#cp-new-password").value;
    const confirmPassword = $("#cp-confirm-password").value;

    if (newPassword !== confirmPassword) {
        showError("#cp-error", "Konfirmasi kata sandi tidak cocok.");
        return;
    }

    try {
        await api('/api/auth/change-password', {
            method: 'POST',
            body: JSON.stringify({ userId: currentUser.id, currentPassword, newPassword })
        });
        toast("Kata sandi berhasil diubah.");
        $("#change-password-form").reset();
        showPage("home");
    } catch (err) {
        showError("#cp-error", err.message);
    }
});

$("#profile-logout-btn").addEventListener("click", () => {
  $("#profile-dropdown").classList.add("hidden");
  $("#profile-menu-toggle").setAttribute("aria-expanded", "false");
  stopPolling();
  currentUser = null;
  $("#app").classList.add("hidden");
  $("#login-screen").classList.remove("hidden");
  $("#login-role").value = "admin";
  setLoginMode();
  toast("Anda telah keluar dari akun");
});

document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    const dropdown = $("#profile-dropdown");
    const toggleBtn = $("#profile-menu-toggle");
    if (dropdown && toggleBtn) {
      dropdown.classList.add("hidden");
      toggleBtn.setAttribute("aria-expanded", "false");
    }
  }
});

document.addEventListener("click", e => {
  if (!e.target.closest(".profile-dropdown-wrapper")) {
    const dropdown = $("#profile-dropdown");
    const toggleBtn = $("#profile-menu-toggle");
    if (dropdown && toggleBtn) {
      dropdown.classList.add("hidden");
      toggleBtn.setAttribute("aria-expanded", "false");
    }
  }
});

const legacyLogoutBtn = $("#logout-btn");
if (legacyLogoutBtn) {
  legacyLogoutBtn.addEventListener("click", () => {
    currentUser = null;
    stopPolling();
    $("#app").classList.add("hidden");
    $("#login-screen").classList.remove("hidden");
    $("#login-role").value = "admin";
    setLoginMode();
    toast("Anda telah keluar dari akun");
  });
}

function showPage(page) {
  const isAdmin = currentUser?.role === "admin";
  if (isAdmin) {
    if (page === "pasien" || page === "info-obat" || page === "lokasi") page = "home";
  } else {
    if (page === "antrian" || page === "obat") page = "home";
  }

  $$(".page").forEach(section => section.classList.toggle("active", section.id === `page-${page}`));

  $$(".nav-link").forEach(link => {
    const isLinkForRole = isAdmin
      ? link.id.startsWith("admin-")
      : link.id.startsWith("patient-");
    link.classList.toggle("active", isLinkForRole && link.dataset.page === page);
  });

  const labels = isAdmin
    ? {
        home: "Home / Dashboard",
        antrian: "Kelola Antrian",
        jadwal: "Jadwal Dokter",
        obat: "Data Obat",
        profil: "Profil Admin"
      }
    : {
        home: "Beranda",
        pasien: "Antrian Saya",
        jadwal: "Jadwal Dokter",
        "medical-records": "Riwayat Rekam Medis",
        lokasi: "Lokasi Klinik",
        profil: "Profil Pasien",
        "ubah-kata-sandi": "Ubah Kata Sandi"
      };

  $("#breadcrumb-current").textContent = labels[page] || (isAdmin ? "Home / Dashboard" : "Beranda");

  if (page === "home") {
    $("#admin-home-dashboard")?.classList.toggle("hidden", !isAdmin);
    $("#patient-home-dashboard")?.classList.toggle("hidden", isAdmin);
    if (isAdmin) renderHome();
    else renderPatientHome();
  } else if (page === "jadwal") {
    renderSchedules();
  } else if (page === "medical-records") {
    renderMedicalRecords();
  } else if (page === "obat") {
    renderMedicines();
  } else if (page === "antrian") {
    renderQueues();
  } else if (page === "pasien") {
    renderPatientQueues();
  } else if (page === "medical-records") {
    renderMedicalRecords();
  } else if (page === "profil") {
    renderProfile();
  } else if (page === "ubah-kata-sandi") {
    document.querySelector("#change-password-form")?.reset();
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

$$(".nav-link").forEach(link => link.addEventListener("click", () => showPage(link.dataset.page)));
$$("[data-goto]").forEach(button => {
  button.addEventListener("click", () => showPage(button.dataset.goto));
  button.addEventListener("keydown", e => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      showPage(button.dataset.goto);
    }
  });
});

function renderHome() {
  const dailyQueues = getQueuesForDate(selectedDashboardDate);
  const dateLabel = formatDateLong(selectedDashboardDate);
  const isToday = selectedDashboardDate === todayKey;
  if ($("#home-description")) $("#home-description").textContent = `Ringkasan aktivitas Klinik Polinela untuk ${dateLabel}.`;
  const subLabel = $("#selected-date-label");
  if (subLabel) subLabel.textContent = isToday ? "Menampilkan data hari ini" : "Menampilkan data riwayat";
  if ($("#home-queue-heading")) $("#home-queue-heading").textContent = isToday ? "Antrian terbaru hari ini" : "Antrian pada tanggal terpilih";
  if ($("#home-queue-description")) $("#home-queue-description").textContent = `${dailyQueues.length} antrian tercatat pada ${dateLabel}.`;

  if ($("#home-queue-body")) {
    $("#home-queue-body").innerHTML =
      dailyQueues
        .slice(0, 5)
        .map(
          q => `
      <tr>
        <td><strong>${escapeHTML(q.number)}</strong></td>
        <td><div class="patient-cell"><div class="patient-avatar">${escapeHTML(initials(q.name))}</div><strong>${escapeHTML(q.name)}</strong></div></td>
        <td>${escapeHTML(q.doctor)}</td>
        <td>${escapeHTML(q.time || "—")}</td>
        <td>${statusBadge(q.status)}</td>
      </tr>`
        )
        .join("") || '<tr><td colspan="5" class="empty-cell">Tidak ada data pasien atau antrian pada tanggal ini.</td></tr>';
  }

  if ($("#home-medicine-list")) {
    $("#home-medicine-list").innerHTML =
      medicines
        .slice(0, 3)
        .map(
          m => `
      <div class="medicine-item">
        ${medicineImg(m)}
        <div><strong>${escapeHTML(m.name)}</strong><small>${escapeHTML(m.category)}</small></div>
        <span class="stock">${Number(m.stock)} unit</span>
      </div>`
        )
        .join("") || '<p class="muted">Belum ada data obat.</p>';
  }

  if ($("#stat-patients")) $("#stat-patients").textContent = getUniquePatientsForDate(selectedDashboardDate, dailyQueues);
  if ($("#stat-queue")) $("#stat-queue").textContent = dailyQueues.length;
  if ($("#stat-waiting")) $("#stat-waiting").textContent = `${dailyQueues.filter(q => q.status === "Menunggu").length} pasien`;
  if ($("#stat-medicine")) $("#stat-medicine").textContent = medicines.length;
}

function renderMedicines() {
  const term = $("#medicine-search").value.toLowerCase();
  const filtered = medicines.filter(m => `${m.name} ${m.category} ${m.form} ${m.description || ""}`.toLowerCase().includes(term));
  $("#medicine-table-body").innerHTML = filtered.length
    ? filtered
        .map(
          m => `
      <tr>
        <td>
          <div class="patient-cell">
            ${medicineImg(m)}
            <div><strong>${escapeHTML(m.name)}</strong><div class="muted">${escapeHTML(m.description || "Belum ada deskripsi")}</div></div>
          </div>
        </td>
        <td>${escapeHTML(m.category)}</td>
        <td>${escapeHTML(m.form)}</td>
        <td><strong>${Number(m.stock)}</strong> unit</td>
        <td>${m.stock < 20 ? '<span class="status waiting">Stok rendah</span>' : '<span class="status done">Tersedia</span>'}</td>
        <td>
          <div class="action-group">
            <button class="row-action" data-edit-medicine="${m.id}">Edit</button>
            <button class="row-action danger" data-delete-medicine="${m.id}">Hapus</button>
          </div>
        </td>
      </tr>`
        )
        .join("")
    : '<tr><td colspan="6" class="empty-cell">Data obat tidak ditemukan.</td></tr>';
  $("#medicine-total").textContent = medicines.length;

  $$("[data-edit-medicine]").forEach(button =>
    button.addEventListener("click", () => {
      const m = medicines.find(item => item.id === Number(button.dataset.editMedicine));
      if (!m) return;
      const previewHTML = m.image
        ? `<div id="medicine-image-preview" class="image-preview"><img src="${m.image}" /><button type="button" class="remove-preview">×</button></div>`
        : `<div id="medicine-image-preview" class="image-preview hidden"><img /><button type="button" class="remove-preview">×</button></div>`;

      openModal(
        "Edit Obat",
        `<label>Gambar obat</label>
        <div class="image-upload-area" id="medicine-upload-area">
          <span>${m.image ? "Klik untuk ganti gambar" : "Klik atau seret gambar ke sini"}</span>
          <input name="image" type="file" accept="image/*" class="file-input" />
        </div>
        ${previewHTML}
        <div class="form-row">
          <div>
            <label>Nama obat</label>
            <input name="name" value="${escapeHTML(m.name)}" required />
          </div>
          <div>
            <label>Kategori</label>
            <input name="category" value="${escapeHTML(m.category || '')}" required />
          </div>
        </div>
        <div class="form-row">
          <div>
            <label>Bentuk sediaan</label>
            <input name="form" value="${escapeHTML(m.form || 'Tablet')}" required />
          </div>
          <div>
            <label>Stok saat ini</label>
            <input name="stock" type="number" min="0" value="${Number(m.stock)}" required />
          </div>
        </div>
        <label>Deskripsi / Kegunaan</label>
        <textarea name="description" rows="3">${escapeHTML(m.description || "")}</textarea>
        <label>Dosis</label>
        <textarea name="dosage" rows="3">${escapeHTML(m.dosage || "")}</textarea>
        <label>Efek Samping</label>
        <textarea name="sideEffects" rows="3">${escapeHTML(m.sideEffects || "")}</textarea>
        <input type="hidden" name="keepOldImage" value="${m.image ? "1" : ""}" />`,
        async form => {
          const data = Object.fromEntries(new FormData(form).entries());
          const file = form.querySelector('input[name="image"]').files[0];
          let image = m.image;
          if (file) {
            image = await readFileAsDataURL(file);
          } else if (!data.keepOldImage) {
            image = "";
          }
          await api(`/api/medicines/${m.id}`, {
            method: 'PUT',
            body: JSON.stringify({
              name: (data.name || m.name).trim(),
              category: (data.category || m.category).trim(),
              form: (data.form || m.form).trim(),
              stock: Number(data.stock),
              image,
              description: (data.description || "").trim(),
              dosage: (data.dosage || "").trim(),
              sideEffects: (data.sideEffects || "").trim()
            })
          });
          await refreshData();
          renderMedicines();
          renderHome();
          toast("Data obat berhasil diperbarui");
        }
      );
      initImageUpload();
    })
  );

  $$("[data-delete-medicine]").forEach(button =>
    button.addEventListener("click", async () => {
      if (!confirm("Hapus data obat ini?")) return;
      const id = Number(button.dataset.deleteMedicine);
      try {
        await api(`/api/medicines/${id}`, { method: 'DELETE' });
        await refreshData();
        renderMedicines();
        renderHome();
        toast("Data obat dihapus");
      } catch (err) {
        toast(err.message);
      }
    })
  );
}

function renderQueues() {
  const term = $("#queue-search").value.toLowerCase();
  const filter = $("#queue-filter").value;
  const filtered = queues.filter(
    q => `${q.name} ${q.number} ${q.doctor} ${q.clinic}`.toLowerCase().includes(term) && (filter === "Semua" || q.status === filter)
  );

  $("#queue-table-body").innerHTML = filtered.length
    ? filtered
        .map(
          q => `
      <tr>
        <td><strong>${escapeHTML(q.number)}</strong></td>
        <td><div class="patient-cell"><div class="patient-avatar">${escapeHTML(initials(q.name))}</div><strong>${escapeHTML(q.name)}</strong></div></td>
        <td><strong>${escapeHTML(q.clinic)}</strong><div class="muted">${escapeHTML(q.doctor)}</div></td>
        <td>${escapeHTML(q.time)}</td>
        <td>${statusBadge(q.status)}</td>
        <td>
          <div class="action-group">
            ${
              q.status !== "Selesai"
                ? `<button class="row-action" data-next-status="${q.id}">${q.status === "Menunggu" ? "Periksa" : "Selesaikan"}</button>`
                : '<span class="status done">Selesai</span>'
            }
            <button class="row-action" data-edit-queue="${q.id}">Edit</button>
            <button class="row-action danger" data-delete-queue="${q.id}">Hapus</button>
          </div>
        </td>
      </tr>`
        )
        .join("")
    : '<tr><td colspan="6" class="empty-cell">Antrian tidak ditemukan.</td></tr>';

  $("#waiting-count").textContent = queues.filter(q => q.status === "Menunggu").length;
  $("#process-count").textContent = queues.filter(q => q.status === "Diperiksa").length;
  $("#done-count").textContent = queues.filter(q => q.status === "Selesai").length;

  $$("[data-next-status]").forEach(button =>
    button.addEventListener("click", async () => {
      const id = Number(button.dataset.nextStatus);
      const q = queues.find(item => item.id === id);
      if (!q) return;
      const nextStatus = q.status === "Menunggu" ? "Diperiksa" : "Selesai";
      try {
        await api(`/api/queues/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: nextStatus })
        });
        await refreshData();
        renderQueues();
        renderHome();
        toast("Status antrian diperbarui");
      } catch (err) {
        toast(err.message);
      }
    })
  );

  $$("[data-edit-queue]").forEach(button =>
    button.addEventListener("click", () => {
      const id = Number(button.dataset.editQueue);
      const q = queues.find(item => item.id === id);
      if (!q) return;
      openModal(
        "Edit Data Antrian",
        `<label>No. Antrian</label>
         <input value="${escapeHTML(q.number)}" disabled />
         <label>Nama Pasien</label>
         <input name="name" value="${escapeHTML(q.name)}" required />
         <div class="form-row">
           <div>
             <label>Layanan / Poli</label>
             <select name="clinic">
               <option ${q.clinic === 'Poli Umum' ? 'selected' : ''}>Poli Umum</option>
               <option ${q.clinic === 'Konsultasi Psikologi' ? 'selected' : ''}>Konsultasi Psikologi</option>
             </select>
           </div>
           <div>
             <label>Dokter / Tenaga Medis</label>
             <select name="doctor">
               <option ${q.doctor === 'dr. Dian' ? 'selected' : ''}>dr. Dian</option>
               <option ${q.doctor === 'dr. Tya' ? 'selected' : ''}>dr. Tya</option>
               <option ${q.doctor === 'Psikolog Rini, M.Psi.' ? 'selected' : ''}>Psikolog Rini, M.Psi.</option>
             </select>
           </div>
         </div>
         <div class="form-row">
           <div>
             <label>Tanggal Kunjungan</label>
             <input name="date" type="date" value="${escapeHTML(q.date || todayKey)}" required />
           </div>
           <div>
             <label>Waktu / Jam</label>
             <input name="time" type="time" value="${escapeHTML(q.time || '08:00')}" required />
           </div>
         </div>
         <div class="form-row">
           <div>
             <label>Status Antrian</label>
             <select name="status">
               <option value="Menunggu" ${q.status === 'Menunggu' ? 'selected' : ''}>Menunggu</option>
               <option value="Diperiksa" ${q.status === 'Diperiksa' ? 'selected' : ''}>Diperiksa</option>
               <option value="Selesai" ${q.status === 'Selesai' ? 'selected' : ''}>Selesai</option>
             </select>
           </div>
         </div>
         <label>Keluhan Pasien</label>
         <textarea name="complaint" rows="3">${escapeHTML(q.complaint || "")}</textarea>`,
        async form => {
          const data = Object.fromEntries(new FormData(form).entries());
          await api(`/api/queues/${q.id}`, {
            method: 'PUT',
            body: JSON.stringify({
              name: data.name.trim(),
              clinic: data.clinic,
              doctor: data.doctor,
              date: data.date,
              time: data.time,
              status: data.status,
              complaint: (data.complaint || "").trim()
            })
          });
          await refreshData();
          renderQueues();
          renderHome();
          toast("Data antrian berhasil diperbarui");
        }
      );
    })
  );

  $$("[data-delete-queue]").forEach(button =>
    button.addEventListener("click", async () => {
      if (!confirm("Hapus antrian ini?")) return;
      const id = Number(button.dataset.deleteQueue);
      try {
        await api(`/api/queues/${id}`, { method: 'DELETE' });
        await refreshData();
        renderQueues();
        renderHome();
        toast("Antrian berhasil dihapus");
      } catch (err) {
        toast(err.message);
      }
    })
  );
}

function renderPatientQueues() {
  if (!currentUser) return;
  const ownQueues = queues.filter(q => q.patientEmail && q.patientEmail.toLowerCase() === currentUser.email.toLowerCase());
  const filterVal = $("#patient-queue-filter") ? $("#patient-queue-filter").value : "Semua";
  const filtered = ownQueues.filter(q => filterVal === "Semua" || q.status === filterVal);
  $("#patient-welcome").textContent = `Halo, ${currentUser.name}!`;
  $("#patient-queue-body").innerHTML = filtered.length
    ? filtered
        .map(
          q => `
      <tr>
        <td><strong>${escapeHTML(q.number)}</strong></td>
        <td>${escapeHTML(q.clinic)}</td>
        <td>${escapeHTML(q.doctor)}</td>
        <td>${escapeHTML(q.time)} / ${escapeHTML(q.date)}</td>
        <td>${statusBadge(q.status)}</td>
        <td>
          <div class="action-group">
            <button type="button" class="row-action" onclick="viewQueueTicket(${q.id})">Lihat Tiket</button>
            ${q.status === "Menunggu" ? `<button class="row-action danger" onclick="cancelQueue(${q.id})">Batalkan</button>` : '<span class="muted">—</span>'}
          </div>
        </td>
      </tr>`
        )
        .join("")
    : '<tr><td colspan="6" class="empty-cell">Belum ada antrian dengan status ini. Tekan “Daftar Antrian Baru” untuk mendaftar.</td></tr>';
}

function filterPatientQueues(val) {
  renderPatientQueues();
}
window.filterPatientQueues = filterPatientQueues;

async function cancelQueue(id) {
  if (!confirm('Batalkan pendaftaran antrian ini?')) return;
  try {
    await api(`/api/queues/${id}`, { method: 'DELETE' });
    await refreshData();
    renderPatientQueues();
    renderPatientHome();
    renderQueues();
    renderHome();
    toast('Antrian berhasil dibatalkan');
  } catch (err) {
    toast(err.message);
  }
}
window.cancelQueue = cancelQueue;

function renderPatientHome() {
  if (!currentUser || currentUser.role === "admin") return;
  const patientDashboard = $("#patient-home-dashboard");
  if (!patientDashboard) return;

  const firstName = currentUser.name ? currentUser.name.split(" ")[0] : "Pengguna";
  if ($("#patient-home-name")) $("#patient-home-name").textContent = firstName;
  if ($("#patient-home-full-name")) $("#patient-home-full-name").textContent = currentUser.name || "Belum tersedia";
  if ($("#patient-home-npm")) $("#patient-home-npm").textContent = currentUser.nim || currentUser.npm || currentUser.phone || "-";
  if ($("#patient-home-study")) $("#patient-home-study").textContent = currentUser.prodi || currentUser.program_studi || formatProfileStatus(currentUser.status || "mahasiswa");

  const ownQueues = queues.filter(q => q.patientEmail && q.patientEmail.toLowerCase() === currentUser.email?.toLowerCase());
  if ($("#patient-home-queue-total")) $("#patient-home-queue-total").textContent = ownQueues.length;
  const q = ownQueues[0];
  if ($("#patient-home-queue")) {
    $("#patient-home-queue").innerHTML = q
      ? `<div class="patient-home-record"><strong>No. ${escapeHTML(q.number)}</strong><span>${escapeHTML(q.date || "—")}</span><span>${escapeHTML(q.clinic || "Layanan klinik")}</span>${statusBadge(q.status)}</div>`
      : '<p class="patient-home-empty">Belum ada riwayat antrean. Silakan ambil antrean untuk mendaftar kunjungan.</p>';
  }

  const today = new Date().toISOString().split("T")[0];
  const todayQueues = queues.filter(q => q.date === today && ["Menunggu", "Diperiksa"].includes(q.status));
  const waitingCount = todayQueues.filter(q => q.status === "Menunggu").length;
  const inProgressCount = todayQueues.filter(q => q.status === "Diperiksa").length;
  const nextQueue = todayQueues.find(q => q.status === "Menunggu");
  if ($("#patient-home-live-queue")) {
    $("#patient-home-live-queue").innerHTML = nextQueue
      ? `<div style="color:var(--primary);">Antrian Berikutnya: <strong>No. ${escapeHTML(nextQueue.number)}</strong> (${escapeHTML(nextQueue.clinic || "—")})</div>
         <div style="margin-top:8px; font-size:.9rem; color:var(--muted);">Menunggu: <strong>${waitingCount}</strong> | Sedang Diperiksa: <strong>${inProgressCount}</strong></div>`
      : '<p class="patient-home-empty">Tidak ada antrean aktif hari ini.</p>';
  }

  if ($("#patient-home-schedules")) {
    const activeSchedules = schedules.filter(s => s.is_active);
    $("#patient-home-schedules").innerHTML = activeSchedules.length
      ? activeSchedules.slice(0, 4).map(s => `
          <article class="patient-home-schedule">
            <span class="patient-home-icon">♡</span>
            <div><strong>${escapeHTML(s.doctor_name)}</strong><small>${escapeHTML(s.clinic)}</small></div>
            <div><strong>${escapeHTML(s.day)}</strong><small>${escapeHTML(s.start_time)} – ${escapeHTML(s.end_time)} WIB</small></div>
          </article>
        `).join("")
      : '<p class="patient-home-empty">Jadwal dokter belum tersedia.</p>';
  }
}

function renderSchedules() {
  const isAdmin = currentUser?.role === "admin";
  const addBtn = $("#add-schedule-btn");
  const adminTable = $("#jadwal-admin-table");
  const patientGrid = $("#jadwal-patient-grid");

  if (addBtn) addBtn.classList.toggle("hidden", !isAdmin);
  if (adminTable) adminTable.classList.toggle("hidden", !isAdmin);
  if (patientGrid) patientGrid.classList.toggle("hidden", isAdmin);

  if (isAdmin) {
    if ($("#jadwal-subtitle")) $("#jadwal-subtitle").textContent = "Lihat dan kelola jadwal praktek dokter klinik.";
    if ($("#jadwal-list-desc")) $("#jadwal-list-desc").textContent = "Admin dapat menambah, mengedit, atau menghapus jadwal dokter.";
    if ($("#admin-jadwal-body")) {
      $("#admin-jadwal-body").innerHTML = schedules.length
        ? schedules.map(s => `
          <tr>
            <td><strong>${escapeHTML(s.doctor_name)}</strong></td>
            <td>${escapeHTML(s.clinic)}</td>
            <td>${escapeHTML(s.day)}</td>
            <td>${escapeHTML(s.start_time)} - ${escapeHTML(s.end_time)}</td>
            <td>${s.is_active ? '<span class="status done">Aktif</span>' : '<span class="status waiting">Nonaktif</span>'}</td>
            <td>
              <div class="action-group">
                <button class="row-action" data-edit-schedule="${s.id}">Edit</button>
                <button class="row-action danger" data-delete-schedule="${s.id}">Hapus</button>
              </div>
            </td>
          </tr>
        `).join("")
        : '<tr><td colspan="6" class="empty-cell">Belum ada data jadwal dokter.</td></tr>';

      $$("[data-edit-schedule]").forEach(btn => {
        btn.addEventListener("click", () => {
          const s = schedules.find(item => item.id === Number(btn.dataset.editSchedule));
          if (!s) return;
          openModal(
            "Edit Jadwal Dokter",
            `<label>Nama Dokter</label>
             <input name="doctor_name" value="${escapeHTML(s.doctor_name)}" required />
             <label>Poli</label>
             <input name="clinic" value="${escapeHTML(s.clinic)}" required />
             <div class="form-row">
               <div>
                 <label>Hari</label>
                 <select name="day">
                   ${['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu'].map(d => `<option ${s.day === d ? 'selected' : ''}>${d}</option>`).join("")}
                 </select>
               </div>
               <div>
                 <label>Status</label>
                 <select name="is_active">
                   <option value="1" ${s.is_active ? 'selected' : ''}>Aktif</option>
                   <option value="0" ${!s.is_active ? 'selected' : ''}>Nonaktif</option>
                 </select>
               </div>
             </div>
             <div class="form-row">
               <div>
                 <label>Jam Mulai</label>
                 <input name="start_time" type="time" value="${escapeHTML(s.start_time)}" required />
               </div>
               <div>
                 <label>Jam Selesai</label>
                 <input name="end_time" type="time" value="${escapeHTML(s.end_time)}" required />
               </div>
             </div>`,
            async form => {
              const data = Object.fromEntries(new FormData(form).entries());
              await api(`/api/doctor-schedules/${s.id}`, {
                method: 'PUT',
                body: JSON.stringify({
                  doctor_name: data.doctor_name.trim(),
                  clinic: data.clinic.trim(),
                  day: data.day,
                  start_time: data.start_time,
                  end_time: data.end_time,
                  is_active: Number(data.is_active)
                })
              });
              await refreshData();
              renderSchedules();
              toast("Jadwal dokter berhasil diperbarui");
            }
          );
        });
      });

      $$("[data-delete-schedule]").forEach(btn => {
        btn.addEventListener("click", async () => {
          if (!confirm("Hapus jadwal ini?")) return;
          const id = Number(btn.dataset.deleteSchedule);
          try {
            await api(`/api/doctor-schedules/${id}`, { method: 'DELETE' });
            await refreshData();
            renderSchedules();
            toast("Jadwal dokter dihapus");
          } catch (err) {
            toast(err.message);
          }
        });
      });
    }
  } else {
    if ($("#jadwal-subtitle")) $("#jadwal-subtitle").textContent = "Daftar jadwal praktek dokter yang tersedia di Klinik Polinela.";
    if ($("#jadwal-list-desc")) $("#jadwal-list-desc").textContent = "Silakan datang sesuai hari dan jam praktek dokter.";
    if (patientGrid) {
      const activeSchedules = schedules.filter(s => s.is_active);
      patientGrid.innerHTML = activeSchedules.length
        ? activeSchedules.map(s => `
          <div class="patient-home-schedule" style="background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:16px;">
            <div class="patient-avatar" style="width:42px;height:42px;font-size:13px;border-radius:10px;">DR</div>
            <div style="flex:1; margin-left:12px;">
              <strong style="font-size:15px; color:#17365d;">${escapeHTML(s.doctor_name)}</strong>
              <div class="muted" style="font-size:12px; margin-top:2px;">${escapeHTML(s.clinic)}</div>
              <div style="margin-top:8px; display:flex; gap:12px; font-size:12px;">
                <span>📅 <strong>${escapeHTML(s.day)}</strong></span>
                <span>⏰ <strong>${escapeHTML(s.start_time)} – ${escapeHTML(s.end_time)} WIB</strong></span>
              </div>
            </div>
            <span class="status done" style="align-self:flex-start;">Aktif</span>
          </div>
        `).join("")
        : '<p class="muted" style="padding:1.5rem;text-align:center">Tidak ada jadwal dokter aktif saat ini.</p>';
    }
  }
}

$("#add-schedule-btn").addEventListener("click", () => {
  if (currentUser?.role !== "admin") return;
  openModal(
    "Tambah Jadwal Dokter",
    `<label>Nama Dokter</label>
     <input name="doctor_name" placeholder="Contoh: dr. Dian" required />
     <label>Poli</label>
     <input name="clinic" value="Poli Umum" required />
     <div class="form-row">
       <div>
         <label>Hari</label>
         <select name="day">
           <option>Senin</option>
           <option>Selasa</option>
           <option>Rabu</option>
           <option>Kamis</option>
           <option>Jumat</option>
           <option>Sabtu</option>
           <option>Minggu</option>
         </select>
       </div>
       <div>
         <label>Status</label>
         <select name="is_active">
           <option value="1">Aktif</option>
           <option value="0">Nonaktif</option>
         </select>
       </div>
     </div>
     <div class="form-row">
       <div>
         <label>Jam Mulai</label>
         <input name="start_time" type="time" value="08:00" required />
       </div>
       <div>
         <label>Jam Selesai</label>
         <input name="end_time" type="time" value="14:00" required />
       </div>
     </div>`,
    async form => {
      const data = Object.fromEntries(new FormData(form).entries());
      await api('/api/doctor-schedules', {
        method: 'POST',
        body: JSON.stringify({
          doctor_name: data.doctor_name.trim(),
          clinic: data.clinic.trim(),
          day: data.day,
          start_time: data.start_time,
          end_time: data.end_time,
          is_active: Number(data.is_active)
        })
      });
      await refreshData();
      renderSchedules();
      toast("Jadwal dokter berhasil ditambahkan");
    }
  );
});

function renderInfoObat() {
  const searchEl = $("#info-obat-search");
  if (!searchEl) return;
  const term = searchEl.value.toLowerCase();
  const filtered = medicines.filter(m => `${m.name} ${m.category} ${m.form} ${m.description || ""}`.toLowerCase().includes(term));
  $("#info-obat-list").innerHTML = filtered.length
    ? filtered
        .map(
          m => `
      <div class="info-obat-card" onclick="openMedicineDetail(${m.id})">
        ${m.image ? `<div class="info-obat-img"><img src="${m.image}" alt="${escapeHTML(m.name)}" /></div>` : ""}
        <div class="info-obat-header">
          ${medicineImg(m)}
          <div><strong>${escapeHTML(m.name)}</strong><small>${escapeHTML(m.category)} · ${escapeHTML(m.form)}</small></div>
          <span class="stock">${Number(m.stock) < 20 ? '<span class="status waiting">Stok rendah</span>' : '<span class="status done">Tersedia</span>'}</span>
        </div>
        <p class="info-obat-desc">${escapeHTML(m.description || "Deskripsi belum tersedia.")}</p>
      </div>`
        )
        .join("")
    : '<p class="muted" style="padding:1.5rem;text-align:center">Obat tidak ditemukan.</p>';
}

function updateCartCount() {
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  $$('.cart-count').forEach(el => el.textContent = count);
  if ($('#cart-count')) $('#cart-count').textContent = count;
}

function addToCart(id, quantity = 1) {
  const medicine = medicines.find(item => Number(item.id) === Number(id));
  quantity = Number(quantity);
  if (!medicine || Number(medicine.stock) < 1) return toast('Obat sedang tidak tersedia');
  if (!Number.isInteger(quantity) || quantity < 1) return toast('Jumlah tidak valid');
  const item = cart.find(entry => Number(entry.id) === Number(id));
  if (item) {
    if (item.quantity + quantity > Number(medicine.stock)) return toast('Jumlah melebihi stok obat');
    item.quantity += quantity;
  } else {
    if (quantity > Number(medicine.stock)) return toast('Jumlah melebihi stok obat');
    cart.push({ id: Number(id), quantity });
  }
  updateCartCount();
  toast(`${medicine.name} ditambahkan ke keranjang`);
}

function openCart() {
  const rows = cart.map(item => {
    const medicine = medicines.find(m => Number(m.id) === Number(item.id));
    return medicine ? `<div class="cart-row"><strong>${escapeHTML(medicine.name)}</strong><span>${item.quantity} unit</span><button type="button" class="row-action danger" onclick="removeFromCart(${item.id})">Hapus</button></div>` : '';
  }).join('') || '<p class="muted">Keranjang masih kosong.</p>';
  const confirmBtn = cart.length
    ? `<div class="cart-confirm-wrap" style="margin-top:12px;"><button type="button" id="confirm-cart-btn" class="btn primary full" onclick="confirmCart()">✓ Konfirmasi &amp; Ambil Obat</button></div>`
    : '';
  openModal('Keranjang Obat', `<div class="cart-list">${rows}</div>${confirmBtn}`, () => {}, { actions: false });
}

function removeFromCart(id) {
  cart = cart.filter(item => Number(item.id) !== Number(id));
  updateCartCount();
  openCart();
}

async function confirmCart() {
  if (!cart.length) return toast('Keranjang kosong');
  const btn = $('#confirm-cart-btn');
  if (btn) {
    if (btn.disabled) return;
    btn.disabled = true;
    btn.textContent = 'Memproses...';
  }
  const now = new Date();
  const kode = 'RX-' + now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0') + '-' + String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0') + String(now.getSeconds()).padStart(2, '0');
  const nama = currentUser ? currentUser.name : 'Pasien';
  const tanggal = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
  const jam = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const items = cart.map(item => {
    const m = medicines.find(x => Number(x.id) === Number(item.id));
    return m ? { id: m.id, name: m.name, qty: item.quantity } : null;
  }).filter(Boolean);

  if (!items.length) {
    if (btn) { btn.disabled = false; btn.textContent = '✓ Konfirmasi & Ambil Obat'; }
    return toast('Keranjang tidak valid atau obat tidak ditemukan');
  }

  const tableRows = items.map((it, i) =>
    `<tr><td>${i + 1}</td><td>${escapeHTML(it.name)}</td><td class="center">${it.qty}</td></tr>`
  ).join('');

  try {
    await api('/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        id: kode,
        userId: currentUser ? Number(currentUser.id) || 0 : 0,
        name: nama,
        items,
        status: 'Menunggu Pengambilan',
        date: now.toISOString()
      })
    });

    cart = [];
    updateCartCount();
    await refreshData();
    await loadOrders();
    renderPatientHome();
    renderMedicines();
    renderHome();

    const struk = `
    <div class="struk" id="struk-content" data-filename="struk-${kode}">
      <div class="struk-header">
        <strong>KLINIK POLINELA</strong>
        <small>Struk Pengambilan Obat</small>
      </div>
      <div class="struk-meta">
        <div><small>No. Resep</small><strong>${kode}</strong></div>
        <div><small>Pasien</small><strong>${escapeHTML(nama)}</strong></div>
        <div><small>Tanggal</small><strong>${tanggal}, ${jam}</strong></div>
      </div>
      <table class="struk-table">
        <thead><tr><th>No</th><th>Nama Obat</th><th class="center">Jumlah</th></tr></thead>
        <tbody>${tableRows}</tbody>
      </table>
      <div class="struk-footer">
        <p>Tunjukkan struk ini di loket farmasi klinik untuk pengambilan obat.</p>
        <small class="muted">Berlaku pada hari yang sama.</small>
      </div>
      <div style="margin-top:12px;"><button type="button" class="btn primary full" onclick="printStruk()">🖨 Cetak Struk</button></div>
    </div>`;
    openModal('Struk Pengambilan Obat', struk, () => {}, { actions: false });
    toast('Pesanan dikonfirmasi! Silakan ambil obat di klinik.');
  } catch (err) {
    if (btn) { btn.disabled = false; btn.textContent = '✓ Konfirmasi & Ambil Obat'; }
    toast(err.message || 'Gagal membuat pesanan');
  }
}

function printStruk() {
  const content = document.getElementById('struk-content');
  if (!content) return;
  const filename = content.dataset.filename || 'struk-pengambilan-obat';

  if (window.html2pdf) {
    const clone = content.cloneNode(true);
    clone.querySelectorAll('button').forEach(b => b.remove());
    html2pdf().set({
      margin: 10,
      filename: `${filename}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a6', orientation: 'portrait' }
    }).from(clone).save();
    toast('Mengunduh struk PDF...');
    return;
  }

  const w = window.open('', '_blank', 'width=400,height=600');
  if (w) {
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Struk Pengambilan Obat</title><style>
      body{font-family:sans-serif;padding:20px;max-width:350px;margin:auto;color:#1e293b}
      .struk-header{text-align:center;margin-bottom:12px;border-bottom:2px dashed #94a3b8;padding-bottom:10px}
      .struk-header strong{display:block;font-size:16px}
      .struk-header small{color:#64748b}
      .struk-meta{margin-bottom:12px;font-size:13px;display:flex;flex-direction:column;gap:4px}
      .struk-meta div{display:flex;justify-content:space-between}
      .struk-meta small{color:#64748b}
      table{width:100%;border-collapse:collapse;font-size:13px;margin-bottom:12px}
      th,td{text-align:left;padding:6px 4px;border-bottom:1px solid #e2e8f0}
      .center{text-align:center}
      .struk-footer{text-align:center;border-top:2px dashed #94a3b8;padding-top:10px;font-size:12px;color:#64748b}
      @media print{button{display:none}}
    </style></head><body>${content.innerHTML}</body></html>`);
    w.document.close();
    w.print();
  } else {
    window.print();
  }
}

async function loadOrders() {
  try {
    orders = await api('/api/orders');
  } catch (_) {
    const data = readStore();
    orders = data.orders || [];
  }
}

async function renderOrderHistory() {
  const container = $('#order-history-list');
  if (!container) return;
  await loadOrders();
  const userId = currentUser ? Number(currentUser.id) || 0 : 0;
  const userOrders = orders.filter(o => (Number(o.userId) || 0) === userId).sort((a, b) => new Date(b.date) - new Date(a.date));
  if (!userOrders.length) {
    container.innerHTML = '<p class="muted" style="padding:1.5rem;text-align:center">Belum ada pesanan obat.</p>';
    return;
  }
  container.innerHTML = `<table class="order-table"><thead><tr><th>No. Resep</th><th>Tanggal</th><th>Obat</th><th>Status</th><th>Aksi</th></tr></thead><tbody>${userOrders.map(o => {
    const d = new Date(o.date);
    const tgl = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    const jam = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const items = Array.isArray(o.items) ? o.items : JSON.parse(o.items || '[]');
    const obatList = items.map(it => `${it.name} (${it.qty})`).join(', ');
    const statusClass = o.status === 'Selesai' ? 'done' : o.status === 'Dibatalkan' ? 'danger' : 'waiting';
    return `<tr>
      <td><strong>${escapeHTML(o.id)}</strong></td>
      <td>${tgl}, ${jam}</td>
      <td>${escapeHTML(obatList)}</td>
      <td><span class="status ${statusClass}">${escapeHTML(o.status)}</span></td>
      <td class="order-actions">
        <button type="button" class="row-action" onclick="viewOrderStruk('${escapeHTML(o.id)}')">Lihat Struk</button>
        ${o.status === 'Menunggu Pengambilan' ? `<button type="button" class="row-action danger" onclick="cancelOrder('${escapeHTML(o.id)}')">Batalkan</button>` : ''}
      </td>
    </tr>`;
  }).join('')}</tbody></table>`;
}

function viewOrderStruk(orderId) {
  const o = orders.find(x => x.id === orderId);
  if (!o) return;
  const d = new Date(o.date);
  const tanggal = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
  const jam = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const items = Array.isArray(o.items) ? o.items : JSON.parse(o.items || '[]');
  const tableRows = items.map((it, i) =>
    `<tr><td>${i + 1}</td><td>${escapeHTML(it.name)}</td><td class="center">${it.qty}</td></tr>`
  ).join('');
  const statusClass = o.status === 'Selesai' ? 'done' : o.status === 'Dibatalkan' ? 'danger' : 'waiting';
  const struk = `
    <div class="struk" id="struk-content" data-filename="struk-${o.id}">
      <div class="struk-header">
        <strong>KLINIK POLINELA</strong>
        <small>Struk Pengambilan Obat</small>
      </div>
      <div class="struk-meta">
        <div><small>No. Resep</small><strong>${escapeHTML(o.id)}</strong></div>
        <div><small>Pasien</small><strong>${escapeHTML(o.name)}</strong></div>
        <div><small>Tanggal</small><strong>${tanggal}, ${jam}</strong></div>
        <div><small>Status</small><span class="status ${statusClass}">${escapeHTML(o.status)}</span></div>
      </div>
      <table class="struk-table">
        <thead><tr><th>No</th><th>Nama Obat</th><th class="center">Jumlah</th></tr></thead>
        <tbody>${tableRows}</tbody>
      </table>
      <div class="struk-footer">
        <p>Tunjukkan struk ini di loket farmasi klinik untuk pengambilan obat.</p>
        <small class="muted">Berlaku pada hari yang sama.</small>
      </div>
      <div style="margin-top:12px;"><button type="button" class="btn primary full" onclick="printStruk()">🖨 Cetak Struk</button></div>
    </div>`;
  openModal('Struk Pengambilan Obat', struk, () => {}, { actions: false });
}

async function cancelOrder(orderId) {
  if (!confirm('Batalkan pesanan obat ini?')) return;
  try {
    await api(`/api/orders/${orderId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'Dibatalkan' })
    });
    await refreshData();
    await loadOrders();
    renderPatientHome();
    renderMedicines();
    renderHome();
    toast('Pesanan berhasil dibatalkan');
  } catch (err) {
    toast(err.message || 'Gagal membatalkan pesanan');
  }
}

async function renderAdminOrders() {
  const tbody = $('#admin-order-table-body');
  if (!tbody) return;
  await loadOrders();
  const term = ($('#order-search') ? $('#order-search').value : '').toLowerCase();
  const filtered = orders.filter(o => `${o.id} ${o.name}`.toLowerCase().includes(term))
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-cell">Belum ada pesanan obat dari pasien.</td></tr>';
    return;
  }
  tbody.innerHTML = filtered.map(o => {
    const d = new Date(o.date);
    const tgl = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    const jam = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const items = Array.isArray(o.items) ? o.items : JSON.parse(o.items || '[]');
    const obatList = items.map(it => `${it.name} (${it.qty})`).join(', ');
    const statusClass = o.status === 'Selesai' ? 'done' : o.status === 'Dibatalkan' ? 'danger' : 'waiting';
    const actions = o.status === 'Menunggu Pengambilan'
      ? `<button type="button" class="row-action" onclick="adminCompleteOrder('${escapeHTML(o.id)}')">Selesai</button>
         <button type="button" class="row-action danger" onclick="adminCancelOrder('${escapeHTML(o.id)}')">Tolak</button>`
      : '';
    return `<tr>
      <td><strong>${escapeHTML(o.id)}</strong></td>
      <td>${escapeHTML(o.name)}</td>
      <td>${tgl}, ${jam}</td>
      <td>${escapeHTML(obatList)}</td>
      <td><span class="status ${statusClass}">${escapeHTML(o.status)}</span></td>
      <td class="order-actions">${actions}</td>
    </tr>`;
  }).join('');
}

async function adminCompleteOrder(orderId) {
  try {
    await api(`/api/orders/${orderId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'Selesai' })
    });
    await loadOrders();
    renderAdminOrders();
    toast('Pesanan ditandai selesai');
  } catch (err) {
    toast(err.message || 'Gagal menyelesaikan pesanan');
  }
}

async function adminCancelOrder(orderId) {
  if (!confirm('Tolak pesanan obat ini?')) return;
  try {
    await api(`/api/orders/${orderId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'Dibatalkan' })
    });
    await refreshData();
    await loadOrders();
    renderAdminOrders();
    renderInfoObat();
    renderMedicines();
    renderHome();
    toast('Pesanan ditolak');
  } catch (err) {
    toast(err.message || 'Gagal menolak pesanan');
  }
}

window.adminCompleteOrder = adminCompleteOrder;
window.adminCancelOrder = adminCancelOrder;

function openMedicineDetail(id) {
  const m = medicines.find(x => Number(x.id) === Number(id));
  if (!m) return;
  openModal(
    `Detail ${escapeHTML(m.name)}`,
    `<div class="medicine-detail">
      ${m.image ? `<div class="info-obat-img"><img src="${m.image}" alt="${escapeHTML(m.name)}" /></div>` : ""}
      <div><strong>Nama:</strong> ${escapeHTML(m.name)}</div>
      <div><strong>Kategori:</strong> ${escapeHTML(m.category)} · <strong>Bentuk:</strong> ${escapeHTML(m.form)}</div>
      <div><strong>Stok:</strong> ${Number(m.stock)} unit</div>
      <div><strong>Kegunaan:</strong> ${escapeHTML(m.description || "-")}</div>
      <div><strong>Dosis:</strong> ${escapeHTML(m.dosage || "-")}</div>
      <div><strong>Efek Samping:</strong> ${escapeHTML(m.sideEffects || "-")}</div>
      <div class="cart-detail-actions" style="display:flex;gap:8px;align-items:center;margin-top:12px;">
        <label for="detail-cart-quantity">Jumlah</label>
        <input id="detail-cart-quantity" type="number" min="1" max="${Math.max(1, Number(m.stock))}" value="1" ${Number(m.stock) < 1 ? "disabled" : ""} style="width:70px;" />
        <button type="button" class="btn primary" onclick="addToCart(${m.id}, Number(document.getElementById('detail-cart-quantity').value)); closeModal();" ${Number(m.stock) < 1 ? "disabled" : ""}>＋ Tambah ke Keranjang</button>
      </div>
    </div>`,
    () => {},
    { actions: false }
  );
}

window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.openCart = openCart;
window.confirmCart = confirmCart;
window.printStruk = printStruk;
window.viewOrderStruk = viewOrderStruk;
window.cancelOrder = cancelOrder;
window.openMedicineDetail = openMedicineDetail;
window.closeModal = closeModal;

function readFileAsDataURL(file) {
  return new Promise(resolve => {
    if (!file) {
      resolve("");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}

function medicineImg(m) {
  return m.image ? `<img src="${m.image}" class="medicine-thumb" alt="${escapeHTML(m.name)}" />` : '<div class="medicine-symbol">✚</div>';
}

function initImageUpload() {
  const area = $("#medicine-upload-area");
  if (!area) return;
  const input = area.querySelector('input[type="file"]');
  const preview = $("#medicine-image-preview");

  function showPreview(file) {
    if (!file || !file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    preview.querySelector("img").src = url;
    preview.classList.remove("hidden");
    area.querySelector("span").textContent = "Klik untuk ganti gambar";
  }

  input.addEventListener("change", () => {
    if (input.files[0]) showPreview(input.files[0]);
  });
  area.addEventListener("dragover", e => {
    e.preventDefault();
    area.classList.add("drag-over");
  });
  area.addEventListener("dragleave", () => area.classList.remove("drag-over"));
  area.addEventListener("drop", e => {
    e.preventDefault();
    area.classList.remove("drag-over");
    if (e.dataTransfer.files[0]) {
      input.files = e.dataTransfer.files;
      showPreview(e.dataTransfer.files[0]);
    }
  });
  if (preview) {
    preview.querySelector(".remove-preview")?.addEventListener("click", () => {
      preview.classList.add("hidden");
      preview.querySelector("img").src = "";
      input.value = "";
      area.querySelector("span").textContent = "Klik atau seret gambar ke sini";
      const keepOld = $('input[name="keepOldImage"]');
      if (keepOld) keepOld.value = "";
    });
  }
}

function openModal(title, fields, onSave, { actions = true } = {}) {
  $("#modal-title").textContent = title;
  $("#modal-form").innerHTML =
    fields + (actions ? '<div class="modal-actions"><button type="button" class="btn outline" id="cancel-modal">Batal</button><button type="submit" class="btn primary">Simpan</button></div>' : '');
  $("#modal-backdrop").classList.remove("hidden");
  if (actions) $("#cancel-modal").addEventListener("click", closeModal);
  $("#modal-form").onsubmit = async event => {
    event.preventDefault();
    if (!actions) return;
    try {
      await onSave(event.currentTarget);
      closeModal();
    } catch (err) {
      console.error("Gagal menyimpan form:", err);
      toast(err.message || "Gagal menyimpan data");
    }
  };
}

function closeModal() {
  $("#modal-backdrop").classList.add("hidden");
}

$("#modal-close").addEventListener("click", closeModal);
$("#modal-backdrop").addEventListener("click", event => {
  if (event.target.id === "modal-backdrop") closeModal();
});

$("#add-medicine-btn").addEventListener("click", () => {
  if (currentUser?.role !== "admin") return;
  openModal(
    "Tambah Obat",
    `<label>Gambar obat</label>
    <div class="image-upload-area" id="medicine-upload-area">
      <span>Klik atau seret gambar ke sini</span>
      <input name="image" type="file" accept="image/*" class="file-input" />
    </div>
    <div id="medicine-image-preview" class="image-preview hidden">
      <img /><button type="button" class="remove-preview">×</button>
    </div>
    <label>Nama obat</label>
    <input name="name" placeholder="Contoh: Ibuprofen 200 mg" required />
    <div class="form-row">
      <div>
        <label>Kategori</label>
        <input name="category" placeholder="Kategori obat" required />
      </div>
      <div>
        <label>Bentuk</label>
        <select name="form">
          <option>Tablet</option>
          <option>Kapsul</option>
          <option>Sirup</option>
          <option>Serbuk</option>
          <option>Salep</option>
          <option>Cairan</option>
        </select>
      </div>
    </div>
    <label>Jumlah stok (unit)</label>
    <input name="stock" type="number" min="0" placeholder="0" required />
    <label>Deskripsi / Kegunaan</label>
    <textarea name="description" rows="3" placeholder="Jelaskan kegunaan dan indikasi obat..."></textarea>
    <label>Dosis</label>
    <textarea name="dosage" rows="3" placeholder="Contoh: Dewasa: 1 tablet 3 kali sehari setelah makan"></textarea>
    <label>Efek Samping</label>
    <textarea name="sideEffects" rows="3" placeholder="Contoh: Kantuk, mual, pusing..."></textarea>`,
    async form => {
      const data = Object.fromEntries(new FormData(form).entries());
      const file = form.querySelector('input[name="image"]').files[0];
      const image = await readFileAsDataURL(file);
      await api('/api/medicines', {
        method: 'POST',
        body: JSON.stringify({
          name: data.name.trim(),
          category: data.category.trim(),
          form: data.form,
          stock: Number(data.stock),
          description: (data.description || "").trim(),
          dosage: (data.dosage || "").trim(),
          sideEffects: (data.sideEffects || "").trim(),
          image
        })
      });
      await refreshData();
      renderMedicines();
      renderHome();
      toast("Data obat berhasil ditambahkan");
    }
  );
  initImageUpload();
});

function createQueueForm(patientMode) {
  const defaultNim = currentUser && currentUser.role === 'patient' ? (currentUser.nim || '21573010') : '';
  const defaultProdi = currentUser && currentUser.role === 'patient' ? (currentUser.prodi || 'D3 Manajemen Informatika') : '';

  const patientFields = patientMode
    ? `<div class="form-row">
         <div>
           <label>Nama lengkap</label>
           <input value="${escapeHTML(currentUser.name)}" disabled />
           <input type="hidden" name="name" value="${escapeHTML(currentUser.name)}" />
         </div>
         <div>
           <label>NIM / Identitas</label>
           <input name="nim" value="${escapeHTML(defaultNim)}" placeholder="Nomor Induk Mahasiswa" required />
         </div>
       </div>
       <div class="form-row">
         <div>
           <label>Program Studi</label>
           <input name="prodi" value="${escapeHTML(defaultProdi)}" placeholder="Contoh: D3 Manajemen Informatika" required />
         </div>
         <div>
           <label>Layanan / Poli</label>
           <select name="clinic" id="queue-clinic-select" onchange="updateDoctorsList(this.value)">
             <option value="Poli Umum">Poli Umum</option>
             <option value="Konsultasi Psikologi">Konsultasi Psikologi</option>
           </select>
         </div>
       </div>
       <div class="form-row">
         <div>
           <label>Dokter / Tenaga Medis</label>
           <select name="doctor" id="queue-doctor-select">
             <option>dr. Dian</option>
             <option>dr. Tya</option>
           </select>
         </div>
         <div>
           <label>Tanggal Kunjungan</label>
           <input name="visitDate" type="date" value="${localDateKey(new Date())}" min="${localDateKey(new Date())}" required />
         </div>
       </div>
       <label>Keluhan singkat (opsional)</label>
       <textarea name="complaint" rows="3" placeholder="Contoh: demam, sakit kepala, batuk..."></textarea>`
    : `<label>Nama pasien</label><input name="name" placeholder="Nama lengkap pasien" required />
       <label>Tanggal kunjungan</label><input name="visitDate" type="date" value="${localDateKey(new Date())}" max="${localDateKey(new Date())}" required />
       <label>Keluhan</label><textarea name="complaint" rows="3" placeholder="Contoh: demam, sakit kepala, batuk..." required></textarea>
       <div class="form-row">
         <div>
           <label>Poli</label>
           <select name="clinic"><option>Poli Umum</option><option>Konsultasi Psikologi</option></select>
         </div>
         <div>
           <label>Dokter</label>
           <select name="doctor"><option>dr. Dian</option><option>dr. Tya</option></select>
         </div>
       </div>`;

  openModal(
    patientMode ? "Pilih Layanan & Jadwal Antrean" : "Tambah Pasien / Antrian",
    patientFields,
    async form => {
      const data = Object.fromEntries(new FormData(form).entries());
      const now = new Date();
      const visitDate = data.visitDate || localDateKey(now);
      
      const dailyQueues = queues.filter(q => q.date === visitDate);
      const maxNumber = dailyQueues.reduce((max, q) => Math.max(max, Number(String(q.number).split("-")[1]) || 0), 0) + 1;
      const patientName = (patientMode ? currentUser.name : (data.name || "")).trim();
      const nimVal = data.nim || defaultNim;
      const prodiVal = data.prodi || defaultProdi;
      const clinicVal = data.clinic || "Poli Umum";
      const doctorVal = data.doctor || "dr. Dian";

      if (patientMode && currentUser?.email) {
        const alreadyQueued = queues.some(
          q => q.patientEmail?.toLowerCase() === currentUser.email.toLowerCase() && q.date === visitDate
        );
        if (alreadyQueued) {
          toast("Anda sudah mendaftar antrean hari ini.", "error");
          return;
        }
      }

      const newQ = {
        number: `A-${String(maxNumber).padStart(3, "0")}`,
        name: patientName,
        nim: nimVal,
        prodi: prodiVal,
        doctor: doctorVal,
        clinic: clinicVal,
        time: now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        date: visitDate,
        createdAt: now.toISOString(),
        status: "Menunggu",
        patientEmail: patientMode ? currentUser.email : "",
        complaint: (data.complaint || "").trim()
      };

      const res = await api('/api/queues', {
        method: 'POST',
        body: JSON.stringify(newQ)
      });

      selectedDashboardDate = visitDate;
      if ($("#dashboard-date")) $("#dashboard-date").value = selectedDashboardDate;
      await refreshData();
      renderQueues();
      renderHome();
      if (patientMode) {
        renderPatientHome();
        renderPatientQueues();
      }

      // Trigger success ticket modal
      showSuccessTicketModal(res && res.id ? res.id : newQ);
      toast("Antrian berhasil didaftarkan!");
    }
  );
}

function updateDoctorsList(clinic) {
  const docSelect = document.getElementById('queue-doctor-select');
  if (!docSelect) return;
  if (clinic === 'Konsultasi Psikologi') {
    docSelect.innerHTML = `<option>Psikolog Rini, M.Psi.</option><option>dr. Tya</option>`;
  } else {
    docSelect.innerHTML = `<option>dr. Dian</option><option>dr. Tya</option>`;
  }
}
window.updateDoctorsList = updateDoctorsList;

function showSuccessTicketModal(qData) {
  const item = typeof qData === 'object' ? qData : queues.find(x => Number(x.id) === Number(qData)) || queues[queues.length - 1];
  if (!item) return;

  const ticketHTML = `
    <div class="struk" id="ticket-content" data-filename="bukti-antrean-${item.number}">
      <div class="struk-header">
        <img src="assets/logo_klinik-removebg-preview.png" alt="Logo Klinik Polinela" style="width:48px; height:48px; object-fit:contain; margin-bottom:6px;" />
        <strong>KLINIK POLINELA</strong>
        <small>Bukti Pendaftaran Antrean Digital</small>
      </div>
      <div style="text-align:center; padding:12px 0; background:#f0fdfa; border-radius:10px; margin:12px 0;">
        <small style="color:var(--muted); display:block; margin-bottom:4px;">NOMOR ANTREAN ANDA</small>
        <strong style="font-size:32px; color:var(--teal); letter-spacing:1px;">${escapeHTML(item.number)}</strong>
        <div style="margin-top:6px;"><span class="status done">Terkonfirmasi</span></div>
      </div>
      <div class="struk-meta" style="font-size:12px;">
        <div><small>Nama Lengkap</small><strong>${escapeHTML(item.name)}</strong></div>
        <div><small>NIM</small><strong>${escapeHTML(item.nim || '21573010')}</strong></div>
        <div><small>Program Studi</small><strong>${escapeHTML(item.prodi || 'D3 Manajemen Informatika')}</strong></div>
        <div><small>Layanan / Poli</small><strong>${escapeHTML(item.clinic)}</strong></div>
        <div><small>Dokter / Tenaga Medis</small><strong>${escapeHTML(item.doctor)}</strong></div>
        <div><small>Tanggal Kunjungan</small><strong>${escapeHTML(item.date)}</strong></div>
        <div><small>Jam / Waktu</small><strong>${escapeHTML(item.time)} WIB</strong></div>
        <div><small>Lokasi</small><strong>Klinik Polinela, Rajabasa, Bandar Lampung</strong></div>
      </div>
      <div class="struk-footer">
        <p>Harap hadir tepat waktu sesuai jadwal kunjungan klinik.</p>
        <small class="muted">Politeknik Negeri Lampung</small>
      </div>
      <div style="display:flex; gap:8px; margin-top:12px;">
        <button type="button" class="btn primary full" onclick="printTicketPDF()">🖨 Unduh Bukti Antrean</button>
        <button type="button" class="btn outline full" onclick="closeModal()">Selesai</button>
      </div>
    </div>
  `;
  openModal("Antrean Berhasil Didaftarkan!", ticketHTML, () => {}, { actions: false });
}
window.showSuccessTicketModal = showSuccessTicketModal;

function viewQueueTicket(id) {
  showSuccessTicketModal(id);
}
window.viewQueueTicket = viewQueueTicket;

function printTicketPDF() {
  const content = document.getElementById('ticket-content');
  if (!content) return;
  const filename = content.dataset.filename || 'bukti-antrean';
  if (window.html2pdf) {
    const clone = content.cloneNode(true);
    clone.querySelectorAll('button').forEach(b => b.remove());
    html2pdf().set({
      margin: 10,
      filename: `${filename}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a5', orientation: 'portrait' }
    }).from(clone).save();
    toast('Mengunduh Bukti Antrean PDF...');
    return;
  }
  window.print();
}
window.printTicketPDF = printTicketPDF;

$("#add-queue-btn")?.addEventListener("click", () => {
  if (currentUser?.role === "admin") createQueueForm(false);
});
$("#patient-add-queue-btn")?.addEventListener("click", () => {
  if (currentUser && currentUser.role !== "admin") createQueueForm(true);
});
const startQueueFlowBtn = $("#patient-start-queue-flow");
if (startQueueFlowBtn) {
  startQueueFlowBtn.addEventListener("click", () => {
    if (!currentUser) return toast("Silakan masuk terlebih dahulu.");
    if (currentUser.role !== "admin") createQueueForm(true);
  });
}

const patientQueueFilter = $("#patient-queue-filter");
if (patientQueueFilter) {
  patientQueueFilter.addEventListener("change", () => renderPatientQueues());
}
$("#queue-search").addEventListener("input", renderQueues);
$("#queue-filter").addEventListener("change", renderQueues);

// =====================================
// EDIT DAN SIMPAN PROFIL
// =====================================

let selectedProfilePhoto = null;
let removeProfilePhoto = false;

// GANTI FOTO PROFIL
$("#profile-photo")?.addEventListener("change", async event => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
        toast("File harus berupa gambar!");
        event.target.value = "";
        return;
    }

    if (file.size > 2 * 1024 * 1024) {
        toast("Ukuran foto maksimal 2 MB!");
        event.target.value = "";
        return;
    }

    selectedProfilePhoto = await readFileAsDataURL(file);
    removeProfilePhoto = false;

    renderAvatar(
        $("#profile-avatar"),
        $("#profile-name").value,
        selectedProfilePhoto
    );
    if ($("#profile-photo-remove-btn")) $("#profile-photo-remove-btn").disabled = false;
});

// HAPUS FOTO PROFIL
$("#profile-photo-remove-btn")?.addEventListener("click", () => {
    selectedProfilePhoto = "";
    removeProfilePhoto = true;
    if ($("#profile-photo")) $("#profile-photo").value = "";
    renderAvatar(
        $("#profile-avatar"),
        $("#profile-name").value,
        ""
    );
    if ($("#profile-photo-remove-btn")) $("#profile-photo-remove-btn").disabled = true;
    toast("Foto profil dilepas. Klik Simpan Perubahan untuk menerapkan.");
});


// SIMPAN PROFIL
$("#profile-form").addEventListener("submit", async event => {
    event.preventDefault();

    if (!currentUser) return;
    const isAdmin = currentUser.role === "admin";

    const name = $("#profile-name").value.trim();
    const email = currentUser.email;
    const personalEmail = $("#profile-personal-email") ? $("#profile-personal-email").value.trim().toLowerCase() : "";
    const phone = $("#profile-phone").value.trim();
    const nim = $("#profile-nim") ? $("#profile-nim").value.trim() : "";
    const prodi = $("#profile-prodi") ? $("#profile-prodi").value.trim() : "";
    const age = isAdmin
        ? (currentUser.age || null)
        : ($("#profile-age").value ? Number($("#profile-age").value) : null);
    const status = isAdmin
        ? (currentUser.status || "administrator")
        : ($("#profile-status").value || "mahasiswa");
    const bio = $("#profile-bio").value.trim();

    const photo = removeProfilePhoto
        ? ""
        : (selectedProfilePhoto !== null ? selectedProfilePhoto : (currentUser.photo || ""));

    if (!name) {
        toast("Nama lengkap wajib diisi!");
        return;
    }

    try {
        const updatedUser = await api(
            `/api/users/${currentUser.id}`,
            {
                method: "PUT",
                body: JSON.stringify({
                    name,
                    email,
                    personal_email: personalEmail,
                    phone,
                    nim,
                    prodi,
                    age,
                    status,
                    bio,
                    photo
                })
            }
        );

        currentUser = {
            ...currentUser,
            ...updatedUser
        };

        selectedProfilePhoto = null;
        removeProfilePhoto = false;
        renderProfile();

        if (currentUser.role === "patient") {
            if ($("#patient-welcome")) $("#patient-welcome").textContent = `Halo, ${name}!`;
            renderPatientHome();
            renderPatientQueues();
        }

        toast(`Profil ${isAdmin ? "Admin" : "Pasien"} berhasil diperbarui!`);

    } catch (err) {
        toast(err.message);
    }
});

// TOMBOL BATAL
$("#profile-form").addEventListener("reset", event => {
    event.preventDefault();
    selectedProfilePhoto = null;
    removeProfilePhoto = false;
    if ($("#profile-photo")) $("#profile-photo").value = "";

    if (currentUser) {
        renderProfile();
        toast("Form profil dikembalikan ke data tersimpan");
    }
});

const date = new Date();
$("#dashboard-date").value = todayKey;
$("#dashboard-date").max = todayKey;
$("#dashboard-date").addEventListener("change", event => {
  if (!event.target.value) return;
  selectedDashboardDate = event.target.value;
  renderHome();
});
const helpBtn = $("#help-btn");
if (helpBtn) {
  helpBtn.addEventListener("click", () => {
    openModal(
      "Bantuan & Layanan Klinik",
      `<div class="help-modal-content">
        <p><strong>Klinik Polinela</strong> siap melayani kebutuhan kesehatan mahasiswa, dosen, dan seluruh civitas akademik.</p>
        <div style="margin-top:14px; font-size:13px; line-height:1.8; color: var(--text);">
          <div>📍 <strong>Alamat:</strong> Jl. Soekarno-Hatta No. 10, Rajabasa, Bandar Lampung</div>
          <div>🕒 <strong>Jam Buka:</strong> Senin – Jumat, 08.00 – 15.00 WIB</div>
          <div>📞 <strong>Telepon / WA:</strong> 0812-3456-7890</div>
          <div>✉️ <strong>Email:</strong> klinik@polinela.ac.id</div>
        </div>
      </div>
      <div style="margin-top:16px; text-align:right;">
        <button type="button" class="btn primary" onclick="closeModal()">Mengerti</button>
      </div>`,
      () => {},
      { actions: false }
    );
  });
}

$("#today-date-btn").addEventListener("click", () => {
  selectedDashboardDate = todayKey;
  $("#dashboard-date").value = todayKey;
  renderHome();
});
$("#patient-date").textContent = date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

// Auto-refresh: poll setiap 5 detik agar admin melihat antrian baru dari pasien
let pollTimer = null;
function startPolling() {
  stopPolling();
  pollTimer = setInterval(async () => {
    if (!currentUser) return;
    await refreshData();
    if (currentUser.role === "admin") {
      renderQueues();
      renderHome();
      renderAdminOrders();
      renderSchedules();
    } else {
      renderPatientHome();
      renderPatientQueues();
      renderSchedules();
      renderOrderHistory();
    }
  }, 5000); // ponytail: 5s polling; upgrade ke WebSocket jika perlu realtime <1s
}
function stopPolling() {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
}

if (legacyLogoutBtn) legacyLogoutBtn.addEventListener("click", stopPolling);

document.addEventListener("keydown", e => {
  if (e.key === "Escape" && !$("#modal-backdrop").classList.contains("hidden")) {
    closeModal();
  }
});

async function renderMedicalRecords() {
  if (!currentUser) return;
  const container = $("#medical-record-list");
  if (!container) return;

  try {
    const records = await api(`/api/medical-records?email=${encodeURIComponent(currentUser.email)}`);
    const dateFilter = $("#medical-record-date") ? $("#medical-record-date").value : "";

    const filtered = dateFilter
      ? records.filter(r => r.date.startsWith(dateFilter))
      : records;

    if (!filtered.length) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; color: var(--muted);">
          <div style="font-size: 40px; margin-bottom: 10px;">📋</div>
          <strong style="font-size: 16px; color: var(--ink); display: block;">Belum ada rekam medis</strong>
          <p style="margin-top: 4px;">Data pemeriksaan medis Anda akan muncul di sini setelah diperiksa oleh dokter.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(r => `
      <div style="border: 1px solid var(--line); border-radius: 12px; padding: 18px; margin-bottom: 14px; background: #fff;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; border-bottom: 1px dashed var(--line); padding-bottom: 10px;">
          <div>
            <span class="pill" style="background: var(--teal-light); color: var(--teal); margin-bottom: 4px;">${escapeHTML(r.clinic)}</span>
            <strong style="display: block; font-size: 15px; margin-top: 2px;">${escapeHTML(r.doctor)}</strong>
          </div>
          <div style="text-align: right;">
            <span style="font-size: 12px; font-weight: 600; color: var(--teal);">${escapeHTML(r.date)}</span>
          </div>
        </div>

        <div style="display: grid; gap: 8px; font-size: 13px;">
          <div><strong style="color: var(--ink);">Keluhan:</strong> <span style="color: #475569;">${escapeHTML(r.complaint)}</span></div>
          <div><strong style="color: var(--ink);">Hasil Pemeriksaan:</strong> <span style="color: #475569;">${escapeHTML(r.examination)}</span></div>
          <div><strong style="color: var(--ink);">Diagnosis:</strong> <span style="color: var(--teal-dark); font-weight: 600;">${escapeHTML(r.diagnosis)}</span></div>
          <div><strong style="color: var(--ink);">Tindakan:</strong> <span style="color: #475569;">${escapeHTML(r.action)}</span></div>
          ${r.followUpNotes ? `<div><strong style="color: var(--ink);">Catatan Tindak Lanjut:</strong> <span style="color: #475569;">${escapeHTML(r.followUpNotes)}</span></div>` : ''}
          ${r.prescription ? `
            <div style="margin-top: 6px; padding: 8px 12px; background: #f8fafc; border-radius: 8px; border-left: 3px solid var(--teal);">
              <strong style="color: var(--teal-dark); display: block; font-size: 12px;">Resep Obat:</strong>
              <span style="color: #334155; font-size: 13px;">${escapeHTML(r.prescription)}</span>
            </div>
          ` : ''}
        </div>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<p class="muted" style="padding:1.5rem;text-align:center">Gagal memuat rekam medis.</p>`;
  }
}

const medDateFilter = $("#medical-record-date");
if (medDateFilter) {
  medDateFilter.addEventListener("change", renderMedicalRecords);
}

// Inisialisasi awal
refreshData().then(() => {
  renderHome();
  renderMedicines();
  renderAdminOrders();
  renderQueues();
});
