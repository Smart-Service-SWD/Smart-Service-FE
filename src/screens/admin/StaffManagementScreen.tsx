import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { adminGraphqlService, GraphqlUser } from '../../services/adminGraphqlService';
import { adminRestService } from '../../services/adminRestService';

export const StaffManagementScreen: React.FC = () => {
  const [users, setUsers] = useState<GraphqlUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const [createVisible, setCreateVisible] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ fullName: '', email: '', phoneNumber: '' });

  const loadStaff = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const data = await adminGraphqlService.getUsersByRole('STAFF');
      setUsers(data);
    } catch (error: any) {
      Alert.alert('Lỗi', error?.message ?? 'Không tải được danh sách nhân viên');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  const filtered = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(u =>
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.phoneNumber || '').toLowerCase().includes(q)
    );
  }, [search, users]);

  const onRefresh = () => {
    setRefreshing(true);
    loadStaff(true);
  };

  const handleCreate = async () => {
    if (!form.fullName.trim() || !form.email.trim() || !form.phoneNumber.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập đủ họ tên, email, số điện thoại');
      return;
    }
    setCreating(true);
    try {
      await adminRestService.createStaff({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phoneNumber: form.phoneNumber.trim(),
      });
      setCreateVisible(false);
      setForm({ fullName: '', email: '', phoneNumber: '' });
      await loadStaff(true);
      Alert.alert('Thành công', 'Tạo nhân viên thành công');
    } catch (error: any) {
      Alert.alert('Lỗi', error?.response?.data?.message || error?.message || 'Tạo nhân viên thất bại');
    } finally {
      setCreating(false);
    }
  };

  const toggleLock = async (user: GraphqlUser) => {
    try {
      await adminRestService.lockUser(user.id, !user.isLocked);
      setUsers(prev =>
        prev.map(item =>
          item.id === user.id ? { ...item, isLocked: !user.isLocked } : item
        )
      );
    } catch (error: any) {
      Alert.alert('Lỗi', error?.response?.data?.message || error?.message || 'Không thể cập nhật trạng thái khóa');
    }
  };

  const renderItem = ({ item }: { item: GraphqlUser }) => (
    <View style={styles.card}>
      <Text style={styles.name}>{item.fullName}</Text>
      <Text style={styles.meta}>{item.email}</Text>
      <Text style={styles.meta}>{item.phoneNumber || 'Chưa có số điện thoại'}</Text>
      <View style={styles.row}>
        <View style={[styles.badge, item.isLocked ? styles.badgeLocked : styles.badgeActive]}>
          <Text style={[styles.badgeText, item.isLocked ? styles.badgeTextLocked : styles.badgeTextActive]}>
            {item.isLocked ? 'Đang khóa' : 'Đang hoạt động'}
          </Text>
        </View>
        <TouchableOpacity style={styles.lockBtn} onPress={() => toggleLock(item)}>
          <Ionicons name={item.isLocked ? 'lock-open-outline' : 'lock-closed-outline'} size={16} color="#007AFF" />
          <Text style={styles.lockBtnText}>{item.isLocked ? 'Mở khóa' : 'Khóa'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Quản lý nhân viên</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setCreateVisible(true)}>
          <Ionicons name="person-add-outline" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm nhân viên..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={filtered.length === 0 ? styles.emptyList : styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>Không có dữ liệu nhân viên</Text>
            </View>
          }
        />
      )}

      <Modal visible={createVisible} transparent animationType="slide" onRequestClose={() => setCreateVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Thêm nhân viên</Text>
            <TextInput
              style={styles.input}
              placeholder="Họ tên"
              value={form.fullName}
              onChangeText={fullName => setForm(prev => ({ ...prev, fullName }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              value={form.email}
              onChangeText={email => setForm(prev => ({ ...prev, email }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Số điện thoại"
              keyboardType="phone-pad"
              value={form.phoneNumber}
              onChangeText={phoneNumber => setForm(prev => ({ ...prev, phoneNumber }))}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setCreateVisible(false)}>
                <Text style={styles.cancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, creating && { opacity: 0.6 }]} onPress={handleCreate} disabled={creating}>
                {creating ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveText}>Tạo</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  title: { fontSize: 20, fontWeight: '700', color: '#111827' },
  addBtn: {
    backgroundColor: '#007AFF',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 14,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  searchInput: { flex: 1, paddingVertical: 10, marginLeft: 6 },
  list: { paddingHorizontal: 14, paddingBottom: 20 },
  emptyList: { flexGrow: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#9CA3AF' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10 },
  name: { fontSize: 15, fontWeight: '700', color: '#111827' },
  meta: { marginTop: 3, color: '#6B7280', fontSize: 13 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeActive: { backgroundColor: '#DCFCE7' },
  badgeLocked: { backgroundColor: '#FEE2E2' },
  badgeText: { fontSize: 11, fontWeight: '700' },
  badgeTextActive: { color: '#166534' },
  badgeTextLocked: { color: '#991B1B' },
  lockBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  lockBtnText: { color: '#007AFF', fontWeight: '600', fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalTitle: { fontSize: 17, fontWeight: '700', marginBottom: 14 },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  cancelBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 10, backgroundColor: '#F3F4F6' },
  cancelText: { color: '#374151', fontWeight: '600' },
  saveBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 10, backgroundColor: '#007AFF' },
  saveText: { color: '#fff', fontWeight: '700' },
});
