import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import {
  adminGraphqlService,
  ServiceRequest,
} from '../../services/adminGraphqlService';

// ────────────────────────────────────────────────────────────────
type TabType = 'pending' | 'completed';

interface StatusMeta {
  label: string;
  color: string;
  bg: string;
  dot: string;
}

const STATUS_MAP: Record<string, StatusMeta> = {
  AWAITING_ANALYSIS: { label: 'Đang phân tích', color: '#FF9500', bg: '#FFF3E0', dot: '#FF9500' },
  CREATED:           { label: 'Đã tạo',          color: '#8E8E93', bg: '#F5F6FA', dot: '#8E8E93' },
  PENDING_REVIEW:    { label: 'Chờ duyệt',        color: '#007AFF', bg: '#E8F2FF', dot: '#007AFF' },
  APPROVED:          { label: 'Đã duyệt',         color: '#5AC8FA', bg: '#E3F5FC', dot: '#5AC8FA' },
  ASSIGNED:          { label: 'Đã phân công',     color: '#FF9500', bg: '#FFF3E0', dot: '#FF9500' },
  IN_PROGRESS:       { label: 'Đang xử lý',       color: '#FF6B00', bg: '#FFF0E3', dot: '#FF6B00' },
  URGENT_DISPATCH:   { label: 'Khẩn cấp',         color: '#FF3B30', bg: '#FFE8E8', dot: '#FF3B30' },
  COMPLETED:         { label: 'Hoàn thành',        color: '#34C759', bg: '#E6FAF0', dot: '#34C759' },
  CANCELLED:         { label: 'Đã hủy',            color: '#9E9E9E', bg: '#F5F5F5', dot: '#9E9E9E' },
};

const isPending = (status: string) =>
  status !== 'COMPLETED' && status !== 'CANCELLED';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

