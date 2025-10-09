import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/lib/logging';

// Request logger middleware
export class RequestLogger {
  static middleware() {
    return (req: any, res: any, next: any) => {
      const startTime = Date.now();
      const requestId = uuidv4();
      
      // Add request ID to request object
      req.id = requestId;
      (req as any).__requestId = requestId;

      // Log request
      logger.info('Incoming request', {
        method: req.method,
        url: req.url,
        userAgent: req.headers['user-agent'],
        ip: req.ip || req.connection?.remoteAddress,
      });

      // Override res.end to log response
      const originalEnd = res.end;
      res.end = function(chunk: any, encoding?: any) {
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