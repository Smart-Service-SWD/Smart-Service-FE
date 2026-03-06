import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';
import { STATUS_LABEL } from '../../../../shared/api/userService';
import { REQUEST_DETAIL_STEP_ORDER } from '../../../../features/user/request-detail/model/constants';
import { styles } from '../styles';

interface RequestStatusAndProgressCardProps {
  statusColor: string;
  statusLabel: string;
  currentStep: number;
  isCancelled: boolean;
}

export const RequestStatusAndProgressCard: React.FC<RequestStatusAndProgressCardProps> = ({
  statusColor,
  statusLabel,
  currentStep,
  isCancelled,
}) => {
  return (
    <>
      <View style={styles.statusBadgeRow}>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20', borderColor: statusColor }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
        {isCancelled ? (
          <View style={styles.cancelledNote}>
            <Ionicons name="information-circle-outline" size={16} color="#EF4444" />
            <Text style={styles.cancelledText}>Yêu cầu đã bị hủy</Text>
          </View>
        ) : null}
      </View>

      {!isCancelled ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tiến trình</Text>
          {REQUEST_DETAIL_STEP_ORDER.map((step, index) => {
            const done = index < currentStep;
            const active = index === currentStep;
            const color = done ? '#10B981' : active ? '#2563EB' : '#D1D5DB';

            return (
              <View key={step} style={styles.stepRow}>
                <View style={styles.stepLeft}>
                  <View style={[styles.stepCircle, { backgroundColor: color, borderColor: color }]}>
                    {done ? (
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    ) : (
                      <View style={[styles.stepInnerDot, { backgroundColor: active ? '#fff' : 'transparent' }]} />
                    )}
                  </View>
                  {index < REQUEST_DETAIL_STEP_ORDER.length - 1 ? (
                    <View style={[styles.stepLine, { backgroundColor: done ? '#10B981' : '#E5E7EB' }]} />
                  ) : null}
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    {
                      color: done || active ? '#1F2937' : '#9CA3AF',
                      fontWeight: active ? '700' : '400',
                    },
                  ]}
                >
                  {STATUS_LABEL[step]}
                </Text>
              </View>
            );
          })}
        </View>
      ) : null}
    </>
  );
};
