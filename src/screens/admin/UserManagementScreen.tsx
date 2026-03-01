import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Modal,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { adminGraphqlService, GraphqlUser, UserRole } from '../../services/adminGraphqlService';
import { adminRestService } from '../../services/adminRestService';

interface User extends GraphqlUser {}

export const UserManagementScreen: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingRole, setSavingRole] = useState(false);
  const [editRoleVisible, setEditRoleVisible] = useState(false);
  const [newRole, setNewRole] = useState<string>('');

  // useMemo: reactive filter — no stale closure
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const q = searchQuery.toLowerCase();
    return users.filter(
      u =>
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phoneNumber || '').includes(q),
    );
  }, [users, searchQuery]);

  useEffect(() => {
    loadUsers();
  }, [selectedRole]);

  const loadUsers = async (isRefresh = false) => {
    if (!isRefresh) {
      setLoading(true);
    }
    try {
      const role = selectedRole === 'all' ? null : (selectedRole as UserRole);
      const data = role
        ? await adminGraphqlService.getUsersByRole(role)
        : await adminGraphqlService.getUsers();
      setUsers(data || []);
    } catch (error) {
      Alert.alert('Lỗi', (error as Error).message || 'Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUsers(true);
  };

  const handleUpdateRole = async () => {
    if (!selectedUser || !newRole) return;
    setSavingRole(true);
    try {
      await adminRestService.updateUserRole(selectedUser.id, newRole);
      Alert.alert('Thành công', 'Đã cập nhật vai trò người dùng');
      setEditRoleVisible(false);
      setModalVisible(false);
      loadUsers(true);
    } catch (error) {
      Alert.alert('Lỗi', (error as any)?.response?.data?.message || 'Không thể cập nhật vai trò');
    } finally {
      setSavingRole(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'CUSTOMER':
        return '#007AFF';
      case 'STAFF':
        return '#34C759';
      case 'AGENT':
        return '#FF9500';
      case 'ADMIN':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'CUSTOMER':
        return 'Khách hàng';
      case 'STAFF':
        return 'Nhân viên';
      case 'AGENT':
        return 'Thợ';
      case 'ADMIN':
        return 'Quản trị';
      default:
        return role;
    }
  };

  const handleUserAction = (user: User, action: string) => {
    setSelectedUser(user);
    switch (action) {
      case 'edit':
        setNewRole(user.role);
        setEditRoleVisible(true);
        setModalVisible(true);
        break;
      case 'suspend':
        Alert.alert('Thông báo', 'Chức năng tạm khóa tài khoản chưa được hỗ trợ');
        break;
      case 'delete':
        Alert.alert('Thông báo', 'Chức năng xóa người dùng chưa được hỗ trợ');
        break;
    }
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={styles.userCard}
      onPress={() => {
        setSelectedUser(item);
        setModalVisible(true);
      }}
    >
      <View style={styles.userHeader}
      >
        <View>
          <Text style={styles.userName}>{item.fullName}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
        </View>
        <View style={styles.userBadges}>
          <View style={[styles.roleBadge, { backgroundColor: getRoleColor(item.role) + '20' }]}>
            <Text style={[styles.roleText, { color: getRoleColor(item.role) }]}>
              {getRoleLabel(item.role)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.userInfo}>
        <Text style={styles.userPhone}>{item.phoneNumber || 'Chưa có số điện thoại'}</Text>
      </View>

      <View style={styles.userActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#007AFF20' }]}
          onPress={() => handleUserAction(item, 'edit')}
        >
          <Ionicons name="pencil" size={16} color="#007AFF" />
          <Text style={[styles.actionText, { color: '#007AFF' }]}>Sửa</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#FF950020' }]}
          onPress={() => handleUserAction(item, 'suspend')}
        >
          <Ionicons name="ban" size={16} color="#FF9500" />
          <Text style={[styles.actionText, { color: '#FF9500' }]}>Khóa</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#FF3B3020' }]}
          onPress={() => handleUserAction(item, 'delete')}
        >
          <Ionicons name="trash" size={16} color="#FF3B30" />
          <Text style={[styles.actionText, { color: '#FF3B30' }]}>Xóa</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Search and Filter */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm theo tên, email, số điện thoại..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
          keyboardShouldPersistTaps="handled"
        >
          {['all', 'CUSTOMER', 'STAFF', 'AGENT', 'ADMIN'].map(role => (
            <TouchableOpacity
              key={role}
              style={[
                styles.filterButton,
                selectedRole === role && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedRole(role)}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedRole === role && styles.filterTextActive,
                ]}
              >
                {role === 'all' ? 'Tất cả' : getRoleLabel(role)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Users List */}
      <FlatList
        data={filteredUsers}
        renderItem={renderUserItem}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        maxToRenderPerBatch={10}
        windowSize={5}
        initialNumToRender={10}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />
        }
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            {loading
              ? <ActivityIndicator size="large" color="#007AFF" />
              : (
                <>
                  <Ionicons name="people-outline" size={48} color="#ddd" />
                  <Text style={styles.emptyText}>Không tìm thấy người dùng nào</Text>
                </>
              )
            }
          </View>
        }
      />

      {/* User Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => { setModalVisible(false); setEditRoleVisible(false); }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedUser && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Chi tiết người dùng</Text>
                  <TouchableOpacity onPress={() => { setModalVisible(false); setEditRoleVisible(false); }}>
                    <Ionicons name="close" size={24} color="#333" />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={styles.modalBody}>
                    <Text style={styles.detailLabel}>Họ tên:</Text>
                    <Text style={styles.detailValue}>{selectedUser.fullName}</Text>

                    <Text style={styles.detailLabel}>Email:</Text>
                    <Text style={styles.detailValue}>{selectedUser.email}</Text>

                    <Text style={styles.detailLabel}>Số điện thoại:</Text>
                    <Text style={styles.detailValue}>
                      {selectedUser.phoneNumber || 'Chưa có số điện thoại'}
                    </Text>

                    <Text style={styles.detailLabel}>Vai trò hiện tại:</Text>
                    <View style={[styles.roleBadge, { backgroundColor: getRoleColor(selectedUser.role) + '20', alignSelf: 'flex-start', marginBottom: 16 }]}>
                      <Text style={[styles.roleText, { color: getRoleColor(selectedUser.role) }]}>{getRoleLabel(selectedUser.role)}</Text>
                    </View>

                    {editRoleVisible && (
                      <>
                        <Text style={styles.detailLabel}>Thay đổi vai trò:</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                          {['CUSTOMER', 'STAFF', 'AGENT', 'ADMIN'].map(role => (
                            <TouchableOpacity
                              key={role}
                              style={[
                                styles.roleChip,
                                newRole === role && { backgroundColor: getRoleColor(role), borderColor: getRoleColor(role) },
                              ]}
                              onPress={() => setNewRole(role)}
                            >
                              <Text style={[styles.roleChipText, newRole === role && { color: '#fff' }]}>
                                {getRoleLabel(role)}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                        <TouchableOpacity
                          style={[styles.btnSaveRole, savingRole && { opacity: 0.6 }]}
                          onPress={handleUpdateRole}
                          disabled={savingRole}
                        >
                          {savingRole
                            ? <ActivityIndicator size="small" color="#fff" />
                            : <Text style={styles.btnSaveRoleText}>Lưu vai trò</Text>
                          }
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  searchSection: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
  },
  listContainer: {
    padding: 20,
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  userBadges: {
    alignItems: 'flex-end',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  userInfo: {
    marginBottom: 12,
  },
  userPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  userActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    paddingVertical: 10,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  roleChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F8F9FA',
  },
  roleChipText: {
    fontSize: 13,
    color: '#555',
    fontWeight: '500',
  },
  btnSaveRole: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  btnSaveRoleText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
