require('dotenv').config();
const express   = require('express');
const mongoose  = require('mongoose');
const cors      = require('cors');
const helmet    = require('helmet');
const morgan    = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes    = require('./routes/authRoutes');
const financeRoutes = require('./routes/financeRoutes');
const chatRoutes    = require('./routes/chatRoutes');

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
const limiter = rateLimit({ windowMs: 15*60*1000, max: 200,
  message: { success: false, message: 'Too many requests' } });
app.use('/api/', limiter);

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

app.use('/api/auth',    authRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/chat',    chatRoutes);

app.get('/api/health', (req, res) =>
  res.json({ success: true, status: 'FinPilot API running', time: new Date().toISOString() })
);

app.use((req, res) =>
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` })
);
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
  });
});

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/finpilot')
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => console.log(`🚀 FinPilot API → http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('⚠️  MongoDB connection failed:', err.message);
    console.log('▶  Starting without DB (localStorage fallback active)');
    app.listen(PORT, () => console.log(`🚀 FinPilot API → http://localhost:${PORT} (no DB)`));
  });

module.exports = app;
