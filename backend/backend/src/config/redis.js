let redisClient = null;
let isConnected = false;

try {
  const { createClient } = require('redis');
  redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://redis:6379'
  });
  redisClient.on('error', (err) => {
    console.error('[Redis Client Error]:', err.message);
  });
} catch (e) {
  // Redis optional dependency when running without redis npm package
}

async function connectRedis() {
  if (!redisClient) return;
  if (!isConnected) {
    try {
      await redisClient.connect();
      isConnected = true;
      console.log('✅ Redis connected successfully');
    } catch (err) {
      console.warn('[Redis] Connection skipped/failed, proceeding without cache:', err.message);
    }
  }
}

async function getCache(key) {
  try {
    if (!isConnected || !redisClient) return null;
    const raw = await redisClient.get(key);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error('[Redis GET Error]:', err.message);
    return null;
  }
}

async function setCache(key, value, ttlSeconds = 300) {
  try {
    if (!isConnected || !redisClient) return;
    await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
  } catch (err) {
    console.error('[Redis SET Error]:', err.message);
  }
}

async function deleteCache(key) {
  try {
    if (!isConnected || !redisClient) return;
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
