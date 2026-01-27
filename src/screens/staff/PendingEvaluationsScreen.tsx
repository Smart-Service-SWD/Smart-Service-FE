import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';

export const PendingEvaluationsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [pendingEvaluations, setPendingEvaluations] = useState<any[]>([]);

  useEffect(() => {
    loadPendingEvaluations();
  }, []);

  const loadPendingEvaluations = async () => {
    try {
      setLoading(true);
      // TODO: Call API to get pending AI evaluations that need staff confirmation
      // const data = await staffService.getPendingEvaluations();
      // setPendingEvaluations(data);

      // Mock data for now
      setTimeout(() => {
        setPendingEvaluations([
          {
            id: '1',
            userName: 'Nguyễn Văn A',
            serviceType: 'Car Damage Assessment',
            aiResult: 'Minor scratches detected',
            confidence: 85,
            imageUrl: 'https://example.com/image1.jpg',
            submittedAt: '2024-01-27T10:00:00Z'
          },
          {
            id: '2',
            userName: 'Trần Thị B',
            serviceType: 'Home Inspection',
            aiResult: 'Water damage detected',
            confidence: 92,
            imageUrl: 'https://example.com/image2.jpg',
            submittedAt: '2024-01-27T11:30:00Z'
          }
        ]);
        setLoading(false);
        setRefreshing(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading pending evaluations:', error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleConfirmEvaluation = (evaluationId: string) => {
    Alert.alert(
      'Confirm AI Evaluation',
      'Are you sure you want to confirm this AI evaluation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              // TODO: Call API to confirm evaluation
              // await staffService.confirmEvaluation(evaluationId);
              Alert.alert('Success', 'AI evaluation confirmed successfully');
              loadPendingEvaluations(); // Refresh list
            } catch (error) {
              Alert.alert('Error', 'Failed to confirm evaluation');
            }
          }
        }
      ]
    );
  };

  const handleRejectEvaluation = (evaluationId: string) => {
    Alert.alert(
      'Reject AI Evaluation',
      'Are you sure you want to reject this AI evaluation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: Call API to reject evaluation
              // await staffService.rejectEvaluation(evaluationId);
              Alert.alert('Success', 'AI evaluation rejected');
              loadPendingEvaluations(); // Refresh list
            } catch (error) {
              Alert.alert('Error', 'Failed to reject evaluation');
            }
          }
        }
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPendingEvaluations();
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading pending evaluations...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <LinearGradient
        colors={["#1976D2", "#63a4ff"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.greeting}>Xin chào, {user?.fullName}!</Text>
        <Text style={styles.role}>Xác nhận đánh giá AI</Text>
      </LinearGradient>

      <View style={styles.content}>
        {pendingEvaluations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No pending evaluations</Text>
            <Text style={styles.emptySubtext}>All AI evaluations have been reviewed</Text>
          </View>
        ) : (
          pendingEvaluations.map((evaluation) => (
            <View key={evaluation.id} style={styles.evaluationCard}>
              <View style={styles.evaluationHeader}>
                <View>
                  <Text style={styles.userName}>{evaluation.userName}</Text>
                  <Text style={styles.serviceType}>{evaluation.serviceType}</Text>
                </View>
                <View style={styles.confidenceBadge}>
                  <Text style={styles.confidenceText}>{evaluation.confidence}%</Text>
                </View>
              </View>

              <View style={styles.aiResult}>
                <Text style={styles.aiResultLabel}>AI Analysis:</Text>
                <Text style={styles.aiResultText}>{evaluation.aiResult}</Text>
              </View>

              <Text style={styles.submittedAt}>
                Submitted: {new Date(evaluation.submittedAt).toLocaleString()}
              </Text>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={() => handleRejectEvaluation(evaluation.id)}
                >
                  <Ionicons name="close-circle" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Reject</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.confirmButton]}
                  onPress={() => handleConfirmEvaluation(evaluation.id)}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#1976D2',
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  greeting: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  role: {
    fontSize: 16,
    color: '#e3f2fd',
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
  evaluationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  evaluationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  serviceType: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  confidenceBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  aiResult: {
    marginBottom: 12,
  },
  aiResultLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  aiResultText: {
    fontSize: 16,
    color: '#555',
    lineHeight: 22,
  },
  submittedAt: {
    fontSize: 12,
    color: '#999',
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
    justifyContent: 'center',
  },
  rejectButton: {
    backgroundColor: '#FF3B30',
  },
  confirmButton: {
    backgroundColor: '#34C759',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
});