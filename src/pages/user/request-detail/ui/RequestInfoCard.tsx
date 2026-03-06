import React from 'react';
import { Text, View } from 'react-native';
import { ServiceRequestDetail } from '../../../../shared/api/userService';
import { styles } from '../styles';
import { InfoRow } from './InfoRow';

interface RequestInfoCardProps {
  request: ServiceRequestDetail;
}

export const RequestInfoCard: React.FC<RequestInfoCardProps> = ({ request }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Thông tin yêu cầu</Text>
      <InfoRow icon="document-text-outline" label="Mô tả" value={request.description ?? '—'} />
      {request.addressText ? (
        <InfoRow icon="location-outline" label="Địa chỉ" value={request.addressText} />
      ) : null}
      <InfoRow
        icon="calendar-outline"
        label="Ngày tạo"
        value={new Date(request.createdAt).toLocaleDateString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
      />
    </View>
  );
};
