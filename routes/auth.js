//dependências
const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const {MONGO_URI} = require('../cert/env.js')
const bcrypt = require('bcrypt');

//modelo de dados
const User = require('../models/User');

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
router.post('/genSessionKeys', async (req, res) => {
  try {
    //Diffie-Hellman
    const group = 'modp14'; //grupo de chaves a usar
    const server = crypto.createDiffieHellman(group);

    //gerar par de chaves de uso único para o servidor
    const serverKey = server.generateKeys();
    const serverPublicKey = server.getPublicKey('hex');

    //receber chave pública do user
    const clientPublicKey = req.body.clientPublicKey;

    //gerar chave de sessão
    const sharedSecret = server.computeSecret(clientPublicKey, 'hex', 'hex');
    console.log("Secret: " + sharedSecret);
    return res.status(200).json({sharedSecret});
  } catch (error) {
    return res.status(500).json({message: "Ocorreu um erro no Diffie-Hellman"});
  }
});


router.post('/register', async (req, res) => {
  
  //desencriptar a mensagem (dados de registo) com a chave de sessão 
  const decipher = crypto.createDecipheriv('aes-256-cbc', req.body.sharedSecret, req.body.iv);
  let decrypted = decipher.update(req.body.message, 'hex', 'utf8');
  decrypted += decipher.final('utf8');


  try {
    //verificação de todos os dados inseridos
    if (
      !(
        decrypted.username &&
        decrypted.email &&
        decrypted.hashedPassword &&
        decrypted.Psalt &&
        decrypted.role &&
        decrypted.name &&
        decrypted.address &&
        decrypted.phone &&
        decrypted.certificate &&
        decrypted.clientPublicKey
      )
    ){
      res.status(406).json({message: "Certifique-se que introduziu todos os dados!"});
    }

    //verificação de utilizador existente
    if (
      (await User.findOne({ username: decrypted.username })) ||
      (await User.findOne({ email: decrypted.email }))
    ) {
      return res.status(406).json({message: "Dados Inválidos"});
    }

    //criação da conta
    var User = mongoose.model('User');
    var user = new User({
      username: decrypted.username,
      email: decrypted.email,
      password: decrypted.hashedPassword,
      Psalt: decrypted.Psalt,
      role: decrypted.role,
      name: decrypted.name,
      address: decrypted.address,
      phone: decrypted.phone,
      Csalt: '',
      certificate: decrypted.certificate,
      pKey: decrypted.clientPublicKey,
    });

    //verificação de certificado introduzido
    if (!decrypted.certificate) {
      return res.status(400).send('Certificado digital inválido');;
    }

    //verificação de certificado válido com chave pública do utilizador
    const CertReceived = new crypto.X509Certificate(fs.readFileSync(certificate));
    if(CertReceived.verify(decrypted.clientPublicKey)) {
      await user.save();
      return res.status(200).json({message: "Utilizador registado com sucesso!"});
    } else {
      return res.status(400).send('Certificado digital inválido');
    }
  } catch (error) {
    return res.status(500).json({message: "Ocorreu um erro no registo"});
  }
});


module.exports = router;