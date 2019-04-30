// import Vue from 'https://cdn.jsdelivr.net/npm/vue@2.6.10/dist/vue.esm.browser.js';
//import Vue from 'vue';
import Vue from './vue.js';

Vue.component('card', {
	props: ['card'],
	template: `<div :id="card.id" class="content-card"><header>{{ card.title }}</header>
<div class="card-content" :id="card.id + '-content'" v-html="card.content"></div></div>`
});

let weatherCardContent = `<div>
	<div :class="weatherClass"></div>
	<p>Aktuelle Temperatur: {{ currentTemp }}</p>
	<div class="temperatureContainer weatherProgressContainer"><span class="tempMinText weatherBadge">{{ minTemp }}</span><progress :max="tempMaxProgress" :value="tempProgress"></progress><span class="tempMaxText weatherBadge">{{ maxTemp }}</span></div>
	<p>Luftfeuchtigkeit:</p>
	<div class="humidityContainer weatherProgressContainer"><progress max="100" :value="humidity"></progress><span><span class="humidityText weatherBadge">{{ humidity }} %</span></div>
	<p>Wolkendichte</p>
	<div class="cloudContainer weatherProgressContainer"><progress max="100" :value="clouds"></progress><span><span class="cloudText weatherBadge">{{ clouds }} %</span></div>
</div>`;

let ttsCardContent = `<div><input @input="getWikiAutocomplete" type="text" id="wikiSearchInput" list="wikiAutocompleteList" placeholder="Artikel laden..."><button type="button" id="wikiSearchButton" @click="getWikipediaData">Suchen</button></div><datalist id="wikiAutocompleteList"></datalist>
<p>{{ wikitext }}</p>
<button type="button" @click="ReadExtract">Vorlesen</button>`;

let rssCardContent = '<div v-html="rsscontent"></div>';

let cardsVue = new Vue({
	el: '#content',
	data: {
		cards: [
			{
				id: 'weatherCard',
				title: 'Current weather in Stuttgart',
				content: weatherCardContent
			},
			{
				id: 'ttsCard',
				title: 'Text-to-Speech from Wikipedia',
				content: ttsCardContent
			},
			{
				id: 'rssCard',
				title: 'RSS Feed from Heise',
				content: rssCardContent
			},
			{
				title: 'Card 4',
				content:
					'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.'
			},
			{
				title: 'Card 5',
				content:
					'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.'
			}
		]
	}
});

let ttsCardVue = new Vue({
	el: '#ttsCard',
	data: {
		wikitext:
			'Suchen Sie nach einem Begriff, um die Daten hier anzeigen zu lassen.'
	},
	methods: {
		getWikipediaData: function() {
			let title = document.getElementById('wikiSearchInput').value;
			if (title !== '') {
				getWikipediaSummary(title);
			}
		},
		ReadExtract: function() {
			TextToSpeech(this.wikitext);
		},
		getWikiAutocomplete: function() {
			let title = document.getElementById('wikiSearchInput').value;
			if (title !== '') {
				WikipediaAutocomplete(title);
			}
		}
	}
});

let rssCardVue = new Vue({
	el: '#rssCard',
	data: {
		rsscontent: ''
	}
});

let weatherCardVue = new Vue({
	el: '#weatherCard-content',
	data: {
		temp: 273.15,
		temp_max: 273.15,
		temp_min: 273.15,
		humidity: 50,
		weathercode: 900,
		clouds: 50
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
			return (this.temp - this.temp_min) / this.temp_min;
		},
		tempMaxProgress: function() {
			return (this.temp_max - this.temp_min) / this.temp_min;
		},
		weatherClass: function() {
			return 'wi wi-owm-' + this.weathercode;
		}
	}
});

