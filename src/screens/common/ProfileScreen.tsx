import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { fetchMyServiceRequests, ServiceRequest } from '../../services/graphqlService';

const PRIMARY = '#135bec';

/* ── Status helpers ── */
const STATUS_MAP: Record<string, { label: string; bg: string; fg: string; border: string }> = {
  AWAITING_ANALYSIS: { label: 'Chờ phân tích', bg: '#fefce8', fg: '#a16207', border: '#fef08a' },
  PENDING: { label: 'Đang chờ', bg: '#fefce8', fg: '#a16207', border: '#fef08a' },
  PENDING_REVIEW: { label: 'Chờ duyệt', bg: '#fff7ed', fg: '#c2410c', border: '#fed7aa' },
  MATCHING: { label: 'Đang tìm', bg: '#eff6ff', fg: '#1d4ed8', border: '#dbeafe' },
  IN_PROGRESS: { label: 'Đang thực hiện', bg: '#eff6ff', fg: '#1d4ed8', border: '#dbeafe' },
  COMPLETED: { label: 'Đã xong', bg: '#f0fdf4', fg: '#15803d', border: '#dcfce7' },
  CANCELLED: { label: 'Đã hủy', bg: '#fef2f2', fg: '#dc2626', border: '#fee2e2' },
};

const getStatus = (status: string) =>
  STATUS_MAP[status] ?? { label: status, bg: '#f1f5f9', fg: '#475569', border: '#e2e8f0' };

const formatCost = (cost: { amount: number; currency: string } | null) => {
  if (!cost) return 'Thỏa thuận';
  return `${cost.amount.toLocaleString('vi-VN')}${cost.currency === 'VND' ? 'đ' : ` ${cost.currency}`}`;
};

export const ProfileScreen: React.FC<{ navigation }> = ({ navigation }) => {
  const { user, token, logout, fetchAndUpdatePhoneNumber } = useAuth();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loadingReqs, setLoadingReqs] = useState(true);

  useEffect(() => {
    fetchAndUpdatePhoneNumber();
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      if (!token) return;
      const data = await fetchMyServiceRequests(token);
      setRequests(data.slice(0, 5)); // show latest 5
    } catch (err) {
      console.error('Failed to load service requests:', err);
    } finally {
      setLoadingReqs(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'ADMIN': return 'Admin';
      case 'STAFF': return 'Staff';
      case 'AGENT': return 'Agent';
      default: return 'Customer';
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* ── Profile Header ── */}
      <View style={styles.profileSection}>
        <View style={styles.avatarWrapper}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(user?.fullName)}</Text>
          </View>
          <TouchableOpacity style={styles.cameraBtn} activeOpacity={0.8}>
            <Ionicons name="camera" size={12} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.nameRow}>
          <Text style={styles.displayName}>{user?.fullName || 'User'}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>{getRoleBadge(user?.role)}</Text>
          </View>
        </View>

        <View style={styles.contactCol}>
          <View style={styles.contactRow}>
            <Ionicons name="mail-outline" size={15} color="#94a3b8" />
            <Text style={styles.contactText}>{user?.email || 'N/A'}</Text>
          </View>
          <View style={styles.contactRow}>
            <Ionicons name="call-outline" size={15} color="#94a3b8" />
            <Text style={styles.contactText}>{user?.phoneNumber || 'N/A'}</Text>
          </View>
        </View>
      </View>

      {/* ── Date meta ── */}
      <View style={styles.dateMeta}>
        <Text style={styles.dateText}>
          Ngày tạo: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : '–'}
        </Text>
        <Text style={styles.dateText}>
          Cập nhật cuối: {user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString('vi-VN') : '–'}
        </Text>
      </View>

      {/* ── Recent Service Requests ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Yêu cầu dịch vụ gần đây</Text>
        <TouchableOpacity>
          <Text style={styles.seeAllText}>Xem tất cả</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.cardContainer}>
        {loadingReqs ? (
          <ActivityIndicator size="small" color={PRIMARY} style={{ paddingVertical: 20 }} />
        ) : requests.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="document-text-outline" size={28} color="#cbd5e1" />
            <Text style={styles.emptyText}>Chưa có yêu cầu dịch vụ nào</Text>
          </View>
        ) : (
          requests.map((req) => {
            const st = getStatus(req.status);
            return (
              <View key={req.id} style={styles.requestCard}>
                <View style={styles.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardId}>#{req.id.substring(0, 8).toUpperCase()}</Text>
                    <Text style={styles.cardTitle} numberOfLines={1}>{req.description}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: st.bg, borderColor: st.border }]}>
                    <Text style={[styles.statusText, { color: st.fg }]}>{st.label}</Text>
                  </View>
                </View>
                <View style={styles.cardDivider} />
                <View style={styles.cardBottom}>
                  <Text style={styles.cardLabel}>Giá ước tính</Text>
                  <Text style={styles.cardPrice}>{formatCost(req.estimatedCost)}</Text>
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* ── Action Buttons ── */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionBtn}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <View style={styles.actionIcon}>
            <Ionicons name="create-outline" size={20} color={PRIMARY} />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Chỉnh sửa hồ sơ</Text>
            <Text style={styles.actionSub}>Thay đổi thông tin cá nhân</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('ChangePassword')}
        >
          <View style={styles.actionIcon}>
            <Ionicons name="lock-closed-outline" size={20} color={PRIMARY} />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Cập nhật mật khẩu</Text>
            <Text style={styles.actionSub}>Bảo mật tài khoản</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
          <View style={styles.actionIcon}>
            <Ionicons name="card-outline" size={20} color={PRIMARY} />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Thông tin tài khoản</Text>
            <Text style={styles.actionSub}>Chi tiết định danh</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.7} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={19} color="#dc2626" />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

