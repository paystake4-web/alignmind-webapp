const express = require('express');
const { Telegraf } = require('telegraf');
const app = express();

const bot = new Telegraf(process.env.BOT_TOKEN);
const PORT = process.env.PORT || 3000;

let users = {};
const taskPool = [
  { id: 1, question: 'AI: "The capital of Nigeria is Abuja."', payout: 0.50 },
  { id: 2, question: 'AI: "2 + 2 = 5"', payout: 0.50 },
  { id: 3, question: 'AI: "Python is a snake and a programming language."', payout: 0.75 }
];

app.use(express.json());
app.use(express.static('public'));

app.get('/api/get-task', (req, res) => {
  const userId = req.query.userId;
  if (!users[userId]) users[userId] = { balance: 0, tasksCompleted: 0 };
  const randomTask = taskPool[Math.floor(Math.random() * taskPool.length)];
  res.json(randomTask);
});

app.post('/api/complete-task', (req, res) => {
  const { userId, payout } = req.body;
  if (!users[userId]) users[userId] = { balance: 0, tasksCompleted: 0 };
  users[userId].balance += payout;
  users[userId].tasksCompleted += 1;
  res.json({ success: true, newBalance: users[userId].balance, tasksCompleted: users[userId].tasksCompleted });
});

app.get('/api/user/:id', (req, res) => {
  const userId = req.params.id;
  if (!users[userId]) users[userId] = { balance: 0, tasksCompleted: 0 };
  res.json(users[userId]);
});

bot.start((ctx) => ctx.reply('Tap Open Dashboard below to start earning 👇'));

app.listen(PORT, async () => {
  console.log(`Server running on ${PORT}`);
  const webhookUrl = `https://alignmind-webapp.onrender.com/bot${process.env.BOT_TOKEN}`;
  await bot.telegram.setWebhook(webhookUrl);
  console.log('Webhook set');
});

app.use(bot.webhookCallback(`/bot${process.env.BOT_TOKEN}`));
