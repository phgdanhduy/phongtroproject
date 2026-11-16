const { createClient } = require('redis');

const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://redis:6379'
});

redisClient.on('error', (err) => {
    console.error('[Redis Client Error]:', err.message);
});

let isConnected = false;

async function connectRedis() {
    if (!isConnected) {
        await redisClient.connect();
        isConnected = true;
        console.log('✅ Redis connected successfully');
    }
}

async function getCache(key) {
    try {
        if (!isConnected) return null;
        const raw = await redisClient.get(key);
        return raw ? JSON.parse(raw) : null;
    } catch (err) {
        console.error('[Redis GET Error]:', err.message);
        return null;
    }
}

async function setCache(key, value, ttlSeconds = 300) {
    try {
        if (!isConnected) return;
        await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
    } catch (err) {
        console.error('[Redis SET Error]:', err.message);
    }
}

async function deleteCache(key) {
    try {
        if (!isConnected) return;
        await redisClient.del(key);
    } catch (err) {
        console.error('[Redis DEL Error]:', err.message);
    }
}

module.exports = {
    redisClient,
    connectRedis,
    getCache,
    setCache,
    deleteCache
};