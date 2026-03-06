import React from 'react';
import { Text, View } from 'react-native';
import { ServiceRequestDetail } from '../../../../shared/api/userService';
import { styles } from '../styles';
import { InfoRow } from './InfoRow';

interface AiSummaryCardProps {
  request: ServiceRequestDetail;
  complexityLevel: number;
  complexityLabel: string;
}

export const AiSummaryCard: React.FC<AiSummaryCardProps> = ({
  request,
  complexityLevel,
  complexityLabel,
}) => {
  if (complexityLevel <= 0 && !request.estimatedCost) {
    return null;
  }

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Kết quả AI</Text>
      {complexityLevel > 0 ? (
        <InfoRow icon="analytics-outline" label="Độ phức tạp" value={complexityLabel} />
      ) : null}
      {request.estimatedCost ? (
        <View style={styles.priceBox}>
          <Text style={styles.priceLabel}>Chi phí ước tính</Text>
          <Text style={styles.priceValue}>
            {request.estimatedCost.amount.toLocaleString('vi-VN')} {request.estimatedCost.currency}
          </Text>
        </View>
      ) : null}
    </View>
  );
};
