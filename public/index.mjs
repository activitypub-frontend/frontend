// import Vue from 'https://cdn.jsdelivr.net/npm/vue@2.6.10/dist/vue.esm.browser.js';
//import Vue from 'vue';
import Vue from './vue.js';

Vue.component('card', {
	props: ['card'],
	template: `<div v-bind:id="card.id" class="content-card"><header>{{ card.title }}</header>
<div class="card-content"><span v-html="card.content"></span></div></div>`
});

let ttsCardContent = `<div><input type="text" id="wikiSearchInput" placeholder="Artikel laden..."><button id="wikiSearchButton" v-on:click="getWikipediaData">Suchen</button></div>
<p>{{ wikitext }}</p>
<button v-on:click="ReadExtract">Vorlesen</button>`;

let rssCardContent = '<div v-html="rsscontent"></div>';

let cardsVue = new Vue({
	el: '#content',
	data: {
		cards: [
			{
				id: 'weatherCard',
				title: 'Aktuelles Wetter in Stuttgart',
				content: ''
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

// Wiki autocomplete = https://de.wikipedia.org/w/api.php?action=opensearch&search=mariano&namespace=0&format=json

let ttsCardVue = new Vue({
	el: '#ttsCard',
	data: {
		wikitext: 'Dies ist ein Wikitest'
	},
	methods: {
		getWikipediaData: function(event) {
			getWikipediaSummary(
				document.getElementById('wikiSearchInput').value
			);
		},
		ReadExtract: function(event) {
			TextToSpeech(this.wikitext);
		}
	}
});

let rssCardVue = new Vue({
	el: '#rssCard',
	data: {
		rsscontent: ''
	}
});

function getOWMData() {
	fetch(
		'https://api.openweathermap.org/data/2.5/weather?q=Stuttgart,DE&APPID=5f867317a42e45aad8ac2fd5f92ddec3'
	)
		.then(res => {
			return res.json();
		})
		.then(json => {
			cardsVue.cards[0].content = `Aktuelle Temperatur: ${(
				json.main.temp - 273.15
			).toFixed(1)} °C`;
		});
}

getOWMData();

function TextToSpeech(str) {
	let url = 'https://stream.watsonplatform.net/text-to-speech/api';
	let username = '***REMOVED***';
	let password = '***REMOVED***';
	fetch(url + '/v1/synthesize?voice=de-DE_BirgitVoice', {
		method: 'POST',
		cache: 'no-cache',
		headers: {
			Authorization: 'Basic ' + btoa(username + ':' + password),
			Accept: 'audio/mpeg',
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			text: str,
			accept: 'audio/mpeg'
		})
	})
		.then(res => {
			return res.blob();
		})
		.then(blob => {
			const reader = new FileReader();
			reader.readAsDataURL(blob);
			reader.onloadend = () => {
				let audio = new Audio(reader.result);
				audio.play();
			};
		});
}

function getWikipediaSummary(title) {
	let url = 'https://de.wikipedia.org/api/rest_v1/page/summary/' + title;
	fetch(url)
		.then(res => res.json())
		.then(json => {
			if ('extract' in json) {
				ttsCardVue.wikitext = json.extract;
			} else {
				ttsCardVue.wikitext =
					'Der Eintrag konnte nicht gefunden werden.';
			}
		});
}

function getRSSFeed()
{
	let container = document.createElement('div');
	container.className = 'rss-container';
	let url = 'https://www.heise.de/rss/heise.rdf';
	fetch('/getFile',
		{ 
			method: 'POST', 
			body: JSON.stringify({url: url}), 
			headers: 
				{
					'Content-Type': 'application/json'
				}
		})
		.then((res) => res.text())
		.then((text) => {
			let parser = new DOMParser();
			let doc = parser.parseFromString(text, 'text/xml');
			Array.from(doc.querySelectorAll('item')).slice(0, 10).forEach((item) => {
				let article = document.createElement('article');
				let heading = document.createElement('h1');
				let heading_link = document.createElement('a');
				heading_link.href = item.querySelector('guid').textContent;
				heading_link.textContent = item.querySelector('title').textContent;
				heading.appendChild(heading_link);
				article.appendChild(heading);
				let content = document.createElement('div');
				content.innerHTML = item.getElementsByTagName('content:encoded')[0].childNodes[0].data;
				article.appendChild(content);
				container.appendChild(article);
				rssCardVue.rsscontent = container.outerHTML;
			});
		});
}

getRSSFeed();