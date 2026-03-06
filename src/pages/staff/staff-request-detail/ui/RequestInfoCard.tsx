import React from 'react';
import { Text, View } from 'react-native';
import { ServiceRequestDetail } from '../../../../shared/api/staffGraphqlService';
import {
  COMPLEXITY_LABEL,
  formatRequestDateTime,
} from '../../../../features/staff/request-detail/model/constants';
import { styles } from '../styles';
import { InfoRow } from './InfoRow';

interface RequestInfoCardProps {
  request: ServiceRequestDetail;
}

export const RequestInfoCard: React.FC<RequestInfoCardProps> = ({ request }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Thông tin yêu cầu</Text>
      <InfoRow icon="document-text-outline" label="ID" value={request.id.slice(0, 8) + '...'} />
      <InfoRow icon="time-outline" label="Thời gian" value={formatRequestDateTime(request.createdAt)} />
      <InfoRow
        icon="layers-outline"
        label="Độ phức tạp"
        value={COMPLEXITY_LABEL[request.complexity?.level] ?? `Level ${request.complexity?.level}`}
      />
      {request.addressText ? (
        <InfoRow icon="location-outline" label="Địa chỉ" value={request.addressText} />
      ) : null}
      {request.description ? (
        <View style={styles.descriptionBox}>
          <Text style={styles.fieldLabel}>Mô tả:</Text>
          <Text style={styles.descriptionText}>{request.description}</Text>
        </View>
      ) : null}
    </View>
  );
};
