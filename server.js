const express = require('express');
const { Telegraf } = require('telegraf');
const app = express();

const bot = new Telegraf(process.env.BOT_TOKEN);
const PORT = process.env.PORT || 3000;

// In-memory database for now
let users = {};

// TASK POOL - Add as many as you want here
const taskPool = [
  { id: 1, type: 'rate', question: 'AI: "The capital of Nigeria is Abuja."', answer: true, payout: 0.50 },
  { id: 2, type: 'rate', question: 'AI: "2 + 2 = 5"', answer: false, payout: 0.50 },
  { id: 3, type: 'rate', question: 'AI: "Python is a snake and a programming language."', answer: true, payout: 0.75 },
  { id: 4, type: 'rate', question: 'AI: "The sun rises in the west."', answer: false, payout: 0.75 },
  { id: 5, type: 'rate', question: 'AI: "Water boils at 100°C at sea level."', answer: true, payout: 1.00 }
];

app.use(express.json());
app.use(express.static('public'));

// Get random task user hasn't done
app.get('/api/get-task', (req, res) => {
  const userId = req.query.userId;
  if (!users[userId]) users[userId] = { balance: 0, tasksCompleted: 0, completedTasks: [] };
  
  const user = users[userId];
  const availableTasks = taskPool.filter(t =>!user.completedTasks.includes(t.id));
  
  // Reset if they did all tasks
  if (availableTasks.length === 0) user.completedTasks = [];
  
  const randomTask = availableTasks[Math.floor(Math.random() * availableTasks.length)] || taskPool[0];
  res.json(randomTask);
});

app.post('/api/complete-task', (req, res) => {
  const { userId, taskId, payout } = req.body;
  if (!users[userId]) users[userId] = { balance: 0, tasksCompleted: 0, completedTasks: [] };
  
  users[userId].balance += payout;
  users[userId].tasksCompleted += 1;
  users[userId].completedTasks.push(taskId);
  
  res.json({ 
    success: true, 
    newBalance: users[userId].balance,
    tasksCompleted: users[userId].tasksCompleted
  });
});

app.get('/api/user/:id', (req, res) => {
  const userId = req.params.id;
  if (!users[userId]) users[userId] = { balance: 0, tasksCompleted: 0, completedTasks: [] };
  res.json(users[userId]);
});

bot.start((ctx) => {
  ctx.reply('Welcome to AlignMind AI Training! Tap Open Dashboard below to start earning.');
});

app.listen(PORT, () => {
  console.log(`AlignMind WebApp running on ${PORT}`);
  bot.launch();
});
