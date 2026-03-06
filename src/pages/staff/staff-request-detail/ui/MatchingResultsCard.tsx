import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  MatchingResult,
  ServiceAgent,
} from '../../../../shared/api/staffGraphqlService';
import { styles } from '../styles';

interface MatchingResultsCardProps {
  sortedMatches: MatchingResult[];
  agents: ServiceAgent[];
  selectedAgentId: string;
  isPendingReview: boolean;
  onSelectMatch: (match: MatchingResult) => void;
}

export const MatchingResultsCard: React.FC<MatchingResultsCardProps> = ({
  sortedMatches,
  agents,
  selectedAgentId,
  isPendingReview,
  onSelectMatch,
}) => {
  if (sortedMatches.length === 0) {
    return null;
  }

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>
        Kết quả so khớp AI ({sortedMatches.length})
      </Text>
      {sortedMatches.map((match, index) => {
        const agent = agents.find(item => item.id === match.serviceAgentId);
        const isSelected = selectedAgentId === match.serviceAgentId;

        return (
          <TouchableOpacity
            key={match.id}
            style={[
              styles.matchCard,
              isSelected && styles.matchCardSelected,
              match.isRecommended && styles.matchCardRecommended,
            ]}
            onPress={() => {
              if (isPendingReview) {
                onSelectMatch(match);
              }
            }}
            activeOpacity={0.8}
          >
            <View style={styles.matchHeader}>
              <View style={styles.matchRank}>
                <Text style={styles.matchRankText}>#{index + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.agentName}>
                  {agent?.fullName ?? `Agent ${match.serviceAgentId.slice(0, 8)}`}
                </Text>
                {match.isRecommended && (
                  <View style={styles.recommendedTag}>
                    <Ionicons name="star" size={12} color="#FF9800" />
                    <Text style={styles.recommendedText}>Được khuyến nghị</Text>
                  </View>
                )}
              </View>
              <View style={styles.scoreCircle}>
                <Text style={styles.scoreText}>
                  {(match.matchingScore * 100).toFixed(0)}%
                </Text>
              </View>
            </View>
            <View style={styles.scoreBar}>
              <View
                style={[
                  styles.scoreBarFill,
                  {
                    width: `${Math.min(match.matchingScore * 100, 100)}%` as any,
                    backgroundColor: match.isRecommended ? '#4CAF50' : '#1976D2',
                  },
                ]}
              />
            </View>
            {isPendingReview && (
              <TouchableOpacity
                style={[
                  styles.selectAgentBtn,
                  isSelected && styles.selectAgentBtnActive,
                ]}
                onPress={() => onSelectMatch(match)}
              >
                <Ionicons
                  name={isSelected ? 'checkmark-circle' : 'radio-button-off'}
                  size={18}
                  color={isSelected ? '#fff' : '#1976D2'}
                />
                <Text style={[styles.selectAgentText, isSelected && { color: '#fff' }]}>
                  {isSelected ? 'Đã chọn' : 'Chọn'}
                </Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};
