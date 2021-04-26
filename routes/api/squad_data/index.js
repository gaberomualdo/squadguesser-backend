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

const avgRatings = (x) => Object.values(x).reduce((a, b) => a + b, 0) / Object.keys(x).length;
const getTopTeams = (cutOff = 50) => {
  const teams = getAllTeams();
  teams.sort((a, b) => avgRatings(a.fifaMiscData.ratings) - avgRatings(b.fifaMiscData.ratings)).reverse();
  return teams.slice(0, cutOff);
};
const getWorstTeams = (cutOff = 50) => {
  const teams = getAllTeams();
  teams.sort((a, b) => avgRatings(a.fifaMiscData.ratings) - avgRatings(b.fifaMiscData.ratings));
  return teams.slice(0, cutOff);
};

const getDailyChallengeTeams = () => {
  const leagues = Object.keys(data);
  return getTopTeams(20);
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
  {
    name: 'Top 40 Teams',
    teams: () => getTopTeams(50),
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

router.get('/dailychallenge/:date/team', (req, res) => {
  const teams = getDailyChallengeTeams();
  const randomGenerator = seedrandom(req.params.date);
  const team = teams[Math.floor(randomGenerator() * teams.length)];
  res.json(team);
});
router.get('/dailychallenge/:date/formationtypes', (req, res) => {
  const randomGenerator = seedrandom(req.params.date);
  // generate gamemode
  const enabledGameTypes = [];
  for (let i = 0; i < 5; i++) {
    if (Math.floor(randomGenerator() * 2) === 0) {
      // choose whether the gametype is enabled or not
      enabledGameTypes.push(i);
    }
  }
  // generate formation
  const formation = [];
  for (let k = 0; k < 11; k++) {
    formation.push(enabledGameTypes[Math.floor(randomGenerator() * enabledGameTypes.length)]);
  }
  res.json(formation);
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
router.get('/stats', (req, res) => {
  const teamsCount = getAllTeams().length;
  res.json({
    leaguesCount: Object.keys(data).length + additionalLeagues.length,
    teamsCount,
    playersCount: teamsCount * 11,
    gameTypesCount: 4,
  });
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

router.get('/teams/all/by-league/onlynamesandlogos', (req, res) => {
  const fullData = {};
  getListOfLeagues().forEach((l) => {
    fullData[l] = getTeamsByLeague(l).map((e) => {
      return { logoURL: e.logoURL, name: e.name };
    });
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
