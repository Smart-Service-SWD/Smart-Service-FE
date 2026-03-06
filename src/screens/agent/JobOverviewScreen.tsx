import { useRoute } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { staffGraphqlService } from '../../services/staffGraphqlService';

const JobOverviewScreen = () => {
  const route = useRoute<any>();
  const passedJob = route.params?.job;
  const jobId = route.params?.jobId || passedJob?.serviceRequestId || passedJob?.id;

  const [job, setJob] = useState<any>(passedJob?.requestDetail ?? null);
  const [loading, setLoading] = useState(!passedJob?.requestDetail);

  const fetchJobData = useCallback(async () => {
    if (!jobId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await staffGraphqlService.getRequestDetail(jobId);
      setJob(data);
    } catch (err: any) {
      Alert.alert('Lỗi', err?.message ?? 'Không tải được chi tiết yêu cầu');
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    if (!job) {
      fetchJobData();
    }
  }, [fetchJobData, job]);

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

      <Text style={styles.label}>Mô tả</Text>
      <Text style={styles.value}>{job.description || 'N/A'}</Text>

      <Text style={styles.label}>Địa chỉ</Text>
      <Text style={styles.value}>{job.addressText || 'N/A'}</Text>

      <Text style={styles.label}>Trạng thái</Text>
      <Text style={styles.value}>{job.status || 'N/A'}</Text>

      <Text style={styles.label}>Độ phức tạp</Text>
      <Text style={styles.value}>{job.complexity?.level ?? 'N/A'}</Text>

      <Text style={styles.label}>Chi phí ước tính</Text>
      <Text style={styles.value}>
        {job.estimatedCost
          ? `${job.estimatedCost.amount} ${job.estimatedCost.currency}`
          : 'Chưa có'}
      </Text>
    </ScrollView>
  );
};

export default JobOverviewScreen;

const styles = StyleSheet.create({
  container: { padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  label: { fontWeight: 'bold', marginTop: 10 },
  value: { marginTop: 4, fontSize: 16 },
});
