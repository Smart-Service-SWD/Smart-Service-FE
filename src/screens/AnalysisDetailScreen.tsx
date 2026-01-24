import React, { useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Text,
  Image,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useAnalysis } from '../context/AnalysisContext';

export const AnalysisDetailScreen: React.FC<{ route, navigation  }> = ({ route, navigation  }) => {
  const { analysisId } = route.params;
  const { currentAnalysis, loading, getDetail } = useAnalysis();

  useEffect(() => {
    if (analysisId) {
      loadAnalysisDetail();
    }
  }, [analysisId, getDetail]);

  const loadAnalysisDetail = async () => {
    try {
      await getDetail(analysisId);
    } catch (error) {
      console.error('Failed to load analysis:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!currentAnalysis) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Analysis not found</Text>
      </View>
    );
  }

  const { imageUrl, result, confidence, category, description } = currentAnalysis;

  return (
    <ScrollView style={styles.container}>
      {imageUrl && (
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />
      )}

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.sectionValue}>{description || 'No description'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category</Text>
          <Text style={styles.sectionValue}>{category || 'Unclassified'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Analysis Result</Text>
          <View style={styles.resultContainer}>
            {typeof result === 'string' ? (
              <Text style={styles.resultText}>{result}</Text>
            ) : (
              <Text style={styles.resultText}>{JSON.stringify(result, null, 2)}</Text>
            )}
          </View>
        </View>

        {confidence !== undefined && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Confidence</Text>
            <View style={styles.confidenceBar}>
              <View
                style={[
                  styles.confidenceFill,
                  { width: `${(confidence || 0) * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.confidenceText}>
              {((confidence || 0) * 100).toFixed(1)}%
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.createRequestButton}
          onPress={() => navigation.navigate('CreateRequest', { analysisId })}
        >
          <Text style={styles.createRequestText}>Create Service Request</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  image: {
    width: '100%',
    height: 300,
  },
  content: {
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  sectionValue: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  resultContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  resultText: {
    fontSize: 13,
    color: '#333',
    fontFamily: 'Courier New',
    lineHeight: 18,
  },
  confidenceBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  confidenceText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  createRequestButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  createRequestText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
  },
});
