import { useEffect, useRef } from 'react';
import { useAppDispatch } from '@store/hooks';
import { recordRenderMetric } from '../services';

export function useRenderMetric(componentName: string): void {
  const dispatch = useAppDispatch();
  const renderStartRef = useRef(performance.now());
  const previousCommitRef = useRef<number | null>(null);
  const renderCountRef = useRef(0);

  renderStartRef.current = performance.now();
  renderCountRef.current += 1;

  useEffect(() => {
    const commitTime = performance.now();
    const previousCommit = previousCommitRef.current;
    const renderTime = commitTime - renderStartRef.current;

    recordRenderMetric(dispatch, {
      componentName,
      renderTime: round(renderTime, 2),
      renderIndex: renderCountRef.current,
      timeSincePreviousRenderMs:
        previousCommit === null ? null : round(commitTime - previousCommit, 2),
      timestamp: Date.now(),
    });

    previousCommitRef.current = commitTime;
  });
}

function round(value: number, precision: number): number {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}
