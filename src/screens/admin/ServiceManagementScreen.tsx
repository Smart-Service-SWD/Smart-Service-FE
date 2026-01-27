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
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  duration: number; // in minutes
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  bookingCount: number;
}

export const ServiceManagementScreen: React.FC = () => {
  const [services, setServices] = useState<Service[]>([
    {
      id: '1',
      name: 'Sửa chữa điện tử',
      description: 'Dịch vụ sửa chữa các thiết bị điện tử như điện thoại, máy tính bảng...',
      category: 'Electronics',
      price: 150000,
      duration: 60,
      isActive: true,
      createdAt: '2024-01-15',
      updatedAt: '2024-01-20',
      bookingCount: 45,
    },
    {
      id: '2',
      name: 'Sửa chữa ô tô',
      description: 'Dịch vụ bảo dưỡng và sửa chữa xe ô tô',
      category: 'Automotive',
      price: 500000,
      duration: 120,
      isActive: true,
      createdAt: '2024-01-10',
      updatedAt: '2024-01-18',
      bookingCount: 32,
    },
    {
      id: '3',
      name: 'Sửa chữa xe máy',
      description: 'Dịch vụ sửa chữa và bảo dưỡng xe máy',
      category: 'Automotive',
      price: 100000,
      duration: 45,
      isActive: false,
      createdAt: '2024-01-12',
      updatedAt: '2024-01-22',
      bookingCount: 18,
    },
  ]);
  
  const [filteredServices, setFilteredServices] = useState<Service[]>(services);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isAddMode, setIsAddMode] = useState(false);

  const categories = ['all', 'Electronics', 'Automotive', 'Home', 'Beauty', 'Other'];

  useEffect(() => {
    filterServices();
  }, [services, searchQuery, selectedCategory]);

  const filterServices = () => {
    let filtered = services;

    if (searchQuery.trim()) {
      filtered = filtered.filter(service =>
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(service => service.category === selectedCategory);
    }

    setFilteredServices(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} phút`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours} giờ`;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Electronics': return '#007AFF';
      case 'Automotive': return '#FF9500';
      case 'Home': return '#34C759';
      case 'Beauty': return '#FF69B4';
      default: return '#8E8E93';
    }
  };

  const handleServiceToggle = (service: Service) => {
    setServices(prev => prev.map(s => 
      s.id === service.id 
        ? { ...s, isActive: !s.isActive, updatedAt: new Date().toISOString().split('T')[0] }
        : s
    ));
  };

  const handleDeleteService = (service: Service) => {
    Alert.alert(
      'Xác nhận xóa',
      `Bạn có chắc chắn muốn xóa dịch vụ "${service.name}"? Hành động này không thể hoàn tác.`,
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            setServices(prev => prev.filter(s => s.id !== service.id));
          }
        },
      ]
    );
  };

  const handleAddNewService = () => {
    setSelectedService({
      id: '',
      name: '',
      description: '',
      category: 'Electronics',
      price: 0,
      duration: 60,
      isActive: true,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      bookingCount: 0,
    });
    setIsAddMode(true);
    setModalVisible(true);
  };

  const renderServiceItem = ({ item }: { item: Service }) => (
    <TouchableOpacity 
      style={[styles.serviceCard, !item.isActive && styles.serviceCardInactive]}
      onPress={() => {
        setSelectedService(item);
        setIsAddMode(false);
        setModalVisible(true);
      }}
    >
      <View style={styles.serviceHeader}>
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceName}>{item.name}</Text>
          <Text style={styles.serviceDescription} numberOfLines={2}>
            {item.description}
          </Text>
        </View>
        <View style={styles.serviceStatus}>
          <Switch
            value={item.isActive}
            onValueChange={() => handleServiceToggle(item)}
            trackColor={{ false: "#767577", true: "#007AFF" }}
            thumbColor={item.isActive ? "#ffffff" : "#f4f3f4"}
          />
        </View>
      </View>

      <View style={styles.serviceDetails}>
        <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.category) + '20' }]}>
          <Text style={[styles.categoryText, { color: getCategoryColor(item.category) }]}>
            {item.category}
          </Text>
        </View>
        
        <Text style={styles.servicePrice}>{formatCurrency(item.price)}</Text>
        <Text style={styles.serviceDuration}>{formatDuration(item.duration)}</Text>
      </View>

      <View style={styles.serviceStats}>
        <View style={styles.statItem}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={styles.statText}>{item.bookingCount} lượt đặt</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="time-outline" size={16} color="#666" />
          <Text style={styles.statText}>
            Cập nhật: {new Date(item.updatedAt).toLocaleDateString('vi-VN')}
          </Text>
        </View>
      </View>

      <View style={styles.serviceActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#007AFF20' }]}
          onPress={() => {
            setSelectedService(item);
            setIsAddMode(false);
            setModalVisible(true);
          }}
        >
          <Ionicons name="pencil" size={16} color="#007AFF" />
          <Text style={[styles.actionText, { color: '#007AFF' }]}>Sửa</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#FF3B3020' }]}
          onPress={() => handleDeleteService(item)}
        >
          <Ionicons name="trash" size={16} color="#FF3B30" />
          <Text style={[styles.actionText, { color: '#FF3B30' }]}>Xóa</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Quản lý dịch vụ</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleAddNewService}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search and Filter */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm dịch vụ..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        <View style={styles.filterRow}>
          {categories.map(category => (
            <TouchableOpacity
              key={category}
              style={[
                styles.filterButton,
                selectedCategory === category && styles.filterButtonActive
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[
                styles.filterText,
                selectedCategory === category && styles.filterTextActive
              ]}>
                {category === 'all' ? 'Tất cả' : category}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Services List */}
      <FlatList
        data={filteredServices}
        renderItem={renderServiceItem}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="construct-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>Không tìm thấy dịch vụ nào</Text>
          </View>
        }
      />

      {/* Service Detail/Edit Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedService && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {isAddMode ? 'Thêm dịch vụ mới' : 'Chi tiết dịch vụ'}
                  </Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons name="close" size={24} color="#333" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.modalBody}>
                  <Text style={styles.detailLabel}>Tên dịch vụ:</Text>
                  <Text style={styles.detailValue}>{selectedService.name}</Text>
                  
                  <Text style={styles.detailLabel}>Mô tả:</Text>
                  <Text style={styles.detailValue}>{selectedService.description}</Text>
                  
                  <Text style={styles.detailLabel}>Danh mục:</Text>
                  <Text style={styles.detailValue}>{selectedService.category}</Text>
                  
                  <Text style={styles.detailLabel}>Giá:</Text>
                  <Text style={styles.detailValue}>{formatCurrency(selectedService.price)}</Text>
                  
                  <Text style={styles.detailLabel}>Thời gian:</Text>
                  <Text style={styles.detailValue}>{formatDuration(selectedService.duration)}</Text>
                  
                  <Text style={styles.detailLabel}>Trạng thái:</Text>
                  <Text style={[styles.detailValue, { color: selectedService.isActive ? '#34C759' : '#FF3B30' }]}>
                    {selectedService.isActive ? 'Đang hoạt động' : 'Tạm dừng'}
                  </Text>
                  
                  {!isAddMode && (
                    <>
                      <Text style={styles.detailLabel}>Số lượt đặt:</Text>
                      <Text style={styles.detailValue}>{selectedService.bookingCount}</Text>
                      
                      <Text style={styles.detailLabel}>Ngày tạo:</Text>
                      <Text style={styles.detailValue}>
                        {new Date(selectedService.createdAt).toLocaleDateString('vi-VN')}
                      </Text>
                      
                      <Text style={styles.detailLabel}>Cập nhật cuối:</Text>
                      <Text style={styles.detailValue}>
                        {new Date(selectedService.updatedAt).toLocaleDateString('vi-VN')}
                      </Text>
                    </>
                  )}
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.modalButtonSecondary]}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.modalButtonText}>Đóng</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.modalButtonPrimary]}
                    onPress={() => {
                      Alert.alert('Thông báo', 'Chức năng chỉnh sửa đang được phát triển');
                    }}
                  >
                    <Text style={[styles.modalButtonText, { color: '#fff' }]}>
                      {isAddMode ? 'Thêm' : 'Sửa'}
                    </Text>
                  </TouchableOpacity>
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
    backgroundColor: '#007AFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
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
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
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
  serviceCard: {
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
  serviceCardInactive: {
    opacity: 0.6,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  serviceInfo: {
    flex: 1,
    marginRight: 12,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  serviceStatus: {
    alignItems: 'center',
  },
  serviceDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  servicePrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  serviceDuration: {
    fontSize: 14,
    color: '#666',
  },
  serviceStats: {
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
  serviceActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionText: {
    fontSize: 14,
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
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonSecondary: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  modalButtonPrimary: {
    backgroundColor: '#007AFF',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
});