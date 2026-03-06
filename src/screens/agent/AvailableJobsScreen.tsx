import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { agentGraphqlService, AssignmentWithRequest } from '../../services/agentGraphqlService';

export const AvailableJobsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<AssignmentWithRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAssignments = useCallback(async (isRefresh = false) => {
    if (!user?.id) return;
    if (!isRefresh) setLoading(true);
    try {
      const data = await agentGraphqlService.getAssignmentsWithRequestDetail(user.id);
      setAssignments(data);
    } catch (err: any) {
      Alert.alert('Lỗi', err?.message ?? 'Không tải được assignment');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  const onRefresh = () => {
    setRefreshing(true);
    loadAssignments(true);
  };

  const renderJobItem = ({ item }: { item: AssignmentWithRequest }) => (
    <TouchableOpacity
      style={styles.jobCard}
      onPress={() => navigation.navigate('JobTabs', { job: item })}
    >
      <View style={styles.jobHeader}>
        <Text style={styles.jobTitle} numberOfLines={1}>
          {item.requestDetail?.description || `Yêu cầu #${item.serviceRequestId.slice(0, 8)}`}
        </Text>
        <Text style={styles.status}>{item.requestDetail?.status || 'N/A'}</Text>
      </View>

      <View style={styles.jobMetaRow}>
        <Ionicons name="location-outline" size={14} color="#6B7280" />
        <Text style={styles.jobMetaText} numberOfLines={1}>
          {item.requestDetail?.addressText || 'Chưa có địa chỉ'}
        </Text>
      </View>
      <View style={styles.jobMetaRow}>
        <Ionicons name="cash-outline" size={14} color="#6B7280" />
        <Text style={styles.jobMetaText}>
          {item.estimatedCost
            ? `${Number(item.estimatedCost.amount).toLocaleString('vi-VN')} ${item.estimatedCost.currency}`
            : 'Chưa có chi phí ước tính'}
        </Text>
      </View>
      <View style={styles.jobMetaRow}>
        <Ionicons name="time-outline" size={14} color="#6B7280" />
        <Text style={styles.jobMetaText}>
          {new Date(item.assignedAt).toLocaleString('vi-VN')}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Assignment của tôi</Text>
      </View>

      <FlatList
        data={assignments}
        renderItem={renderJobItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={assignments.length === 0 ? styles.emptyList : styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>Chưa có assignment nào được giao.</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#fff', paddingTop: 50, paddingBottom: 16, paddingHorizontal: 20 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  listContainer: { padding: 14, paddingBottom: 24 },
  emptyList: { flexGrow: 1 },
  emptyText: { color: '#9CA3AF', fontSize: 14 },
  jobCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  jobHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 8 },
  jobTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: '#111827' },
  status: { fontSize: 11, color: '#007AFF', fontWeight: '700' },
  jobMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  jobMetaText: { flex: 1, fontSize: 13, color: '#4B5563' },
});
