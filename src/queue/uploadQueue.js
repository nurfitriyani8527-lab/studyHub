const { Queue } = require("bullmq");
const connection = require("../config/redisQueue");

const uploadQueue = new Queue("upload-material", {
    connection
});

module.exports = uploadQueue;