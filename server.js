const slowDown = require('express-slow-down');
const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());

// Connect Database
connectDB();

app.get('/', (req, res) => res.sendFile(path.join(__dirname + '/api_indexfile.html')));

// Init Middleware
app.use(express.json({ extended: false }));

// Rate limiting
app.enable('trust proxy');

// allow 500 requests per 1 minute, then add 500ms of delay per request
const speedLimiter = slowDown({
  windowMs: 1 * 60 * 1000,
  delayAfter: 500,
  delayMs: 500,
});
app.use(speedLimiter);

// Define routes
app.use('/api/users', require('./routes/api/users.js'));
app.use('/api/profiles', require('./routes/api/profile.js'));
app.use('/api/auth', require('./routes/api/auth.js'));
app.use('/', require('./routes/api/squad_data/'));

const PORT = process.env.PORT || 6773;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
