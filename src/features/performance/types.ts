export interface FrameMetric {
  timestamp: number;
  fps: number;
}

export interface RenderMetric {
  componentName: string;
  renderTime: number;
  timestamp: number;
}

export interface MemoryMetric {
  timestamp: number;
  jsHeapUsedMB: number;
}

export interface PerformanceReport {
  sessionCode: string;
  sessionDurationMs: number;
  averageFPS: number;
  minFPS: number;
  maxFPS: number;
  averageJSHeapMB: number;
  peakJSHeapMB: number;
  componentRenderTimes: Record<string, { average: number; count: number }>;
  generatedAt: number;
}

export interface PerformanceState {
  frameMetrics: FrameMetric[];
  renderMetrics: RenderMetric[];
  memoryMetrics: MemoryMetric[];
  isMonitoring: boolean;
  report: PerformanceReport | null;
}
