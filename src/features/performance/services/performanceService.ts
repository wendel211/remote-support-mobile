import type { AppDispatch, RootState } from '@store/index';
import { addFrameMetric, addMemoryMetric, addRenderMetric } from '../store';
import type {
  ComponentRenderReport,
  MemoryMetric,
  PerformanceReport,
  RenderMetric,
} from '../types';

const TARGET_FRAME_MS = 1000 / 60;
const JANK_FRAME_MS = 50;
const SLOW_RENDER_MS = 16;
const FPS_SAMPLE_WINDOW_MS = 1000;
const MEMORY_SAMPLE_INTERVAL_MS = 3000;
const BYTES_IN_MB = 1048576;

interface PerformanceMemorySnapshot {
  usedJSHeapSize?: number;
  totalJSHeapSize?: number;
  jsHeapSizeLimit?: number;
}

export function startFPSMonitor(dispatch: AppDispatch): () => void {
  let lastFrameTime = performance.now();
  let windowStartTime = lastFrameTime;
  let frameDurations: number[] = [];
  let animationFrameId: number;
  let cancelled = false;

  const flushWindow = (now: number): void => {
    const windowDurationMs = now - windowStartTime;

    if (frameDurations.length === 0 || windowDurationMs <= 0) {
      windowStartTime = now;
      frameDurations = [];
      return;
    }

    const totalFrameTime = sum(frameDurations);
    const totalFrames = frameDurations.length;
    const instantFPSValues = frameDurations.map((duration) => 1000 / duration);
    const droppedFrames = frameDurations.reduce(
      (total, duration) => total + Math.max(0, Math.floor(duration / TARGET_FRAME_MS) - 1),
      0,
    );
    const jankyFrames = frameDurations.filter((duration) => duration >= JANK_FRAME_MS).length;

    dispatch(
      addFrameMetric({
        timestamp: Date.now(),
        windowDurationMs: round(windowDurationMs, 1),
        fps: round((totalFrames * 1000) / windowDurationMs, 1),
        minInstantFPS: round(Math.min(...instantFPSValues), 1),
        maxInstantFPS: round(Math.max(...instantFPSValues), 1),
        averageFrameTimeMs: round(totalFrameTime / totalFrames, 2),
        p95FrameTimeMs: percentile(frameDurations, 95, 2),
        maxFrameTimeMs: round(Math.max(...frameDurations), 2),
        totalFrames,
        droppedFrames,
        jankyFrames,
      }),
    );

    windowStartTime = now;
    frameDurations = [];
  };

  const loop = (now: number): void => {
    if (cancelled) {
      return;
    }

    const frameDuration = now - lastFrameTime;
    lastFrameTime = now;

    if (frameDuration > 0) {
      frameDurations.push(frameDuration);
    }

    if (now - windowStartTime >= FPS_SAMPLE_WINDOW_MS) {
      flushWindow(now);
    }

    animationFrameId = requestAnimationFrame(loop);
  };

  animationFrameId = requestAnimationFrame(loop);

  return () => {
    cancelled = true;
    cancelAnimationFrame(animationFrameId);
    flushWindow(performance.now());
  };
}

export function startMemoryMonitor(dispatch: AppDispatch): () => void {
  const collect = (): void => {
    dispatch(addMemoryMetric(readMemoryMetric()));
  };

  collect();
  const intervalId = setInterval(collect, MEMORY_SAMPLE_INTERVAL_MS);

  return () => {
    collect();
    clearInterval(intervalId);
  };
}

export function recordRenderMetric(
  dispatch: AppDispatch,
  metric: RenderMetric,
): void {
  dispatch(addRenderMetric(metric));
}

