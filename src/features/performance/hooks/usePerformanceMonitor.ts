import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { store } from '@store/index';
import { setIsMonitoring, setReport, clearMetrics } from '../store';
import {
  startFPSMonitor,
  startMemoryMonitor,
  generateReport,
  printReport,
} from '../services';

export function usePerformanceMonitor(sessionCode: string) {
  const dispatch = useAppDispatch();
  const isMonitoring = useAppSelector(
    (state) => state.performance.isMonitoring,
  );
  const report = useAppSelector((state) => state.performance.report);
  const sessionStartTime = useRef(Date.now());

  useEffect(() => {
    if (!sessionCode) {
      return undefined;
    }

    dispatch(clearMetrics());
    dispatch(setIsMonitoring(true));
    sessionStartTime.current = Date.now();

    const cancelFPS = startFPSMonitor(dispatch);
    const cancelMemory = startMemoryMonitor(dispatch);

    return () => {
      cancelFPS();
      cancelMemory();

      const state = store.getState();
      const reportData = generateReport(
        state,
        sessionCode,
        sessionStartTime.current,
      );

      dispatch(setReport(reportData));
      printReport(reportData);
      dispatch(setIsMonitoring(false));
    };
  }, [sessionCode, dispatch]);

  return { isMonitoring, report };
}
