import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { ServiceRequestSummary } from '../../../../shared/api/staffGraphqlService';
import {
  RE_EVALUATION_COMPLEXITY_LABEL,
  RE_EVALUATION_STATUS_TAG,
  formatReEvaluationDate,
} from '../../../../features/staff/re-evaluations/model/constants';
import { styles } from '../styles';

interface ReEvaluationCardProps {
  request: ServiceRequestSummary;
  isAnalyzing: boolean;
  onOpenDetail: (requestId: string) => void;
  onAnalyze: (request: ServiceRequestSummary) => void;
}

export const ReEvaluationCard: React.FC<ReEvaluationCardProps> = ({
  request,
  isAnalyzing,
  onOpenDetail,
  onAnalyze,
}) => {
  const tag = RE_EVALUATION_STATUS_TAG[request.status] ?? { label: request.status, color: '#607D8B' };

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={[styles.statusTag, { backgroundColor: tag.color }]}>
          <Text style={styles.statusTagText}>{tag.label}</Text>
        </View>
        <Text style={styles.cardDate}>{formatReEvaluationDate(request.createdAt)}</Text>
      </View>
      <Text style={styles.cardDesc} numberOfLines={3}>
        {request.description ?? '(Không có mô tả)'}
      </Text>
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons name="layers-outline" size={13} color="#607D8B" />
          <Text style={styles.metaText}>
            {RE_EVALUATION_COMPLEXITY_LABEL[request.complexity?.level] ?? `Level ${request.complexity?.level ?? '?'}`}
          </Text>
        </View>
        {request.addressText ? (
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={13} color="#607D8B" />
            <Text style={styles.metaText} numberOfLines={1}>{request.addressText}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.detailBtn}
          onPress={() => onOpenDetail(request.id)}
        >
          <Ionicons name="eye-outline" size={15} color="#1976D2" />
          <Text style={styles.detailBtnText}>Chi tiết</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.analyzeBtn, isAnalyzing && { opacity: 0.7 }]}
          onPress={() => onAnalyze(request)}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="analytics-outline" size={15} color="#fff" />
          )}
          <Text style={styles.analyzeBtnText}>
            {isAnalyzing ? 'Đang phân tích...' : 'Phân tích AI'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
