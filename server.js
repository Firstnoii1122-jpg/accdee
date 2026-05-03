require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const authRoutes    = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const walletRoutes  = require('./routes/walletRoutes');

app.use('/api/auth',   authRoutes);
app.use('/api',        profileRoutes);
app.use('/api/wallet', walletRoutes);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => {
  res.json({ message: 'Accdee API is running!', version: '1.0.0' });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
