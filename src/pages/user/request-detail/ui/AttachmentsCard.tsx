import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';
import { ServiceRequestDetail } from '../../../../shared/api/userService';
import { styles } from '../styles';

interface AttachmentsCardProps {
  attachments: ServiceRequestDetail['attachments'];
}

export const AttachmentsCard: React.FC<AttachmentsCardProps> = ({ attachments }) => {
  if (!attachments?.length) {
    return null;
  }

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Tệp đính kèm ({attachments.length})</Text>
      {attachments.map(attachment => (
        <View key={attachment.id} style={styles.attItem}>
          <Ionicons name="document-outline" size={18} color="#6B7280" />
          <Text style={styles.attName} numberOfLines={1}>{attachment.fileName}</Text>
        </View>
      ))}
    </View>
  );
};
