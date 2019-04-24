/* eslint-disable no-console */
const express = require('express');
const request = require('request');
const app = express();
app.use(express.json());
app.post('/getFile', (req, res) => {
	let url = req.body.url;
	request.get(url, (error, resp, body) => {
		res.send(body);
	});
});
app.use(express.static('public'));
app.listen(5000, () => console.log('Listening on http://127.0.0.1:5000/'));