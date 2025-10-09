// Performance logger
export class PerformanceLogger {
  private static metrics = new Map<string, number[]>();

  static recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);
  }

  static getMetrics(name: string): number[] {
    return this.metrics.get(name) || [];
  }

  static getAverage(name: string): number {
    const values = this.getMetrics(name);
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  static getPercentile(name: string, percentile: number): number {
    const values = this.getMetrics(name).sort((a, b) => a - b);
    if (values.length === 0) return 0;
    
    const index = Math.ceil((percentile / 100) * values.length) - 1;
    return values[Math.max(0, index)];
  }

  static clearMetrics(name?: string): void {
    if (name) {
      this.metrics.delete(name);
    } else {
      this.metrics.clear();
    }
  }

  static getSummary(): Record<string, {
    count: number;
    average: number;
    min: number;
    max: number;
    p50: number;
    p95: number;
    p99: number;
  }> {
    const summary: Record<string, any> = {};
    
    for (const [name, values] of this.metrics) {
      if (values.length === 0) continue;
      
      const sorted = values.sort((a, b) => a - b);
      summary[name] = {
        count: values.length,
        average: this.getAverage(name),
        min: sorted[0],
        max: sorted[sorted.length - 1],
        p50: this.getPercentile(name, 50),
        p95: this.getPercentile(name, 95),
        p99: this.getPercentile(name, 99),
      };
    }
    
    return summary;
  }
}