# JMS STORE - VPS Status Monitor (with Telegram Alerts)

Project ini adalah panel monitoring VPS untuk **JMS STORE**:
- Menampilkan status VPS (online/offline)
- Menunjukkan response time per server
- Mengirim notifikasi Telegram ketika server turun (down)

Backend: Node.js + Express  
Frontend: HTML + CSS + JS (tanpa framework)

---

## 1. Persiapan di VPS

### 1.1. Login ke VPS

```bash
ssh root@IP_VPS_KAMU
```

### 1.2. Install Node.js & Git (Ubuntu/Debian)

```bash
apt update && apt upgrade -y
apt install -y nodejs npm git
```

Cek versi:

```bash
node -v
npm -v
```

---

## 2. Deploy Project

### 2.1. Copy project ke VPS

Cara paling gampang:
- Upload ZIP project ini ke GitHub
- Lalu di VPS:

```bash
git clone https://github.com/USERNAME/jms-vps-status.git
cd jms-vps-status
```

Atau upload via SFTP / Panel dan `cd` ke folder proyek.

### 2.2. Install dependency

```bash
npm install
```

---

## 3. Siapkan Bot Telegram

### 3.1. Buat Bot

1. Buka Telegram
2. Chat ke **@BotFather**
3. Kirim:
   ```text
   /start
   /newbot
   ```
4. Ikuti instruksi, lalu BotFather akan memberikan **BOT TOKEN**, misal:
   ```text
   123456789:AAAbbbCCCdddEEEfff...
   ```

Simpan token ini.

### 3.2. Dapatkan CHAT_ID

1. Chat ke bot yang baru dibuat (kirim "test" misalnya).
2. Buka di browser:

   ```text
   https://api.telegram.org/botTOKEN_KAMU/getUpdates
   ```

   Ganti `TOKEN_KAMU` dengan token bot.

3. Cari bagian:

   ```json
   "chat": {
     "id": 123456789,
   ```

   Nilai `123456789` adalah `CHAT_ID`.

---

## 4. Konfigurasi Project

Edit file `server.js`:

```bash
nano server.js
```

Cari bagian:

```js
const TELEGRAM_BOT_TOKEN = 'ISI_TOKEN_BOT_KAMU_DI_SINI';
const TELEGRAM_CHAT_ID = 'ISI_CHAT_ID_KAMU_DI_SINI';
```

Ganti:

```js
const TELEGRAM_BOT_TOKEN = '123456789:AAAbbbCCCdddEEEfff...';
const TELEGRAM_CHAT_ID = '123456789';
```

### 4.1. Atur daftar VPS

Masih di `server.js`, bagian:

```js
const servers = [
  {
    id: 1,
    name: 'SERVER SG',
    host: 'sg2.jmsvpn.tech',
    port: 22,
    role: 'Server Singapura (SSH/OVPN)'
  },
  {
    id: 2,
    name: 'SERVER ID',
    host: 'neva-id.vpn-premium.xyz',
    port: 22,
    role: 'Server Indonesia (SSH/OVPN)'
  }
];
```

- `name`  → nama VPS
- `host`  → domain / IP
- `port`  → port yang dicek (misal 22/80/443)
- `role`  → keterangan server

Tambahkan object baru jika punya VPS tambahan.

---

## 5. Menjalankan Panel

### 5.1. Jalankan secara biasa

```bash
npm start
```

Jika sukses:

```text
JMS STORE VPS Status berjalan di http://localhost:3000
```

Buka di browser:

- Dari VPS (browser di panel): `http://localhost:3000`
- Dari luar: `http://IP_VPS_KAMU:3000` (pastikan port 3000 dibuka atau pakai reverse proxy NGINX).

---

## 6. Menjalankan 24 Jam Nonstop (PM2)

Agar app tetap jalan walaupun SSH keluar / VPS reboot:

### 6.1. Install PM2

```bash
npm install -g pm2
```

### 6.2. Jalankan dengan PM2

```bash
pm2 start server.js --name jms-status
```

### 6.3. Simpan dan auto start saat reboot

```bash
pm2 save
pm2 startup
```

Cek status PM2:

```bash
pm2 status
```

---

## 7. Cara Kerja Notifikasi Telegram

- Frontend memanggil `/api/status` setiap 10 detik.
- Backend cek tiap server dengan koneksi TCP ke host:port.
- Status terakhir server disimpan di `lastStatus`.
- Jika status berubah dari:
  - `online` → `offline` → dikirim notifikasi:
    - `🚨 SERVER DOWN`
    - Nama, host, peran, waktu
- Kode untuk notifikasi `SERVER UP` sudah disiapkan tetapi di-comment, bisa diaktifkan jika mau.

---

## 8. Custom Lanjutan (Opsional)

- Aktifkan notifikasi saat server kembali online.
- Tambah logging ke file / database.
- Integrasi dengan domain + SSL (Nginx reverse proxy).
- Tambah autentikasi (login) untuk akses panel.

---

Dibuat khusus untuk **JMS STORE**  
VPS Monitoring + Telegram Alert dalam satu panel ringan.
