-- Schema Database Klinik Polinela
-- SQLite Compatible

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  phone TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  age INTEGER DEFAULT NULL,
  status TEXT DEFAULT 'mahasiswa',
  photo TEXT DEFAULT '',
  role TEXT NOT NULL DEFAULT 'patient',
  createdAt TEXT NOT NULL,
  nim TEXT DEFAULT '',
  prodi TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS medicines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  form TEXT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  description TEXT DEFAULT '',
  dosage TEXT DEFAULT '',
  sideEffects TEXT DEFAULT '',
  image TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS queues (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  number TEXT NOT NULL,
  name TEXT NOT NULL,
  doctor TEXT NOT NULL,
  clinic TEXT NOT NULL,
  time TEXT NOT NULL,
  date TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Menunggu' CHECK(status IN ('Menunggu', 'Diperiksa', 'Selesai')),
  patientEmail TEXT DEFAULT '',
  complaint TEXT DEFAULT ''
);

-- Data Awal (Seed Data)
INSERT OR IGNORE INTO users (id, name, email, password, phone, status, role, createdAt)
VALUES (1, 'Administrator', 'adminklinik@polinela.ac.id', 'klinik123', '0812-3456-7890', 'administrator', 'admin', '2026-01-01T00:00:00.000Z');

INSERT OR IGNORE INTO users (name, email, password, phone, status, role, createdAt, nim, prodi)
VALUES ('Mahasiswa Polinela', 'mahasiswa@student.polinela.ac.id', '123456', '0812-3456-7891', 'mahasiswa', 'patient', '2026-01-01T00:00:00.000Z', '21573010', 'D3 Manajemen Informatika');

INSERT OR IGNORE INTO users (name, email, password, phone, status, role, createdAt, nim, prodi)
VALUES ('Dosen Polinela', 'dosen@polinela.ac.id', '123456', '0812-3456-7892', 'dosen', 'patient', '2026-01-01T00:00:00.000Z', '198501012010121001', 'Dosen Jurusan Ekonomi dan Bisnis');

-- Akun mahasiswa dan dosen aktif
INSERT OR IGNORE INTO users (name, email, password, status, role, createdAt, nim, prodi) VALUES
('Mahasiswa 26783118', '26783118@student.polinela.ac.id', 'Polinela123', 'mahasiswa', 'patient', '2026-01-01T00:00:00.000Z', '26783118', ''),
('Mahasiswa 26783121', '26783121@student.polinela.ac.id', 'Polinela123', 'mahasiswa', 'patient', '2026-01-01T00:00:00.000Z', '26783121', ''),
('Mahasiswa 26783110', '26783110@student.polinela.ac.id', 'Polinela123', 'mahasiswa', 'patient', '2026-01-01T00:00:00.000Z', '26783110', ''),
('Mahasiswa 26783130', '26783130@student.polinela.ac.id', 'Polinela123', 'mahasiswa', 'patient', '2026-01-01T00:00:00.000Z', '26783130', ''),
('Mahasiswa 26783113', '26783113@student.polinela.ac.id', 'Polinela123', 'mahasiswa', 'patient', '2026-01-01T00:00:00.000Z', '26783113', ''),
('Mahasiswa 25783035', '25783035@student.polinela.ac.id', 'Polinela123', 'mahasiswa', 'patient', '2026-01-01T00:00:00.000Z', '25783035', ''),
('Mahasiswa 25783036', '25783036@student.polinela.ac.id', 'Polinela123', 'mahasiswa', 'patient', '2026-01-01T00:00:00.000Z', '25783036', ''),
('Mahasiswa 25783058', '25783058@student.polinela.ac.id', 'Polinela123', 'mahasiswa', 'patient', '2026-01-01T00:00:00.000Z', '25783058', ''),
('Mahasiswa 25783065', '25783065@student.polinela.ac.id', 'Polinela123', 'mahasiswa', 'patient', '2026-01-01T00:00:00.000Z', '25783065', ''),
('Mahasiswa 25783066', '25783066@student.polinela.ac.id', 'Polinela123', 'mahasiswa', 'patient', '2026-01-01T00:00:00.000Z', '25783066', ''),
('Mahasiswa 25783110', '25783110@student.polinela.ac.id', 'Polinela123', 'mahasiswa', 'patient', '2026-01-01T00:00:00.000Z', '25783110', ''),
('Mahasiswa 24783010', '24783010@student.polinela.ac.id', 'Polinela123', 'mahasiswa', 'patient', '2026-01-01T00:00:00.000Z', '24783010', ''),
('Mahasiswa 24783031', '24783031@student.polinela.ac.id', 'Polinela123', 'mahasiswa', 'patient', '2026-01-01T00:00:00.000Z', '24783031', ''),
('Mahasiswa 24783018', '24783018@student.polinela.ac.id', 'Polinela123', 'mahasiswa', 'patient', '2026-01-01T00:00:00.000Z', '24783018', ''),
('Mahasiswa 24783020', '24783020@student.polinela.ac.id', 'Polinela123', 'mahasiswa', 'patient', '2026-01-01T00:00:00.000Z', '24783020', '');
INSERT OR IGNORE INTO users (name, email, password, status, role, createdAt, nim, prodi)
VALUES ('Dosen Fathurrahman', 'fathurrahman@polinela.ac.id', 'Polinela123', 'dosen', 'patient', '2026-01-01T00:00:00.000Z', '', '');

