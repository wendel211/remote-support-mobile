import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  FrameMetric,
  RenderMetric,
  MemoryMetric,
  PerformanceReport,
  PerformanceState,
} from '../types';

const initialState: PerformanceState = {
  frameMetrics: [],
  renderMetrics: [],
  memoryMetrics: [],
  isMonitoring: false,
  report: null,
};

const performanceSlice = createSlice({
  name: 'performance',
  initialState,
  reducers: {
    addFrameMetric(state, action: PayloadAction<FrameMetric>) {
      state.frameMetrics.push(action.payload);
    },
    addRenderMetric(state, action: PayloadAction<RenderMetric>) {
      state.renderMetrics.push(action.payload);
    },
    addMemoryMetric(state, action: PayloadAction<MemoryMetric>) {
      state.memoryMetrics.push(action.payload);
    },
    setIsMonitoring(state, action: PayloadAction<boolean>) {
      state.isMonitoring = action.payload;
    },
    setReport(state, action: PayloadAction<PerformanceReport | null>) {
      state.report = action.payload;
    },
    clearMetrics(state) {
      state.frameMetrics = [];
      state.renderMetrics = [];
      state.memoryMetrics = [];
      state.report = null;
    },
  },
});

export const {
  addFrameMetric,
  addRenderMetric,
  addMemoryMetric,
  setIsMonitoring,
  setReport,
  clearMetrics,
} = performanceSlice.actions;

export const performanceReducer = performanceSlice.reducer;
