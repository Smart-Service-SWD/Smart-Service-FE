import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ServiceAttachmentItem } from '../../../../shared/api/staffGraphqlService';
import { styles } from '../styles';

interface AttachmentsCardProps {
  attachments: ServiceAttachmentItem[];
}

export const AttachmentsCard: React.FC<AttachmentsCardProps> = ({ attachments }) => {
  if (!attachments?.length) {
    return null;
  }

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Tệp đính kèm ({attachments.length})</Text>
      {attachments.map(attachment => (
        <View key={attachment.id} style={styles.attachmentRow}>
          <Ionicons name="attach-outline" size={18} color="#607D8B" />
          <Text style={styles.attachmentName} numberOfLines={1}>
            {attachment.fileName}
          </Text>
          <Text style={styles.attachmentType}>{attachment.type}</Text>
        </View>
      ))}
    </View>
  );
};
