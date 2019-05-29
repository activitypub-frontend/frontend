/**
 * The functions for the site
 */

'use strict';

import Vue from './vue.js';
import Chart from './Chart.js';
import rssFeed from './rssFeed.js';

/**
 * Mischt zwei Farben in einem Verhältnis,
 * entsprechend dem linear-gradient in CSS.
 * @param {number[]} c1 Erste Farbe
 * @param {number[]} c2 Zweite Farbe
 * @param {number} mix Verhältnis zwischen den beiden Farben.
 * 0.0 - Erste Farbe, 1.0 - Zweite Farbe
 * @return {number[]} Gemischte Farbe
 */
const mixColor = (c1, c2, mix) => [
  c1[0] * (1 - mix) + c2[0] * mix,
  c1[1] * (1 - mix) + c2[1] * mix,
  c1[2] * (1 - mix) + c2[2] * mix,
];

const toTwoDigitNumber = (num) => num < 10 && num >= 0 ?
  '0' + num.toFixed(0) :
  num.toFixed(0);

/**
 * Wandelt eine Zahl in den entsprechenden Hexwert um für CSS-Farben
 * @param {number} rgb Farbe als Dezimalzahl (0-255)
 * @return {string} Hexwert (00-FF)
 */
function rgbToHex(rgb) {
  const hex = Number(Number(rgb).toFixed(0)).toString(16);
  return hex.length < 2 ? '0' + hex : hex;
}

/**
 * Parses the JSON from OpenWeatherMap for the current weather
 * @param {object} json JSON to be parsed for current weather
 */
function parseWeatherData(json) {
  weatherCardVue.title = 'Current weather in ' + json.name;
  weatherCardVue.temp = json.main.temp;
  weatherCardVue.temp_max = json.main.temp_max;
  weatherCardVue.temp_min = json.main.temp_min;
  weatherCardVue.humidity = json.main.humidity;
  weatherCardVue.weathercode = json.weather[0].id;
  weatherCardVue.clouds = json.clouds.all;
  const color = mixColor(
    [255, 170, 170],
    [170, 170, 255],
    ((json.main.temp - 273.15 - (json.main.temp_min - 273.15)) /
      (json.main.temp_min - 273.15))
  );
  document.documentElement.style.setProperty(
    '--current-temp-color',
    '#' + rgbToHex(color[0]) + rgbToHex(color[1]) + rgbToHex(color[2])
  );
}

const ttsCardVue = new Vue({
  el: '#ttsCard',
  data: {
    title: 'Text-to-Speech from Wikipedia',
    wikitext: 'Use the search to view any article.',
  },
  methods: {
    getWikipediaData: function() {
      const title = document.getElementById('wikiSearchInput').value;
      if (title !== '') {
        getWikipediaSummary(title);
      }
    },
    ReadExtract: function() {
      textToSpeech(this.wikitext);
    },
    getWikiAutocomplete: function() {
      const title = document.getElementById('wikiSearchInput').value;
      if (title !== '') {
        wikipediaAutocomplete(title);
      }
    },
  },
});

const rssCardVue = new Vue({
  el: '#rssCard',
  data: {
    title: 'RSS-Feed from Heise',
    rsscontent: '',
  },
});

const vvsCardVue = new Vue({
  el: '#vvsCard',
  data: {
    title: 'Next departures from Stadtmitte',
    vvscontent: '',
  },
});

const mastodonCardVue = new Vue({
  el: '#mastodonCard',
  data: {
    title: 'Your Mastodon-Feed',
    mastodoncontent: '',
  },
  methods: {
    mastodonLogin: function() {
      const mInstance = document.getElementById('mastodonInstance').value;
      doMastodonAuth(mInstance);
    }
  }
});


const weatherCardVue = new Vue({
  el: '#weatherCard',
  data: {
    title: 'Current weather in Stuttgart',
    temp: 273.15,
    temp_max: 273.15,
    temp_min: 273.15,
    humidity: 50,
    weathercode: 900,
    clouds: 50,
  },
  computed: {
    currentTemp: function() {
      return (this.temp - 273.15).toFixed(1) + '\u00A0°C';
    },
    maxTemp: function() {
      return (this.temp_max - 273.15).toFixed(1) + '\u00A0°C';
    },
    minTemp: function() {
      return (this.temp_min - 273.15).toFixed(1) + '\u00A0°C';
    },
    tempProgress: function() {
      return (
        (this.temp - 273.15 - (this.temp_min - 273.15)) /
        (this.temp_min - 273.15)
      );
    },
    tempMaxProgress: function() {
      return (
        (this.temp_max - 273.15 - (this.temp_min - 273.15)) /
        (this.temp_min - 273.15)
      );
    },
    weatherClass: function() {
      return 'wi wi-owm-' + this.weathercode;
    },
  },
});

