const crypto = require('crypto');
const express = require('express');
const route = express.Router();


//Servidor vai ser o BOB
route.post('/applyDiffieHellman', (req, res) => {

    //receber o num Primo, o Gerador e a chave do Cliente
    const {p, g, A} = req.body;

    const B = crypto.createDiffieHellman(p, g).generateKeys();
    const secret = crypto.createDiffieHellman(p, g).computeSecret(A);
    const sessionKey = crypto.
    //necessário devolver a chave do Servidor
    res.status(200).json({B, secret});
})