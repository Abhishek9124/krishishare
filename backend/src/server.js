require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const { apiRateLimiter } = require('./middleware/rateLimiter');
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const investmentRoutes = require('./routes/investments');
const walletRoutes = require('./routes/wallet');
const telemetryRoutes = require('./routes/telemetry');
const adminRoutes = require('./routes/admin');

const app = express();

// Enable trust proxy for Vercel reverse proxy / load balancers
app.set('trust proxy', 1);

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Apply general API rate limiter
app.use('/api', apiRateLimiter);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    note: 'Krishishare demo API — all money movement is simulated, no real payments/escrow.',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/investments', investmentRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api', telemetryRoutes);
app.use('/api/admin', adminRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Express Error Handler:', err);
  const msg = typeof err === 'string' ? err : (err.message || 'An unexpected server error occurred.');
  res.status(500).json({ error: msg });
});

const PORT = process.env.PORT || 4000;
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Krishishare API listening on port ${PORT}`);
  });
}

module.exports = app;
