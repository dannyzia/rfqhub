/**
 * Clear all rate limit keys from Redis
 * Use this during development if you get rate limited
 */
import Redis from 'ioredis';

async function clearRateLimits() {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  
  const client = new Redis(redisUrl);
  
  try {
    // ioredis auto-connects, so we don't need to call connect()
    console.log('✓ Connected to Redis');
    
    // Find all rate limit keys
    const keys = await client.keys('rate_limit:*');
    
    if (keys.length === 0) {
      console.log('✓ No rate limit keys found');
      return;
    }
    
    console.log(`Found ${keys.length} rate limit keys`);
    
    // Delete all rate limit keys
    for (const key of keys) {
      await client.del(key);
      console.log(`  ✓ Deleted: ${key}`);
    }
    
    console.log(`\\n✅ Successfully cleared ${keys.length} rate limit keys`);
    
  } catch (error) {
    console.error('❌ Error clearing rate limits:', error);
    process.exit(1);
  } finally {
    await client.quit();
    console.log('✓ Disconnected from Redis');
  }
}

clearRateLimits();
