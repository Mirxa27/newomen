import type { AuditLogEntry, AuditLoggerConfig, AuditStorage } from '../types';
import { promises as fs } from 'fs';
import path from 'path';
import zlib from 'zlib';

// File-based audit storage
export class FileAuditStorage implements AuditStorage {
  private basePath: string;

  constructor(private config: AuditLoggerConfig) {
    this.basePath = config.filePath || './logs/audit';
    if (typeof window === 'undefined') {
      this.ensureDirectoryExists();
    }
  }

  async store(logs: AuditLogEntry[]): Promise<void> {
    const filePath = this.getCurrentFilePath();
    const logContent = logs.map(log => JSON.stringify(log)).join('\n') + '\n';

    // Append to file
    await fs.appendFile(filePath, logContent);

    // Check if file needs rotation
    await this.rotateIfNeeded(filePath);
  }

  async search(criteria: Record<string, unknown>): Promise<AuditLogEntry[]> {
    // Simple file-based search implementation
    // In production, this would use a proper database
    const results: AuditLogEntry[] = [];
    const files = await this.getLogFiles();

    for (const file of files) {
      const logs = await this.readLogFile(file);
      for (const log of logs) {
        if (this.matchesCriteria(log, criteria)) {
          results.push(log);
        }
      }
    }

    return results;
  }

  async getStats(timeRange: Record<string, unknown>): Promise<{
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsByLevel: Record<string, number>;
    eventsByResult: Record<string, number>;
    topUsers: Array<{ userId: string; count: number }>;
    topResources: Array<{ resource: string; count: number }>;
    topIpAddresses: Array<{ ipAddress: string; count: number }>;
  }> {
    // Implementation for getting statistics
    return {
      totalEvents: 0,
      eventsByType: {},
      eventsByLevel: {},
      eventsByResult: {},
      topUsers: [],
      topResources: [],
      topIpAddresses: [],
    };
  }

  async cleanup(retentionDays: number): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const files = await this.getLogFiles();
    for (const file of files) {
      const stats = await fs.stat(file);
      if (stats.mtime < cutoffDate) {
        await fs.unlink(file);
      }
    }
  }

  private getCurrentFilePath(): string {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0];
    return `${this.basePath}/audit-${dateStr}.log`;
  }

  private async ensureDirectoryExists(): Promise<void> {
    try {
      await fs.mkdir(this.basePath, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }

  private async rotateIfNeeded(filePath: string): Promise<void> {
    const stats = await fs.stat(filePath);
    
    if (stats.size > this.config.maxFileSize) {
      const timestamp = Date.now();
      const rotatedPath = `${filePath}.${timestamp}`;
      await fs.rename(filePath, rotatedPath);
      
      if (this.config.compressLogs) {
        await this.compressFile(rotatedPath);
      }
    }
  }

  private async compressFile(filePath: string): Promise<void> {
    const input = await fs.readFile(filePath);
    const compressed = zlib.gzipSync(input);
    await fs.writeFile(`${filePath}.gz`, compressed);
    await fs.unlink(filePath);
  }

  private async getLogFiles(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.basePath);
      return files
        .filter((file: string) => file.startsWith('audit-') && file.endsWith('.log'))
        .map((file: string) => path.join(this.basePath, file))
        .sort()
        .reverse();
    } catch {
      return [];
    }
  }

  private async readLogFile(filePath: string): Promise<AuditLogEntry[]> {
    const logs: AuditLogEntry[] = [];
    
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const lines = content.split('\n').filter((line: string) => line.trim());
      
      for (const line of lines) {
        try {
          const log = JSON.parse(line);
          logs.push(log);
        } catch {
          // Skip invalid lines
        }
      }
    } catch {
      // File might not exist or be readable
    }
    
    return logs;
  }

  private matchesCriteria(log: AuditLogEntry, criteria: Record<string, unknown>): boolean {
    if (criteria.startDate && log.timestamp < criteria.startDate) return false;
    if (criteria.endDate && log.timestamp > criteria.endDate) return false;
    if (criteria.userId && log.userId !== criteria.userId) return false;
    if (criteria.eventType && log.eventType !== criteria.eventType) return false;
    if (criteria.level && log.level !== criteria.level) return false;
    if (criteria.resource && log.resource !== criteria.resource) return false;
    if (criteria.result && log.result !== criteria.result) return false;
    if (criteria.ipAddress && log.ipAddress !== criteria.ipAddress) return false;
    if (criteria.tags && criteria.tags.length > 0) {
      if (!log.tags || !criteria.tags.some((tag: string) => log.tags!.includes(tag))) {
        return false;
      }
    }
    
    return true;
  }
}