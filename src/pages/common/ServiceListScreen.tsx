import React, { useLayoutEffect } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  View,
} from 'react-native';
import { ServiceListItem } from '../../shared/api/adminGraphqlService';
import { useServiceList } from '../../features/common/service-list/model/useServiceList';
import { ServiceListScreenProps } from './service-list/types';
import { styles } from './service-list/styles';
import { ServiceListHeader } from './service-list/ui/ServiceListHeader';
import { ServiceCard } from './service-list/ui/ServiceCard';
import { ServiceListEmptyState } from './service-list/ui/ServiceListEmptyState';

export const ServiceListScreen: React.FC<ServiceListScreenProps> = ({ navigation, route }) => {
  const { category, categoryId } = route.params;
  const {
    services,
    loading,
    refreshing,
    onRefresh,
  } = useServiceList({
    category,
    categoryId,
  });

  // Update navigation header title
  useLayoutEffect(() => {
    navigation.setOptions({
      title: category || 'Services',
    });
  }, [category, navigation]);

  const renderServiceItem = ({ item }: { item: ServiceListItem }) => (
    <ServiceCard
      item={item}
      onPress={service => navigation.navigate('ServiceDetail', { service })}
    />
  );

  return (
    <View style={styles.container}>
      <ServiceListHeader title={category} onBack={() => navigation.goBack()} />

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066CC" />
        </View>
      ) : (
        <FlatList
          data={services}
          renderItem={renderServiceItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0066CC" />
          }
          ListEmptyComponent={<ServiceListEmptyState />}
        />
      )}
    </View>
  );
};

