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

export const ReEvaluationsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [reEvaluationRequests, setReEvaluationRequests] = useState<any[]>([]);

  useEffect(() => {
    loadReEvaluationRequests();
  }, []);

  const loadReEvaluationRequests = async () => {
    try {
      setLoading(true);
      // TODO: Call API to get re-evaluation requests from users
      // const data = await staffService.getReEvaluationRequests();
      // setReEvaluationRequests(data);

      // Mock data for now
      setTimeout(() => {
        setReEvaluationRequests([
          {
            id: '1',
            userName: 'Nguyễn Văn A',
            serviceType: 'Car Damage Assessment',
            originalAiResult: 'Minor scratches detected',
            userReason: 'I disagree with the AI assessment. The damage appears more severe.',
            imageUrl: 'https://example.com/image1.jpg',
            requestedAt: '2024-01-27T14:00:00Z',
            status: 'pending'
          },
          {
            id: '2',
            userName: 'Trần Thị B',
            serviceType: 'Home Inspection',
            originalAiResult: 'Water damage detected',
            userReason: 'The AI missed additional damage in the basement.',
            imageUrl: 'https://example.com/image2.jpg',
            requestedAt: '2024-01-27T15:30:00Z',
            status: 'pending'
          }
        ]);
        setLoading(false);
        setRefreshing(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading re-evaluation requests:', error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleStartReEvaluation = (requestId: string) => {
    Alert.alert(
      'Start Re-evaluation',
      'Begin manual review of this request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Review',
          onPress: () => {
            // TODO: Navigate to detailed review screen or update status
            Alert.alert('Review Started', 'Manual review has been initiated');
            // Update local state
            setReEvaluationRequests(prev =>
              prev.map(req =>
                req.id === requestId ? { ...req, status: 'in_review' } : req
              )
            );
          }
        }
      ]
    );
  };

  const handleCompleteReEvaluation = (requestId: string) => {
    Alert.alert(
      'Complete Re-evaluation',
      'Mark this re-evaluation as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            try {
              // TODO: Call API to complete re-evaluation
              // await staffService.completeReEvaluation(requestId);
              Alert.alert('Success', 'Re-evaluation completed');
              loadReEvaluationRequests(); // Refresh list
            } catch (error) {
              Alert.alert('Error', 'Failed to complete re-evaluation');
            }
          }
        }
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadReEvaluationRequests();
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading re-evaluation requests...</Text>
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
        <Text style={styles.role}>Đánh giá lại yêu cầu</Text>
      </LinearGradient>

      <View style={styles.content}>
        {reEvaluationRequests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="refresh-circle-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No re-evaluation requests</Text>
            <Text style={styles.emptySubtext}>All requests have been processed</Text>
          </View>
        ) : (
          reEvaluationRequests.map((request) => (
            <View key={request.id} style={styles.requestCard}>
              <View style={styles.requestHeader}>
                <View>
                  <Text style={styles.userName}>{request.userName}</Text>
                  <Text style={styles.serviceType}>{request.serviceType}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
                  <Text style={styles.statusText}>{getStatusText(request.status)}</Text>
                </View>
              </View>

              <View style={styles.originalResult}>
                <Text style={styles.resultLabel}>Original AI Result:</Text>
                <Text style={styles.resultText}>{request.originalAiResult}</Text>
              </View>

              <View style={styles.userReason}>
                <Text style={styles.reasonLabel}>User&apos;s Reason:</Text>
                <Text style={styles.reasonText}>{request.userReason}</Text>
              </View>

              <Text style={styles.requestedAt}>
                Requested: {new Date(request.requestedAt).toLocaleString()}
              </Text>

              <View style={styles.actionButtons}>
                {request.status === 'pending' && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.startButton]}
                    onPress={() => handleStartReEvaluation(request.id)}
                  >
                    <Ionicons name="play-circle" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Start Review</Text>
                  </TouchableOpacity>
                )}

                {request.status === 'in_review' && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.completeButton]}
                    onPress={() => handleCompleteReEvaluation(request.id)}
                  >
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Complete</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return '#FF9500';
    case 'in_review': return '#007AFF';
    case 'completed': return '#34C759';
    default: return '#666';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'pending': return 'Pending';
    case 'in_review': return 'In Review';
    case 'completed': return 'Completed';
    default: return 'Unknown';
  }
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
  requestCard: {
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
  requestHeader: {
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
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  originalResult: {
    marginBottom: 12,
  },
  resultLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  resultText: {
    fontSize: 16,
    color: '#555',
    lineHeight: 22,
  },
  userReason: {
    marginBottom: 12,
  },
  reasonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 16,
    color: '#555',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  requestedAt: {
    fontSize: 12,
    color: '#999',
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    justifyContent: 'center',
    minWidth: 140,
  },
  startButton: {
    backgroundColor: '#007AFF',
  },
  completeButton: {
    backgroundColor: '#34C759',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
});