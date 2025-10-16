// Comprehensive service registry for Newomen platform
// Central hub for all business logic services

import { mobileService } from './MobileService';
import { assessmentBusinessLogic } from '@/services/features/assessment/AssessmentBusinessLogic';
import { paymentService } from '@/services/features/payment/PaymentService';
import { communityService } from '@/services/features/community/CommunityService';
import { errorHandler } from '@/utils/shared/core/error-handling';

export interface ServiceStatus {
  name: string;
  initialized: boolean;
  lastError?: string;
  lastActivity?: string;
}

export interface PlatformHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  services: ServiceStatus[];
  uptime: number;
  lastCheck: string;
}

export class ServiceRegistry {
  private static instance: ServiceRegistry;
  private services: Map<string, unknown> = new Map();
  private serviceStatus: Map<string, ServiceStatus> = new Map();
  private startTime: number = Date.now();

  private constructor() {
    this.registerServices();
  }

  public static getInstance(): ServiceRegistry {
    if (!ServiceRegistry.instance) {
      ServiceRegistry.instance = new ServiceRegistry();
    }
    return ServiceRegistry.instance;
  }

  // Register all services
  private registerServices(): void {
    this.services.set('mobile', mobileService);
    this.services.set('assessment', assessmentBusinessLogic);
    this.services.set('payment', paymentService);
    this.services.set('community', communityService);

    // Initialize service status
    this.services.forEach((service, name) => {
      this.serviceStatus.set(name, {
        name,
        initialized: false,
      });
    });
  }

  // Initialize all services
  public async initializeAll(): Promise<void> {
    console.log('🚀 Initializing Newomen platform services...');

    const initPromises = Array.from(this.services.entries()).map(async ([name, service]) => {
      try {
        if (typeof service.initialize === 'function') {
          await service.initialize();
        }
        
        this.updateServiceStatus(name, { initialized: true });
        console.log(`✅ ${name} service initialized`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.updateServiceStatus(name, { 
          initialized: false, 
          lastError: errorMessage 
        });
        console.error(`❌ ${name} service initialization failed:`, error);
      }
    });

    await Promise.allSettled(initPromises);
    console.log('🎉 Service initialization complete');
  }

  // Get service by name
  public getService<T = unknown>(name: string): T | null {
    return this.services.get(name) as T || null;
  }

  // Get all services
  public getAllServices(): Map<string, unknown> {
    return new Map(this.services);
  }

  // Get service status
  public getServiceStatus(name: string): ServiceStatus | null {
    return this.serviceStatus.get(name) || null;
  }

  // Get platform health
  public getPlatformHealth(): PlatformHealth {
    const services = Array.from(this.serviceStatus.values());
    const initializedServices = services.filter(s => s.initialized);
    const failedServices = services.filter(s => !s.initialized);

    let overall: 'healthy' | 'degraded' | 'unhealthy';
    if (failedServices.length === 0) {
      overall = 'healthy';
    } else if (failedServices.length < services.length / 2) {
      overall = 'degraded';
    } else {
      overall = 'unhealthy';
    }

    return {
      overall,
      services,
      uptime: Date.now() - this.startTime,
      lastCheck: new Date().toISOString(),
    };
  }

  // Update service status
  private updateServiceStatus(name: string, updates: Partial<ServiceStatus>): void {
    const current = this.serviceStatus.get(name);
    if (current) {
      this.serviceStatus.set(name, {
        ...current,
        ...updates,
        lastActivity: new Date().toISOString(),
      });
    }
  }

  // Health check for all services
  public async performHealthCheck(): Promise<PlatformHealth> {
    console.log('🔍 Performing platform health check...');

    const healthCheckPromises = Array.from(this.services.entries()).map(async ([name, service]) => {
      try {
        // Perform service-specific health checks
        if (typeof service.healthCheck === 'function') {
          await service.healthCheck();
        }
        
        this.updateServiceStatus(name, { 
          initialized: true,
          lastError: undefined 
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Health check failed';
        this.updateServiceStatus(name, { 
          initialized: false,
          lastError: errorMessage 
        });
        console.error(`❌ ${name} service health check failed:`, error);
      }
    });

    await Promise.allSettled(healthCheckPromises);
    
    const health = this.getPlatformHealth();
    console.log(`🏥 Platform health: ${health.overall}`);
    
    return health;
  }

  // Get service metrics
  public getServiceMetrics(): {
    totalServices: number;
    initializedServices: number;
    failedServices: number;
    uptime: number;
    healthScore: number;
  } {
    const services = Array.from(this.serviceStatus.values());
    const totalServices = services.length;
    const initializedServices = services.filter(s => s.initialized).length;
    const failedServices = totalServices - initializedServices;
    const healthScore = totalServices > 0 ? (initializedServices / totalServices) * 100 : 0;

    return {
      totalServices,
      initializedServices,
      failedServices,
      uptime: Date.now() - this.startTime,
      healthScore,
    };
  }

  // Restart failed services
  public async restartFailedServices(): Promise<void> {
    console.log('🔄 Restarting failed services...');

    const failedServices = Array.from(this.serviceStatus.entries())
      .filter(([, status]) => !status.initialized);

    for (const [name, service] of failedServices) {
      try {
        if (typeof service.initialize === 'function') {
          await service.initialize();
        }
        
        this.updateServiceStatus(name, { 
          initialized: true,
          lastError: undefined 
        });
        console.log(`✅ ${name} service restarted successfully`);
      } catch (error) {
        console.error(`❌ Failed to restart ${name} service:`, error);
      }
    }
  }

  // Cleanup all services
  public async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up services...');

    const cleanupPromises = Array.from(this.services.entries()).map(async ([name, service]) => {
      try {
        if (typeof service.cleanup === 'function') {
          await service.cleanup();
        }
        console.log(`✅ ${name} service cleaned up`);
      } catch (error) {
        console.error(`❌ Failed to cleanup ${name} service:`, error);
      }
    });

    await Promise.allSettled(cleanupPromises);
    console.log('🎉 Service cleanup complete');
  }

  // Get service dependencies
  public getServiceDependencies(): Record<string, string[]> {
    return {
      mobile: ['capacitor'],
      assessment: ['ai', 'database'],
      payment: ['paypal', 'stripe'],
      community: ['database', 'auth'],
    };
  }

  // Validate service dependencies
  public async validateDependencies(): Promise<{
    valid: boolean;
    missing: string[];
    errors: string[];
  }> {
    const dependencies = this.getServiceDependencies();
    const missing: string[] = [];
    const errors: string[] = [];

    for (const [serviceName, deps] of Object.entries(dependencies)) {
      for (const dep of deps) {
        if (!this.services.has(dep)) {
          missing.push(`${serviceName} -> ${dep}`);
        }
      }
    }

    return {
      valid: missing.length === 0,
      missing,
      errors,
    };
  }

  // Export service registry for external use
  public exportRegistry(): {
    services: string[];
    status: ServiceStatus[];
    health: PlatformHealth;
    metrics: ReturnType<typeof this.getServiceMetrics>;
  } {
    return {
      services: Array.from(this.services.keys()),
      status: Array.from(this.serviceStatus.values()),
      health: this.getPlatformHealth(),
      metrics: this.getServiceMetrics(),
    };
  }
}

// Export singleton instance
export const serviceRegistry = ServiceRegistry.getInstance();

// Export individual services for convenience
export {
  mobileService,
  assessmentBusinessLogic,
  paymentService,
  communityService,
};

// Export service registry as default
export default serviceRegistry;
