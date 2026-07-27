const mongoose = require("mongoose")
require('dotenv').config()

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI)
        .then(() => console.log('Connected!'));
    } catch (error) {
        console.log("tidak bisa connect ke mongodb")
    }
}

module.exports = { connectDB }