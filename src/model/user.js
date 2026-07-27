const mongoose = require("mongoose")
const { Schema } = mongoose
const bcrypt = require('bcrypt');
require('dotenv').config()

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  }
}, {
  timestamps: true,
  autoCreate: true,
  autoSave: true

});

// hash password sebelum disimpan menggunakan bcrypt
userSchema.pre('save', async function (next) {
    if(!this.isModified('password')){
        return next()
    }
    const rounds = Number(process.env.SALT_ROUNDS)
    const salt = await bcrypt.genSalt(rounds)
    this.password = await bcrypt.hash(this.password, salt)
    })
    userSchema.methods.comparePassword = function (inputPassword){
    return bcrypt.compare(inputPassword, this.password)
    }

 // untuk auto createdAt/updateAt
module.exports = mongoose.model('User',userSchema)
