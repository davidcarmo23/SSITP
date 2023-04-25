const express = require('express')
const path = require('path');
const https = require('https')
const fs = require('fs')
const app = express()
const port = 3000
// custom middleware
const authRoute = require('../routes/auth')


app.use(express.static('../views')); // pasta com arquivos estáticos (CSS, imagens, etc.)
app.use(express.urlencoded({ extended: true })); // parser para request body

app.get('../scripts/frontendauth.js', (req, res) => {
  res.set('Content-Type', 'text/javascript');
  res.sendFile(path.resolve('../scripts/frontendauth.js'));
});

app.use('/', authRoute)
// rota para página de login
app.get('/login', (req, res) => {
  res.sendFile(path.resolve('../views/login.html'));
});




https.createServer(
    {
    key: fs.readFileSync('../cert/key.pem'), 
    cert: fs.readFileSync('../cert/cert.pem')
    },app).listen(3000, () => {
    console.log(`Example app listening at https://localhost:${port}`)
    })
    

