import { useNavigation, useRoute } from '@react-navigation/native';
import React from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAgentJobRequestDetail } from '../../features/agent/job/model/useAgentJobRequestDetail';
import { resolveAgentJobRouteParams } from '../../features/agent/job/model/useAgentJobRoute';
import { styles } from './job-details/styles';
import { JobDetailsHeader } from './job-details/ui/JobDetailsHeader';
import { AttachmentsCard } from './job-details/ui/AttachmentsCard';
import { JobDetailErrorState } from './job-details/ui/JobDetailErrorState';

export const JobDetailsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { passedJob, jobId } = resolveAgentJobRouteParams(route.params);

  const {
    requestDetail,
    loading,
    error,
    fetchJobData,
  } = useAgentJobRequestDetail({
    passedJob,
    jobId,
  });

  if (loading) {
    return (
      <View style={[styles.container, styles.fullCenter]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error || !requestDetail) {
    return <JobDetailErrorState errorMessage={error || 'Không có dữ liệu'} onRetry={fetchJobData} />;
  }

  return (
    <View style={styles.container}>
      <JobDetailsHeader onBack={() => navigation.goBack()} />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Mô tả chi tiết</Text>
          <Text style={styles.detailText}>{requestDetail.description || 'Không có mô tả'}</Text>
        </View>

        <AttachmentsCard attachments={requestDetail.attachments || []} />
      </ScrollView>

      <TouchableOpacity
        style={styles.acceptButton}
        onPress={() => Alert.alert('Thông báo', 'Flow nhận/từ chối assignment sẽ được bổ sung theo API command mới.')}
      >
        <Text style={styles.acceptButtonText}>NHẬN VIỆC</Text>
      </TouchableOpacity>
    </View>
  );
};

export default JobDetailsScreen;

