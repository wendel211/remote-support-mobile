import { useEffect, useRef } from 'react';
import { useAppDispatch } from '@store/hooks';
import { addRenderMetric } from '../store';

export function useRenderMetric(componentName: string): void {
  const dispatch = useAppDispatch();
  const startRef = useRef<number>(Date.now());

  startRef.current = Date.now();

  useEffect(() => {
    const end = Date.now();
    const renderTime = end - startRef.current;

    dispatch(
      addRenderMetric({
        componentName,
        renderTime,
        timestamp: end,
      }),
    );
  });
}