const weatherForecastCardVue = new Vue({
  el: '#weatherForecastCard',
  data: {
    title: 'Weather forecast in Stuttgart',
  },
});

/**
 * Gets the data from OpenWeatherMap
 */
function getOWMData() {
  fetch(
      'https://api.openweathermap.org/data/2.5/weather?q=Stuttgart,DE&APPID=5f867317a42e45aad8ac2fd5f92ddec3'
    )
    .then((res) => {
      return res.json();
    })
    .then((json) => {
      parseWeatherData(json);
    });
  navigator.geolocation.getCurrentPosition((data) => {
    fetch(
        'https://api.openweathermap.org/data/2.5/weather?APPID=5f867317a42e45aad8ac2fd5f92ddec3&lon=' +
        data.coords.longitude +
        '&lat=' +
        data.coords.latitude
      )
      .then((res) => {
        return res.json();
      })
      .then((json) => {
        parseWeatherData(json);
      });
  });
}
getOWMData();

/**
 * Text-to-speech for Wikipedia articles
 * @param {string} str The Text to be converted to speech
 */
function textToSpeech(str) {
  fetch('/getTTS', {
      method: 'POST',
      body: JSON.stringify({
        text: str
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })
    .then((res) => res.blob())
    .then((blob) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => new Audio(reader.result).play();
    });
}

/**
 * Gets the summary from a Wikipedia article
 * @param {string} title Article to get the summary from
 */
function getWikipediaSummary(title) {
  fetch('https://de.wikipedia.org/api/rest_v1/page/summary/' + title)
    .then((res) => {
      ttsCardVue.wikidata = 'Artikel wird geladen...';
      return res.json();
    })
    .then(
      (json) =>
      (ttsCardVue.wikitext =
        'extract' in json ?
        json.extract :
        'Der Artikel konnte nicht gefunden werden.')
    );
}

/**
 * Gets the Heise RSS feed.
 */
function getRSSFeed() {
  rssFeed('https://www.heise.de/rss/heise.rdf').then((container) => rssCardVue.rsscontent = container.outerHTML, (_reason) => {});
}

/**
 * Get the data for autocomplete Wikipedia article names
 * @param {string} title The part of name which is typed in to autocomplete
 */
function wikipediaAutocomplete(title) {
  const url =
    'https://de.wikipedia.org/w/api.php?action=opensearch&namespace=0&format=json&search=' + encodeURIComponent(title);
  fetch('/getFile', {
      method: 'POST',
      body: JSON.stringify({
        url: url
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })
    .then((res) => res.json())
    .then((json) => {
      const datalist = document.getElementById('wikiAutocompleteList');
      datalist.innerHTML = '';
      json[1].forEach((item) => {
        const option = document.createElement('option');
        option.value = item;
        datalist.appendChild(option);
      });
    });
}

const forecastChart = new Chart(
  document.getElementById('weatherForecastChart'), {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
          label: 'Forecast (Minimum)',
          data: [],
          backgroundColor: 'rgba(34, 12, 169, 0.3)',
          borderColor: 'rgba(34, 12, 169, 1)',
          borderWidth: 1,
        },
        {
          label: 'Forecast (Maximum)',
          data: [],
          backgroundColor: 'rgba(169, 12, 34, 0.3)',
          borderColor: 'rgba(169, 12, 34, 1)',
          borderWidth: 1,
        },
      ],
    },
  });

/**
 * Parses the data for the weather forecast
 * @param {object} json The data for the weather forecast
 */
