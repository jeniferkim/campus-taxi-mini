// REDIS_URL 기반 Redis 연결

import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://redis:6379";

// 하나만 만들어서 전체에서 공유
const redis = new Redis(redisUrl);

export default redis;
