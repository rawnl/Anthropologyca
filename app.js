const express = require('express');

const app = express();

app.use(() => console.log('This is a middleware'));

module.exports = app;
