import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ServiceRequest } from '../../../../shared/api/adminGraphqlService';
import {
  formatAdminRequestCurrency,
  formatAdminRequestDate,
  REQUEST_STATUS_MAP,
} from '../../../../features/admin/request-management/model/constants';
import { styles } from '../styles';
import { InfoRow } from './InfoRow';

interface RequestCardProps {
  item: ServiceRequest;
  userMap: Record<string, string>;
  catMap: Record<string, string>;
  agentMap: Record<string, string>;
}

export const RequestCard: React.FC<RequestCardProps> = ({
  item,
  userMap,
  catMap,
  agentMap,
}) => {
  const meta = REQUEST_STATUS_MAP[item.status] ?? {
    label: item.status,
    color: '#8E8E93',
    bg: '#F5F6FA',
    dot: '#8E8E93',
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={[styles.badge, { backgroundColor: meta.bg }]}>
          <View style={[styles.dot, { backgroundColor: meta.dot }]} />
          <Text style={[styles.badgeText, { color: meta.color }]}>{meta.label}</Text>
        </View>
        <Text style={styles.dateText}>{formatAdminRequestDate(item.createdAt)}</Text>
      </View>

      <Text style={styles.customerName} numberOfLines={1}>
        {userMap[item.customerId] ?? 'Khách hàng #' + item.customerId.slice(0, 6)}
      </Text>

      <View style={styles.divider} />

      <View style={styles.infoSection}>
        <InfoRow icon="grid-outline" text={catMap[item.categoryId] ?? 'Danh mục'} />
        {item.addressText ? (
          <InfoRow icon="location-outline" text={item.addressText} maxLines={1} />
        ) : null}
        {item.assignedProviderId ? (
          <InfoRow
            icon="hammer-outline"
            text={'Thợ: ' + (agentMap[item.assignedProviderId] ?? item.assignedProviderId.slice(0, 6))}
          />
        ) : null}
      </View>

      {item.description ? (
        <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
      ) : null}

      {item.estimatedCost ? (
        <View style={styles.costRow}>
          <Ionicons name="cash-outline" size={14} color="#34C759" />
          <Text style={styles.costText}>
            Chi phí ước tính: {formatAdminRequestCurrency(item.estimatedCost.amount)}
          </Text>
        </View>
      ) : null}
    </View>
  );
};
