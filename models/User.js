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

const User = mongoose.model("User", UserSchema)
module.exports = User;