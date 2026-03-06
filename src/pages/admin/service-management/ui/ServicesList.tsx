import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { Service } from '../../../../features/admin/service-management/model/types';
import { styles } from '../styles';
import { ServiceCard } from './ServiceCard';

interface ServicesListProps {
  services: Service[];
  loading: boolean;
  refreshing: boolean;
  searchQuery: string;
  onRefresh: () => void;
  formatCurrency: (value: number) => string;
  formatDuration: (value: number) => string;
  onEdit: (service: Service) => void;
  onDelete: (service: Service) => void;
}

export const ServicesList: React.FC<ServicesListProps> = ({
  services,
  loading,
  refreshing,
  searchQuery,
  onRefresh,
  formatCurrency,
  formatDuration,
  onEdit,
  onDelete,
}) => {
  return (
    <FlatList
      data={services}
      renderItem={({ item }) => (
        <ServiceCard
          item={item}
          formatCurrency={formatCurrency}
          formatDuration={formatDuration}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )}
      keyExtractor={item => item.id}
      showsVerticalScrollIndicator={false}
      removeClippedSubviews
      maxToRenderPerBatch={8}
      windowSize={5}
      initialNumToRender={8}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />}
      contentContainerStyle={[styles.listContainer, services.length === 0 && styles.emptyList]}
      ListEmptyComponent={(
        <View style={styles.emptyContainer}>
          {loading ? (
            <ActivityIndicator size="large" color="#007AFF" />
          ) : (
            <>
              <Ionicons name="construct-outline" size={48} color="#ddd" />
              <Text style={styles.emptyText}>
                {searchQuery ? 'Không tìm thấy kết quả' : 'Chưa có dịch vụ nào'}
              </Text>
            </>
          )}
        </View>
      )}
    />
  );
};
