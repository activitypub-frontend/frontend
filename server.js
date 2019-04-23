/* eslint-disable no-console */
let express = require('express');
let app = express();
app.use(express.static('public'));
app.listen(5000, () => console.log('Listening on http://127.0.0.1:5000/'));