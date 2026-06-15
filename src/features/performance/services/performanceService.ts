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
  const fpsStatus = getFPSStatus(report);
  const renderStatus = getRenderStatus(report.componentRenderTimes);
  const memoryStatus = getMemoryStatus(report);
  const refreshRateNote = getRefreshRateNote(report.averageFPS);
  const topRenderComponents = Object.entries(report.componentRenderTimes)
    .sort(([, a], [, b]) => b.p95 - a.p95)
    .slice(0, 5)
    .map(([name, stats], index) =>
      `${index + 1}. ${name}: avg ${stats.average}ms | p95 ${stats.p95}ms | max ${stats.max}ms | renders ${stats.count}`,
    );

  console.log('\n');
  console.log('============================================================');
  console.log('PERFORMANCE REPORT - SUPPORT SESSION');
  console.log('Generated when the support session was ended');
  console.log('============================================================');
  console.log(`Session code: ${report.sessionCode}`);
  console.log(`Duration: ${durationSec}s`);
  console.log(`Generated at: ${isoDate}`);
  console.log('------------------------------------------------------------');
  console.log('FPS');
  console.log(`Average FPS: ${report.averageFPS}`);
  console.log(`Refresh rate note: ${refreshRateNote}`);
  console.log(`Min/Max FPS: ${report.minFPS} / ${report.maxFPS}`);
  console.log(`Average frame time: ${report.averageFrameTimeMs}ms`);
  console.log(`P95 frame time: ${report.fpsP95FrameTimeMs}ms`);
  console.log(`Worst frame time: ${report.worstFrameTimeMs}ms`);
  console.log(`Dropped frames estimate: ${report.droppedFrames}`);
  console.log(`Janky frames: ${report.jankyFrames} (${report.jankRatePercent}%)`);
  console.log(`FPS diagnosis: ${fpsStatus}`);
  console.log('------------------------------------------------------------');
  console.log('RENDER BY COMPONENT');
  console.log(`Render samples: ${report.renderSampleCount}`);
  if (topRenderComponents.length > 0) {
    topRenderComponents.forEach((line) => console.log(line));
  } else {
    console.log('No component render samples collected.');
  }
  console.log(`Render diagnosis: ${renderStatus}`);
  console.log('------------------------------------------------------------');
  console.log('JS HEAP MEMORY');
  console.log(`Memory available: ${report.memoryAvailable ? 'yes' : 'no'}`);
  console.log(`Memory source: ${report.memorySource}`);
  console.log(`Initial heap: ${report.memoryAvailable ? `${report.initialJSHeapMB} MB` : '-'}`);
  console.log(`Final heap: ${report.memoryAvailable ? `${report.finalJSHeapMB} MB` : '-'}`);
  console.log(`Average heap: ${report.memoryAvailable ? `${report.averageJSHeapMB} MB` : '-'}`);
  console.log(`Peak heap: ${report.memoryAvailable ? `${report.peakJSHeapMB} MB` : '-'}`);
  console.log(`Heap delta: ${report.memoryAvailable ? `${report.heapDeltaMB} MB` : '-'}`);
  console.log(`Memory diagnosis: ${memoryStatus}`);
  console.log('============================================================');
  console.log('\n');

  console.group('PERFORMANCE REPORT - SUPPORT SESSION - DETAILS');
  console.log('Relatorio final gerado ao encerrar a sessao de suporte.');
  console.log('Coleta: FPS via requestAnimationFrame, render por commit de componente e JS heap quando exposto pelo runtime.');

  console.table([
    { Campo: 'Codigo da sessao', Valor: report.sessionCode },
    { Campo: 'Duracao monitorada', Valor: `${durationSec}s` },
    { Campo: 'Gerado em', Valor: isoDate },
    { Campo: 'Amostras de FPS', Valor: report.frameSampleCount },
    { Campo: 'Amostras de memoria', Valor: report.memorySampleCount },
    { Campo: 'Amostras de render', Valor: report.renderSampleCount },
  ]);

  console.log('1. FPS e fluidez');
  console.table([
    {
      Metrica: 'FPS medio',
      Valor: report.averageFPS,
      Interpretacao: refreshRateNote,
    },
    {
      Metrica: 'FPS minimo por janela',
      Valor: report.minFPS,
      Interpretacao: report.minFPS >= 50 ? 'Sem queda relevante' : 'Houve janela abaixo do ideal',
    },
    {
      Metrica: 'FPS maximo por janela',
      Valor: report.maxFPS,
      Interpretacao: 'Maior janela observada',
    },
    {
      Metrica: 'Frame medio',
      Valor: `${report.averageFrameTimeMs} ms`,
      Interpretacao: report.averageFrameTimeMs <= TARGET_FRAME_MS ? 'Dentro do orcamento de 60 FPS' : 'Acima de 16.67 ms',
    },
    {
      Metrica: 'P95 de frame',
      Valor: `${report.fpsP95FrameTimeMs} ms`,
      Interpretacao: report.fpsP95FrameTimeMs <= JANK_FRAME_MS ? 'Sem jank critico frequente' : 'Jank perceptivel no P95',
    },
    {
      Metrica: 'Pior frame',
      Valor: `${report.worstFrameTimeMs} ms`,
      Interpretacao: report.worstFrameTimeMs <= JANK_FRAME_MS ? 'Sem travada critica' : 'Travada pontual detectada',
    },
    {
      Metrica: 'Frames estimados perdidos',
      Valor: report.droppedFrames,
      Interpretacao: 'Estimativa baseada no orcamento de 16.67 ms por frame',
    },
    {
      Metrica: 'Taxa de jank',
      Valor: `${report.jankRatePercent}%`,
      Interpretacao: report.jankRatePercent <= 3 ? 'Baixa' : 'Revisar telas com maior carga',
    },
  ]);

  console.log('2. Renderizacao por componente');
  const renderRows = Object.entries(report.componentRenderTimes)
    .map(([name, stats]) => ({
      Componente: name,
      Renders: stats.count,
      'Medio (ms)': stats.average,
      'Mediana (ms)': stats.median,
      'P95 (ms)': stats.p95,
      'Maximo (ms)': stats.max,
      'Renders > 16ms': stats.slowRenderCount,
      'Intervalo medio': stats.averageIntervalMs === null ? '-' : `${stats.averageIntervalMs} ms`,
      Diagnostico: getComponentDiagnosis(stats),
    }))
    .sort((a, b) => b['P95 (ms)'] - a['P95 (ms)']);

  if (renderRows.length > 0) {
    console.table(renderRows);
  } else {
    console.log('Nenhuma metrica de renderizacao por componente foi coletada.');
  }

  console.log('3. Memoria JS');
  console.table([
    {
      Metrica: 'Disponibilidade',
      Valor: report.memoryAvailable ? 'Disponivel' : 'Indisponivel',
      Detalhe: report.memorySource,
    },
    {
      Metrica: 'Heap inicial',
      Valor: report.memoryAvailable ? `${report.initialJSHeapMB} MB` : '-',
      Detalhe: 'Primeira amostra da sessão',
    },
    {
      Metrica: 'Heap final',
      Valor: report.memoryAvailable ? `${report.finalJSHeapMB} MB` : '-',
      Detalhe: 'Ultima amostra da sessao',
    },
    {
      Metrica: 'Heap medio',
      Valor: report.memoryAvailable ? `${report.averageJSHeapMB} MB` : '-',
      Detalhe: 'Media das amostras disponiveis',
    },
    {
      Metrica: 'Pico de heap',
      Valor: report.memoryAvailable ? `${report.peakJSHeapMB} MB` : '-',
      Detalhe: memoryStatus,
    },
    {
      Metrica: 'Variacao do heap',
      Valor: report.memoryAvailable ? `${report.heapDeltaMB} MB` : '-',
      Detalhe: report.heapDeltaMB > 5 ? 'Crescimento relevante durante a sessao' : 'Sem crescimento relevante',
    },
  ]);

  console.log('4. Leitura tecnica');
  console.table([
    {
      Area: 'FPS',
      Resultado: fpsStatus,
      Observacao: 'Amostrado continuamente com requestAnimationFrame em janelas de aproximadamente 1 segundo.',
    },
    {
      Area: 'Render',
      Resultado: renderStatus,
      Observacao: 'Mede o tempo entre inicio do render funcional e commit do useEffect por componente instrumentado.',
    },
    {
      Area: 'Memoria',
      Resultado: memoryStatus,
      Observacao: report.memoryAvailable
        ? 'Dados extraidos de performance.memory.'
        : 'React Native pode nao expor heap JS no runtime nativo; o relatorio registra essa limitacao explicitamente.',
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

function getFPSStatus(report: PerformanceReport): string {
  if (
    report.averageFPS >= 55 &&
    report.jankRatePercent <= 3 &&
    report.fpsP95FrameTimeMs <= 33 &&
    report.worstFrameTimeMs <= 120
  ) {
    return 'Excelente';
  }

  if (
    report.averageFPS >= 50 &&
    report.jankRatePercent <= 5 &&
    report.fpsP95FrameTimeMs <= 50
  ) {
    return 'Bom com atencao';
  }

  if (report.averageFPS >= 45 && report.jankRatePercent <= 8) {
    return 'Regular: houve travadas pontuais';
  }

  return 'Precisa de otimizacao';
}

function getRefreshRateNote(averageFPS: number): string {
  if (averageFPS > 75) {
    return 'Runtime provavelmente executando em tela de alta taxa de atualizacao (90/120 Hz).';
  }

  return 'Runtime provavelmente executando proximo ao alvo tradicional de 60 FPS.';
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
    return 'Bom com pontos de atencao';
  }

  return 'Revisar componentes mais caros';
}

function getMemoryStatus(report: PerformanceReport): string {
  if (!report.memoryAvailable) {
    return 'Indisponivel neste runtime';
  }

  if (report.heapDeltaMB > 10) {
    return 'Crescimento alto de heap';
  }

  if (report.heapDeltaMB > 5) {
    return 'Crescimento moderado de heap';
  }

  return 'Estavel';
}

function getComponentDiagnosis(stats: ComponentRenderReport): string {
  if (stats.p95 > 32 || stats.slowRenderCount >= 3) {
    return 'Prioridade de otimizacao';
  }

  if (stats.p95 > SLOW_RENDER_MS || stats.slowRenderCount > 0) {
    return 'Monitorar';
  }

  return 'Saudavel';
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
