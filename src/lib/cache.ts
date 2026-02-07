/**
 * Bounded TTL cache with automatic eviction.
 *
 * Replaces the raw Maps used throughout the codebase that grow without bound.
 * Each entry has a time-to-live (TTL) and the cache enforces a maximum number
 * of entries. When the limit is reached the oldest entry is evicted.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  insertedAt: number;
}

interface BoundedCacheOptions {
  /** Maximum number of entries the cache will hold. */
  maxSize: number;
  /** Default TTL in milliseconds for new entries. */
  defaultTtlMs?: number;
}

export class BoundedCache<T> {
  private store = new Map<string, CacheEntry<T>>();
  private readonly maxSize: number;
  private readonly defaultTtlMs: number;

  constructor(options: BoundedCacheOptions) {
    this.maxSize = options.maxSize;
    this.defaultTtlMs = options.defaultTtlMs ?? 15 * 60 * 1000; // 15 min default
  }

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  /**
   * Return the raw entry (including metadata) so callers can access stale
   * values for fallback scenarios.
   */
  getEntry(key: string): { value: T; expiresAt: number } | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    return { value: entry.value, expiresAt: entry.expiresAt };
  }

  set(key: string, value: T, ttlMs?: number): void {
    // Evict expired entries first
    this.evictExpired();

    // If still at capacity, evict the oldest entry
    if (this.store.size >= this.maxSize && !this.store.has(key)) {
      this.evictOldest();
    }

    this.store.set(key, {
      value,
      expiresAt: Date.now() + (ttlMs ?? this.defaultTtlMs),
      insertedAt: Date.now(),
    });
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: string): boolean {
    return this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }

  private evictExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (entry.expiresAt <= now) {
        this.store.delete(key);
      }
    }
  }

  private evictOldest(): void {
    let oldestKey: string | undefined;
    let oldestTime = Infinity;
    for (const [key, entry] of this.store) {
      if (entry.insertedAt < oldestTime) {
        oldestTime = entry.insertedAt;
        oldestKey = key;
      }
    }
    if (oldestKey) {
      this.store.delete(oldestKey);
    }
  }
}