function getOWMData() {
	navigator.geolocation.getCurrentPosition(
		data => {
			fetch(
				'https://api.openweathermap.org/data/2.5/weather?APPID=5f867317a42e45aad8ac2fd5f92ddec3&lon=' +
					data.coords.longitude +
					'&lat=' +
					data.coords.latitude
			)
				.then(res => {
					return res.json();
				})
				.then(json => {
					cardsVue.cards.filter(
						item => item.id === 'weatherCard'
					)[0].title = 'Current weather in ' + json.name;
					weatherCardVue.temp = json.main.temp;
					weatherCardVue.temp_max = json.main.temp_max;
					weatherCardVue.temp_min = json.main.temp_min;
					weatherCardVue.humidity = json.main.humidity;
					weatherCardVue.weathercode = json.weather[0].id;
					weatherCardVue.clouds = json.clouds.all;
				});
		},
		() => {
			fetch(
				'https://api.openweathermap.org/data/2.5/weather?q=Stuttgart,DE&APPID=5f867317a42e45aad8ac2fd5f92ddec3'
			)
				.then(res => {
					return res.json();
				})
				.then(json => {
					weatherCardVue.temp = json.main.temp;
					weatherCardVue.temp_max = json.main.temp_max;
					weatherCardVue.temp_min = json.main.temp_min;
					weatherCardVue.humidity = json.main.humidity;
					weatherCardVue.weathercode = json.weather[0].id;
					weatherCardVue.clouds = json.clouds.all;
				});
		}
	);
}

getOWMData();

function TextToSpeech(str) {
	fetch('/getTTS', {
		method: 'POST',
		body: JSON.stringify({ text: str }),
		headers: {
			'Content-Type': 'application/json'
		}
	})
		.then(res => res.blob())
		.then(blob => {
			const reader = new FileReader();
			reader.readAsDataURL(blob);
			reader.onloadend = () => new Audio(reader.result).play();
		});
}

function getWikipediaSummary(title) {
	fetch('https://de.wikipedia.org/api/rest_v1/page/summary/' + title)
		.then(res => {
			ttsCardVue.wikidata = 'Artikel wird geladen...';
			return res.json();
		})
		.then(
			json =>
				(ttsCardVue.wikitext =
					'extract' in json ? json.extract
						: 'Der Artikel konnte nicht gefunden werden.')
		);
}

function getRSSFeed() {
	let container = document.createElement('div');
	container.className = 'rss-container';
	let url = 'https://www.heise.de/rss/heise.rdf';
	fetch('/getFile', {
		method: 'POST',
		body: JSON.stringify({ url: url }),
		headers: {
			'Content-Type': 'application/json'
		}
	})
		.then(res => res.text())
		.then(text => {
			let parser = new DOMParser();
			let doc = parser.parseFromString(text, 'text/xml');
			Array.from(doc.querySelectorAll('item'))
				.slice(0, 10)
				.forEach(item => {
					let article = document.createElement('article');
					let heading = document.createElement('h1');
					let heading_link = document.createElement('a');
					heading_link.rel = 'noreferrer';
					heading_link.target = '_blank';
					heading_link.href = item.querySelector('guid').textContent;
					heading_link.textContent = item.querySelector(
						'title'
					).textContent;
					heading.appendChild(heading_link);
					article.appendChild(heading);
					let published = document.createElement('div');
					published.textContent =
						'Erschienen ' +
						new Date(
							Date.parse(item.querySelector('pubDate').innerHTML)
						).toLocaleString('de-DE');
					article.appendChild(published);
					let content = document.createElement('div');
					content.innerHTML = item.getElementsByTagName(
						'content:encoded'
					)[0].childNodes[0].data;
					article.appendChild(content);
					container.appendChild(article);
					rssCardVue.rsscontent = container.outerHTML;
				});
		});
}

getRSSFeed();

function WikipediaAutocomplete(title) {
	let url =
		'https://de.wikipedia.org/w/api.php?action=opensearch&namespace=0&format=json&search=' +
		encodeURIComponent(title);
	fetch('/getFile', {
		method: 'POST',
		body: JSON.stringify({ url: url }),
		headers: {
			'Content-Type': 'application/json'
		}
	})
		.then(res => res.json())
		.then(json => {
			let datalist = document.getElementById('wikiAutocompleteList');
			datalist.innerHTML = '';
			json[1].forEach(item => {
				let option = document.createElement('option');
				option.value = item;
				datalist.appendChild(option);
			});
		});
}
