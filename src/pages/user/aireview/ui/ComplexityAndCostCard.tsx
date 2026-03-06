import React from 'react';
import { Text, View } from 'react-native';
import { styles } from '../styles';

interface ComplexityAndCostCardProps {
  complexityLevel: number;
  complexityLabel: string;
  badgeColor: string;
  estimatedAmount?: number;
  currency: string;
}

export const ComplexityAndCostCard: React.FC<ComplexityAndCostCardProps> = ({
  complexityLevel,
  complexityLabel,
  badgeColor,
  estimatedAmount,
  currency,
}) => {
  return (
    <>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Độ phức tạp</Text>
        <View style={styles.complexityRow}>
          {[1, 2, 3, 4, 5].map(level => (
            <View
              key={level}
              style={[
                styles.complexityDot,
                { backgroundColor: level <= complexityLevel ? badgeColor : '#E5E7EB' },
              ]}
            />
          ))}
          <View style={[styles.complexityBadge, { backgroundColor: badgeColor + '20' }]}>
            <Text style={[styles.complexityLabel, { color: badgeColor }]}>{complexityLabel}</Text>
          </View>
        </View>
      </View>

      {estimatedAmount !== undefined ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Chi phí ước tính</Text>
          <Text style={styles.priceText}>
            {estimatedAmount.toLocaleString('vi-VN')}{' '}
            <Text style={styles.currency}>{currency}</Text>
          </Text>
          <Text style={styles.priceNote}>
            * Đây là mức giá ước tính. Giá cuối cùng sẽ được xác nhận sau khi nhân viên xem xét.
          </Text>
        </View>
      ) : null}
    </>
  );
};
