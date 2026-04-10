import { SetMetadata } from '@nestjs/common';

export interface IdempotentOptions {
  service: string;
  operation: string;
  /**
   * Header name to extract the key from (default: 'x-idempotency-key')
   */
  header?: string;
  /**
   * TTL for the lock in seconds (default: 300)
   */
  lockTtl?: number;
  /**
   * TTL for the result in seconds (default: 86400)
   */
  resultTtl?: number;
}

export const IDEMPOTENT_METADATA_KEY = 'idempotent_options';

/**
 * Decorator to apply industry-standard idempotency logic to a method.
 * Works for both HTTP Controllers and background workers.
 */
export const Idempotent = (options: IdempotentOptions) =>
  SetMetadata(IDEMPOTENT_METADATA_KEY, options);
