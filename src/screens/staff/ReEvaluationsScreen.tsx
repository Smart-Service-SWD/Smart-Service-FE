import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { staffRestService } from '../../services/staffRestService';

const STATUS_TAG: Record<string, { label: string; color: string }> = {
  AWAITING_ANALYSIS: { label: 'Chờ phân tích', color: '#9E9E9E' },
  CREATED: { label: 'Moi tao', color: '#607D8B' },
};

const COMPLEXITY_LABEL: Record<number, string> = {
  1: 'Rat don gian', 2: 'Don gian', 3: 'Trung binh', 4: 'Phuc tap', 5: 'Rat phuc tap',
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

export const ReEvaluationsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState<ServiceRequestSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await staffGraphqlService.getNewRequests();
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

  const handleTriggerAnalysis = async (req: ServiceRequestSummary) => {
    if (!req.description) {
      Alert.alert('Thiếu thông tin', 'Yêu cầu này không có mô tả để phân tích AI.');
      return;
    }
    Alert.alert(
      'Phân tích AI',
      `Kích hoạt AI phân tích yêu cầu #${req.id.slice(0, 8).toUpperCase()}?`,
      [
        { text: 'Huy', style: 'cancel' },
        {
          text: 'Phân tích',
          onPress: async () => {
            try {
              setAnalyzingId(req.id);
              await staffRestService.triggerAnalysis({ description: req.description! });
              Alert.alert('Thành công', 'Đã gửi yêu cầu phân tích AI. Kết quả sẽ xuất hiện trong tab "Xác nhận AI".', [
                { text: 'OK', onPress: () => load() },
              ]);
            } catch (err: any) {
              Alert.alert('Lỗi', err?.response?.data?.message ?? err?.message ?? 'Phân tích thất bại');
            } finally {
              setAnalyzingId(null);
            }
          },
        },
      ]
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1976D2" />
        <Text style={styles.loadingText}>Đang tải yêu cầu mới...</Text>
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
          <Text style={styles.role}>Yêu cầu cần phân tích</Text>
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
            <Ionicons name="checkmark-circle-outline" size={72} color="#BBDEFB" />
            <Text style={styles.emptyTitle}>Không có yêu cầu mới</Text>
            <Text style={styles.emptySubtext}>Tất cả yêu cầu đã được xử lý</Text>
          </View>
        )}

        {requests.map(req => {
          const tag = STATUS_TAG[req.status] ?? { label: req.status, color: '#607D8B' };
          const isAnalyzing = analyzingId === req.id;
          return (
            <View key={req.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={[styles.statusTag, { backgroundColor: tag.color }]}>
                  <Text style={styles.statusTagText}>{tag.label}</Text>
                </View>
                <Text style={styles.cardDate}>{fmt(req.createdAt)}</Text>
              </View>
              <Text style={styles.cardDesc} numberOfLines={3}>
                {req.description ?? '(Không có mô tả)'}
              </Text>
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Ionicons name="layers-outline" size={13} color="#607D8B" />
                  <Text style={styles.metaText}>
                    {COMPLEXITY_LABEL[req.complexity?.level] ?? `Level ${req.complexity?.level ?? '?'}`}
                  </Text>
                </View>
                {req.addressText ? (
                  <View style={styles.metaItem}>
                    <Ionicons name="location-outline" size={13} color="#607D8B" />
                    <Text style={styles.metaText} numberOfLines={1}>{req.addressText}</Text>
                  </View>
                ) : null}
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.detailBtn}
                  onPress={() => navigation.navigate('StaffRequestDetail', { requestId: req.id })}
                >
                  <Ionicons name="eye-outline" size={15} color="#1976D2" />
                  <Text style={styles.detailBtnText}>Chi tiết</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.analyzeBtn, isAnalyzing && { opacity: 0.7 }]}
                  onPress={() => handleTriggerAnalysis(req)}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="analytics-outline" size={15} color="#fff" />
                  )}
                  <Text style={styles.analyzeBtnText}>
                    {isAnalyzing ? 'Đang phân tích...' : 'Phân tích AI'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
};

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
  statusTag: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusTagText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  cardDate: { fontSize: 12, color: '#9E9E9E' },
  cardDesc: { fontSize: 14, color: '#333', lineHeight: 20, marginBottom: 10 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: '#607D8B' },
  cardActions: { flexDirection: 'row', gap: 10, borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 10 },
  detailBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1.5, borderColor: '#1976D2', borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 8, flex: 1, justifyContent: 'center',
  },
  detailBtnText: { color: '#1976D2', fontSize: 13, fontWeight: '600' },
  analyzeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#FF9800', borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 8, flex: 1.5, justifyContent: 'center',
  },
  analyzeBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
});
