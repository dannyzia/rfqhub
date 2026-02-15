import app from './app';
import { logger } from './config/logger';
import { config } from './config';
import { pool } from './config/database';
import { redisClient } from './config/redis';

const PORT = config.port || 3000;

async function startServer() {
  try {
    // Test database connection
    logger.info('Testing database connection...');
    await pool.query('SELECT NOW()');
    logger.info('Database connected successfully');

    // Test Redis connection
    logger.info('Testing Redis connection...');
    await redisClient.ping();
    logger.info('Redis connected successfully');

    // Start Express server
    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${config.nodeEnv}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`API base URL: http://localhost:${PORT}/api`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received: closing server gracefully`);

      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          await pool.end();
          logger.info('Database pool closed');

          await redisClient.quit();
          logger.info('Redis connection closed');

          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown:', error);
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
