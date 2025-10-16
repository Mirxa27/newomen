import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/types';
import { logger } from '@/lib/logging';
import { DatabaseError, MigrationError } from '@/lib/errors';
import { withDatabasePool } from './pool';
import { Tables } from '@/integrations/supabase/types';

export interface Migration {
  version: string;
  name: string;
  up: (client: SupabaseClient<Database>) => Promise<void>;
  down: (client: SupabaseClient<Database>) => Promise<void>;
  dependencies?: string[];
  checksum?: string;
}

export interface MigrationRecord {
  version: string;
  name: string;
  applied_at: Date;
  checksum: string;
  execution_time: number;
  success: boolean;
  rollback_available: boolean;
}

export interface MigrationOptions {
  dryRun?: boolean;
  force?: boolean;
  batchSize?: number;
  timeout?: number;
  rollbackOnError?: boolean;
}

export class MigrationManager {
  private migrations: Map<string, Migration> = new Map();
  private appliedMigrations: Set<string> = new Set();

  constructor(private client: SupabaseClient<Database>) {}

  registerMigration(migration: Migration): void {
    this.migrations.set(migration.version, migration);
    logger.info('Migration registered', { version: migration.version, name: migration.name });
  }

  async getAppliedMigrations(): Promise<MigrationRecord[]> {
    try {
      const { data, error } = await this.client
        .from('schema_migrations')
        .select('*')
        .order('applied_at', { ascending: false });

      if (error) {
        throw new DatabaseError('Failed to fetch applied migrations');
      }

      return (data as MigrationRecord[]) || [];
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Failed to fetch applied migrations');
    }
  }

  async getPendingMigrations(): Promise<Migration[]> {
    const applied = await this.getAppliedMigrations();
    const appliedVersions = new Set(applied.map(m => m.version));
    
    const pending: Migration[] = [];
    for (const [version, migration] of this.migrations) {
      if (!appliedVersions.has(version)) {
        pending.push(migration);
      }
    }

    // Sort by version
    return pending.sort((a, b) => a.version.localeCompare(b.version));
  }

  async validateMigrationDependencies(migration: Migration): Promise<void> {
    if (!migration.dependencies || migration.dependencies.length === 0) {
      return;
    }

    const applied = await this.getAppliedMigrations();
    const appliedVersions = new Set(applied.map(m => m.version));

    for (const dependency of migration.dependencies) {
      if (!appliedVersions.has(dependency)) {
        throw new MigrationError(
          `Migration dependency not satisfied: ${migration.version} requires ${dependency}`
        );
      }
    }
  }

