/* eslint-disable no-console */
const express = require('express');
const request = require('request');
const btoa = require('btoa');
const app = express();
app.use(express.json());
app.post('/getTTS', (req, res) => {
	request.post('https://stream.watsonplatform.net/text-to-speech/api/v1/synthesize?voice=de-DE_BirgitVoice', {
		headers: {
			Authorization: 'Basic ' + btoa(''),
			Accept: 'audio/mpeg',
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			text: req.body.text,
			accept: 'audio/mpeg'
		})
	}).pipe(res);
});
app.post('/getFile', (req, res) => request.get(req.body.url).pipe(res));
app.use(express.static('public'));
app.listen(5000, () => console.log('Listening on http://127.0.0.1:5000/'));
