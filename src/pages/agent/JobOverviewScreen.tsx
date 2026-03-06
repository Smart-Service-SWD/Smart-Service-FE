import { useRoute } from '@react-navigation/native';
import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useAgentJobRequestDetail } from '../../features/agent/job/model/useAgentJobRequestDetail';
import { resolveAgentJobRouteParams } from '../../features/agent/job/model/useAgentJobRoute';
import { styles } from './job-overview/styles';
import { OverviewField } from './job-overview/ui/OverviewField';

const JobOverviewScreen = () => {
  const route = useRoute<any>();
  const { passedJob, jobId } = resolveAgentJobRouteParams(route.params);

  const {
    requestDetail: job,
    loading,
  } = useAgentJobRequestDetail({
    passedJob,
    jobId,
  });

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!job) {
    return (
      <View style={styles.center}>
        <Text>Không có dữ liệu công việc</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Tổng quan công việc</Text>

      <OverviewField label="Mô tả" value={job.description || 'N/A'} />
      <OverviewField label="Địa chỉ" value={job.addressText || 'N/A'} />
      <OverviewField label="Trạng thái" value={job.status || 'N/A'} />
      <OverviewField label="Độ phức tạp" value={String(job.complexity?.level ?? 'N/A')} />
      <OverviewField
        label="Chi phí ước tính"
        value={job.estimatedCost
          ? `${job.estimatedCost.amount} ${job.estimatedCost.currency}`
          : 'Chưa có'}
      />
    </ScrollView>
  );
};

export default JobOverviewScreen;

