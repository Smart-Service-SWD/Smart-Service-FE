import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
} from 'react-native';
import { useAnalysis } from '../context/AnalysisContext';

export const HistoryScreen = ({ navigation }) => {
  const { analysisHistory, loading, fetchHistory } = useAnalysis();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadHistory();
  }, [fetchHistory]);

  const loadHistory = async () => {
    try {
      await fetchHistory(1);
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchHistory(1);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSelectAnalysis = (analysis) => {
    navigation.navigate('AnalysisDetail', { analysisId: analysis.id });
  };

  const renderHistoryItem = ({ item }) => (
    <TouchableOpacity
      style={styles.historyItem}
      onPress={() => handleSelectAnalysis(item)}
    >
      {item.imageUrl && (
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.thumbnail}
        />
      )}
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle} numberOfLines={1}>
          {item.description || 'Analysis ' + item.id}
        </Text>
        <Text style={styles.itemDate}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
        <Text style={styles.itemStatus}>
          Status: {item.status || 'Completed'}
        </Text>
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );

  if (loading && analysisHistory.length === 0) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={analysisHistory}
        renderItem={renderHistoryItem}
        keyExtractor={item => item.id?.toString() || Math.random().toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No analysis history</Text>
            <Text style={styles.emptySubtext}>Start by capturing an image</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  historyItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginVertical: 4,
    marginHorizontal: 8,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 6,
    marginRight: 12,
    backgroundColor: '#e0e0e0',
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  itemDate: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  itemStatus: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 4,
  },
  arrow: {
    fontSize: 24,
    color: '#ccc',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
  },
});
