/**
 * Simple script to clear rate limits using existing redisClient
 */
import { redisClient } from '../src/config/redis';

async function clearRateLimits() {
  try {
    console.log('🔄 Clearing rate limits...');
    
    // Find all rate limit keys
    const keys = await redisClient.keys('rate_limit:*');
    
    if (keys.length === 0) {
      console.log('✓ No rate limit keys found');
      return;
    }
    
    console.log(`Found ${keys.length} rate limit keys`);
    
    // Delete all rate limit keys
    for (const key of keys) {
      await redisClient.del(key);
      console.log(`  ✓ Deleted: ${key}`);
    }
    
    console.log(`\n✅ Successfully cleared ${keys.length} rate limit keys`);
    
  } catch (error) {
    console.error('❌ Error clearing rate limits:', error);
    process.exit(1);
  }
}

clearRateLimits().then(() => {
  console.log('✅ Rate limit clearing complete');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
