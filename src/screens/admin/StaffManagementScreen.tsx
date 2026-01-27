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

interface Staff {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  specialization: string;
  status: 'active' | 'inactive' | 'on_leave';
  joinDate: string;
  department: string;
  completedTasks: number;
  averageRating: number;
}

export const StaffManagementScreen: React.FC = () => {
  const [staff, setStaff] = useState<Staff[]>([
    {
      id: '1',
      fullName: 'Trần Văn Nam',
      email: 'nam.tran@smartservice.com',
      phoneNumber: '0901234567',
      specialization: 'Sửa chữa điện tử',
      status: 'active',
      joinDate: '2023-06-15',
      department: 'Kỹ thuật',
      completedTasks: 145,
      averageRating: 4.8,
    },
    {
      id: '2',
      fullName: 'Nguyễn Thị Lan',
      email: 'lan.nguyen@smartservice.com',
      phoneNumber: '0912345678',
      specialization: 'Bảo dưỡng ô tô',
      status: 'active',
      joinDate: '2023-03-20',
      department: 'Ô tô',
      completedTasks: 98,
      averageRating: 4.6,
    },
    {
      id: '3',
      fullName: 'Lê Minh Tuấn',
      email: 'tuan.le@smartservice.com',
      phoneNumber: '0923456789',
      specialization: 'Dịch vụ gia đình',
      status: 'on_leave',
      joinDate: '2023-01-10',
      department: 'Gia đình',
      completedTasks: 210,
      averageRating: 4.9,
    },
  ]);
  
  const [filteredStaff, setFilteredStaff] = useState<Staff[]>(staff);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);

  const departments = ['all', 'Kỹ thuật', 'Ô tô', 'Xe máy', 'Gia đình'];
  const statuses = ['all', 'active', 'inactive', 'on_leave'];

  useEffect(() => {
    filterStaff();
  }, [staff, searchQuery, selectedStatus, selectedDepartment]);

  const filterStaff = () => {
    let filtered = staff;

    if (searchQuery.trim()) {
      filtered = filtered.filter(member =>
        member.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.specialization.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(member => member.status === selectedStatus);
    }

    if (selectedDepartment !== 'all') {
      filtered = filtered.filter(member => member.department === selectedDepartment);
    }

    setFilteredStaff(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#34C759';
      case 'inactive': return '#8E8E93';
      case 'on_leave': return '#FF9500';
      default: return '#8E8E93';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Hoạt động';
      case 'inactive': return 'Tạm dừng';
      case 'on_leave': return 'Nghỉ phép';
      default: return status;
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return '#34C759';
    if (rating >= 4.0) return '#FF9500';
    return '#FF3B30';
  };

  const handleStaffAction = (staff: Staff, action: string) => {
    switch (action) {
      case 'edit':
        Alert.alert('Thông báo', 'Chức năng chỉnh sửa đang được phát triển');
        break;
      case 'change_status':
        const newStatus = staff.status === 'active' ? 'inactive' : 'active';
        Alert.alert(
          'Xác nhận',
          `Bạn có chắc chắn muốn ${newStatus === 'active' ? 'kích hoạt' : 'tạm dừng'} nhân viên ${staff.fullName}?`,
          [
            { text: 'Hủy', style: 'cancel' },
            { 
              text: 'Xác nhận',
              onPress: () => {
                setStaff(prev => prev.map(s => 
                  s.id === staff.id 
                    ? { ...s, status: newStatus as any }
                    : s
                ));
              }
            },
          ]
        );
        break;
      case 'assign_task':
        Alert.alert('Thông báo', 'Chức năng giao việc đang được phát triển');
        break;
    }
  };

  const renderStaffItem = ({ item }: { item: Staff }) => (
    <TouchableOpacity 
      style={styles.staffCard}
      onPress={() => {
        setSelectedStaff(item);
        setModalVisible(true);
      }}
    >
      <View style={styles.staffHeader}>
        <View style={styles.staffInfo}>
          <Text style={styles.staffName}>{item.fullName}</Text>
          <Text style={styles.staffEmail}>{item.email}</Text>
          <Text style={styles.staffSpecialization}>{item.specialization}</Text>
        </View>
        <View style={styles.staffBadges}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {getStatusText(item.status)}
            </Text>
          </View>
          <View style={styles.departmentBadge}>
            <Text style={styles.departmentText}>{item.department}</Text>
          </View>
        </View>
      </View>

      <View style={styles.staffStats}>
        <View style={styles.statItem}>
          <Ionicons name="checkmark-circle-outline" size={16} color="#34C759" />
          <Text style={styles.statText}>{item.completedTasks} hoàn thành</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="star" size={16} color={getRatingColor(item.averageRating)} />
          <Text style={styles.statText}>{item.averageRating}/5.0</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={styles.statText}>
            Tham gia: {new Date(item.joinDate).toLocaleDateString('vi-VN')}
          </Text>
        </View>
      </View>

      <View style={styles.staffActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#007AFF20' }]}
          onPress={() => handleStaffAction(item, 'edit')}
        >
          <Ionicons name="pencil" size={16} color="#007AFF" />
          <Text style={[styles.actionText, { color: '#007AFF' }]}>Sửa</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#34C75920' }]}
          onPress={() => handleStaffAction(item, 'assign_task')}
        >
          <Ionicons name="add-circle" size={16} color="#34C759" />
          <Text style={[styles.actionText, { color: '#34C759' }]}>Giao việc</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: item.status === 'active' ? '#FF950020' : '#34C75920' }]}
          onPress={() => handleStaffAction(item, 'change_status')}
        >
          <Ionicons 
            name={item.status === 'active' ? "pause-circle" : "play-circle"} 
            size={16} 
            color={item.status === 'active' ? '#FF9500' : '#34C759'} 
          />
          <Text style={[styles.actionText, { color: item.status === 'active' ? '#FF9500' : '#34C759' }]}>
            {item.status === 'active' ? 'Tạm dừng' : 'Kích hoạt'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Quản lý nhân viên</Text>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="person-add" size={20} color="#007AFF" />
          <Text style={styles.addText}>Thêm</Text>
        </TouchableOpacity>
      </View>

      {/* Search and Filter */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm nhân viên..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Trạng thái:</Text>
          {statuses.map(status => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterButton,
                selectedStatus === status && styles.filterButtonActive
              ]}
              onPress={() => setSelectedStatus(status)}
            >
              <Text style={[
                styles.filterText,
                selectedStatus === status && styles.filterTextActive
              ]}>
                {status === 'all' ? 'Tất cả' : getStatusText(status)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Phòng ban:</Text>
          {departments.map(department => (
            <TouchableOpacity
              key={department}
              style={[
                styles.filterButton,
                selectedDepartment === department && styles.filterButtonActive
              ]}
              onPress={() => setSelectedDepartment(department)}
            >
              <Text style={[
                styles.filterText,
                selectedDepartment === department && styles.filterTextActive
              ]}>
                {department === 'all' ? 'Tất cả' : department}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Staff List */}
      <FlatList
        data={filteredStaff}
        renderItem={renderStaffItem}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>Không tìm thấy nhân viên nào</Text>
          </View>
        }
      />

      {/* Staff Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedStaff && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Chi tiết nhân viên</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons name="close" size={24} color="#333" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.modalBody}>
                  <Text style={styles.detailLabel}>Họ tên:</Text>
                  <Text style={styles.detailValue}>{selectedStaff.fullName}</Text>
                  
                  <Text style={styles.detailLabel}>Email:</Text>
                  <Text style={styles.detailValue}>{selectedStaff.email}</Text>
                  
                  <Text style={styles.detailLabel}>Số điện thoại:</Text>
                  <Text style={styles.detailValue}>{selectedStaff.phoneNumber}</Text>
                  
                  <Text style={styles.detailLabel}>Chuyên môn:</Text>
                  <Text style={styles.detailValue}>{selectedStaff.specialization}</Text>
                  
                  <Text style={styles.detailLabel}>Phòng ban:</Text>
                  <Text style={styles.detailValue}>{selectedStaff.department}</Text>
                  
                  <Text style={styles.detailLabel}>Trạng thái:</Text>
                  <Text style={[styles.detailValue, { color: getStatusColor(selectedStaff.status) }]}>
                    {getStatusText(selectedStaff.status)}
                  </Text>
                  
                  <Text style={styles.detailLabel}>Số nhiệm vụ hoàn thành:</Text>
                  <Text style={styles.detailValue}>{selectedStaff.completedTasks}</Text>
                  
                  <Text style={styles.detailLabel}>Đánh giá trung bình:</Text>
                  <Text style={[styles.detailValue, { color: getRatingColor(selectedStaff.averageRating) }]}>
                    {selectedStaff.averageRating}/5.0 ⭐
                  </Text>
                  
                  <Text style={styles.detailLabel}>Ngày tham gia:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(selectedStaff.joinDate).toLocaleDateString('vi-VN')}
                  </Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#007AFF20',
  },
  addText: {
    color: '#007AFF',
    fontWeight: '500',
    marginLeft: 4,
  },
  searchSection: {
    padding: 20,
    backgroundColor: '#fff',
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
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  filterLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
    fontWeight: '500',
    minWidth: 70,
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    marginRight: 8,
    marginBottom: 8,
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
  },
  listContainer: {
    padding: 20,
  },
  staffCard: {
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
  staffHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  staffEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  staffSpecialization: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  staffBadges: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  departmentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#8E8E9320',
  },
  departmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
  },
  staffStats: {
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
  },
  staffActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 2,
    justifyContent: 'center',
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