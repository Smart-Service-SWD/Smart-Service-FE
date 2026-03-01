import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import {
  ServiceRequestSummary,
  staffGraphqlService,
} from '../../services/staffGraphqlService';

// ─── Helpers ────────────────────────────────────────────────────────────────────

const COMPLEXITY_LABEL: Record<number, string> = {
  1: 'Rat don gian', 2: 'Don gian', 3: 'Trung binh', 4: 'Phuc tap', 5: 'Rat phuc tap',
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

// ─── Main Component ─────────────────────────────────────────────────────────────

export const PendingEvaluationsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState<ServiceRequestSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await staffGraphqlService.getPendingReviewRequests();
      setRequests(data);
    } catch (err: any) {
      setError(err?.message ?? 'Không tải được dữ liệu');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = () => { setRefreshing(true); load(); };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1976D2" />
        <Text style={styles.loadingText}>Đang tải yêu cầu chờ duyệt...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <LinearGradient colors={['#1976D2', '#63a4ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <View>
          <Text style={styles.greeting}>Xin chào, {user?.fullName}!</Text>
          <Text style={styles.role}>Xác nhận đánh giá AI</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{requests.length}</Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={20} color="#F44336" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={load}>
              <Text style={styles.retryText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        )}
        {!error && requests.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle-outline" size={72} color="#c8e6c9" />
            <Text style={styles.emptyTitle}>Không có yêu cầu chờ duyệt</Text>
            <Text style={styles.emptySubtext}>Tất cả yêu cầu đã được xử lý</Text>
          </View>
        )}
        {requests.map(req => (
          <RequestCard
            key={req.id}
            request={req}
            onPress={() => navigation.navigate('StaffRequestDetail', { requestId: req.id })}
          />
        ))}
      </View>
    </ScrollView>
  );
};

// ─── Request Card ───────────────────────────────────────────────────────────────

const RequestCard: React.FC<{ request: ServiceRequestSummary; onPress: () => void }> = ({ request, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
    <View style={styles.cardTop}>
      <View style={styles.aiTag}>
        <Ionicons name="analytics" size={13} color="#fff" />
        <Text style={styles.aiTagText}>AI da phan tich</Text>
      </View>
      <Text style={styles.cardDate}>{fmt(request.createdAt)}</Text>
    </View>
    <Text style={styles.cardDesc} numberOfLines={2}>{request.description ?? '(Không có mô tả)'}</Text>
    <View style={styles.metaRow}>
      <View style={styles.metaItem}>
        <Ionicons name="layers-outline" size={13} color="#607D8B" />
        <Text style={styles.metaText}>
          {COMPLEXITY_LABEL[request.complexity?.level] ?? `Level ${request.complexity?.level ?? '?'}`}
        </Text>
      </View>
      {request.addressText ? (
        <View style={styles.metaItem}>
          <Ionicons name="location-outline" size={13} color="#607D8B" />
          <Text style={styles.metaText} numberOfLines={1}>{request.addressText}</Text>
        </View>
      ) : null}
    </View>
    <View style={styles.cardFooter}>
      <Text style={styles.idText}>#{request.id.slice(0, 8).toUpperCase()}</Text>
      <View style={styles.reviewBtn}>
        <Text style={styles.reviewBtnText}>Xem {"&"} Duyet</Text>
        <Ionicons name="chevron-forward" size={15} color="#1976D2" />
      </View>
    </View>
  </TouchableOpacity>
);

// ─── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa', paddingTop: 50 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  loadingText: { color: '#666', marginTop: 8 },
  header: {
    paddingVertical: 22, paddingHorizontal: 20, marginBottom: 8,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  greeting: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 2 },
  role: { fontSize: 15, color: '#e3f2fd' },
  countBadge: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center',
  },
  countText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  content: { padding: 16 },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FFEBEE', borderRadius: 10, padding: 12, marginBottom: 12,
  },
  errorText: { flex: 1, color: '#F44336', fontSize: 13 },
  retryText: { color: '#1976D2', fontWeight: '600', fontSize: 13 },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: '#555', marginTop: 16 },
  emptySubtext: { fontSize: 13, color: '#aaa', marginTop: 6, textAlign: 'center' },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07,
    shadowRadius: 6, elevation: 3, borderLeftWidth: 4, borderLeftColor: '#1976D2',
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  aiTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#1976D2', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
  },
  aiTagText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  cardDate: { fontSize: 12, color: '#9E9E9E' },
  cardDesc: { fontSize: 14, color: '#333', lineHeight: 20, marginBottom: 10 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: '#607D8B' },
  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 10,
  },
  idText: { fontSize: 11, color: '#bbb' },
  reviewBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  reviewBtnText: { color: '#1976D2', fontSize: 13, fontWeight: '600' },
});
