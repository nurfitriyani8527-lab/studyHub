require('dotenv').config()
const jwt = require('jsonwebtoken')
const respon = require('./src/utils/response')
const bcrypt = require("bcrypt")

exports.postRegister = async (req,res) => {
    try {
        const hash = await bcrypt.hash("nurfitriyani", 10);
        console.log(hash);

        const test = await bcrypt.compare("nurfitriyani", hash);
        console.log(test);
    } catch (error){
        return respon(res, 500, false, "Server error", error.message)
    }
}