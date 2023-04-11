const express = require('express')
const https = require('https')
const fs = require('fs')
const app = express()
const port = 4000

https.createServer(
    {
    key: fs.readFileSync('key.pem'), 
    cert: fs.readFileSync('cert.pem')
    },app).listen(port, () => {
    console.log(`Example app listening at https://localhost:${port}`)
    })

app.get('/', (req, res) => res.send('Hello World!'))