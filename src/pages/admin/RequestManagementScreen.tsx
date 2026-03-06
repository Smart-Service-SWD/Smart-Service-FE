import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ServiceRequest } from '../../shared/api/adminGraphqlService';
import {
  RequestTabType,
} from '../../features/admin/request-management/model/constants';
import { useRequestManagement } from '../../features/admin/request-management/model/useRequestManagement';
import { styles } from './request-management/styles';
import { RequestSummaryStrip } from './request-management/ui/RequestSummaryStrip';
import { RequestTabs } from './request-management/ui/RequestTabs';
import { RequestCard } from './request-management/ui/RequestCard';

export const RequestManagementScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const initialTab: RequestTabType = (route.params as any)?.tab ?? 'pending';

  const {
    activeTab,
    requests,
    userMap,
    catMap,
    agentMap,
    loading,
    refreshing,
    pendingList,
    completedList,
    filteredList,
    setActiveTab,
    onRefresh,
  } = useRequestManagement({ initialTab });

  const renderItem = ({ item }: { item: ServiceRequest }) => (
    <RequestCard item={item} userMap={userMap} catMap={catMap} agentMap={agentMap} />
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Quản lý yêu cầu</Text>
          {!loading && (
            <Text style={styles.headerSub}>{requests.length} yêu cầu tổng cộng</Text>
          )}
        </View>
        <View style={{ width: 40 }} />
      </View>

      {!loading && <RequestSummaryStrip requests={requests} />}

      <RequestTabs
        activeTab={activeTab}
        pendingCount={pendingList.length}
        completedCount={completedList.length}
        onChangeTab={setActiveTab}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Đang tải yêu cầu...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredList}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />
          }
          contentContainerStyle={[
            styles.listContainer,
            filteredList.length === 0 && styles.emptyList,
          ]}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons
                name={activeTab === 'pending' ? 'time-outline' : 'checkmark-circle-outline'}
                size={56}
                color="#E0E0E0"
              />
              <Text style={styles.emptyText}>
                {activeTab === 'pending'
                  ? 'Không có yêu cầu nào đang chờ'
                  : 'Không có yêu cầu nào đã hoàn thành'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

