const express = require('express')
const path = require('path');
const https = require('https')
const fs = require('fs')
const app = express()
const port = 3000
// custom middleware
const authRoute = require('../routes/auth')
const mongoose = require('mongoose');
const {MONGO_URI} = require('../cert/env.js')

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

app.use(express.static('../views')); // pasta com arquivos estáticos (CSS, imagens, etc.)
app.use(express.urlencoded({ extended: true })); // parser para request body

app.get('../scripts/frontendauth.js', (req, res) => {
  res.set('Content-Type', 'text/javascript');
  res.sendFile(path.resolve('../scripts/frontendauth.js'));
});

app.use('/', authRoute)
// rota para página de login
app.get('/register', (req, res) => {
  res.sendFile(path.resolve('../views/register.html'));
});

https.createServer(
    {
    key: fs.readFileSync('../cert/key.pem'), 
    cert: fs.readFileSync('../cert/cert.pem')
    },app).listen(3000, () => {
    console.log(`Example app listening at https://localhost:${port}`)
    })
    

