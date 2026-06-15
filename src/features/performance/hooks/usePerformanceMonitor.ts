import { useCallback, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { store } from '@store/index';
import { setIsMonitoring, setReport, clearMetrics } from '../store';
import {
  startFPSMonitor,
  startMemoryMonitor,
  generateReport,
  printReport,
} from '../services';
import type { PerformanceReport } from '../types';

interface PerformanceMonitorControls {
  isMonitoring: boolean;
  report: PerformanceReport | null;
  finishPerformanceReport: () => void;
}

export function usePerformanceMonitor(sessionCode: string): PerformanceMonitorControls {
  const dispatch = useAppDispatch();
  const isMonitoring = useAppSelector(
    (state) => state.performance.isMonitoring,
  );
  const report = useAppSelector((state) => state.performance.report);
  const sessionStartTime = useRef(Date.now());
  const activeSessionCodeRef = useRef<string | null>(null);
  const finalizedRef = useRef(false);
  const cancelFPSRef = useRef<(() => void) | null>(null);
  const cancelMemoryRef = useRef<(() => void) | null>(null);

  const finishPerformanceReport = useCallback(() => {
    const activeSessionCode = activeSessionCodeRef.current;

    if (!activeSessionCode || finalizedRef.current) {
      return;
    }

    finalizedRef.current = true;

    if (cancelFPSRef.current) {
      cancelFPSRef.current();
      cancelFPSRef.current = null;
    }

    if (cancelMemoryRef.current) {
      cancelMemoryRef.current();
      cancelMemoryRef.current = null;
    }

    const state = store.getState();
    const reportData = generateReport(
      state,
      activeSessionCode,
      sessionStartTime.current,
    );

    dispatch(setReport(reportData));
    printReport(reportData);
    dispatch(setIsMonitoring(false));
    activeSessionCodeRef.current = null;
  }, [dispatch]);

  useEffect(() => {
    if (!sessionCode) {
      return undefined;
    }

    dispatch(clearMetrics());
    dispatch(setIsMonitoring(true));
    sessionStartTime.current = Date.now();
    finalizedRef.current = false;
    activeSessionCodeRef.current = sessionCode;

    cancelFPSRef.current = startFPSMonitor(dispatch);
    cancelMemoryRef.current = startMemoryMonitor(dispatch);

    return () => {
      finishPerformanceReport();
    };
  }, [sessionCode, dispatch, finishPerformanceReport]);

  return { isMonitoring, report, finishPerformanceReport };
}
