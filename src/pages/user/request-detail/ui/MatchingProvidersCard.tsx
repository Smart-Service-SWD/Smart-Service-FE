import React from 'react';
import { Text, View } from 'react-native';
import { ServiceRequestDetail } from '../../../../shared/api/userService';
import { styles } from '../styles';

interface MatchingProvidersCardProps {
  matchingResults: ServiceRequestDetail['matchingResults'];
}

export const MatchingProvidersCard: React.FC<MatchingProvidersCardProps> = ({
  matchingResults,
}) => {
  if (!matchingResults?.length) {
    return null;
  }

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Nhà cung cấp được đề xuất</Text>
      {matchingResults.map((match, index) => (
        <View key={match.id} style={styles.matchItem}>
          <View style={[styles.matchRank, { backgroundColor: index === 0 ? '#FEF3C7' : '#F3F4F6' }]}>
            <Text style={[styles.matchRankText, { color: index === 0 ? '#92400E' : '#6B7280' }]}>
              #{index + 1}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.matchScore}>
              Điểm khớp: {(match.matchingScore * 100).toFixed(0)}%
            </Text>
            {match.isRecommended ? (
              <Text style={styles.matchRecommended}>★ Được khuyến nghị</Text>
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );
};
