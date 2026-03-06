import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { COMPLEXITY_LABEL, formatDateTime } from '../../../features/staff/pending-evaluations/model/constants';
import { usePendingEvaluations } from '../../../features/staff/pending-evaluations/model/usePendingEvaluations';
import { ServiceRequestSummary } from '../../../shared/api/staffGraphqlService';
import { styles } from './styles';

const RequestCard: React.FC<{ request: ServiceRequestSummary; onPress: () => void }> = ({ request, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
    <View style={styles.cardTop}>
      <View style={styles.aiTag}>
        <Ionicons name="analytics" size={13} color="#fff" />
        <Text style={styles.aiTagText}>AI da phan tich</Text>
      </View>
      <Text style={styles.cardDate}>{formatDateTime(request.createdAt)}</Text>
    </View>
    <Text style={styles.cardDesc} numberOfLines={2}>{request.description ?? '(Không có mô tả)'}</Text>
    <View style={styles.metaRow}>
      <View style={styles.metaItem}>
        <Ionicons name="layers-outline" size={13} color="#607D8B" />
        <Text style={styles.metaText}>
          {COMPLEXITY_LABEL[request.complexity?.level] ?? `Level ${request.complexity?.level ?? '?'}`}
        </Text>
      </View>
      {request.addressText ? (
        <View style={styles.metaItem}>
          <Ionicons name="location-outline" size={13} color="#607D8B" />
          <Text style={styles.metaText} numberOfLines={1}>{request.addressText}</Text>
        </View>
      ) : null}
    </View>
    <View style={styles.cardFooter}>
      <Text style={styles.idText}>#{request.id.slice(0, 8).toUpperCase()}</Text>
      <View style={styles.reviewBtn}>
        <Text style={styles.reviewBtnText}>Xem {"&"} Duyet</Text>
        <Ionicons name="chevron-forward" size={15} color="#1976D2" />
      </View>
    </View>
  </TouchableOpacity>
);

export const PendingEvaluationsPage: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user, loading, refreshing, requests, error, load, onRefresh } = usePendingEvaluations();

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1976D2" />
        <Text style={styles.loadingText}>Đang tải yêu cầu chờ duyệt...</Text>
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
          <Text style={styles.role}>Xác nhận đánh giá AI</Text>
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
            <Ionicons name="checkmark-circle-outline" size={72} color="#c8e6c9" />
            <Text style={styles.emptyTitle}>Không có yêu cầu chờ duyệt</Text>
            <Text style={styles.emptySubtext}>Tất cả yêu cầu đã được xử lý</Text>
          </View>
        )}
        {requests.map(req => (
          <RequestCard
            key={req.id}
            request={req}
            onPress={() => navigation.navigate('StaffRequestDetail', { requestId: req.id })}
          />
        ))}
      </View>
    </ScrollView>
  );
};
