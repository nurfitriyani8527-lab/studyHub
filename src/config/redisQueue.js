require("dotenv").config();
const Redis = require("ioredis");
const { URL } = require("url");
// untuk mendapatkan redis TCP ini pakailah hostingers northflank(gratis) 

const redisUrl = new URL(process.env.REDIS_QUEUE_URL);

const connection = new Redis(process.env.REDIS_QUEUE_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,

  tls: {
    servername: redisUrl.hostname, // <-- ini setara dengan --sni
  },
});

connection.on("connect", () => {
  console.log("✅ Connected");
});

connection.on("ready", () => {
  console.log("🚀 Ready");
});

connection.on("error", (err) => {
  console.error("❌", err);
});

module.exports = connection;