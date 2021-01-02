const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');

const app = express();
app.use(cors());

// Connect Database
connectDB();

app.get('/', (req, res) => res.send('API running'));

// Init Middleware
app.use(express.json({ extended: false }));

// Define routes
app.use('/api/users', require('./routes/api/users.js'));
app.use('/api/profiles', require('./routes/api/profile.js'));
app.use('/api/auth', require('./routes/api/auth.js'));
app.use('/', require('./routes/api/squad_data/'));

const PORT = process.env.PORT || 6773;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
