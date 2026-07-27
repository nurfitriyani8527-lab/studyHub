const { redis } = require('../config/redis')
const respon = require('../utils/response')
const User = require('../model/user')

const aiRateLimiter = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const key = `ratelimit:ai:${userId}`;
        const limit = 10;
        const windowInSeconds = 600;

        const count = await redis.incr(key)  // command buat increment

        if (count === 1) {
            await redis.expire(key, windowInSeconds)  // command buat set waktu expired
        }

        if (count > limit) {
            return respon(res, 429, false, "Terlalu banyak request, coba lagi nanti", null)
        }

        next()
    } catch (error) {
        console.error(error)
        next()  // kenapa tetep next() kalau Redis error, bukan block total?
    }
}

module.exports = aiRateLimiter