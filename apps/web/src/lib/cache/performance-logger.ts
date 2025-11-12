interface PerformanceLog {
    operation: string;
    startTime: number;
    endTime?: number;
    duration?: number;
    metadata?: Record<string, any>;
}

interface PerformanceMetrics {
    operation: string;
    count: number;
    totalTime: number;
    avgTime: number;
    minTime: number;
    maxTime: number;
}

class PerformanceLogger {
    private logs: Map<string, PerformanceLog> = new Map();
    private completedLogs: PerformanceLog[] = [];
    private enableLogging: boolean;

    constructor(enableLogging: boolean = true) {
        this.enableLogging = enableLogging;
    }

    start(
        operationId: string,
        operationName: string,
        metadata?: Record<string, any>,
    ): void {
        const log: PerformanceLog = {
            operation: operationName,
            startTime: Date.now(),
            metadata,
        };

        this.logs.set(operationId, log);

        if (this.enableLogging) {
            const metaStr = metadata ? ` | ${JSON.stringify(metadata)}` : "";
            console.log(`[Perf] START: ${operationName}${metaStr}`);
        }
    }

    end(operationId: string, additionalMetadata?: Record<string, any>): number {
        const log = this.logs.get(operationId);
        if (!log) {
            console.warn(
                `[Perf] No start log found for operation: ${operationId}`,
            );
            return 0;
        }

        log.endTime = Date.now();
        log.duration = log.endTime - log.startTime;

        if (additionalMetadata) {
            log.metadata = { ...log.metadata, ...additionalMetadata };
        }

        this.completedLogs.push(log);
        this.logs.delete(operationId);

        if (this.enableLogging) {
            const metaStr = log.metadata
                ? ` | ${JSON.stringify(log.metadata)}`
                : "";
            console.log(
                `[Perf] END: ${log.operation} | Duration: ${log.duration}ms${metaStr}`,
            );
        }

        return log.duration;
    }

    getMetrics(): PerformanceMetrics[] {
        const metricsMap = new Map<string, PerformanceMetrics>();

        for (const log of this.completedLogs) {
            if (!log.duration) continue;

            let metrics = metricsMap.get(log.operation);
            if (!metrics) {
                metrics = {
                    operation: log.operation,
                    count: 0,
                    totalTime: 0,
                    avgTime: 0,
                    minTime: Infinity,
                    maxTime: 0,
                };
                metricsMap.set(log.operation, metrics);
            }

            metrics.count++;
            metrics.totalTime += log.duration;
            metrics.avgTime = metrics.totalTime / metrics.count;
            metrics.minTime = Math.min(metrics.minTime, log.duration);
            metrics.maxTime = Math.max(metrics.maxTime, log.duration);
        }

        return Array.from(metricsMap.values());
    }

    getDetailedLogs(): PerformanceLog[] {
        return [...this.completedLogs];
    }

    clear(): void {
        this.logs.clear();
        this.completedLogs = [];
    }

    printSummary(): void {
        const metrics = this.getMetrics();

        console.log("\n===== Performance Summary =====");
        console.log(`Total Operations: ${this.completedLogs.length}`);
        console.log("\nMetrics by Operation:");

        metrics.forEach((m) => {
            console.log(`\n${m.operation}:`);
            console.log(`  Count: ${m.count}`);
            console.log(`  Total Time: ${m.totalTime.toFixed(2)}ms`);
            console.log(`  Avg Time: ${m.avgTime.toFixed(2)}ms`);
            console.log(`  Min Time: ${m.minTime.toFixed(2)}ms`);
            console.log(`  Max Time: ${m.maxTime.toFixed(2)}ms`);
        });

        console.log("\n===============================\n");
    }

    exportToJson(): string {
        return JSON.stringify(
            {
                summary: this.getMetrics(),
                detailedLogs: this.completedLogs,
            },
            null,
            2,
        );
    }
}

let globalLogger: PerformanceLogger | null = null;

export function getPerformanceLogger(): PerformanceLogger {
    if (!globalLogger) {
        globalLogger = new PerformanceLogger(
            process.env.NODE_ENV === "development" ||
                process.env.ENABLE_PERF_LOGGING === "true",
        );
    }
    return globalLogger;
}

export async function measureAsync<T>(
    operationName: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>,
): Promise<{ result: T; duration: number }> {
    const logger = getPerformanceLogger();
    const operationId = `${operationName}-${Date.now()}-${Math.random()}`;

    logger.start(operationId, operationName, metadata);

    try {
        const result = await fn();
        const duration = logger.end(operationId, { success: true });
        return { result, duration };
    } catch (error) {
        const duration = logger.end(operationId, {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        });
        throw error;
    }
}

export function measureSync<T>(
    operationName: string,
    fn: () => T,
    metadata?: Record<string, any>,
): { result: T; duration: number } {
    const logger = getPerformanceLogger();
    const operationId = `${operationName}-${Date.now()}-${Math.random()}`;

    logger.start(operationId, operationName, metadata);

    try {
        const result = fn();
        const duration = logger.end(operationId, { success: true });
        return { result, duration };
    } catch (error) {
        const duration = logger.end(operationId, {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        });
        throw error;
    }
}

export { PerformanceLogger };
export type { PerformanceLog, PerformanceMetrics };
