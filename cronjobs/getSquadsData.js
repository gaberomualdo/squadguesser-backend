const fetch = require('node-fetch');
const { JSDOM } = require('jsdom');
const { makeURL } = require('./utils');
const cliProgress = require('cli-progress');

const makeClubSquads = (squadsURLs, callback) => {
  let allSquadData = {};

  const squadTypes = Object.keys(squadsURLs);

  let done = 0;
  let total = Object.values(squadsURLs)
    .map((e) => e.length)
    .reduce((a, b) => a + b, 0);

  const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  progressBar.start(total, 0);

  Object.values(squadsURLs).forEach((urls, idx) => {
    const typeName = squadTypes[idx];
    allSquadData[typeName] = [];

    setTimeout(() => {
      urls.forEach((url, urlIdx) => {
        setTimeout(async () => {
          let squadData = {};

          let urlData;
          try {
            urlData = await (await fetch(url)).text();
          } catch {
            console.error(`Problem requesting url ${url}`);
            return;
          }

          const dom = new JSDOM(urlData);
          const doc = dom.window.document;

          // club info
          (() => {
            // left side (name, image logo, etc.)
            const elm = doc.querySelector('.row.pt-3 > div:first-child > div:first-child');
            squadData.logoURL = makeURL(elm.querySelector('img').getAttribute('data-src'));
            squadData.stars =
              Array.from(elm.querySelectorAll('p i.fas:not(.fa-star-half-alt)')).length +
              0.5 * Array.from(elm.querySelectorAll('p i.fas.fa-star-half-alt')).length;
            squadData.league = {
              name: elm.querySelector('h2 a').textContent.trim(),
              // url: makeURL(elm.querySelector('h2 a').href),
            };
            squadData.name = elm.querySelector('h1').firstChild.nodeValue.trim();
          })();
          (() => {
            squadData.fifaMiscData = { ratings: {} };
            // right side (rival, FIFA rating, etc.)
            const elms = Array.from(doc.querySelectorAll('.row.pt-3 > div:nth-child(2) ul li'));

            for (let i = 0; i < 5; i++) {
              const elm = elms[i];
              if (i === 0) {
                squadData.fifaMiscData.rival = {
                  name: elm.querySelector('span a').textContent.trim(),
                  // url: makeURL(elm.querySelector('span a').href),
                };
              } else if (i === 4) {
                squadData.fifaMiscData.transferBudgetDollars = elm
                  .querySelector('span.data-currency-dollar')
                  .textContent.split('.')
                  .join('')
                  .split(',')
                  .join('')
                  .split('$')
                  .join('');
              } else {
                squadData.fifaMiscData.ratings[elm.firstChild.textContent.trim().toLowerCase()] = parseInt(elm.querySelector('span').textContent);
              }
            }
          })();

          // club players
          (() => {
            squadData.players = [];
            const elms = Array.from(doc.querySelector('.table-players').querySelectorAll('tbody > tr'));
            elms.forEach((elm) => {
              const playerData = {};
              Array.from(elm.querySelectorAll('td')).forEach((item, i) => {
                try {
                  if (i === 0) {
                    playerData.kitNumber = parseInt(item.textContent);
                  } else if (i === 1) {
                    playerData.positionName = item.textContent;
                  } else if (i === 2) {
                    playerData.photoURL = makeURL(item.querySelector('a img').getAttribute('data-src'));
                  } else if (i === 3) {
                    playerData.nationality = {
                      // url: makeURL(item.querySelector('a').href),
                      name: item.querySelector('a').getAttribute('title'),
                      flagURL: makeURL(item.querySelector('a img').getAttribute('data-src')),
                    };
                  } else if (i === 4) {
                    playerData.fifaRating = {
                      overall: parseInt(item.querySelector('span:first-child').textContent),
                      potential: parseInt(item.querySelector('span:last-child').textContent),
                    };
                  } else if (i === 5) {
                    playerData.name = item.querySelector('a').firstChild.textContent;
                    playerData.url = makeURL(item.querySelector('a').href);
                  } else if (i === 7) {
                    playerData.age = parseInt(item.textContent);
                  }
                } catch (err) {}
              });
              if (playerData.name && playerData.url && playerData.age && playerData.kitNumber) {
                squadData.players.push(playerData);
              } else {
                console.error('Error with team ' + squadData.name);
              }
            });
          })();

          // formation
          (() => {
            squadData.formation = [];

            const getPlayerByURL = (url) => {
              for (let i = 0; i < squadData.players.length; i++) {
                if (squadData.players[i].url === url) {
                  return squadData.players[i];
                }
              }
            };

            const elms = Array.from(doc.querySelectorAll('.formation > .player'));
            elms.forEach((elm) => {
              const playerURL = makeURL(elm.querySelector('a').href);
              const playerData = JSON.parse(JSON.stringify(getPlayerByURL(playerURL)));
              const playerShortName = elm.querySelector('div.name a').textContent.trim();
              playerData.shortName = playerShortName;

              delete playerData.url;

              const coords = elm
                .getAttribute('style')
                .split('left:')
                .join('')
                .split('bottom:')
                .join('')
                .split('%')
                .join('')
                .split(';')
                .slice(0, 2)
                .map((e) => parseInt(e));
              playerData.positionCoords = {
                x: coords[0],
                y: coords[1],
              };

              squadData.formation.push(playerData);
            });
          })();

          delete squadData.players;

          allSquadData[typeName].push(squadData);

          done++;
          progressBar.update(done);
          if (done === total) {
            progressBar.stop();
            callback(allSquadData);
          }
        }, urlIdx * 200);
      });
    }, idx * 6000);
  });
};
module.exports = makeClubSquads;
