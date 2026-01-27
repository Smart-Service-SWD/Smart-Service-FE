import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface User {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: 'USER' | 'STAFF' | 'AGENT';
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  lastLoginAt?: string;
}

export const UserManagementScreen: React.FC = () => {
  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      fullName: 'Nguyễn Văn A',
      email: 'user1@example.com',
      phoneNumber: '0901234567',
      role: 'USER',
      status: 'active',
      createdAt: '2024-01-15',
      lastLoginAt: '2024-01-27',
    },
    {
      id: '2',
      fullName: 'Trần Thị B',
      email: 'staff1@example.com',
      phoneNumber: '0912345678',
      role: 'STAFF',
      status: 'active',
      createdAt: '2024-01-10',
      lastLoginAt: '2024-01-26',
    },
    {
      id: '3',
      fullName: 'Lê Văn C',
      email: 'agent1@example.com',
      phoneNumber: '0923456789',
      role: 'AGENT',
      status: 'active',
      createdAt: '2024-01-12',
      lastLoginAt: '2024-01-25',
    },
  ]);
  
  const [filteredUsers, setFilteredUsers] = useState<User[]>(users);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery, selectedRole]);

  const filterUsers = () => {
    let filtered = users;

    if (searchQuery.trim()) {
      filtered = filtered.filter(user =>
        user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.phoneNumber.includes(searchQuery)
      );
    }

    if (selectedRole !== 'all') {
      filtered = filtered.filter(user => user.role === selectedRole);
    }

    setFilteredUsers(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'USER': return '#007AFF';
      case 'STAFF': return '#34C759';
      case 'AGENT': return '#FF9500';
      default: return '#8E8E93';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#34C759';
      case 'inactive': return '#8E8E93';
      case 'suspended': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

  const handleUserAction = (user: User, action: string) => {
    setSelectedUser(user);
    
    switch (action) {
      case 'edit':
        // Navigate to edit screen
        Alert.alert('Thông báo', 'Chức năng chỉnh sửa đang được phát triển');
        break;
      case 'suspend':
        Alert.alert(
          'Xác nhận',
          `Bạn có chắc chắn muốn ${user.status === 'suspended' ? 'kích hoạt lại' : 'tạm khóa'} tài khoản ${user.fullName}?`,
          [
            { text: 'Hủy', style: 'cancel' },
            { 
              text: 'Xác nhận',
              onPress: () => {
                setUsers(prev => prev.map(u => 
                  u.id === user.id 
                    ? { ...u, status: u.status === 'suspended' ? 'active' : 'suspended' }
                    : u
                ));
              }
            },
          ]
        );
        break;
      case 'delete':
        Alert.alert(
          'Xác nhận xóa',
          `Bạn có chắc chắn muốn xóa tài khoản ${user.fullName}? Hành động này không thể hoàn tác.`,
          [
            { text: 'Hủy', style: 'cancel' },
            { 
              text: 'Xóa',
              style: 'destructive',
              onPress: () => {
                setUsers(prev => prev.filter(u => u.id !== user.id));
              }
            },
          ]
        );
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
      <View style={styles.userHeader}>
        <View>
          <Text style={styles.userName}>{item.fullName}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
        </View>
        <View style={styles.userBadges}>
          <View style={[styles.roleBadge, { backgroundColor: getRoleColor(item.role) + '20' }]}>
            <Text style={[styles.roleText, { color: getRoleColor(item.role) }]}>
              {item.role}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.userInfo}>
        <Text style={styles.userPhone}>{item.phoneNumber}</Text>
        <Text style={styles.userDate}>
          Tham gia: {new Date(item.createdAt).toLocaleDateString('vi-VN')}
        </Text>
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
          style={[styles.actionButton, { backgroundColor: item.status === 'suspended' ? '#34C75920' : '#FF950020' }]}
          onPress={() => handleUserAction(item, 'suspend')}
        >
          <Ionicons 
            name={item.status === 'suspended' ? "checkmark-circle" : "ban"} 
            size={16} 
            color={item.status === 'suspended' ? '#34C759' : '#FF9500'} 
          />
          <Text style={[styles.actionText, { color: item.status === 'suspended' ? '#34C759' : '#FF9500' }]}>
            {item.status === 'suspended' ? 'Kích hoạt' : 'Khóa'}
          </Text>
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
        
        <View style={styles.filterRow}>
          {['all', 'USER', 'STAFF', 'AGENT'].map(role => (
            <TouchableOpacity
              key={role}
              style={[
                styles.filterButton,
                selectedRole === role && styles.filterButtonActive
              ]}
              onPress={() => setSelectedRole(role)}
            >
              <Text style={[
                styles.filterText,
                selectedRole === role && styles.filterTextActive
              ]}>
                {role === 'all' ? 'Tất cả' : role}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Users List */}
      <FlatList
        data={filteredUsers}
        renderItem={renderUserItem}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>Không tìm thấy người dùng nào</Text>
          </View>
        }
      />

      {/* User Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedUser && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Chi tiết người dùng</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons name="close" size={24} color="#333" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.modalBody}>
                  <Text style={styles.detailLabel}>Họ tên:</Text>
                  <Text style={styles.detailValue}>{selectedUser.fullName}</Text>
                  
                  <Text style={styles.detailLabel}>Email:</Text>
                  <Text style={styles.detailValue}>{selectedUser.email}</Text>
                  
                  <Text style={styles.detailLabel}>Số điện thoại:</Text>
                  <Text style={styles.detailValue}>{selectedUser.phoneNumber}</Text>
                  
                  <Text style={styles.detailLabel}>Vai trò:</Text>
                  <Text style={styles.detailValue}>{selectedUser.role}</Text>
                  
                  <Text style={styles.detailLabel}>Trạng thái:</Text>
                  <Text style={[styles.detailValue, { color: getStatusColor(selectedUser.status) }]}>
                    {selectedUser.status}
                  </Text>
                  
                  <Text style={styles.detailLabel}>Ngày tham gia:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(selectedUser.createdAt).toLocaleDateString('vi-VN')}
                  </Text>
                  
                  {selectedUser.lastLoginAt && (
                    <>
                      <Text style={styles.detailLabel}>Lần đăng nhập cuối:</Text>
                      <Text style={styles.detailValue}>
                        {new Date(selectedUser.lastLoginAt).toLocaleDateString('vi-VN')}
                      </Text>
                    </>
                  )}
                </View>
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
    justifyContent: 'space-around',
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
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
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
  userDate: {
    fontSize: 12,
    color: '#999',
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
});