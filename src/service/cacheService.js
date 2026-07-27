const { redis } = require("../config/redis");

exports.getCached = async (key) => {
    const cache = await redis.get(key);

    if (!cache) return null;
    // Kalau sudah object, langsung return
    if (typeof cache === "object") {
        return cache;
    }
    // Kalau string JSON, baru parse
    return JSON.parse(cache);
};

exports.saveCache = async (key, data) => {
    await redis.set(
        key,
        JSON.stringify(data),
        {
            ex: 300,
        }
    );
};