INSERT OR IGNORE INTO medicines (id, name, category, form, stock, description, dosage, sideEffects, image) VALUES
(1, 'Paracetamol 500 mg', 'Analgesik', 'Tablet', 120, 'Meredakan demam dan nyeri ringan hingga sedang seperti sakit kepala, sakit gigi, dan nyeri otot.', 'Dewasa: 1 tablet 3-4 kali sehari setelah makan. Anak 6-12 tahun: 1/2 - 1 tablet 3-4 kali sehari.', 'Jarang terjadi; pemakaian berlebih dapat merusak fungsi hati.', ''),
(2, 'Amoxicillin 500 mg', 'Antibiotik', 'Kapsul', 18, 'Antibiotik untuk mengobati infeksi bakteri pada saluran pernapasan, telinga, dan saluran kemih.', 'Dewasa: 1 kapsul tiap 8 jam sesudah makan. Harus dihabiskan sesuai anjuran dokter.', 'Mual, diare, ruam kulit, atau reaksi alergi.', ''),
(3, 'Vitamin C 500 mg', 'Vitamin', 'Tablet', 75, 'Suplemen untuk menjaga daya tahan tubuh dan membantu proses penyembuhan.', '1 tablet sekali sehari setelah makan.', 'Dosis berlebih dapat memicu kram perut atau diare.', ''),
(4, 'Antasida', 'Antasida', 'Tablet kunyah', 42, 'Menetralkan asam lambung berlebih, meredakan maag dan heartburn.', '1-2 tablet dikunyah 1-2 jam setelah makan dan menjelang tidur.', 'Sembelit, diare ringan, atau kembung.', ''),
(5, 'Cetirizine 10 mg', 'Antihistamin', 'Tablet', 8, 'Meredakan gejala alergi seperti bersin, gatal, dan mata berair.', 'Dewasa & anak >12 tahun: 1 tablet sekali sehari pada malam hari.', 'Kantuk, mulut kering, lelah, atau pusing.', ''),
(6, 'Oralit', 'Rehidrasi', 'Serbuk', 30, 'Larutan rehidrasi oral untuk mengganti cairan dan elektrolit yang hilang akibat diare.', 'Larutkan 1 sachet ke dalam 200 ml air matang. Minum bertahap setiap diare.', 'Umumnya aman jika takaran air tepat.', '');

-- Data antrian sengaja kosong; hanya pendaftaran pasien nyata yang disimpan.

CREATE TABLE IF NOT EXISTS doctor_schedules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  doctor_name TEXT NOT NULL,
  clinic TEXT NOT NULL,
  day TEXT NOT NULL CHECK(day IN ('Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu')),
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  createdAt TEXT NOT NULL
);

INSERT OR IGNORE INTO doctor_schedules (id, doctor_name, clinic, day, start_time, end_time, is_active, createdAt) VALUES
(1, 'dr. Dian', 'Poli Umum', 'Senin', '08:00', '14:00', 1, '2026-01-01T00:00:00.000Z'),
(2, 'dr. Dian', 'Poli Umum', 'Rabu', '08:00', '14:00', 1, '2026-01-01T00:00:00.000Z'),
(3, 'dr. Tya', 'Poli Umum', 'Selasa', '09:00', '15:00', 1, '2026-01-01T00:00:00.000Z'),
(4, 'dr. Tya', 'Poli Umum', 'Kamis', '09:00', '15:00', 1, '2026-01-01T00:00:00.000Z');

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  userId INTEGER,
  name TEXT NOT NULL,
  items TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Menunggu Pengambilan',
  date TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS medical_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patientEmail TEXT NOT NULL,
  patientName TEXT NOT NULL,
  date TEXT NOT NULL,
  clinic TEXT NOT NULL,
  doctor TEXT NOT NULL,
  complaint TEXT NOT NULL,
  examination TEXT NOT NULL,
  diagnosis TEXT NOT NULL,
  action TEXT NOT NULL,
  followUpNotes TEXT DEFAULT '',
  prescription TEXT DEFAULT '',
  createdAt TEXT NOT NULL
);

INSERT OR IGNORE INTO medical_records (id, patientEmail, patientName, date, clinic, doctor, complaint, examination, diagnosis, action, followUpNotes, prescription, createdAt) VALUES
(1, 'mahasiswa@student.polinela.ac.id', 'Mahasiswa Polinela', '2026-02-15', 'Poli Umum', 'dr. Dian', 'Demam 2 hari, sakit kepala, badan lemas', 'Suhu tubuh 38.2°C, tekanan darah 115/75 mmHg, nadi 84x/menit, faring sedikit hiperemis', 'Faringitis Akut & Febris', 'Edukasi istirahat cukup, kompres hangat, hidrasi cairan 2L/hari', 'Kontrol kembali jika demam berlanjut > 3 hari', 'Paracetamol 500mg 3x1 (bila demam), Vitamin C 500mg 1x1', '2026-02-15T09:30:00.000Z'),
(2, 'mahasiswa@student.polinela.ac.id', 'Mahasiswa Polinela', '2026-01-10', 'Poli Umum', 'dr. Tya', 'Nyeri ulu hati, mual setelah telat makan', 'Tekanan darah 120/80 mmHg, nyeri tekan epigastrium (+)', 'Dispepsia / Gastritis Ringan', 'Konseling pola makan teratur, hindari makanan pedas dan asam', 'Minum obat lambung sebelum makan', 'Antasida 3x1 sebelum makan', '2026-01-10T10:15:00.000Z');
