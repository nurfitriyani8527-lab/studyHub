const jwt = require('jsonwebtoken')
const respon = require('../utils/response')
require('dotenv').config()

const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return respon(res,401,false,"token tidak ditemukan")
        }

        if (!authHeader.startsWith("Bearer ")) {
            return respon(res,401,false,"format token salah")
        }
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded

        next()
    } catch (error) {
        respon(res,401,false,"token tidak valid")
    }
};

module.exports = authMiddleware;