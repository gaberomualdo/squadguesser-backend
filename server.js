const slowDown = require('express-slow-down');
const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');
const sendWeeklyNewsletter = require('./cronjobs/sendWeeklyNewsletter');
const updateSquads = require('./cronjobs/updateSquads');

const app = express();
app.use(cors());

/* D A T A B A S E */
connectDB();

/* I N D E X P A G E */
app.get('/', (req, res) => res.sendFile(path.join(__dirname, './static/indexpage.txt')));

/* M I D D L E W A R E */
app.use(express.json({ extended: false }));

/* R A T E   L I M I T */
app.enable('trust proxy');

// allow 500 requests per 1 minute, then add 500ms of delay per request
const speedLimiter = slowDown({
  windowMs: 1 * 60 * 1000,
  delayAfter: 500,
  delayMs: 500,
});
app.use(speedLimiter);

/* R O U T E S */
app.use('/api/users', require('./routes/api/users.js'));
app.use('/api/profiles', require('./routes/api/profile.js'));
app.use('/api/auth', require('./routes/api/auth.js'));
app.use('/api/email-list', require('./routes/api/emailList.js'));
app.use('/', require('./routes/api/squadData/'));

/* C R O N J O B S */

// every day at 4:55 AM UTC (presuming server is UTC)
cron.schedule('55 10 * * *', () => updateSquads());
// every Saturday at 8:30 AM UTC (presuming server is UTC)
cron.schedule('30 8 * * 6', () => sendWeeklyNewsletter());

/* S T A R T   T H E   A P P L I C A T I O N */
const PORT = process.env.PORT || 6773;
app.listen(PORT, () => console.log(`Server started on port ${PORT}.`));
