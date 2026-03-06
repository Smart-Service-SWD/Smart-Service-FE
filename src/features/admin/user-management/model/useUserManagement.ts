import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import {
  adminGraphqlService,
  GraphqlUser,
  UserRole,
} from '../../../../shared/api/adminGraphqlService';
import { adminRestService } from '../../../../shared/api/adminRestService';
import {
  EDITABLE_ROLE_OPTIONS,
  getRoleColor,
  getRoleLabel,
  ROLE_OPTIONS,
} from './constants';

export const useUserManagement = () => {
  const [users, setUsers] = useState<GraphqlUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<GraphqlUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingRole, setSavingRole] = useState(false);
  const [editRoleVisible, setEditRoleVisible] = useState(false);
  const [newRole, setNewRole] = useState<string>('');

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) {
      return users;
    }

    const query = searchQuery.toLowerCase();
    return users.filter(
      user =>
        user.fullName.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        (user.phoneNumber || '').includes(query)
    );
  }, [searchQuery, users]);

  const loadUsers = useCallback(async (isRefresh = false) => {
    if (!isRefresh) {
      setLoading(true);
    }

    try {
      const role = selectedRole === 'all' ? null : (selectedRole as UserRole);
      const loadedUsers = role
        ? await adminGraphqlService.getUsersByRole(role)
        : await adminGraphqlService.getUsers();
      setUsers(loadedUsers || []);
    } catch (error) {
      Alert.alert('Lỗi', (error as Error).message || 'Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedRole]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadUsers(true);
  }, [loadUsers]);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    setEditRoleVisible(false);
  }, []);

  const openUserDetail = useCallback((user: GraphqlUser) => {
    setSelectedUser(user);
    setModalVisible(true);
  }, []);

  const handleUpdateRole = useCallback(async () => {
    if (!selectedUser || !newRole) {
      return;
    }

    setSavingRole(true);
    try {
      await adminRestService.updateUserRole(selectedUser.id, newRole);
      Alert.alert('Thành công', 'Đã cập nhật vai trò người dùng');
      closeModal();
      loadUsers(true);
    } catch (error: any) {
      Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể cập nhật vai trò');
    } finally {
      setSavingRole(false);
    }
  }, [closeModal, loadUsers, newRole, selectedUser]);

  const handleUserAction = useCallback(async (user: GraphqlUser, action: 'edit' | 'suspend' | 'delete') => {
    setSelectedUser(user);

    if (action === 'edit') {
      setNewRole(user.role);
      setEditRoleVisible(true);
      setModalVisible(true);
      return;
    }

    if (action === 'suspend') {
      try {
        await adminRestService.lockUser(user.id, !user.isLocked);
        setUsers(previousUsers =>
          previousUsers.map(item =>
            item.id === user.id ? { ...item, isLocked: !user.isLocked } : item
          )
        );
        Alert.alert('Thành công', user.isLocked ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản');
      } catch (error: any) {
        Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể cập nhật trạng thái khóa');
      }
      return;
    }

    Alert.alert('Thông báo', 'Chức năng xóa người dùng chưa được hỗ trợ');
  }, []);

  return {
    users: filteredUsers,
    searchQuery,
    selectedRole,
    refreshing,
    modalVisible,
    selectedUser,
    loading,
    savingRole,
    editRoleVisible,
    newRole,
    roleOptions: ROLE_OPTIONS,
    editableRoleOptions: EDITABLE_ROLE_OPTIONS,
    getRoleColor,
    getRoleLabel,
    setSearchQuery,
    setSelectedRole,
    setNewRole,
    setModalVisible,
    setEditRoleVisible,
    onRefresh,
    closeModal,
    openUserDetail,
    handleUpdateRole,
    handleUserAction,
  };
};
