export interface FrameMetric {
  timestamp: number;
  windowDurationMs: number;
  fps: number;
  minInstantFPS: number;
  maxInstantFPS: number;
  averageFrameTimeMs: number;
  p95FrameTimeMs: number;
  maxFrameTimeMs: number;
  totalFrames: number;
  droppedFrames: number;
  jankyFrames: number;
}

export interface RenderMetric {
  componentName: string;
  renderTime: number;
  renderIndex: number;
  timeSincePreviousRenderMs: number | null;
  timestamp: number;
}

export interface MemoryMetric {
  timestamp: number;
  jsHeapUsedMB: number;
  totalJSHeapMB: number | null;
  jsHeapLimitMB: number | null;
  available: boolean;
  source: string;
}

export interface ComponentRenderReport {
  average: number;
  median: number;
  p95: number;
  min: number;
  max: number;
  count: number;
  slowRenderCount: number;
  averageIntervalMs: number | null;
}

export interface PerformanceReport {
  sessionCode: string;
  sessionDurationMs: number;
  averageFPS: number;
  minFPS: number;
  maxFPS: number;
  fpsP95FrameTimeMs: number;
  averageFrameTimeMs: number;
  worstFrameTimeMs: number;
  totalFrames: number;
  droppedFrames: number;
  jankyFrames: number;
  jankRatePercent: number;
  averageJSHeapMB: number;
  peakJSHeapMB: number;
  initialJSHeapMB: number;
  finalJSHeapMB: number;
  heapDeltaMB: number;
  memoryAvailable: boolean;
  memorySource: string;
  componentRenderTimes: Record<string, ComponentRenderReport>;
  frameSampleCount: number;
  memorySampleCount: number;
  renderSampleCount: number;
  generatedAt: number;
}

export interface PerformanceState {
  frameMetrics: FrameMetric[];
  renderMetrics: RenderMetric[];
  memoryMetrics: MemoryMetric[];
  isMonitoring: boolean;
  report: PerformanceReport | null;
}