// ────────────────────────────────────────────────────────────────
export const RequestManagementScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const initialTab: TabType = (route.params as any)?.tab ?? 'pending';

  const [activeTab, setActiveTab]     = useState<TabType>(initialTab);
  const [requests, setRequests]       = useState<ServiceRequest[]>([]);
  const [userMap, setUserMap]         = useState<Record<string, string>>({});
  const [catMap, setCatMap]           = useState<Record<string, string>>({});
  const [agentMap, setAgentMap]       = useState<Record<string, string>>({});
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);

  // ── Load ──────────────────────────────────────────────────────
  const loadData = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const [reqs, users, cats] = await Promise.all([
        adminGraphqlService.getServiceRequests(),
        adminGraphqlService.getUsers(),
        adminGraphqlService.getServiceCategories(),
      ]);

      setRequests(reqs);

      const um: Record<string, string> = {};
      const am: Record<string, string> = {};
      users.forEach(u => {
        um[u.id] = u.fullName;
        if (u.role === 'AGENT') am[u.id] = u.fullName;
      });
      setUserMap(um);
      setAgentMap(am);

      const cm: Record<string, string> = {};
      cats.forEach(c => { cm[c.id] = c.name; });
      setCatMap(cm);
    } catch {
      // silently fail — dashboard already shows errors
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const onRefresh = () => { setRefreshing(true); loadData(true); };

  // ── Derived data ──────────────────────────────────────────────
  const pendingList   = requests.filter(r => isPending(r.status));
  const completedList = requests.filter(r => !isPending(r.status));
  const filteredList  = activeTab === 'pending' ? pendingList : completedList;

  // ── Render item ───────────────────────────────────────────────
  const renderItem = ({ item }: { item: ServiceRequest }) => {
    const meta = STATUS_MAP[item.status] ?? {
      label: item.status,
      color: '#8E8E93',
      bg: '#F5F6FA',
      dot: '#8E8E93',
    };

    return (
      <View style={styles.card}>
        {/* Row 1 – status badge + date */}
        <View style={styles.cardTop}>
          <View style={[styles.badge, { backgroundColor: meta.bg }]}>
            <View style={[styles.dot, { backgroundColor: meta.dot }]} />
            <Text style={[styles.badgeText, { color: meta.color }]}>{meta.label}</Text>
          </View>
          <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
        </View>

        {/* Row 2 – customer name */}
        <Text style={styles.customerName} numberOfLines={1}>
          {userMap[item.customerId] ?? 'Khách hàng #' + item.customerId.slice(0, 6)}
        </Text>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Info rows */}
        <View style={styles.infoSection}>
          <InfoRow icon="grid-outline"     text={catMap[item.categoryId] ?? 'Danh mục'} />
          {item.addressText ? (
            <InfoRow icon="location-outline" text={item.addressText} maxLines={1} />
          ) : null}
          {item.assignedProviderId ? (
            <InfoRow
              icon="hammer-outline"
              text={'Thợ: ' + (agentMap[item.assignedProviderId] ?? item.assignedProviderId.slice(0, 6))}
            />
          ) : null}
        </View>

        {/* Description */}
        {item.description ? (
          <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
        ) : null}

        {/* Cost */}
        {item.estimatedCost ? (
          <View style={styles.costRow}>
            <Ionicons name="cash-outline" size={14} color="#34C759" />
            <Text style={styles.costText}>
              Chi phí ước tính: {formatCurrency(item.estimatedCost.amount)}
            </Text>
          </View>
        ) : null}
      </View>
    );
  };

  // ── Summary strip ─────────────────────────────────────────────
  const SummaryStrip = () => (
    <View style={styles.summaryStrip}>
      <SummaryTile
        label="Đang phân tích"
        count={requests.filter(r => r.status === 'AWAITING_ANALYSIS').length}
        color="#FF9500"
      />
      <SummaryTile
        label="Chờ duyệt"
        count={requests.filter(r => r.status === 'PENDING_REVIEW').length}
        color="#007AFF"
      />
      <SummaryTile
        label="Đang xử lý"
        count={requests.filter(r => r.status === 'IN_PROGRESS').length}
        color="#FF6B00"
      />
      <SummaryTile
        label="Hoàn thành"
        count={requests.filter(r => r.status === 'COMPLETED').length}
        color="#34C759"
      />
    </View>
  );

  // ── Main ──────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Quản lý yêu cầu</Text>
          {!loading && (
            <Text style={styles.headerSub}>{requests.length} yêu cầu tổng cộng</Text>
          )}
        </View>
        {/* spacer to balance the back button */}
        <View style={{ width: 40 }} />
      </View>

      {/* Summary strip */}
      {!loading && <SummaryStrip />}

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'pending' && styles.tabButtonActive]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>
            Chờ xử lý {pendingList.length > 0 ? `(${pendingList.length})` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'completed' && styles.tabButtonActive]}
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[styles.tabText, activeTab === 'completed' && styles.tabTextActive]}>
            Đã hoàn thành {completedList.length > 0 ? `(${completedList.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Đang tải yêu cầu...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredList}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />
          }
          contentContainerStyle={[
            styles.listContainer,
            filteredList.length === 0 && styles.emptyList,
          ]}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons
                name={activeTab === 'pending' ? 'time-outline' : 'checkmark-circle-outline'}
                size={56}
                color="#E0E0E0"
              />
              <Text style={styles.emptyText}>
                {activeTab === 'pending'
                  ? 'Không có yêu cầu nào đang chờ'
                  : 'Không có yêu cầu nào đã hoàn thành'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

// ── Small helpers ──────────────────────────────────────────────────────────────
const InfoRow: React.FC<{ icon: string; text: string; maxLines?: number }> = ({
  icon, text, maxLines = 2,
}) => (
  <View style={styles.infoRow}>
    <Ionicons name={icon as any} size={13} color="#999" style={{ marginTop: 1 }} />
    <Text style={styles.infoText} numberOfLines={maxLines}>{text}</Text>
  </View>
);

const SummaryTile: React.FC<{ label: string; count: number; color: string }> = ({
  label, count, color,
}) => (
  <View style={styles.summaryTile}>
    <Text style={[styles.summaryCount, { color }]}>{count}</Text>
    <Text style={styles.summaryLabel}>{label}</Text>
  </View>
);

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#F5F6FA' },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  loadingText: { marginTop: 10, color: '#999', fontSize: 13 },
  emptyText:   { marginTop: 12, color: '#aaa', fontSize: 14, textAlign: 'center' },

  // Header
  header: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  headerSub:   { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 },

  // Summary strip
  summaryStrip: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    gap: 4,
  },
  summaryTile: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  summaryCount: { fontSize: 20, fontWeight: '700' },
  summaryLabel: { fontSize: 10, color: '#888', marginTop: 2, textAlign: 'center' },

  // Tabs
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: { borderBottomColor: '#007AFF' },
  tabText:         { fontSize: 14, color: '#888', fontWeight: '500' },
  tabTextActive:   { color: '#007AFF', fontWeight: '700' },

  // List
  listContainer: { padding: 12, paddingBottom: 30 },
  emptyList:     { flex: 1, justifyContent: 'center' },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 5,
  },
  dot:       { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  dateText:  { fontSize: 11, color: '#aaa' },

  customerName: { fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 8 },

  divider: { height: 1, backgroundColor: '#F0F1F5', marginBottom: 8 },

  infoSection: { gap: 4, marginBottom: 6 },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  infoText: { flex: 1, fontSize: 13, color: '#555' },

  description: {
    fontSize: 13,
    color: '#777',
    marginTop: 6,
    lineHeight: 18,
    fontStyle: 'italic',
  },

  costRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
    backgroundColor: '#F0FBF4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  costText: { fontSize: 13, fontWeight: '600', color: '#2D9B4E' },
});
