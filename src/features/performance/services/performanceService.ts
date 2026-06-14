import type { AppDispatch, RootState } from '@store/index';
import { addFrameMetric, addMemoryMetric, addRenderMetric } from '../store';
import type { PerformanceReport } from '../types';

export function startFPSMonitor(dispatch: AppDispatch): () => void {
  let lastTime = performance.now();
  let frameCount = 0;
  let fpsSum = 0;
  let windowStartTime = performance.now();
  let animationFrameId: number;

  const loop = (now: number): void => {
    const deltaTime = now - lastTime;
    lastTime = now;

    if (deltaTime > 0) {
      const fps = 1000 / deltaTime;
      fpsSum += fps;
      frameCount++;
    }

    if (now - windowStartTime >= 1000) {
      const averageFps = frameCount > 0 ? fpsSum / frameCount : 0;
      dispatch(
        addFrameMetric({
          timestamp: Date.now(),
          fps: parseFloat(averageFps.toFixed(1)),
        }),
      );
      frameCount = 0;
      fpsSum = 0;
      windowStartTime = now;
    }

    animationFrameId = requestAnimationFrame(loop);
  };

  animationFrameId = requestAnimationFrame(loop);

  return () => {
    cancelAnimationFrame(animationFrameId);
  };
}

export function startMemoryMonitor(dispatch: AppDispatch): () => void {
  const intervalId = setInterval(() => {
    const memory = (performance as any).memory;
    const usedJSHeapSize = memory?.usedJSHeapSize ?? 0;
    const jsHeapUsedMB = usedJSHeapSize / 1048576;

    dispatch(
      addMemoryMetric({
        timestamp: Date.now(),
        jsHeapUsedMB: parseFloat(jsHeapUsedMB.toFixed(2)),
      }),
    );
  }, 3000);

  return () => {
    clearInterval(intervalId);
  };
}

export function measureRender(
  componentName: string,
  renderFn: () => void,
  dispatch: AppDispatch,
): void {
  const start = Date.now();
  renderFn();
  const end = Date.now();
  const renderTime = end - start;

  dispatch(
    addRenderMetric({
      componentName,
      renderTime,
      timestamp: Date.now(),
    }),
  );
}

export function generateReport(
  state: RootState,
  sessionCode: string,
  sessionStartTime: number,
): PerformanceReport {
  const { frameMetrics, renderMetrics, memoryMetrics } = state.performance;
  const sessionDurationMs = Date.now() - sessionStartTime;

  let averageFPS = 0;
  let minFPS = 0;
  let maxFPS = 0;

  if (frameMetrics.length > 0) {
    const fpsValues = frameMetrics.map((m) => m.fps);
    const sum = fpsValues.reduce((a, b) => a + b, 0);
    averageFPS = parseFloat((sum / fpsValues.length).toFixed(1));
    minFPS = Math.min(...fpsValues);
    maxFPS = Math.max(...fpsValues);
  }

  let averageJSHeapMB = 0;
  let peakJSHeapMB = 0;

  if (memoryMetrics.length > 0) {
    const heapValues = memoryMetrics.map((m) => m.jsHeapUsedMB);
    const sum = heapValues.reduce((a, b) => a + b, 0);
    averageJSHeapMB = parseFloat((sum / heapValues.length).toFixed(2));
    peakJSHeapMB = parseFloat(Math.max(...heapValues).toFixed(2));
  }

  const componentGroups: Record<string, { sum: number; count: number }> = {};
  for (const metric of renderMetrics) {
    if (!componentGroups[metric.componentName]) {
      componentGroups[metric.componentName] = { sum: 0, count: 0 };
    }
    componentGroups[metric.componentName].sum += metric.renderTime;
    componentGroups[metric.componentName].count += 1;
  }

  const componentRenderTimes: Record<
    string,
    { average: number; count: number }
  > = {};
  for (const [name, data] of Object.entries(componentGroups)) {
    componentRenderTimes[name] = {
      average: parseFloat((data.sum / data.count).toFixed(2)),
      count: data.count,
    };
  }

  return {
    sessionCode,
    sessionDurationMs,
    averageFPS,
    minFPS,
    maxFPS,
    averageJSHeapMB,
    peakJSHeapMB,
    componentRenderTimes,
    generatedAt: Date.now(),
  };
}

export function printReport(report: PerformanceReport): void {
  const durationSec = (report.sessionDurationMs / 1000).toFixed(1);
  const isoDate = new Date(report.generatedAt).toISOString();

  console.group(
    '╔══════════════════════════════════════╗\n║     PERFORMANCE REPORT — SESSION     ║\n╚══════════════════════════════════════╝',
  );
  console.log(`Session Code: ${report.sessionCode}`);
  console.log(`Duration: ${durationSec}s`);
  console.log('── FPS ──');
  console.log(
    `Average: ${report.averageFPS} | Min: ${report.minFPS} | Max: ${report.maxFPS}`,
  );
  console.log('── JS HEAP ──');
  console.log(
    `Average: ${report.averageJSHeapMB} MB | Peak: ${report.peakJSHeapMB} MB`,
  );
  console.log('── RENDER TIMES ──');

  const renderTableData = Object.entries(report.componentRenderTimes).map(
    ([name, stats]) => ({
      'Component Name': name,
      'Average (ms)': stats.average,
      'Render Count': stats.count,
    }),
  );
  console.table(renderTableData);

  console.log(`Generated at: ${isoDate}`);
  console.groupEnd();
}
