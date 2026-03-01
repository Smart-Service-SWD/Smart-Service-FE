import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect } from 'react';
import { getUsers } from '../../services/graphqlService';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import type { User as BEUser } from '../../services/graphqlService';
type User = BEUser;

import { useNavigation } from '@react-navigation/native';

const STAFF_ROLES = [
  { key: 'STAFF', label: 'Nhân viên' },
  { key: 'AGENT', label: 'Agent' },
];


export const StaffListScreen: React.FC = () => {
  const navigation = useNavigation();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('STAFF');
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Fetch all users, filter staff & agent ở FE (role là string)
  const fetchUsers = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const all: User[] = await getUsers(token);
      setUsers(all.filter(u => u.role === 'STAFF' || u.role === 'AGENT'));
    } catch (err) {
      setUsers([]);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery, selectedRole]);

  // Debug: log dữ liệu users để kiểm tra
  useEffect(() => {
    console.log('All users from API:', users);
  }, [users]);

  // Filter staff/agent theo role string
  const filterUsers = () => {
    let filtered = users.filter(u => u.role === selectedRole);
    if (searchQuery.trim()) {
      filtered = filtered.filter(user =>
        user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.phoneNumber.includes(searchQuery)
      );
    }
    setFilteredUsers(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'STAFF': return '#34C759';
      case 'AGENT': return '#FF9500';
      default: return '#8E8E93';
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
      <Ionicons name="person-circle-outline" size={36} color={getRoleColor(item.role)} style={{ marginRight: 12 }} />
      <View style={{ flex: 1 }}>
        <Text style={styles.userName}>{item.fullName}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
          <Text style={[styles.userRole, { color: getRoleColor(item.role), fontWeight: 'bold' }]}>{item.role === 'STAFF' ? 'Nhân viên' : 'Agent'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header + Menu */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Danh sách nhân viên & agent</Text>
      </View>
      {/* Role Filter */}
      <View style={styles.roleFilterRow}>
        {STAFF_ROLES.map(r => (
          <TouchableOpacity
            key={r.key}
            style={[styles.roleBtn, selectedRole === r.key && styles.roleBtnActive]}
            onPress={() => setSelectedRole(r.key)}
          >
            <Text style={[styles.roleBtnText, selectedRole === r.key && styles.roleBtnTextActive]}>{r.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm theo tên, email, số điện thoại..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      {/* List */}
      <FlatList
        data={filteredUsers}
        renderItem={renderUserItem}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>Không tìm thấy nhân viên hoặc agent nào</Text>
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
                  <Text style={styles.modalTitle}>Chi tiết</Text>
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
                  <Text style={styles.detailValue}>{selectedUser.phoneNumber || 'Chưa cập nhật'}</Text>
                  <Text style={styles.detailLabel}>Vai trò:</Text>
                  <Text style={styles.detailValue}>{selectedUser.role === 'STAFF' ? 'Nhân viên' : 'Agent'}</Text>
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
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  backBtn: { marginRight: 8, padding: 4 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  roleFilterRow: { flexDirection: 'row', justifyContent: 'center', marginVertical: 8 },
  roleBtn: { paddingVertical: 6, paddingHorizontal: 18, borderRadius: 16, backgroundColor: '#F8F9FA', marginHorizontal: 6 },
  roleBtnActive: { backgroundColor: '#007AFF' },
  roleBtnText: { fontSize: 14, color: '#666', fontWeight: '500' },
  roleBtnTextActive: { color: '#fff' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3.84,
    elevation: 2,
  },
  userName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  userEmail: { fontSize: 14, color: '#666' },
  userRole: { fontSize: 13, fontWeight: '500', marginTop: 2 },
  emptyContainer: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 16, color: '#999', marginTop: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 20, width: '90%', maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  modalBody: { paddingVertical: 10 },
  detailLabel: { fontSize: 14, color: '#666', marginTop: 12, marginBottom: 4 },
  detailValue: { fontSize: 16, color: '#333', fontWeight: '500' },
});

export default StaffListScreen;
