const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const errorHandler = require('./middleware/errorHandler');

// Import routes (we will create them later)
const authRoutes = require('./routes/authRoutes');
const reportRoutes = require('./routes/reportRoutes');
const safePlaceRoutes = require('./routes/safePlaceRoutes');
const routeRoutes = require('./routes/routeRoutes');

const app = express();

// Security & parsing middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Health check (useful for Render & mobile later)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Nirapod Poth API is running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes (all start with /api)
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/safe-places', safePlaceRoutes);
app.use('/api/routes', routeRoutes);

// Error handler must be last
app.use(errorHandler);

module.exports = app; 