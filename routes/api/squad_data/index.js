const express = require('express');
const fs = require('fs');
const seedrandom = require('seedrandom');
const dataJSONPath = require('./utils').getDataJSONPath();

const router = express.Router();
const data = JSON.parse(fs.readFileSync(`${dataJSONPath}/club_squads.json`));

const reduceToTeamName = (teams) => {
  return teams.map((t) => t.name);
};

const getAllTeams = () => {
  return [].concat.apply([], Object.values(data));
};

const chooseRandomFromArr = (arr) => {
  return arr[Math.floor(Math.random() * arr.length)];
};

const getTopTeams = (cutOff = 50) => {
  const avg = (x) => Object.values(x).reduce((a, b) => a + b, 0) / Object.keys(x).length;
  const teams = getAllTeams();
  teams.sort((a, b) => avg(a.fifaMiscData.ratings) - avg(b.fifaMiscData.ratings)).reverse();
  return teams.slice(0, cutOff);
};

const getCurrentDateStr = (swapMonthAndDay = false) => {
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const yyyy = today.getFullYear();
  if (swapMonthAndDay) {
    return `${dd}/${mm}/${yyyy}`;
  } else {
    return `${mm}/${dd}/${yyyy}`;
  }
};
const getDailyChallengeTeams = () => {
  const leagues = Object.keys(data);
  const randomGenerator = seedrandom(getCurrentDateStr());
  return Object.values(data)[Math.floor(randomGenerator() * leagues.length)];
};

const additionalLeagues = [
  {
    name: 'All Teams',
    teams: getAllTeams,
  },
  {
    name: 'Daily Challenge',
    teams: getDailyChallengeTeams,
    hideInLeaguesList: true,
  },
  {
    name: 'Top 25 Teams',
    teams: () => getTopTeams(25),
  },
];
const excludedLeaguesFromDatabase = ['All Teams'];

const getTeamsByLeague = (league) => {
  const idxInAdditionalLeagues = additionalLeagues.map((e) => e.name).indexOf(league);
  if (idxInAdditionalLeagues > -1) {
    return additionalLeagues[idxInAdditionalLeagues].teams();
  } else {
    return data[league];
  }
};

const getListOfLeagues = () => {
  return additionalLeagues
    .filter((e) => !e.hideInLeaguesList)
    .map((e) => e.name)
    .concat(Object.keys(data));
};

router.get('/dailychallenge/team', (req, res) => {
  const teams = getDailyChallengeTeams();
  const randomGenerator = seedrandom(getCurrentDateStr(true));
  const team = teams[Math.floor(randomGenerator() * teams.length)];
  res.json(team);
});

router.get('/leagues', (req, res) => {
  res.json(getListOfLeagues());
});

router.get('/teams', (req, res) => {
  res.json(getAllTeams());
});
router.get('/teams/by-league/:league', (req, res) => {
  res.json(getTeamsByLeague(req.params.league));
});

router.get('/teams/by-league/onlynames/:league', (req, res) => {
  res.json(reduceToTeamName(getTeamsByLeague(req.params.league)));
});

router.get('/teams/by-league/onlylogos/:league', (req, res) => {
  res.json(getTeamsByLeague(req.params.league).map((e) => e.logoURL));
});

router.get('/teams/by-league/onlynamesandlogos/:league', (req, res) => {
  res.json(
    getTeamsByLeague(req.params.league).map((e) => {
      return { logoURL: e.logoURL, name: e.name };
    })
  );
});

router.get('/teams/all/by-league/', (req, res) => {
  const fullData = {};
  getListOfLeagues().forEach((l) => {
    if (excludedLeaguesFromDatabase.indexOf(l) === -1) {
      fullData[l] = getTeamsByLeague(l);
    }
  });
  res.json(fullData);
});

router.get('/team/random', (req, res) => {
  res.json(chooseRandomFromArr(getAllTeams()));
});

router.get('/team/:team', (req, res) => {
  const resultAsArr = getAllTeams().filter((e) => e.name === req.params.team);
  res.json(resultAsArr.length > 0 ? resultAsArr[0] : {});
});

router.get('/team/random/by-league/:league', (req, res) => {
  res.json(chooseRandomFromArr(getTeamsByLeague(req.params.league)));
});

module.exports = router;