function parseWeatherForecast(json) {
  weatherForecastCardVue.title =
    'Forecast for ' + json.city.name;
  json.list.forEach((item) =>
    forecastChart.data.labels.push(
      new Date(item.dt_txt).toLocaleDateString('de-DE', {
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    )
  );
  json.list.forEach((item) =>
    forecastChart.data.datasets[0].data.push(
      (item.main.temp_min - 273.15).toFixed(1)
    )
  );
  json.list.forEach((item) =>
    forecastChart.data.datasets[1].data.push(
      (item.main.temp_max - 273.15).toFixed(1)
    )
  );
  forecastChart.update();
}

/**
 * fetches the data for the weather forecast
 */
function getOWMForecast() {
  fetch(
      'https://api.openweathermap.org/data/2.5/forecast?q=Stuttgart,DE&APPID=5f867317a42e45aad8ac2fd5f92ddec3'
    )
    .then((res) => {
      return res.json();
    })
    .then((json) => parseWeatherForecast(json));
  navigator.geolocation.getCurrentPosition((data) =>
    fetch(
      'https://api.openweathermap.org/data/2.5/forecast?APPID=5f867317a42e45aad8ac2fd5f92ddec3&lon=' +
      data.coords.longitude +
      '&lat=' +
      data.coords.latitude
    )
    .then((res) => {
      return res.json();
    })
    .then((json) => parseWeatherForecast(json))
  );
}

getOWMForecast();

/**
 * Gets the VVS data
 */
function getVVSData() {
  fetch('/getFile', {
    method: 'POST',
    body: JSON.stringify({
      url: 'https://www2.vvs.de/oeffi/XSLT_DM_REQUEST?outputFormat=JSON&language=de&stateless=1&type_dm=stop&name_dm=5006056&useRealtime=1&mode=direct&ptOptionsActive=1&deleteAssignedStops_dm=1&useProxFootSearch=0&mergeDep=1&limit=12&itdTime=' + toTwoDigitNumber((new Date()).getHours()) + toTwoDigitNumber((new Date()).getMinutes())
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  }).then((res) => res.json()).then((json) => {
    const div = document.createElement('div');
    json.departureList.forEach((el) => {
      const realTime = new Date(el.realDateTime.year, el.realDateTime.month - 1, el.realDateTime.day, el.realDateTime.hour, el.realDateTime.minute);
      const expectedTime = new Date(el.dateTime.year, el.dateTime.month - 1, el.dateTime.day, el.dateTime.hour, el.dateTime.minute);
      const delay = realTime > expectedTime;
      const row = document.createElement('article');
      const lineBadge = document.createElement('span');
      lineBadge.textContent = el.servingLine.number;
      if (el.servingLine.number[0] === 'S') {
        lineBadge.classList.add('sBahnBadge');
      } else if (el.servingLine.number[0] === 'U') {
        lineBadge.classList.add('uBahnBadge');
      } else {
        lineBadge.classList.add('busBadge');
      }
      lineBadge.classList.add('lineBadge');
      row.appendChild(lineBadge);
      const destText = document.createElement('span');
      destText.classList.add('destination');
      destText.textContent = el.servingLine.direction;
      row.appendChild(destText);
      const countdownText = document.createElement('span');
      countdownText.textContent = 'in ' + el.countdown + ' min';
      if (delay) {
        countdownText.classList.add('delayed');
      }
      row.appendChild(countdownText);
      div.appendChild(row);
    });
    vvsCardVue.vvscontent = div.innerHTML;
  });
}

function initMastodon() {
  // ToDo: Check Cookie

  // ToDo: Check Valid session

  // ToDo: Check if code is available
  
}

function doMastodonAuth(mInstance) {
  fetch('/mastodon/' + mInstance + '/oauth', {
    method: 'GET'
  }).then((res) => res.json()).then((json) => {
    if (!json.client_id) {
      throw "No client_id";
    }
    if (!json.success) {
      throw "Server Side Problem";
    }
    window.location.replace("https://" + mInstance + "/oauth/authorize?scope=read&response_type=code&redirect_uri=https://dashboard.tinf17.in&client_id=" + json.client_id);
  }).catch((e) => {
    mastodonCardVue.mastodoncontent = `
      Login failed.
    `;

  });
}
setInterval(() => {
  getVVSData();
  getRSSFeed();
}, 60 * 1000);
getVVSData();
getRSSFeed();
initMastodon();
document.querySelector('.lightdarkswitch').onclick = () => {
  document.querySelector('html').classList.toggle('dark');
  document.querySelector('.lightdarkswitch').classList.toggle('wi-day-sunny');
  document.querySelector('.lightdarkswitch').classList.toggle('wi-night-clear');
};
