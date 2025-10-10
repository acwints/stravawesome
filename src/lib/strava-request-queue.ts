/**
 * Strava API Request Queue
 * Manages concurrent requests to prevent rate limiting
 */

import { logger } from './logger';

interface QueuedRequest {
  id: string;
  execute: () => Promise<unknown>;
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  priority: number;
  timestamp: number;
}

class StravaRequestQueue {
  private queue: QueuedRequest[] = [];
  private processing = false;
  private requestDelay = 120; // 120ms delay between requests to stay under Strava rate limits while improving throughput
  private lastRequestTime = 0;

  /**
   * Add a request to the queue
   */
  async enqueue<T>(
    requestFn: () => Promise<T>,
    priority: number = 0,
    requestId?: string
  ): Promise<T> {
    const id = requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return new Promise<T>((resolve, reject) => {
      const queuedRequest: QueuedRequest = {
        id,
        execute: requestFn as () => Promise<unknown>,
        resolve: resolve as (value: unknown) => void,
        reject,
        priority,
        timestamp: Date.now(),
      };

      // Insert request in priority order (higher priority first)
      const insertIndex = this.queue.findIndex(req => req.priority < priority);
      if (insertIndex === -1) {
        this.queue.push(queuedRequest);
      } else {
        this.queue.splice(insertIndex, 0, queuedRequest);
      }

      logger.debug('Request queued', { 
        id, 
        priority, 
        queueLength: this.queue.length 
      });

      this.processQueue();
    });
  }

  /**
   * Process the queue with rate limiting
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const request = this.queue.shift();
      if (!request) break;

      try {
        // Ensure minimum delay between requests
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < this.requestDelay) {
          await new Promise(resolve => 
            setTimeout(resolve, this.requestDelay - timeSinceLastRequest)
          );
        }

        logger.debug('Processing queued request', { 
          id: request.id, 
          queueLength: this.queue.length 
        });

        const result = await request.execute();
        request.resolve(result);
        
        this.lastRequestTime = Date.now();
        
        logger.debug('Request completed', { 
          id: request.id,
          duration: Date.now() - request.timestamp
        });

      } catch (error) {
        logger.error('Request failed', error, { id: request.id });
        request.reject(error as Error);
      }
    }

    this.processing = false;
  }

  /**
   * Get queue status
   */
  getStatus() {
    return {
      queueLength: this.queue.length,
      processing: this.processing,
      lastRequestTime: this.lastRequestTime,
    };
  }

  /**
   * Clear the queue
   */
  clear(): void {
    this.queue.forEach(request => {
      request.reject(new Error('Queue cleared'));
    });
    this.queue = [];
    this.processing = false;
  }
}

export const stravaRequestQueue = new StravaRequestQueue();
