const { makeURL } = require('./utils');
const fetch = require('node-fetch');
const { JSDOM } = require('jsdom');
const cliProgress = require('cli-progress');

const getSquadsFromURL = async (squadURL) => {
  let curPageSquads = [];

  let data;
  try {
    data = await (await fetch(squadURL)).text();
  } catch (err) {
    return []; // return nothing with 404 errors
  }
  const dom = new JSDOM(data);

  const squadHeaders = Array.from(dom.window.document.querySelectorAll('.table-teams thead th')).map((e) => {
    return e.textContent;
  });

  const potentialSquads = dom.window.document.querySelectorAll('.table-teams tbody tr');
  potentialSquads.forEach((s) => {
    const sData = Array.from(s.querySelectorAll('td'));
    if (sData.length === squadHeaders.length) {
      for (let i = 0; i < sData.length; i++) {
        if (squadHeaders[i].toLowerCase() === 'name') {
          curPageSquads.push(sData[i].querySelector('a').href);
        }
      }
    }
  });
  return curPageSquads;
};

const makeSquadsURLList = async (callback) => {
  const squadLeagues = [13, 53, 19, 31, 16, 10, 308, 68, 1003, 50, 14];
  const squadLeaguesNames = [
    'Premier League',
    'La Liga',
    'Bundesliga',
    'Serie A TIM',
    'Ligue 1',
    'Eredivisie',
    'Liga NOS',
    'Süper Lig',
    'Libertadores',
    'Scottish Prem',
    'EFL Championship',
  ]; // if you change this, you must change the squadLeagues array; and the other way around!

  let squads = {};
  let finishedSquadLeagues = ',false'
    .repeat(squadLeagues.length)
    .slice(1)
    .split(',')
    .map((e) => e !== 'false');

  const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  progressBar.start(squadLeagues.length, 0);

  for (let i = 0; i < squadLeagues.length; i++) {
    const leagueId = squadLeagues[i];
    squads[squadLeaguesNames[i]] = [];

    setTimeout(async () => {
      let page = 1;
      while (true) {
        const pageSquads = await getSquadsFromURL(makeURL(`/teams/${page}/?league=${leagueId}`));
        if (pageSquads.length > 0) {
          squads[squadLeaguesNames[i]] = squads[squadLeaguesNames[i]].concat(pageSquads.map((e) => makeURL(e)));
        } else {
          finishedSquadLeagues[i] = true;
          progressBar.update(finishedSquadLeagues.filter((e) => e !== false).length);
          if (finishedSquadLeagues.filter((e) => e === false).length === 0) {
            progressBar.stop();
            callback(squads);
          }
          break;
        }
        page++;
      }
    }, 0);
  }
};

module.exports = makeSquadsURLList;
