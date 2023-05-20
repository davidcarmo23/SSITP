//dependências
const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const axios = require('axios');
const mongoose = require('mongoose');
const {MONGO_URI} = require('../cert/env.js')
const bcrypt = require('bcrypt');
const uuid = require('uuid');

//modelo de dados
const User = require('../models/User');

//variaveis temporárias
let ivs = {};
let ephemeralKeys = {};


//conexão à base de dados mongodb
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



  router.post('/login', async (req, res) => {
  try {
    if (!(req.body.username) || !(req.body.hashedPassword)) {
      res.status(406).json("É necessário introduzir todos os dados");
    }

    const user = await UserModel.findOne({
      username: req.body.username,
    });

    if (req.body.hashedPassword === user.password) {
      const token = jwt.sign({ userID: user._id }, TOKEN_SECRET, {
        expiresIn: "6h",
      });

      await user.save();

      const id = user._id.toString();
      res
      .cookie("token", token, {
          httpOnly: false,
          secure: TOKEN_SECRET === "production",
        })
        .cookie("userID", id, {
          httpOnly: false,
          secure: TOKEN_SECRET === "production",
        })

      return res.status(200).json({message: "Login feito com sucesso"});  
      } else {
      return res.status(404).json({message: "Dados Inválidos"});
    }
  }catch(err) {
    return res.status(500).json({message: "Ocorreu um erro interno"})
  }
});

router.get('/logout', function(req, res, next) {
  req.logout();
  res.redirect('/auth/login');
});

//método para gerar par de chaves de uso único para o servidor
router.post('/establishCommon', async (req, res) => {
  try {
    //gerar par de chaves de uso único para o servidor ECDH
    const serverKeyPair = await crypto.generateKeyPairSync('ec', {
      namedCurve: 'P-256',
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    });
    //Chaves Servidor
    console.log(serverKeyPair)

    //gerar iv para a sessão
    let iv = crypto.randomBytes(16);
    iv = iv.toString('hex');

    //gerar uuid do utilizador para a sessão
    let userID = uuid.v4();
    console.log("UUID")
    console.log(userID)
    console.log("IV")
    console.log(iv)
    console.log("Chave pública efémera do cliente")
    console.log(req.body.clientPublicKey)

    //guardar o iv e a chave pública efémera para a sessão 
    ivs[userID] = iv;
    ephemeralPKeys[userID] = req.body.clientPublicKey
    ephemeralSKeys[userID] = serverKeyPair.privateKey;
    let chavePublicaServidor = serverKeyPair.publicKey;

    res.status(200).json({chavePublicaServidor, iv, userID});
  } catch (error) {
    return res.status(500).json({message: "Ocorreu um erro a gerar a chave de sessão"});
  }
});


router.post('/register', async (req, res) => {
  
  //gerar segredo partilhado utilizando a chave privada efémera do servidor e a chave pública efémera do cliente
  const sharedSecret = crypto.diffieHellman({
    privateKey: ephemeralSKeys[req.body.userID],
    publicKey: ephemeralPKeys[req.body.userID]
  });

  //desencriptar a mensagem (dados de registo) com a chave de sessão e o iv
  const decipher = crypto.createDecipheriv('aes-256-cbc', sharedSecret, ivs[req.body.userID]);
  let decrypted = decipher.update(req.body.data, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  console.log(JSON.parse(decrypted))
  
  try {
    //verificação de todos os dados inseridos
    if (
      !(
        decrypted.hashedUsername &&
        decrypted.hashedEmail &&
        decrypted.hashedPassword &&
        decrypted.hashedCertificate &&
        decrypted.Usalt &&
        decrypted.Esalt &&
        decrypted.Psalt &&
        decrypted.Csalt
      )
    ){
      res.status(406).json({message: "Certifique-se que introduziu todos os dados!"});
    }

    //verificação de utilizador existente
    if (
      (await User.findOne({ username: decrypted.hashedUsername })) ||
      (await User.findOne({ email: decrypted.hashedEmail }))
    ) {
      return res.status(406).json({message: "Dados Inválidos"});
    }

    //criação da conta
    var User = mongoose.model('User');
    var user = new User({
      username: decrypted.hashedUsername,
      email: decrypted.hashedEmail,
      password: decrypted.hashedPassword,
      certificate: decrypted.hashedCertificate,
      Usalt: decrypted.Usalt,
      Esalt: decrypted.Esalt,
      Psalt: decrypted.Psalt,
      Csalt: decrypted.Csalt
    });

    await user.save();
    //remover iv e chave efémera da sessão associados
    ivs[req.body.userID] = null;
    ephemeralKeys[req.body.userID] = null;

    return res.status(200).json({message: "Utilizador registado com sucesso!"});
  } catch (error) {
    return res.status(500).json({message: "Ocorreu um erro no registo"});
  }
});


module.exports = router;