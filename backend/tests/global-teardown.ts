import { pool } from '../src/config/database';
import { redisClient } from '../src/config/redis';

export default async () => {
  try {
    // Close database connections
    if (pool) {
      console.log('🔄 Closing database connections...');
      
      // Force close all connections in the pool
      await pool.end();
      
      console.log('✅ Database connections closed');
    }
    
    // Close Redis connections
    if (redisClient) {
      try {
        console.log('🔄 Closing Redis connections...');
        await redisClient.disconnect();
        console.log('✅ Redis connections closed');
      } catch (redisError: unknown) {
        console.warn('⚠️ Redis disconnect failed:', redisError instanceof Error ? redisError.message : String(redisError));
      }
    }
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
      console.log('🗑️  Forced garbage collection');
    }
    
    console.log('✅ Test environment cleaned up successfully');
  } catch (error) {
    console.error('❌ Failed to cleanup test environment:', error);
    process.exit(1); // Exit with error code if cleanup fails
  }
};
