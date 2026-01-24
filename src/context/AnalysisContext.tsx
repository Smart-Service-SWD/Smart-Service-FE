import React, { createContext, useState, useCallback } from 'react';
import { analysisService } from '../services/analysisService';
import type { AnalysisContextType, AnalysisResult } from '../types';

export const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined);

export const AnalysisProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisResult[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (imageUri: string, metadata: Record<string, any> = {}): Promise<AnalysisResult> => {
    setLoading(true);
    setError(null);
    try {
      const result = await analysisService.analyzeImage(
        { uri: imageUri },
        metadata
      );
      setCurrentAnalysis(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Analysis failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async (page: number = 1): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const result = await analysisService.getAnalysisHistory(page, 10);
      setAnalysisHistory(result.items || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch history';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getDetail = useCallback(async (analysisId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const result = await analysisService.getAnalysisDetail(analysisId);
      setCurrentAnalysis(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch detail';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const value: AnalysisContextType = {
    analysisHistory,
    currentAnalysis,
    loading,
    error,
    analyze,
    fetchHistory,
    getDetail,
  };

  return (
    <AnalysisContext.Provider value={value}>
      {children}
    </AnalysisContext.Provider>
  );
};

export const useAnalysis = (): AnalysisContextType => {
  const context = React.useContext(AnalysisContext);
  if (!context) {
    throw new Error('useAnalysis must be used within AnalysisProvider');
  }
  return context;
};