  async applyMigration(
    migration: Migration,
    options: MigrationOptions = {}
  ): Promise<MigrationRecord> {
    const startTime = Date.now();
    
    try {
      logger.info('Applying migration', { 
        version: migration.version, 
        name: migration.name,
        dryRun: options.dryRun 
      });

      if (!options.dryRun) {
        await this.validateMigrationDependencies(migration);
      }

      if (!options.dryRun) {
        await migration.up(this.client);
      }

      const executionTime = Date.now() - startTime;
      const record: MigrationRecord = {
        version: migration.version,
        name: migration.name,
        applied_at: new Date(),
        checksum: migration.checksum || this.generateChecksum(migration),
        execution_time: executionTime,
        success: true,
        rollback_available: !!migration.down
      };

      if (!options.dryRun) {
        const { error } = await this.client
          .from('schema_migrations')
          .insert(record as unknown as Tables<'schema_migrations'>);

        if (error) {
          throw new DatabaseError('Failed to record migration');
        }
      }

      logger.info('Migration applied successfully', {
        version: migration.version,
        executionTime
      });

      return record;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      logger.error('Migration failed', {
        version: migration.version,
        executionTime,
        error
      });

      if (options.rollbackOnError && migration.down) {
        logger.info('Attempting rollback', { version: migration.version });
        try {
          await migration.down(this.client);
        } catch (rollbackError) {
          logger.error('Rollback failed', { version: migration.version, rollbackError });
        }
      }

      throw new MigrationError(
        `Migration ${migration.version} failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async rollbackMigration(
    version: string,
    options: MigrationOptions = {}
  ): Promise<MigrationRecord> {
    const migration = this.migrations.get(version);
    if (!migration) {
      throw new MigrationError(`Migration not found: ${version}`);
    }

    if (!migration.down) {
      throw new MigrationError(`Migration ${version} does not support rollback`);
    }

    const startTime = Date.now();

    try {
      logger.info('Rolling back migration', { version, dryRun: options.dryRun });

      if (!options.dryRun) {
        await migration.down(this.client);
        
        const { error } = await this.client
          .from('schema_migrations')
          .delete()
          .eq('version', version);

        if (error) {
          throw new DatabaseError('Failed to remove migration record');
        }
      }

      const executionTime = Date.now() - startTime;

      logger.info('Migration rolled back successfully', {
        version,
        executionTime
      });

      return {
        version: migration.version,
        name: migration.name,
        applied_at: new Date(),
        checksum: migration.checksum || this.generateChecksum(migration),
        execution_time: executionTime,
        success: true,
        rollback_available: false
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      logger.error('Rollback failed', {
        version,
        executionTime,
        error
      });

      throw new MigrationError(
        `Rollback of ${version} failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async migrate(options: MigrationOptions = {}): Promise<MigrationRecord[]> {
    const pending = await this.getPendingMigrations();
    
    if (pending.length === 0) {
      logger.info('No pending migrations');
      return [];
    }

    logger.info('Starting migration', {
      pendingCount: pending.length,
      dryRun: options.dryRun
    });

    const results: MigrationRecord[] = [];
    const batchSize = options.batchSize || 1;

    for (let i = 0; i < pending.length; i += batchSize) {
      const batch = pending.slice(i, i + batchSize);
      
      for (const migration of batch) {
        try {
          const result = await this.applyMigration(migration, options);
          results.push(result);
        } catch (error) {
          if (!options.force) {
            throw error;
          }
          logger.warn('Migration failed but continuing due to force flag', {
            version: migration.version,
            error
          });
        }
      }
    }

    logger.info('Migration completed', {
      appliedCount: results.length,
      totalPending: pending.length
    });

    return results;
  }

  async rollback(options: { 
    steps?: number; 
    toVersion?: string;
    dryRun?: boolean;
    force?: boolean;
  } = {}): Promise<MigrationRecord[]> {
    const applied = await this.getAppliedMigrations();
    const appliedVersions = applied.map(m => m.version);
    
    let versionsToRollback: string[] = [];
    
    if (options.toVersion) {
      const targetIndex = appliedVersions.indexOf(options.toVersion);
      if (targetIndex === -1) {
        throw new MigrationError(`Version not found: ${options.toVersion}`);
      }
      versionsToRollback = appliedVersions.slice(0, targetIndex + 1).reverse();
    } else {
      const steps = options.steps || 1;
      versionsToRollback = appliedVersions.slice(0, steps);
    }

    logger.info('Starting rollback', {
      versions: versionsToRollback,
      dryRun: options.dryRun
    });

    const results: MigrationRecord[] = [];

    for (const version of versionsToRollback) {
      try {
        const result = await this.rollbackMigration(version, {
          dryRun: options.dryRun,
          force: options.force
        });
        results.push(result);
      } catch (error) {
        if (!options.force) {
          throw error;
        }
        logger.warn('Rollback failed but continuing due to force flag', {
          version,
          error
        });
      }
    }

    logger.info('Rollback completed', {
      rolledBackCount: results.length,
      versions: versionsToRollback
    });

    return results;
  }

  async validateChecksums(): Promise<{ valid: boolean; mismatches: string[] }> {
    const applied = await this.getAppliedMigrations();
    const mismatches: string[] = [];

    for (const record of applied) {
      const migration = this.migrations.get(record.version);
      if (migration) {
        const currentChecksum = this.generateChecksum(migration);
        if (currentChecksum !== record.checksum) {
          mismatches.push(record.version);
        }
      }
    }

    return {
      valid: mismatches.length === 0,
      mismatches
    };
  }

  private generateChecksum(migration: Migration): string {
    // Simple checksum generation - in production, use a proper hash function
    const content = `${migration.version}:${migration.name}:${migration.up.toString()}`;
    return btoa(content).slice(0, 16);
  }

  async getMigrationStatus(): Promise<{
    total: number;
    applied: number;
    pending: number;
    latest: string | null;
  }> {
    const applied = await this.getAppliedMigrations();
    const pending = await this.getPendingMigrations();

    return {
      total: this.migrations.size,
      applied: applied.length,
      pending: pending.length,
      latest: applied.length > 0 ? applied[0].version : null
    };
  }
}

// Migration utilities
export async function createMigrationsTable(client: SupabaseClient<Database>): Promise<void> {
  const { error } = await client.rpc('create_schema_migrations_table');
  
  if (error) {
    throw new DatabaseError('Failed to create migrations table');
  }
}

export async function withTransaction<T>(
  client: SupabaseClient<Database>,
  operation: () => Promise<T>
): Promise<T> {
  try {
    // Note: Supabase doesn't support traditional transactions across multiple operations
    // This is a placeholder for when transaction support is available
    return await operation();
  } catch (error) {
    throw new DatabaseError('Transaction failed');
  }
}

// Migration templates
export function createMigration(
  version: string,
  name: string,
  up: (client: SupabaseClient<Database>) => Promise<void>,
  down: (client: SupabaseClient<Database>) => Promise<void>,
  dependencies?: string[]
): Migration {
  return {
    version,
    name,
    up,
    down,
    dependencies,
    checksum: btoa(`${version}:${name}:${up.toString()}`).slice(0, 16)
  };
}

// Common migration operations
export const MigrationOperations = {
  async createTable(
    client: SupabaseClient<Database>,
    tableName: string,
    columns: Record<string, string>,
    options: { ifNotExists?: boolean; schema?: string } = {}
  ): Promise<void> {
    const schema = options.schema || 'public';
    const ifNotExists = options.ifNotExists !== false;
    
    const columnDefs = Object.entries(columns)
      .map(([name, definition]) => `${name} ${definition}`)
      .join(', ');

    const query = `
      CREATE TABLE ${ifNotExists ? 'IF NOT EXISTS' : ''} ${schema}.${tableName} (
        ${columnDefs}
      )
    `;

    const { error } = await client.rpc('execute_sql', { query });
    
    if (error) {
      throw new DatabaseError(`Failed to create table ${tableName}`);
    }
  },

  async createIndex(
    client: SupabaseClient<Database>,
    tableName: string,
    indexName: string,
    columns: string[],
    options: { unique?: boolean; ifNotExists?: boolean; schema?: string } = {}
  ): Promise<void> {
    const schema = options.schema || 'public';
    const unique = options.unique ? 'UNIQUE' : '';
    const ifNotExists = options.ifNotExists !== false ? 'IF NOT EXISTS' : '';

    const query = `
      CREATE ${unique} INDEX ${ifNotExists} ${indexName}
      ON ${schema}.${tableName} (${columns.join(', ')})
    `;

    const { error } = await client.rpc('execute_sql', { query });
    
    if (error) {
      throw new DatabaseError(`Failed to create index ${indexName}`);
    }
  },

  async addColumn(
    client: SupabaseClient<Database>,
    tableName: string,
    columnName: string,
    definition: string,
    options: { ifNotExists?: boolean; schema?: string } = {}
  ): Promise<void> {
    const schema = options.schema || 'public';
    const ifNotExists = options.ifNotExists !== false ? 'IF NOT EXISTS' : '';

    const query = `
      ALTER TABLE ${schema}.${tableName}
      ADD COLUMN ${ifNotExists} ${columnName} ${definition}
    `;

    const { error } = await client.rpc('execute_sql', { query });
    
    if (error) {
      throw new DatabaseError(`Failed to add column ${columnName}`);
    }
  },

  async dropColumn(
    client: SupabaseClient<Database>,
    tableName: string,
    columnName: string,
    options: { ifExists?: boolean; schema?: string } = {}
  ): Promise<void> {
    const schema = options.schema || 'public';
    const ifExists = options.ifExists !== false ? 'IF EXISTS' : '';

    const query = `
      ALTER TABLE ${schema}.${tableName}
      DROP COLUMN ${ifExists} ${columnName}
    `;

    const { error } = await client.rpc('execute_sql', { query });
    
    if (error) {
      throw new DatabaseError(`Failed to drop column ${columnName}`);
    }
  }
};