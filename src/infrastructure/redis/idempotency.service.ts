import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { RedisService } from './redis.service';
import * as crypto from 'crypto';

export interface IdempotencyRecord {
  status: 'started' | 'completed';
  requestHash: string;
  result?: any;
}

@Injectable()
export class IdempotencyService {
  private readonly logger = new Logger(IdempotencyService.name);
  private readonly PREFIX = 'idempotency:';

  constructor(private readonly redisService: RedisService) {}

  /**
   * Generates a deterministic hash for the request payload.
   */
  private generateHash(payload: any): string {
    const content = JSON.stringify(payload || {});
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Generates a structured Redis key: idempotency:{service}:{operation}:{key}
   */
  private buildKey(service: string, operation: string, key: string): string {
    return `${this.PREFIX}${service}:${operation}:${key}`;
  }

  /**
   * Attempts to acquire an idempotency lock for a given key.
   * If the key already exists, returns the existing record.
   * If not, sets the status to 'started' and returns null.
   *
   * @param service The name of the service (e.g., 'payments')
   * @param operation The name of the operation (e.g., 'create')
   * @param key Unique idempotency key
   * @param payload The request payload to verify against the key
   * @param lockTtl Time-to-live for the "in-progress" lock in seconds (default: 5 minutes)
   */
  async getOrSet(
    service: string,
    operation: string,
    key: string,
    payload: any,
    lockTtl: number = 5 * 60,
  ): Promise<IdempotencyRecord | null> {
    const fullKey = this.buildKey(service, operation, key);
    const client = this.redisService.clientInstance;
    const requestHash = this.generateHash(payload);

    // Use SET NX (Not Exists) to atomically set the lock
    const initialRecord: IdempotencyRecord = { status: 'started', requestHash };
    const result = await client.set(
      fullKey,
      JSON.stringify(initialRecord),
      'EX',
      lockTtl,
      'NX',
    );

    if (result === 'OK') {
      this.logger.debug(
        `Idempotency lock acquired: ${fullKey} (TTL: ${lockTtl}s)`,
      );
      return null;
    }

    // Key already exists, fetch the current status/result
    const existing =
      await this.redisService.getCache<IdempotencyRecord>(fullKey);

    // VERIFY: If the key exists but the payload is different, it's a conflict
    if (existing && existing.requestHash !== requestHash) {
      this.logger.warn(
        `Idempotency conflict for ${fullKey}. Payload mismatch.`,
      );
      throw new ConflictException(
        `Idempotency-Key "${key}" for ${service}:${operation} is being reused with a different payload.`,
      );
    }

    this.logger.debug(
      `Idempotency hit for ${fullKey}, status: ${existing?.status}`,
    );
    return existing;
  }

  /**
   * Updates the idempotency record with the final result.
   */
  async complete(
    service: string,
    operation: string,
    key: string,
    payload: any,
    result: any,
    resultTtl: number = 24 * 60 * 60,
  ): Promise<void> {
    const fullKey = this.buildKey(service, operation, key);
    const requestHash = this.generateHash(payload);
    const record: IdempotencyRecord = {
      status: 'completed',
      requestHash,
      result,
    };

    await this.redisService.setCache(fullKey, record, resultTtl);
    this.logger.debug(
      `Idempotency record completed: ${fullKey} (TTL: ${resultTtl}s)`,
    );
  }

  /**
   * Deletes an idempotency record.
   */
  async delete(service: string, operation: string, key: string): Promise<void> {
    const fullKey = this.buildKey(service, operation, key);
    await this.redisService.deleteCache(fullKey);
    this.logger.debug(`Idempotency record deleted: ${fullKey}`);
  }
}
