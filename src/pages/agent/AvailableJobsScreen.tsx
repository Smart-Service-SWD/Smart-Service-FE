import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { AssignmentWithRequest } from '../../shared/api/agentGraphqlService';
import { useAvailableJobs } from '../../features/agent/assignments/model/useAvailableJobs';
import { styles } from './available-jobs/styles';
import { AvailableJobCard } from './available-jobs/ui/AvailableJobCard';

export const AvailableJobsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const {
    assignments,
    loading,
    refreshing,
    onRefresh,
  } = useAvailableJobs();

  const renderJobItem = ({ item }: { item: AssignmentWithRequest }) => (
    <AvailableJobCard
      item={item}
      onPress={assignment => navigation.navigate('JobTabs', { job: assignment })}
    />
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Assignment của tôi</Text>
      </View>

      <FlatList
        data={assignments}
        renderItem={renderJobItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={assignments.length === 0 ? styles.emptyList : styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>Chưa có assignment nào được giao.</Text>
          </View>
        }
      />
    </View>
  );
};
