//dependências
const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const {MONGO_URI} = require('../cert/.env')
const bcrypt = require('bcrypt');

//modelo de dados
const User = require('../models/User');

//métodos para modelos

//hashing do certificado antes de ser guardado na base de dados
User.pre('save', async function(next) {
  //verificação de certificado (necessário poder ler ficheiros)
  

  //verificação de existência de certificado
  if (!certificate) {
    res.status(400).send('Certificado digital inválido');
    return;
  }

  //proteger certificado 
  const user = this;

  if (!user.isModified('certificate')) return next();

  const Csalt = await bcrypt.genSalt(10);
  user.Csalt = Csalt;
  user.certificate = await bcrypt.hash(user.certificate, Csalt);

  next();
});

//validação de certificado guardado na base de dados
User.methods.isValidCertificate = async function(certificate) {
  const user = this;

  return await bcrypt.compare(certificate, user.certificate);
}

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

router.post('/register', async (req, res) => {
  try {
    //verificação de todos os dados inseridos
    if (
      !(
        req.body.username &&
        req.body.email &&
        req.body.hashedPassword &&
        req.body.Psalt &&
        req.body.role &&
        req.body.name &&
        req.body.address &&
        req.body.phone
      )
    ){
      res.status(406).json({message: "Certifique-se que introduziu todos os dados!"});
    }

    //verificação de utilizador existente
    if (
      (await User.findOne({ username: req.body.username })) ||
      (await User.findOne({ email: req.body.email }))
    ) {
      return res.status(406).json({message: "Dados Inválidos"});
    }

    //criação da conta
    var User = mongoose.model('User');
    var user = new User({
      username: req.body.username,
      email: req.body.email,
      password: req.body.hashedPassword,
      Psalt: req.body.Psalt,
      role: req.body.role,
      name: req.body.name,
      address: req.body.address,
      phone: req.body.phone,
      Csalt: '',
      certificate: '',
    });

    await user.save();
    return res.status(200).json({message: "Utilizador registado com sucesso!"});
  } catch (error) {
    return res.status(500).json({message: "Ocorreu um erro no registo"});
  }
});


module.exports = router;