const getSquadsURLs = require('./cronjobs/getSquadsURLList');
const getClubSquads = require('./cronjobs/getSquadsData');
const SquadsDataStore = require('./models/SquadsDataStore');

const updateSquads = async () => {
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

module.exports = updateSquads;
