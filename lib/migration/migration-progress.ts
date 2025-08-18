/**
 * GREEN PHASE - Migration Progress Tracker Implementation
 * Tracks and reports migration progress
 */

export interface ProgressUpdate {
  stage: string;
  totalItems: number;
  completedItems: number;
  percentage: number;
  message?: string;
  timestamp?: Date;
}

export interface MigrationProgressState {
  isRunning: boolean;
  startTime: Date | null;
  endTime: Date | null;
  currentStage: string;
  totalItems: number;
  completedItems: number;
  percentage: number;
  estimatedTimeRemaining: number;
  elapsedTime: number;
  stages: ProgressUpdate[];
  lastUpdate: Date | null;
}

export class MigrationProgress {
  private state: MigrationProgressState;
  private stageStartTimes: Map<string, number> = new Map();

  constructor() {
    this.state = {
      isRunning: false,
      startTime: null,
      endTime: null,
      currentStage: '',
      totalItems: 0,
      completedItems: 0,
      percentage: 0,
      estimatedTimeRemaining: 0,
      elapsedTime: 0,
      stages: [],
      lastUpdate: null
    };
  }

  startTracking(): void {
    this.state = {
      isRunning: true,
      startTime: new Date(),
      endTime: null,
      currentStage: 'initializing',
      totalItems: 0,
      completedItems: 0,
      percentage: 0,
      estimatedTimeRemaining: 0,
      elapsedTime: 0,
      stages: [],
      lastUpdate: new Date()
    };

    this.stageStartTimes.set('initializing', Date.now());
  }

  updateProgress(update: ProgressUpdate): void {
    if (!this.state.isRunning) {
      return;
    }

    const now = new Date();
    
    // If stage changed, record the previous stage completion time
    if (this.state.currentStage !== update.stage) {
      const previousStageTime = this.stageStartTimes.get(this.state.currentStage);
      if (previousStageTime) {
        const stageUpdate: ProgressUpdate = {
          stage: this.state.currentStage,
          totalItems: this.state.totalItems,
          completedItems: this.state.completedItems,
          percentage: this.state.percentage,
          timestamp: now
        };
        this.state.stages.push(stageUpdate);
      }
      
      this.stageStartTimes.set(update.stage, Date.now());
    }

    // Update current state
    this.state.currentStage = update.stage;
    this.state.totalItems = update.totalItems;
    this.state.completedItems = update.completedItems;
    this.state.percentage = update.percentage;
    this.state.lastUpdate = now;

    // Calculate elapsed time
    if (this.state.startTime) {
      this.state.elapsedTime = now.getTime() - this.state.startTime.getTime();
    }

    // Estimate remaining time based on current progress
    if (this.state.percentage > 0 && this.state.percentage < 100) {
      const timePerPercent = this.state.elapsedTime / this.state.percentage;
      this.state.estimatedTimeRemaining = timePerPercent * (100 - this.state.percentage);
    } else {
      this.state.estimatedTimeRemaining = 0;
    }
  }

  complete(): void {
    if (!this.state.isRunning) {
      return;
    }

    const now = new Date();
    
    // Add final stage
    const finalUpdate: ProgressUpdate = {
      stage: this.state.currentStage,
      totalItems: this.state.totalItems,
      completedItems: this.state.completedItems,
      percentage: 100,
      timestamp: now
    };
    this.state.stages.push(finalUpdate);

    this.state.isRunning = false;
    this.state.endTime = now;
    this.state.percentage = 100;
    this.state.estimatedTimeRemaining = 0;
    this.state.lastUpdate = now;

    if (this.state.startTime) {
      this.state.elapsedTime = now.getTime() - this.state.startTime.getTime();
    }
  }

  getProgress(): MigrationProgressState {
    return { ...this.state };
  }

  getStageProgress(): ProgressUpdate[] {
    return [...this.state.stages];
  }

  getCurrentStage(): string {
    return this.state.currentStage;
  }

  getElapsedTime(): number {
    return this.state.elapsedTime;
  }

  getEstimatedTimeRemaining(): number {
    return this.state.estimatedTimeRemaining;
  }

  isComplete(): boolean {
    return !this.state.isRunning && this.state.percentage === 100;
  }

  reset(): void {
    this.state = {
      isRunning: false,
      startTime: null,
      endTime: null,
      currentStage: '',
      totalItems: 0,
      completedItems: 0,
      percentage: 0,
      estimatedTimeRemaining: 0,
      elapsedTime: 0,
      stages: [],
      lastUpdate: null
    };
    this.stageStartTimes.clear();
  }

  // Utility methods for reporting
  getProgressSummary(): string {
    if (!this.state.isRunning && this.state.percentage === 0) {
      return 'Migration not started';
    }

    if (this.isComplete()) {
      const totalTimeSeconds = Math.round(this.state.elapsedTime / 1000);
      return `Migration completed in ${totalTimeSeconds} seconds`;
    }

    const remainingSeconds = Math.round(this.state.estimatedTimeRemaining / 1000);
    return `${this.state.currentStage}: ${this.state.percentage.toFixed(1)}% complete (${remainingSeconds}s remaining)`;
  }

  getDetailedReport(): {
    summary: string;
    stages: ProgressUpdate[];
    timing: {
      startTime: Date | null;
      endTime: Date | null;
      elapsedTime: number;
      estimatedTimeRemaining: number;
    };
    progress: {
      currentStage: string;
      completedItems: number;
      totalItems: number;
      percentage: number;
    };
  } {
    return {
      summary: this.getProgressSummary(),
      stages: this.getStageProgress(),
      timing: {
        startTime: this.state.startTime,
        endTime: this.state.endTime,
        elapsedTime: this.state.elapsedTime,
        estimatedTimeRemaining: this.state.estimatedTimeRemaining
      },
      progress: {
        currentStage: this.state.currentStage,
        completedItems: this.state.completedItems,
        totalItems: this.state.totalItems,
        percentage: this.state.percentage
      }
    };
  }
}