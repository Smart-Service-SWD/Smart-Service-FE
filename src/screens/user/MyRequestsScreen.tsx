import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  getMyServiceRequests,
  ServiceRequestDetail,
  STATUS_COLOR,
  STATUS_LABEL,
} from '../../services/userService';

interface Props {
  navigation: any;
}

type FilterStatus = '' | 'PENDING_REVIEW' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

const FILTER_TABS: { label: string; value: FilterStatus }[] = [
  { label: 'Tất cả', value: '' },
  { label: 'Chờ duyệt', value: 'PENDING_REVIEW' },
  { label: 'Đang làm', value: 'IN_PROGRESS' },
  { label: 'Hoàn thành', value: 'COMPLETED' },
  { label: 'Đã hủy', value: 'CANCELLED' },
];

export const MyRequestsScreen: React.FC<Props> = ({ navigation }) => {
  const [requests, setRequests] = useState<ServiceRequestDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterStatus>('');

  const loadRequests = useCallback(async () => {
    try {
      const data = await getMyServiceRequests(filter || undefined);
      setRequests(data);
    } catch (err: any) {
      Alert.alert('Lỗi', err?.message ?? 'Không tải được danh sách yêu cầu');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    setLoading(true);
    loadRequests();
  }, [filter]);

  const onRefresh = () => { setRefreshing(true); loadRequests(); };

  const handleItemPress = (item: ServiceRequestDetail) => {
    navigation.navigate('RequestDetail', { requestId: item.id });
  };

  // ── Empty state ─────────────────────────────────────────────────────────────
  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="clipboard-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>Chưa có yêu cầu nào</Text>
      <Text style={styles.emptySubtitle}>
        {filter ? 'Không có yêu cầu nào ở trạng thái này.' : 'Tạo yêu cầu dịch vụ đầu tiên của bạn!'}
      </Text>
      {!filter && (
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => navigation.navigate('NewRequest')}
        >
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.createBtnText}>Tạo yêu cầu mới</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // ── Request card ─────────────────────────────────────────────────────────────
  const RequestCard = ({ item }: { item: ServiceRequestDetail }) => {
    const statusColor = STATUS_COLOR[item.status] ?? '#6B7280';
    const statusLabel = STATUS_LABEL[item.status] ?? item.status;
    const date = new Date(item.createdAt).toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });

    return (
      <TouchableOpacity style={styles.card} onPress={() => handleItemPress(item)} activeOpacity={0.7}>
        {/* Status indicator */}
        <View style={[styles.statusBar, { backgroundColor: statusColor }]} />

        <View style={styles.cardBody}>
          <View style={styles.cardTop}>
            <View style={[styles.badge, { backgroundColor: statusColor + '20' }]}>
              <View style={[styles.badgeDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.badgeText, { color: statusColor }]}>{statusLabel}</Text>
            </View>
            <Text style={styles.date}>{date}</Text>
          </View>

          <Text style={styles.description} numberOfLines={2}>{item.description}</Text>

          {!!item.addressText && (
            <View style={styles.addressRow}>
              <Ionicons name="location-outline" size={13} color="#9CA3AF" />
              <Text style={styles.addressText} numberOfLines={1}>{item.addressText}</Text>
            </View>
          )}

          <View style={styles.cardBottom}>
            {item.estimatedCost ? (
              <Text style={styles.price}>
                {item.estimatedCost.amount.toLocaleString('vi-VN')} {item.estimatedCost.currency}
              </Text>
            ) : (
              <Text style={styles.noPrice}>Chưa có giá</Text>
            )}
            <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Yêu cầu của tôi</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('NewRequest')}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {FILTER_TABS.map(tab => (
          <TouchableOpacity
            key={tab.value}
            style={[styles.filterTab, filter === tab.value && styles.filterTabActive]}
            onPress={() => setFilter(tab.value)}
          >
            <Text style={[styles.filterTabText, filter === tab.value && styles.filterTabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <RequestCard item={item} />}
          contentContainerStyle={requests.length === 0 ? { flex: 1 } : { padding: 16, paddingBottom: 32 }}
          ListEmptyComponent={<EmptyState />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      )}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  addBtn: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  filterContainer: { backgroundColor: '#fff', maxHeight: 56 },
  filterContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  filterTabActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  filterTabText: { fontSize: 13, fontWeight: '500', color: '#6B7280' },
  filterTabTextActive: { color: '#fff', fontWeight: '700' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statusBar: { width: 4 },
  cardBody: { flex: 1, padding: 14 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  date: { fontSize: 11, color: '#9CA3AF' },
  description: { fontSize: 14, color: '#374151', lineHeight: 20, marginBottom: 6 },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  addressText: { flex: 1, fontSize: 12, color: '#9CA3AF' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  price: { fontSize: 15, fontWeight: '700', color: '#2563EB' },
  noPrice: { fontSize: 13, color: '#9CA3AF' },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 12,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151' },
  emptySubtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20 },
  createBtn: {
    flexDirection: 'row',
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  createBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
