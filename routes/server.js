const express = require('express')
const https = require('https')
const fs = require('fs')
const app = express()
const port = 3000

// custom middleware
const authRoute = require('../routes/auth')

app.use('/', authRoute)


https.createServer(
    {
    key: fs.readFileSync('../cert/key.pem'), 
    cert: fs.readFileSync('../cert/cert.pem')
    },app).listen(3000, () => {
    console.log(`Example app listening at https://localhost:${port}`)
    })

