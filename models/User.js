const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
    username:{
        type: String,
        required: true,
    },
    password:{
        type: String,
        required: true
    },
    email:{
        type: String,
        required: true
    },
    Usalt:{
        type: String,
        required: true,
    },
    Esalt:{
        type: String,
        required: true,
    },
    Psalt:{
        type: String,
        required: true,
    },
    Csalt:{
        type: String,
        required: true,
    },
    certificate:{
        type: String,
        required: true
    },
});
  
//validação de certificado guardado na base de dados
  UserSchema.methods.isValidCertificate = async function(certificate) {
    const user = this;
    CertReceived = await bcrypt.hash(certificate, user.Csalt);
  
    return await bcrypt.compare(CertReceived, user.certificate);
  }

const User = mongoose.model("User", UserSchema)
module.exports = User;