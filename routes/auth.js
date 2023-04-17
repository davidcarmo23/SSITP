
var path = require('path');
var passport = require('passport');
var LocalStrategy = require('passport-local')
var crypto = require('crypto');

/*conexão à firebase
var admin = require('firebase-admin');
var serviceAccount = require("../cert/ssitg-21650-firebase-adminsdk-pp19d-763452aba8.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://ssitg-21650.firebaseio.com"
});

var db = admin.database();
//referencia ao documento de utilizadores
var ref = db.ref("Users/")*/

//conexão à base de dados mongodb
var mongoose = require('mongoose');
const {MONGO_URI} = require('../cert/.env')

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("Ligação com a base de dados bem sucedida");
  })
  .catch((error) => {
    console.log("Ligação com a base de dados falhou, a encerrar!");
    console.error(error);
    process.exit(1);
  });

var express = require('express');
var page = path.join(__dirname, '../views/login.html');
var router = express.Router();

router.get('/login', function(req, res, next) {
  res.sendFile(page);
});

module.exports = router;