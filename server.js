const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const path = require('path');
const app = express();

const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = process.env.ADMIN_ID;

app.use(express.json());
app.use(express.static('public'));

// Database setup
const db = new sqlite3.Database('./alignmind.db');
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    telegram_id INTEGER PRIMARY KEY,
    username TEXT,
    first_name TEXT,
    balance_cents INTEGER DEFAULT 0,
    tasks_completed INTEGER DEFAULT 0,
    is_banned INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS withdrawals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_id INTEGER,
    amount_cents INTEGER,
    method TEXT,
    address TEXT,
    chain TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// Verify Telegram WebApp data
function verifyTelegramWebAppData(initData) {
  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get('hash');
  urlParams.delete('hash');

  const dataCheckString = Array.from(urlParams.entries())
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([key, value]) => `${key}=${value}`)
  .join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
  const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  return calculatedHash === hash;
}

// API: Get user data
app.post('/api/user', (req, res) => {
  const { initData } = req.body;
  if (!verifyTelegramWebAppData(initData)) {
    return res.status(401).json({ error: 'Invalid Telegram data' });
  }

  const user = JSON.parse(new URLSearchParams(initData).get('user'));

  db.run(`INSERT OR IGNORE INTO users (telegram_id, username, first_name) VALUES (?,?,?)`,
    [user.id, user.username, user.first_name]);

  db.get(`SELECT * FROM users WHERE telegram_id =?`, [user.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({
      id: row.telegram_id,
      username: row.username,
      first_name: row.first_name,
      balance: (row.balance_cents / 100).toFixed(2),
      tasks_completed: row.tasks_completed
    });
  });
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`AlignMind WebApp running on ${PORT}`);
});
