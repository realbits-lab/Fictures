/**
 * GREEN PHASE - Batch Processor Implementation
 * Handles batch processing of large datasets during migration
 */

import { DrizzleD1Database } from 'drizzle-orm/d1';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { book, chapter } from '../db/schema';

export interface BatchProgress {
  totalBatches: number;
  completedBatches: number;
  currentBatch: number;
  itemsInCurrentBatch: number;
  totalItems: number;
  processedItems: number;
  percentage: number;
  estimatedTimeRemaining: number;
  averageBatchTime: number;
}

export class BatchProcessor {
  private db: PostgresJsDatabase<any> | DrizzleD1Database<any>;
  private batchTimes: number[] = [];

  constructor(database: PostgresJsDatabase<any> | DrizzleD1Database<any>) {
    this.db = database;
  }

  async processBooksInBatches<T>(
    items: T[],
    batchSize: number,
    processor: (batch: T[]) => Promise<void>
  ): Promise<BatchProgress> {
    const totalBatches = items.length === 0 ? 0 : Math.ceil(items.length / batchSize);
    let completedBatches = 0;
    
    const progress: BatchProgress = {
      totalBatches,
      completedBatches: 0,
      currentBatch: 0,
      itemsInCurrentBatch: 0,
      totalItems: items.length,
      processedItems: 0,
      percentage: items.length === 0 ? 100 : 0, // Handle empty array case
      estimatedTimeRemaining: 0,
      averageBatchTime: 0
    };

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchStartTime = Date.now();
      
      progress.currentBatch = Math.floor(i / batchSize) + 1;
      progress.itemsInCurrentBatch = batch.length;

      try {
        await processor(batch);
        
        const batchTime = Date.now() - batchStartTime;
        this.batchTimes.push(batchTime);
        
        completedBatches++;
        progress.completedBatches = completedBatches;
        progress.processedItems = Math.min(i + batchSize, items.length);
        progress.percentage = (progress.processedItems / items.length) * 100;
        progress.averageBatchTime = this.batchTimes.reduce((a, b) => a + b, 0) / this.batchTimes.length;
        
        const remainingBatches = totalBatches - completedBatches;
        progress.estimatedTimeRemaining = remainingBatches * progress.averageBatchTime;

      } catch (error) {
        throw new Error(`Batch processing failed at batch ${progress.currentBatch}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return progress;
  }

  async processChaptersInBatches<T>(
    items: T[],
    batchSize: number,
    processor: (batch: T[]) => Promise<void>
  ): Promise<BatchProgress> {
    // Same implementation as processBooksInBatches for now
    return this.processBooksInBatches(items, batchSize, processor);
  }

  getBatchProgress(): BatchProgress {
    const totalBatches = this.batchTimes.length;
    const averageTime = totalBatches > 0 ? 
      this.batchTimes.reduce((a, b) => a + b, 0) / totalBatches : 0;

    return {
      totalBatches,
      completedBatches: totalBatches,
      currentBatch: totalBatches,
      itemsInCurrentBatch: 0,
      totalItems: 0,
      processedItems: 0,
      percentage: 100,
      estimatedTimeRemaining: 0,
      averageBatchTime: averageTime
    };
  }

  resetProgress(): void {
    this.batchTimes = [];
  }

  async optimizeBatchSize(
    sampleItems: any[],
    initialBatchSize: number,
    targetTimePerBatch: number = 5000 // 5 seconds
  ): Promise<number> {
    if (sampleItems.length < initialBatchSize) {
      return Math.max(1, sampleItems.length);
    }

    // Test with initial batch size
    const testBatch = sampleItems.slice(0, initialBatchSize);
    const startTime = Date.now();
    
    // Simulate processing time (in real implementation, this would do actual work)
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const actualTime = Date.now() - startTime;
    
    // Calculate optimal batch size based on target time
    let optimalBatchSize = Math.floor((targetTimePerBatch / actualTime) * initialBatchSize);
    
    // Ensure reasonable bounds
    optimalBatchSize = Math.max(1, Math.min(optimalBatchSize, 100));
    
    return optimalBatchSize;
  }
}