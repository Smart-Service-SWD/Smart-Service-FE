import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';
import { ServiceRequestDetail } from '../../../../shared/api/userService';
import { styles } from '../styles';

interface ServiceRequestCardProps {
  serviceRequest: ServiceRequestDetail;
}

export const ServiceRequestCard: React.FC<ServiceRequestCardProps> = ({ serviceRequest }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Yêu cầu dịch vụ</Text>
      <Text style={styles.requestDesc}>{serviceRequest.description}</Text>
      {serviceRequest.addressText ? (
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={14} color="#6B7280" />
          <Text style={styles.infoText}>{serviceRequest.addressText}</Text>
        </View>
      ) : null}
    </View>
  );
};
