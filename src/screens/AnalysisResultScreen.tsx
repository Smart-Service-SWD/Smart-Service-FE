import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';

export const AnalysisResultScreen: React.FC<{ route, navigation  }> = ({ route, navigation  }) => {
  const { analysis } = route.params || {};

  const handleSaveRequest = () => {
    if (analysis?.id) {
      navigation.navigate('CreateRequest', { analysisId: analysis.id });
    }
  };

  const handleBackToCamera = () => {
    navigation.navigate('Camera');
  };

  if (!analysis) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No analysis data available</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Analysis Result</Text>
      </View>

      {analysis.imageUrl && (
        <Image
          source={{ uri: analysis.imageUrl }}
          style={styles.resultImage}
          resizeMode="cover"
        />
      )}

      <View style={styles.content}>
        <View style={styles.resultCard}>
          <Text style={styles.resultLabel}>Analysis</Text>
          <Text style={styles.resultValue}>
            {analysis.result || 'Analysis completed'}
          </Text>
        </View>

        {analysis.category && (
          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>Category</Text>
            <Text style={styles.resultValue}>{analysis.category}</Text>
          </View>
        )}

        {analysis.confidence !== undefined && (
          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>Confidence Level</Text>
            <View style={styles.confidenceBar}>
              <View
                style={[
                  styles.confidenceFill,
                  { width: `${(analysis.confidence * 100).toFixed(0)}%` as any },
                ]}
              />
            </View>
            <Text style={styles.confidencePercent}>
              {(analysis.confidence * 100).toFixed(1)}%
            </Text>
          </View>
        )}

        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleSaveRequest}
          >
            <Text style={styles.primaryButtonText}>Create Service Request</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleBackToCamera}
          >
            <Text style={styles.secondaryButtonText}>Take Another Photo</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  resultImage: {
    width: '100%',
    height: 280,
  },
  content: {
    padding: 16,
  },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  resultLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  resultValue: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  confidenceBar: {
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    overflow: 'hidden',
    marginVertical: 8,
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  confidencePercent: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  buttonGroup: {
    marginTop: 20,
    marginBottom: 30,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#007AFF',
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    marginTop: 50,
  },
});
