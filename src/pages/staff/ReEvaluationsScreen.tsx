import React from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useReEvaluations } from '../../features/staff/re-evaluations/model/useReEvaluations';
import { styles } from './re-evaluations/styles';
import { ReEvaluationCard } from './re-evaluations/ui/ReEvaluationCard';

export const ReEvaluationsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const {
    user,
    loading,
    refreshing,
    requests,
    error,
    analyzingId,
    load,
    onRefresh,
    triggerAnalysis,
  } = useReEvaluations();

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1976D2" />
        <Text style={styles.loadingText}>Đang tải yêu cầu mới...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <LinearGradient colors={['#1976D2', '#63a4ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <View>
          <Text style={styles.greeting}>Xin chào, {user?.fullName}!</Text>
          <Text style={styles.role}>Yêu cầu cần phân tích</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{requests.length}</Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={20} color="#F44336" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={load}>
              <Text style={styles.retryText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        )}

        {!error && requests.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle-outline" size={72} color="#BBDEFB" />
            <Text style={styles.emptyTitle}>Không có yêu cầu mới</Text>
            <Text style={styles.emptySubtext}>Tất cả yêu cầu đã được xử lý</Text>
          </View>
        )}

        {requests.map(request => (
          <ReEvaluationCard
            key={request.id}
            request={request}
            isAnalyzing={analyzingId === request.id}
            onOpenDetail={requestId => navigation.navigate('StaffRequestDetail', { requestId })}
            onAnalyze={triggerAnalysis}
          />
        ))}
      </View>
    </ScrollView>
  );
};
