import {
  addFrameMetric,
  addMemoryMetric,
  addRenderMetric,
  clearMetrics,
  performanceReducer,
  setIsMonitoring,
  setReport,
} from './performanceSlice';
import type { PerformanceReport } from '../types';

const report: PerformanceReport = {
  sessionCode: 'ABC123',
  sessionDurationMs: 1000,
  averageFPS: 60,
  minFPS: 58,
  maxFPS: 61,
  fpsP95FrameTimeMs: 18,
  averageFrameTimeMs: 16,
  worstFrameTimeMs: 20,
  totalFrames: 60,
  droppedFrames: 0,
  jankyFrames: 0,
  jankRatePercent: 0,
  averageJSHeapMB: 12,
  peakJSHeapMB: 14,
  initialJSHeapMB: 10,
  finalJSHeapMB: 12,
  heapDeltaMB: 2,
  memoryAvailable: true,
  memorySource: 'performance.memory',
  componentRenderTimes: {},
  frameSampleCount: 1,
  memorySampleCount: 1,
  renderSampleCount: 1,
  generatedAt: 123,
};

describe('performanceSlice', () => {
  it('stores metrics and report', () => {
    let state = performanceReducer(undefined, setIsMonitoring(true));
    state = performanceReducer(
      state,
      addFrameMetric({
        timestamp: 1,
        windowDurationMs: 1000,
        fps: 60,
        minInstantFPS: 58,
        maxInstantFPS: 61,
        averageFrameTimeMs: 16,
        p95FrameTimeMs: 18,
        maxFrameTimeMs: 20,
        totalFrames: 60,
        droppedFrames: 0,
        jankyFrames: 0,
      }),
    );
    state = performanceReducer(
      state,
      addRenderMetric({
        componentName: 'Component',
        renderTime: 4,
        renderIndex: 1,
        timeSincePreviousRenderMs: null,
        timestamp: 2,
      }),
    );
    state = performanceReducer(
      state,
      addMemoryMetric({
        timestamp: 3,
        jsHeapUsedMB: 12,
        totalJSHeapMB: 16,
        jsHeapLimitMB: 64,
        available: true,
        source: 'performance.memory',
      }),
    );
    state = performanceReducer(state, setReport(report));

    expect(state.isMonitoring).toBe(true);
    expect(state.frameMetrics).toHaveLength(1);
    expect(state.renderMetrics).toHaveLength(1);
    expect(state.memoryMetrics).toHaveLength(1);
    expect(state.report).toEqual(report);
  });

  it('clears metrics and report', () => {
    const state = performanceReducer(
      { frameMetrics: [], renderMetrics: [], memoryMetrics: [], isMonitoring: true, report },
      clearMetrics(),
    );

    expect(state).toEqual({
      frameMetrics: [],
      renderMetrics: [],
      memoryMetrics: [],
      isMonitoring: true,
      report: null,
    });
  });
});
