const slowDown = require('express-slow-down');
const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');
const getSquadsURLs = require('./cronjobs/getSquadsURLList');
const getClubSquads = require('./cronjobs/getSquadsData');

const SquadsDataStore = require('./models/SquadsDataStore');

const app = express();
app.use(cors());

// Connect Database
connectDB();

// index page
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
app.use('/api/email-list', require('./routes/api/emailList.js'));
app.use('/', require('./routes/api/squadData/'));

// start cronjobs

const updateSquadsJob = async () => {
  console.log('Started fetching squads data.');
  getSquadsURLs((squadsURLs) => {
    console.log(
      `Successfully fetched squads data: ${Object.values(squadsURLs)
        .map((e) => e.length)
        .reduce((a, b) => a + b, 0)} squads across ${Object.keys(squadsURLs).length} leagues.`
    );
    console.log('Began fetching club squads.');
    getClubSquads(squadsURLs, async (data) => {
      console.log(`Successfully fetched club squads data.`);
      const dataContents = JSON.stringify(data);
      let dataStore = await SquadsDataStore.findOne();
      if (dataStore) {
        dataStore.contents = dataContents;
      } else {
        dataStore = new SquadsDataStore({
          contents: dataContents,
        });
      }
      await dataStore.save();
    });
  });
};
// scheduled every day at 4:55 AM local time
cron.schedule('55 10 * * *', () => updateSquadsJob());
setTimeout(() => {
  // run just after the server starts as well
  // updateSquadsJob();
}, 3000);

// start app
const PORT = process.env.PORT || 6773;
app.listen(PORT, () => console.log(`Server started on port ${PORT}.`));