export function measureRender(
  componentName: string,
  renderFn: () => void,
  dispatch: AppDispatch,
): void {
  const start = performance.now();
  renderFn();
  const end = performance.now();

  dispatch(
    addRenderMetric({
      componentName,
      renderTime: round(end - start, 2),
      renderIndex: 1,
      timeSincePreviousRenderMs: null,
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
  const fpsValues = frameMetrics.map((metric) => metric.fps);
  const availableMemoryMetrics = memoryMetrics.filter((metric) => metric.available);
  const heapValues = availableMemoryMetrics.map((metric) => metric.jsHeapUsedMB);
  const totalFrames = frameMetrics.reduce((total, metric) => total + metric.totalFrames, 0);
  const droppedFrames = frameMetrics.reduce((total, metric) => total + metric.droppedFrames, 0);
  const jankyFrames = frameMetrics.reduce((total, metric) => total + metric.jankyFrames, 0);

  const componentRenderTimes = buildComponentRenderReport(renderMetrics);
  const initialJSHeapMB = heapValues.length > 0 ? heapValues[0] : 0;
  const finalJSHeapMB = heapValues.length > 0 ? heapValues[heapValues.length - 1] : 0;

  return {
    sessionCode,
    sessionDurationMs,
    averageFPS: average(fpsValues, 1),
    minFPS: fpsValues.length > 0 ? round(Math.min(...fpsValues), 1) : 0,
    maxFPS: fpsValues.length > 0 ? round(Math.max(...fpsValues), 1) : 0,
    fpsP95FrameTimeMs: frameMetrics.length > 0
      ? round(Math.max(...frameMetrics.map((metric) => metric.p95FrameTimeMs)), 2)
      : 0,
    averageFrameTimeMs: average(frameMetrics.map((metric) => metric.averageFrameTimeMs), 2),
    worstFrameTimeMs: frameMetrics.length > 0
      ? round(Math.max(...frameMetrics.map((metric) => metric.maxFrameTimeMs)), 2)
      : 0,
    totalFrames,
    droppedFrames,
    jankyFrames,
    jankRatePercent: totalFrames > 0 ? round((jankyFrames / totalFrames) * 100, 2) : 0,
    averageJSHeapMB: average(heapValues, 2),
    peakJSHeapMB: heapValues.length > 0 ? round(Math.max(...heapValues), 2) : 0,
    initialJSHeapMB: round(initialJSHeapMB, 2),
    finalJSHeapMB: round(finalJSHeapMB, 2),
    heapDeltaMB: round(finalJSHeapMB - initialJSHeapMB, 2),
    memoryAvailable: availableMemoryMetrics.length > 0,
    memorySource: availableMemoryMetrics[0]?.source ?? memoryMetrics[0]?.source ?? 'unavailable',
    componentRenderTimes,
    frameSampleCount: frameMetrics.length,
    memorySampleCount: memoryMetrics.length,
    renderSampleCount: renderMetrics.length,
    generatedAt: Date.now(),
  };
}

export function printReport(report: PerformanceReport): void {
  const durationSec = (report.sessionDurationMs / 1000).toFixed(1);
  const isoDate = new Date(report.generatedAt).toISOString();
  const fpsStatus = getFPSStatus(report.averageFPS, report.jankRatePercent);
  const renderStatus = getRenderStatus(report.componentRenderTimes);
  const memoryStatus = getMemoryStatus(report);

  console.group('PERFORMANCE REPORT - SUPPORT SESSION');
  console.log('Relatório final gerado ao encerrar ou desmontar a sessão de suporte.');
  console.log('Coleta: FPS via requestAnimationFrame, render por commit de componente e JS heap quando exposto pelo runtime.');

  console.table([
    { Campo: 'Código da sessão', Valor: report.sessionCode },
    { Campo: 'Duração monitorada', Valor: `${durationSec}s` },
    { Campo: 'Gerado em', Valor: isoDate },
    { Campo: 'Amostras de FPS', Valor: report.frameSampleCount },
    { Campo: 'Amostras de memória', Valor: report.memorySampleCount },
    { Campo: 'Amostras de render', Valor: report.renderSampleCount },
  ]);

  console.log('1. FPS e fluidez');
  console.table([
    {
      Métrica: 'FPS médio',
      Valor: report.averageFPS,
      Interpretação: fpsStatus,
    },
    {
      Métrica: 'FPS mínimo por janela',
      Valor: report.minFPS,
      Interpretação: report.minFPS >= 50 ? 'Sem queda relevante' : 'Houve janela abaixo do ideal',
    },
    {
      Métrica: 'FPS máximo por janela',
      Valor: report.maxFPS,
      Interpretação: 'Maior janela observada',
    },
    {
      Métrica: 'Frame médio',
      Valor: `${report.averageFrameTimeMs} ms`,
      Interpretação: report.averageFrameTimeMs <= TARGET_FRAME_MS ? 'Dentro do orçamento de 60 FPS' : 'Acima de 16.67 ms',
    },
    {
      Métrica: 'P95 de frame',
      Valor: `${report.fpsP95FrameTimeMs} ms`,
      Interpretação: report.fpsP95FrameTimeMs <= JANK_FRAME_MS ? 'Sem jank crítico frequente' : 'Jank perceptível no P95',
    },
    {
      Métrica: 'Pior frame',
      Valor: `${report.worstFrameTimeMs} ms`,
      Interpretação: report.worstFrameTimeMs <= JANK_FRAME_MS ? 'Sem travada crítica' : 'Travada pontual detectada',
    },
    {
      Métrica: 'Frames estimados perdidos',
      Valor: report.droppedFrames,
      Interpretação: 'Estimativa baseada no orçamento de 16.67 ms por frame',
    },
    {
      Métrica: 'Taxa de jank',
      Valor: `${report.jankRatePercent}%`,
      Interpretação: report.jankRatePercent <= 3 ? 'Baixa' : 'Revisar telas com maior carga',
    },
  ]);

  console.log('2. Renderização por componente');
  const renderRows = Object.entries(report.componentRenderTimes)
    .map(([name, stats]) => ({
      Componente: name,
      Renders: stats.count,
      'Médio (ms)': stats.average,
      'Mediana (ms)': stats.median,
      'P95 (ms)': stats.p95,
      'Máximo (ms)': stats.max,
      'Renders > 16ms': stats.slowRenderCount,
      'Intervalo médio': stats.averageIntervalMs === null ? '-' : `${stats.averageIntervalMs} ms`,
      Diagnóstico: getComponentDiagnosis(stats),
    }))
    .sort((a, b) => b['P95 (ms)'] - a['P95 (ms)']);

  if (renderRows.length > 0) {
    console.table(renderRows);
  } else {
    console.log('Nenhuma métrica de renderização por componente foi coletada.');
  }

  console.log('3. Memória JS');
  console.table([
    {
      Métrica: 'Disponibilidade',
      Valor: report.memoryAvailable ? 'Disponível' : 'Indisponível',
      Detalhe: report.memorySource,
    },
    {
      Métrica: 'Heap inicial',
      Valor: report.memoryAvailable ? `${report.initialJSHeapMB} MB` : '-',
      Detalhe: 'Primeira amostra da sessão',
    },
    {
      Métrica: 'Heap final',
      Valor: report.memoryAvailable ? `${report.finalJSHeapMB} MB` : '-',
      Detalhe: 'Última amostra da sessão',
    },
    {
      Métrica: 'Heap médio',
      Valor: report.memoryAvailable ? `${report.averageJSHeapMB} MB` : '-',
      Detalhe: 'Média das amostras disponíveis',
    },
    {
      Métrica: 'Pico de heap',
      Valor: report.memoryAvailable ? `${report.peakJSHeapMB} MB` : '-',
      Detalhe: memoryStatus,
    },
    {
      Métrica: 'Variação do heap',
      Valor: report.memoryAvailable ? `${report.heapDeltaMB} MB` : '-',
      Detalhe: report.heapDeltaMB > 5 ? 'Crescimento relevante durante a sessão' : 'Sem crescimento relevante',
    },
  ]);

  console.log('4. Leitura técnica');
  console.table([
    {
      Área: 'FPS',
      Resultado: fpsStatus,
      Observação: 'Amostrado continuamente com requestAnimationFrame em janelas de aproximadamente 1 segundo.',
    },
    {
      Área: 'Render',
      Resultado: renderStatus,
      Observação: 'Mede o tempo entre início do render funcional e commit do useEffect por componente instrumentado.',
    },
    {
      Área: 'Memória',
      Resultado: memoryStatus,
      Observação: report.memoryAvailable
        ? 'Dados extraídos de performance.memory.'
        : 'React Native pode não expor heap JS no runtime nativo; o relatório registra essa limitação explicitamente.',
    },
  ]);

  console.groupEnd();
}

function readMemoryMetric(): MemoryMetric {
  const memory = (performance as Performance & {
    memory?: PerformanceMemorySnapshot;
  }).memory;

  if (!memory?.usedJSHeapSize) {
    return {
      timestamp: Date.now(),
      jsHeapUsedMB: 0,
      totalJSHeapMB: null,
      jsHeapLimitMB: null,
      available: false,
      source: 'performance.memory unavailable in this runtime',
    };
  }

  return {
    timestamp: Date.now(),
    jsHeapUsedMB: round(memory.usedJSHeapSize / BYTES_IN_MB, 2),
    totalJSHeapMB: memory.totalJSHeapSize ? round(memory.totalJSHeapSize / BYTES_IN_MB, 2) : null,
    jsHeapLimitMB: memory.jsHeapSizeLimit ? round(memory.jsHeapSizeLimit / BYTES_IN_MB, 2) : null,
    available: true,
    source: 'performance.memory',
  };
}

function buildComponentRenderReport(
  renderMetrics: RenderMetric[],
): Record<string, ComponentRenderReport> {
  const groups: Record<string, RenderMetric[]> = {};

  for (const metric of renderMetrics) {
    groups[metric.componentName] = groups[metric.componentName] ?? [];
    groups[metric.componentName].push(metric);
  }

  return Object.fromEntries(
    Object.entries(groups).map(([name, metrics]) => {
      const renderTimes = metrics.map((metric) => metric.renderTime);
      const intervals = metrics
        .map((metric) => metric.timeSincePreviousRenderMs)
        .filter((value): value is number => value !== null);

      return [
        name,
        {
          average: average(renderTimes, 2),
          median: percentile(renderTimes, 50, 2),
          p95: percentile(renderTimes, 95, 2),
          min: renderTimes.length > 0 ? round(Math.min(...renderTimes), 2) : 0,
          max: renderTimes.length > 0 ? round(Math.max(...renderTimes), 2) : 0,
          count: metrics.length,
          slowRenderCount: renderTimes.filter((time) => time > SLOW_RENDER_MS).length,
          averageIntervalMs: intervals.length > 0 ? average(intervals, 2) : null,
        },
      ];
    }),
  );
}

function getFPSStatus(averageFPS: number, jankRatePercent: number): string {
  if (averageFPS >= 55 && jankRatePercent <= 3) {
    return 'Excelente';
  }

  if (averageFPS >= 45 && jankRatePercent <= 8) {
    return 'Bom com atenção';
  }

  return 'Precisa de otimização';
}

function getRenderStatus(componentRenderTimes: Record<string, ComponentRenderReport>): string {
  const stats = Object.values(componentRenderTimes);

  if (stats.length === 0) {
    return 'Sem amostras';
  }

  const worstP95 = Math.max(...stats.map((stat) => stat.p95));
  const slowRenderCount = stats.reduce((total, stat) => total + stat.slowRenderCount, 0);

  if (worstP95 <= SLOW_RENDER_MS && slowRenderCount === 0) {
    return 'Excelente';
  }

  if (worstP95 <= 32) {
    return 'Bom com pontos de atenção';
  }

  return 'Revisar componentes mais caros';
}

function getMemoryStatus(report: PerformanceReport): string {
  if (!report.memoryAvailable) {
    return 'Indisponível neste runtime';
  }

  if (report.heapDeltaMB > 10) {
    return 'Crescimento alto de heap';
  }

  if (report.heapDeltaMB > 5) {
    return 'Crescimento moderado de heap';
  }

  return 'Estável';
}

function getComponentDiagnosis(stats: ComponentRenderReport): string {
  if (stats.p95 > 32 || stats.slowRenderCount >= 3) {
    return 'Prioridade de otimização';
  }

  if (stats.p95 > SLOW_RENDER_MS || stats.slowRenderCount > 0) {
    return 'Monitorar';
  }

  return 'Saudável';
}

function average(values: number[], precision: number): number {
  if (values.length === 0) {
    return 0;
  }

  return round(sum(values) / values.length, precision);
}

function percentile(values: number[], percentileValue: number, precision: number): number {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentileValue / 100) * sorted.length) - 1;
  return round(sorted[Math.min(Math.max(index, 0), sorted.length - 1)], precision);
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function round(value: number, precision: number): number {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}
