import type { RootState } from '@store/index';
import {
  generateReport,
  measureRender,
  printReport,
  startFPSMonitor,
  startMemoryMonitor,
} from './performanceService';

function makeState(overrides: Partial<RootState['performance']> = {}): RootState {
  return {
    session: { session: null, status: 'idle', role: null, error: null },
    chat: { messages: [], isTyping: false, error: null },
    screenshot: { pendingRequest: null, lastScreenshot: null, isSending: false, error: null },
    commands: { pendingCommand: null, sentCommands: [], error: null },
    performance: {
      frameMetrics: [],
      renderMetrics: [],
      memoryMetrics: [],
      isMonitoring: false,
      report: null,
      ...overrides,
    },
  };
}

describe('performanceService', () => {
  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(10_000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('generates a detailed report from collected metrics', () => {
    const state = makeState({
      frameMetrics: [
        {
          timestamp: 1,
          windowDurationMs: 1000,
          fps: 60,
          minInstantFPS: 55,
          maxInstantFPS: 62,
          averageFrameTimeMs: 16.5,
          p95FrameTimeMs: 20,
          maxFrameTimeMs: 24,
          totalFrames: 60,
          droppedFrames: 0,
          jankyFrames: 0,
        },
        {
          timestamp: 2,
          windowDurationMs: 1000,
          fps: 48,
          minInstantFPS: 30,
          maxInstantFPS: 60,
          averageFrameTimeMs: 21,
          p95FrameTimeMs: 55,
          maxFrameTimeMs: 80,
          totalFrames: 48,
          droppedFrames: 8,
          jankyFrames: 2,
        },
      ],
      renderMetrics: [
        {
          componentName: 'ClientScreen',
          renderTime: 10,
          renderIndex: 1,
          timeSincePreviousRenderMs: null,
          timestamp: 1,
        },
        {
          componentName: 'ClientScreen',
          renderTime: 30,
          renderIndex: 2,
          timeSincePreviousRenderMs: 100,
          timestamp: 2,
        },
        {
          componentName: 'ChatInput',
          renderTime: 4,
          renderIndex: 1,
          timeSincePreviousRenderMs: null,
          timestamp: 3,
        },
      ],
      memoryMetrics: [
        {
          timestamp: 1,
          jsHeapUsedMB: 10,
          totalJSHeapMB: 20,
          jsHeapLimitMB: 100,
          available: true,
          source: 'performance.memory',
        },
        {
          timestamp: 2,
          jsHeapUsedMB: 14,
          totalJSHeapMB: 20,
          jsHeapLimitMB: 100,
          available: true,
          source: 'performance.memory',
        },
      ],
    });

    const report = generateReport(state, 'ABC123', 5_000);

    expect(report.sessionCode).toBe('ABC123');
    expect(report.sessionDurationMs).toBe(5_000);
    expect(report.averageFPS).toBe(54);
    expect(report.minFPS).toBe(48);
    expect(report.maxFPS).toBe(60);
    expect(report.fpsP95FrameTimeMs).toBe(55);
    expect(report.worstFrameTimeMs).toBe(80);
    expect(report.droppedFrames).toBe(8);
    expect(report.jankyFrames).toBe(2);
    expect(report.memoryAvailable).toBe(true);
    expect(report.averageJSHeapMB).toBe(12);
    expect(report.peakJSHeapMB).toBe(14);
    expect(report.heapDeltaMB).toBe(4);
    expect(report.componentRenderTimes.ClientScreen).toMatchObject({
      average: 20,
      median: 10,
      p95: 30,
      max: 30,
      count: 2,
      slowRenderCount: 1,
      averageIntervalMs: 100,
    });
  });

  it('handles missing memory support explicitly', () => {
    const report = generateReport(
      makeState({
        memoryMetrics: [
          {
            timestamp: 1,
            jsHeapUsedMB: 0,
            totalJSHeapMB: null,
            jsHeapLimitMB: null,
            available: false,
            source: 'unavailable',
          },
        ],
      }),
      'ABC123',
      9_000,
    );

    expect(report.memoryAvailable).toBe(false);
    expect(report.memorySource).toBe('unavailable');
    expect(report.averageJSHeapMB).toBe(0);
  });

  it('prints a visible report block and details group', () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    const table = jest.spyOn(console, 'table').mockImplementation(() => undefined);
    const group = jest.spyOn(console, 'group').mockImplementation(() => undefined);
    const groupEnd = jest.spyOn(console, 'groupEnd').mockImplementation(() => undefined);
    const report = generateReport(
      makeState({
        frameMetrics: [
          {
            timestamp: 1,
            windowDurationMs: 1000,
            fps: 120,
            minInstantFPS: 90,
            maxInstantFPS: 121,
            averageFrameTimeMs: 8,
            p95FrameTimeMs: 12,
            maxFrameTimeMs: 30,
            totalFrames: 120,
            droppedFrames: 0,
            jankyFrames: 0,
          },
        ],
      }),
      'ABC123',
      9_000,
    );

    printReport(report);

    expect(log).toHaveBeenCalledWith('PERFORMANCE REPORT - SUPPORT SESSION');
    expect(log).toHaveBeenCalledWith(expect.stringContaining('Refresh rate note'));
    expect(group).toHaveBeenCalledWith('PERFORMANCE REPORT - SUPPORT SESSION - DETAILS');
    expect(table).toHaveBeenCalled();
    expect(groupEnd).toHaveBeenCalled();
  });

  it('samples memory using performance.memory when available', () => {
    jest.useFakeTimers();
    const dispatch = jest.fn();
    Object.defineProperty(performance, 'memory', {
      configurable: true,
      value: {
        usedJSHeapSize: 10 * 1048576,
        totalJSHeapSize: 20 * 1048576,
        jsHeapSizeLimit: 100 * 1048576,
      },
    });

    const stop = startMemoryMonitor(dispatch);
    jest.advanceTimersByTime(3000);
    stop();

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'performance/addMemoryMetric',
        payload: expect.objectContaining({
          jsHeapUsedMB: 10,
          totalJSHeapMB: 20,
          jsHeapLimitMB: 100,
          available: true,
        }),
      }),
    );
  });

  it('marks memory as unavailable when runtime does not expose performance.memory', () => {
    jest.useFakeTimers();
    const dispatch = jest.fn();
    Object.defineProperty(performance, 'memory', {
      configurable: true,
      value: undefined,
    });

    const stop = startMemoryMonitor(dispatch);
    stop();

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'performance/addMemoryMetric',
        payload: expect.objectContaining({
          available: false,
          jsHeapUsedMB: 0,
        }),
      }),
    );
  });

  it('samples FPS windows using requestAnimationFrame', () => {
    const dispatch = jest.fn();
    const callbacks: FrameRequestCallback[] = [];
    const requestAnimationFrameSpy = jest
      .spyOn(global, 'requestAnimationFrame')
      .mockImplementation((callback) => {
        callbacks.push(callback);
        return callbacks.length;
      });
    const cancelAnimationFrameSpy = jest
      .spyOn(global, 'cancelAnimationFrame')
      .mockImplementation(() => undefined);
    jest.spyOn(performance, 'now')
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(1030);

    const stop = startFPSMonitor(dispatch);
    for (const time of [16, 32, 48, 64, 80, 96, 250, 500, 750, 1030]) {
      const callback = callbacks.shift();
      callback?.(time);
    }
    stop();

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'performance/addFrameMetric',
        payload: expect.objectContaining({
          totalFrames: expect.any(Number),
          fps: expect.any(Number),
          droppedFrames: expect.any(Number),
          jankyFrames: expect.any(Number),
        }),
      }),
    );
    expect(requestAnimationFrameSpy).toHaveBeenCalled();
    expect(cancelAnimationFrameSpy).toHaveBeenCalled();
  });

  it('measures an imperative render block', () => {
    const dispatch = jest.fn();
    jest.spyOn(performance, 'now').mockReturnValueOnce(10).mockReturnValueOnce(18.8);
    const renderFn = jest.fn();

    measureRender('ManualComponent', renderFn, dispatch);

    expect(renderFn).toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'performance/addRenderMetric',
        payload: expect.objectContaining({
          componentName: 'ManualComponent',
          renderTime: 8.8,
        }),
      }),
    );
  });

  it('classifies poor FPS and unavailable render data in printed report', () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'table').mockImplementation(() => undefined);
    jest.spyOn(console, 'group').mockImplementation(() => undefined);
    jest.spyOn(console, 'groupEnd').mockImplementation(() => undefined);

    const report = generateReport(
      makeState({
        frameMetrics: [
          {
            timestamp: 1,
            windowDurationMs: 1000,
            fps: 35,
            minInstantFPS: 20,
            maxInstantFPS: 40,
            averageFrameTimeMs: 30,
            p95FrameTimeMs: 80,
            maxFrameTimeMs: 180,
            totalFrames: 35,
            droppedFrames: 30,
            jankyFrames: 10,
          },
        ],
      }),
      'LOWFPS',
      9_000,
    );

    printReport(report);

    expect(log).toHaveBeenCalledWith('FPS diagnosis: Precisa de otimizacao');
    expect(log).toHaveBeenCalledWith('No component render samples collected.');
  });

  it('prints intermediate FPS, render and memory diagnoses', () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'table').mockImplementation(() => undefined);
    jest.spyOn(console, 'group').mockImplementation(() => undefined);
    jest.spyOn(console, 'groupEnd').mockImplementation(() => undefined);

    const report = generateReport(
      makeState({
        frameMetrics: [
          {
            timestamp: 1,
            windowDurationMs: 1000,
            fps: 52,
            minInstantFPS: 45,
            maxInstantFPS: 58,
            averageFrameTimeMs: 19,
            p95FrameTimeMs: 40,
            maxFrameTimeMs: 90,
            totalFrames: 52,
            droppedFrames: 5,
            jankyFrames: 2,
          },
        ],
        renderMetrics: [
          {
            componentName: 'Healthy',
            renderTime: 8,
            renderIndex: 1,
            timeSincePreviousRenderMs: null,
            timestamp: 1,
          },
          {
            componentName: 'Monitor',
            renderTime: 20,
            renderIndex: 1,
            timeSincePreviousRenderMs: null,
            timestamp: 2,
          },
          {
            componentName: 'Priority',
            renderTime: 40,
            renderIndex: 1,
            timeSincePreviousRenderMs: null,
            timestamp: 3,
          },
        ],
        memoryMetrics: [
          {
            timestamp: 1,
            jsHeapUsedMB: 10,
            totalJSHeapMB: 20,
            jsHeapLimitMB: 100,
            available: true,
            source: 'performance.memory',
          },
          {
            timestamp: 2,
            jsHeapUsedMB: 17,
            totalJSHeapMB: 20,
            jsHeapLimitMB: 100,
            available: true,
            source: 'performance.memory',
          },
        ],
      }),
      'MIDFPS',
      9_000,
    );

    printReport(report);

    expect(log).toHaveBeenCalledWith('FPS diagnosis: Bom com atencao');
    expect(log).toHaveBeenCalledWith('Memory diagnosis: Crescimento moderado de heap');
  });

  it('prints regular FPS and high memory growth diagnoses', () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'table').mockImplementation(() => undefined);
    jest.spyOn(console, 'group').mockImplementation(() => undefined);
    jest.spyOn(console, 'groupEnd').mockImplementation(() => undefined);

    const report = generateReport(
      makeState({
        frameMetrics: [
          {
            timestamp: 1,
            windowDurationMs: 1000,
            fps: 47,
            minInstantFPS: 30,
            maxInstantFPS: 55,
            averageFrameTimeMs: 22,
            p95FrameTimeMs: 60,
            maxFrameTimeMs: 100,
            totalFrames: 47,
            droppedFrames: 8,
            jankyFrames: 2,
          },
        ],
        memoryMetrics: [
          {
            timestamp: 1,
            jsHeapUsedMB: 10,
            totalJSHeapMB: 20,
            jsHeapLimitMB: 100,
            available: true,
            source: 'performance.memory',
          },
          {
            timestamp: 2,
            jsHeapUsedMB: 25,
            totalJSHeapMB: 30,
            jsHeapLimitMB: 100,
            available: true,
            source: 'performance.memory',
          },
        ],
      }),
      'REGFPS',
      9_000,
    );

    printReport(report);

    expect(log).toHaveBeenCalledWith('FPS diagnosis: Regular: houve travadas pontuais');
    expect(log).toHaveBeenCalledWith('Memory diagnosis: Crescimento alto de heap');
  });

  it('prints excellent render and stable memory diagnoses', () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'table').mockImplementation(() => undefined);
    jest.spyOn(console, 'group').mockImplementation(() => undefined);
    jest.spyOn(console, 'groupEnd').mockImplementation(() => undefined);

    const report = generateReport(
      makeState({
        frameMetrics: [
          {
            timestamp: 1,
            windowDurationMs: 1000,
            fps: 60,
            minInstantFPS: 58,
            maxInstantFPS: 61,
            averageFrameTimeMs: 16,
            p95FrameTimeMs: 20,
            maxFrameTimeMs: 24,
            totalFrames: 60,
            droppedFrames: 0,
            jankyFrames: 0,
          },
        ],
        renderMetrics: [
          {
            componentName: 'FastComponent',
            renderTime: 8,
            renderIndex: 1,
            timeSincePreviousRenderMs: null,
            timestamp: 1,
          },
        ],
        memoryMetrics: [
          {
            timestamp: 1,
            jsHeapUsedMB: 10,
            totalJSHeapMB: 20,
            jsHeapLimitMB: 100,
            available: true,
            source: 'performance.memory',
          },
          {
            timestamp: 2,
            jsHeapUsedMB: 12,
            totalJSHeapMB: 20,
            jsHeapLimitMB: 100,
            available: true,
            source: 'performance.memory',
          },
        ],
      }),
      'GOOD',
      9_000,
    );

    printReport(report);

    expect(log).toHaveBeenCalledWith('Render diagnosis: Excelente');
    expect(log).toHaveBeenCalledWith('Memory diagnosis: Estavel');
  });
});
