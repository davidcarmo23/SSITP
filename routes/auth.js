
var path = require('path');
var passport = require('passport');
var LocalStrategy = require('passport-local')
var crypto = require('crypto');
// conexão à firebase
var firebase = require('firebase');

var express = require('express');
var page = path.join(__dirname, '../views/login.html');
var router = express.Router();

router.get('/login', function(req, res, next) {
  res.sendFile(page);
});

module.exports = router;