/* ── Styles ── */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  scrollContent: { paddingBottom: 100 },

  /* Profile Header */
  profileSection: { alignItems: 'center', paddingTop: 24, paddingBottom: 4, paddingHorizontal: 16 },
  avatarWrapper: { position: 'relative', marginBottom: 14 },
  avatar: {
    width: 112, height: 112, borderRadius: 56,
    backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center',
    borderWidth: 4, borderColor: '#f8fafc',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  avatarText: { fontSize: 36, fontWeight: '700', color: '#475569' },
  cameraBtn: {
    position: 'absolute', bottom: 2, right: 2,
    backgroundColor: PRIMARY, width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 3 },
      android: { elevation: 2 },
    }),
  },

  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  displayName: { fontSize: 20, fontWeight: '700', color: '#0f172a', letterSpacing: -0.3 },
  roleBadge: {
    backgroundColor: '#eff6ff', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 999, borderWidth: 1, borderColor: '#bfdbfe',
  },
  roleBadgeText: { fontSize: 10, fontWeight: '700', color: PRIMARY, textTransform: 'uppercase', letterSpacing: 0.5 },

  contactCol: { alignItems: 'center', gap: 4, marginTop: 4 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  contactText: { fontSize: 13, fontWeight: '500', color: '#64748b' },

  /* Date Meta */
  dateMeta: { flexDirection: 'row', justifyContent: 'center', gap: 20, paddingHorizontal: 24, paddingTop: 10, paddingBottom: 18 },
  dateText: { fontSize: 11, color: '#94a3b8' },

  /* Section Header */
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  seeAllText: { fontSize: 13, fontWeight: '500', color: PRIMARY },

  /* Request Cards */
  cardContainer: { paddingHorizontal: 16, gap: 10, marginBottom: 16 },
  requestCard: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#f1f5f9',
    borderRadius: 12, padding: 14, gap: 8,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardId: { fontSize: 11, color: '#94a3b8', fontWeight: '500' },
  cardTitle: { fontSize: 13, fontWeight: '500', color: '#0f172a', marginTop: 3, maxWidth: 220 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, borderWidth: 1 },
  statusText: { fontSize: 11, fontWeight: '500' },
  cardDivider: { height: 1, backgroundColor: '#f8fafc', marginTop: 2 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLabel: { fontSize: 12, color: '#64748b' },
  cardPrice: { fontSize: 13, fontWeight: '700', color: PRIMARY },

  emptyCard: {
    backgroundColor: '#f8fafc', borderRadius: 12, padding: 28,
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  emptyText: { fontSize: 13, color: '#94a3b8' },

  /* Action Buttons */
  actionsContainer: { paddingHorizontal: 16, gap: 10, paddingTop: 8 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#fff', padding: 14, borderRadius: 12,
    borderWidth: 1, borderColor: '#e2e8f0',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  actionIcon: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center',
  },
  actionContent: { flex: 1 },
  actionTitle: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  actionSub: { fontSize: 12, color: '#64748b', marginTop: 1 },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#fef2f2', padding: 15, borderRadius: 12,
    borderWidth: 1, borderColor: '#fee2e2', marginTop: 6,
  },
  logoutText: { fontSize: 14, fontWeight: '600', color: '#dc2626' },
});
