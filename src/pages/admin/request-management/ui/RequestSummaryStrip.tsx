import React from 'react';
import { View } from 'react-native';
import { ServiceRequest } from '../../../../shared/api/adminGraphqlService';
import { styles } from '../styles';
import { SummaryTile } from './SummaryTile';

interface RequestSummaryStripProps {
  requests: ServiceRequest[];
}

export const RequestSummaryStrip: React.FC<RequestSummaryStripProps> = ({ requests }) => {
  return (
    <View style={styles.summaryStrip}>
      <SummaryTile
        label="Đang phân tích"
        count={requests.filter(request => request.status === 'AWAITING_ANALYSIS').length}
        color="#FF9500"
      />
      <SummaryTile
        label="Chờ duyệt"
        count={requests.filter(request => request.status === 'PENDING_REVIEW').length}
        color="#007AFF"
      />
      <SummaryTile
        label="Đang xử lý"
        count={requests.filter(request => request.status === 'IN_PROGRESS').length}
        color="#FF6B00"
      />
      <SummaryTile
        label="Hoàn thành"
        count={requests.filter(request => request.status === 'COMPLETED').length}
        color="#34C759"
      />
    </View>
  );
};
