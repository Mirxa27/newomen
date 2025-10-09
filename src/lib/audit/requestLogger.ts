import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/lib/logging';

// Request logger middleware
export class RequestLogger {
  static middleware() {
    return (req: Record<string, unknown>, res: Record<string, unknown>, next: () => void) => {
      const startTime = Date.now();
      const requestId = uuidv4();
      
      // Add request ID to request object
      (req as Record<string, unknown>).id = requestId;
      (req as Record<string, unknown>).__requestId = requestId;

      // Log request
      logger.info('Incoming request', {
        method: req.method,
        url: req.url,
        userAgent: req.headers['user-agent'],
        ip: req.ip || req.connection?.remoteAddress,
      });

      // Override res.end to log response
      const originalEnd = res.end;
      res.end = function(chunk: unknown, encoding?: string) {
        const duration = Date.now() - startTime;
        
        logger.info('Request completed', {
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          duration: `${duration}ms`,
        });

        res.end = originalEnd;
        res.end(chunk, encoding);
      };

      next();
    };
  }
}