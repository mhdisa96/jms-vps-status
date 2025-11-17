// server.js
// JMS STORE - VPS Status Monitor (cek otomatis via TCP port + Telegram alert)

const express = require('express');
const net = require('net');
const path = require('path');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;

// ================== KONFIGURASI TELEGRAM ==================
// TODO: Ganti 2 baris di bawah dengan data bot kamu
const TELEGRAM_BOT_TOKEN = '8272388200:AAFh7t-2fTaTDZDavnqgBPiTKWMaXe-I3oI';
const TELEGRAM_CHAT_ID = '7364677220';
// ==========================================================

// ================== DAFTAR VPS JMS STORE ==================
const servers = [
  {
    id: 1,
    name: 'SERVER SG 1',
    host: 'sg2.jmsvpn.tech',
    port: 22,
    role: 'Server Singapura (SSH/OVPN)'
  },
  {
    id: 2,
    name: 'SERVER SG 2',
    host: 'sg.serverdovip.my.id',
    port: 22,
    role: 'Server Indonesia (SSH/OVPN)'
  },
  {
    id: 3,
    name: 'SERVER ID 1',
    host: 'neva-id.vpn-premium.xyz',
    port: 22,
    role: 'Server Indonesia (SSH/OVPN)'
  },
  {
    id: 4,
    name: 'SERVER ID 2',
    host: '160.19.167.115',
    port: 22,
    role: 'Server Indonesia (SSH/OVPN)'
  },
  {
    id: 5,
    name: 'SERVER ID 3',
    host: '103.161.184.215',
    port: 22,
    role: 'Server Indonesia (SSH/OVPN)'
  }
];
// =========================================================

// Simpan status terakhir setiap server (supaya notifikasi hanya saat berubah)
const lastStatus = new Map(); // key: host:port, value: true/false

// Fungsi kirim notifikasi ke Telegram
function sendTelegramAlert(text) {
  if (!TELEGRAM_BOT_TOKEN || TELEGRAM_BOT_TOKEN === 'ISI_TOKEN_BOT_KAMU_DI_SINI') {
    console.warn('Telegram BOT_TOKEN belum diisi, skip notifikasi.');
    return;
  }
  if (!TELEGRAM_CHAT_ID || TELEGRAM_CHAT_ID === 'ISI_CHAT_ID_KAMU_DI_SINI') {
    console.warn('Telegram CHAT_ID belum diisi, skip notifikasi.');
    return;
  }

  const postData = new URLSearchParams({
    chat_id: TELEGRAM_CHAT_ID,
    text,
    parse_mode: 'HTML'
  }).toString();

  const options = {
    hostname: 'api.telegram.org',
    path: `/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = https.request(options, (res) => {
    res.on('data', () => {});
  });

  req.on('error', (err) => {
    console.error('Gagal kirim notifikasi Telegram:', err.message);
  });

  req.write(postData);
  req.end();
}

// Fungsi cek 1 server via TCP port
function checkTcpServer(host, port, timeoutMs = 3000) {
  return new Promise((resolve) => {
    const start = Date.now();
    const socket = new net.Socket();
    let finished = false;

    const done = (online) => {
      if (finished) return;
      finished = true;
      const ms = Date.now() - start;
      socket.destroy();
      resolve({
        online,
        responseTime: ms
      });
    };

    socket.setTimeout(timeoutMs);

    socket.on('connect', () => {
      // Bisa connect ke port => dianggap online
      done(true);
    });

    socket.on('timeout', () => {
      done(false);
    });

    socket.on('error', () => {
      done(false);
    });

    socket.connect(port, host);
  });
}

// API: /api/status -> frontend ambil dari sini
app.get('/api/status', async (req, res) => {
  try {
    const results = await Promise.all(
      servers.map(async (s) => {
        const result = await checkTcpServer(s.host, s.port);

        const key = `${s.host}:${s.port}`;
        const prev = lastStatus.get(key);

        // Kalau sebelumnya online, sekarang offline => kirim notifikasi
        if (typeof prev === 'boolean') {
          if (prev === true && result.online === false) {
            const msg =
              `🚨 <b>SERVER DOWN</b>\n` +
              `Nama: <b>${s.name}</b>\n` +
              `Host: <code>${s.host}:${s.port}</code>\n` +
              `Peran: ${s.role || '-'}\n` +
              `Waktu: ${new Date().toLocaleString('id-ID')}`;
            sendTelegramAlert(msg);
          }

          // Jika ingin notifikasi saat server kembali online, bisa aktifkan ini:
          // if (prev === false && result.online === true) {
          //   const msgUp =
          //     `✅ <b>SERVER UP</b>\n` +
          //     `Nama: <b>${s.name}</b>\n` +
          //     `Host: <code>${s.host}:${s.port}</code>\n` +
          //     `Peran: ${s.role || '-'}\n` +
          //     `Waktu: ${new Date().toLocaleString('id-ID')}`;
          //   sendTelegramAlert(msgUp);
          // }
        }

        // Update status terakhir
        lastStatus.set(key, result.online);

        return {
          ...s,
          ...result,
          checkedAt: new Date().toISOString()
        };
      })
    );

    res.json({
      updatedAt: new Date().toISOString(),
      servers: results
    });
  } catch (err) {
    console.error('Error cek status:', err);
    res.status(500).json({ error: 'Gagal cek status server' });
  }
});

// Serve file static (frontend)
app.use(express.static(path.join(__dirname, 'public')));

// Root -> index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`JMS STORE VPS Status berjalan di http://localhost:${PORT}`);
});
