const {Redis} = require("@upstash/redis")
require("dotenv").config();

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const connectRedis = async () => {
    try {
        await redis.set("key", "Redis connected!");

        const data = await redis.get("key");
        console.log(data);
    } catch (error) {
        console.error(error)
    }
};

module.exports = { redis, connectRedis };