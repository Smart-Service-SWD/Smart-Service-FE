import React, { createContext, useState, useCallback } from 'react';
import { analysisService } from '../services/analysisService';

export const AnalysisContext = createContext();

export const AnalysisProvider = ({ children }) => {
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const analyze = useCallback(async (imageUri, metadata = {}) => {
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
      setError(err.message || 'Analysis failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const result = await analysisService.getAnalysisHistory(page, 10);
      setAnalysisHistory(result.items || []);
      return result;
    } catch (err) {
      setError(err.message || 'Failed to fetch history');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getDetail = useCallback(async (analysisId) => {
    setLoading(true);
    setError(null);
    try {
      const result = await analysisService.getAnalysisDetail(analysisId);
      setCurrentAnalysis(result);
      return result;
    } catch (err) {
      setError(err.message || 'Failed to fetch detail');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const value = {
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

export const useAnalysis = () => {
  const context = React.useContext(AnalysisContext);
  if (!context) {
    throw new Error('useAnalysis must be used within AnalysisProvider');
  }
  return context;
};
