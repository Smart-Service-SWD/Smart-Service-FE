import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';
import { styles } from '../styles';

interface AttachmentItem {
  id: string;
  fileName: string;
  type: string;
  uploadedAt: string;
}

interface AttachmentsCardProps {
  attachments?: AttachmentItem[];
}

export const AttachmentsCard: React.FC<AttachmentsCardProps> = ({ attachments = [] }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Tệp đính kèm ({attachments.length})</Text>
      {attachments.map(attachment => (
        <View key={attachment.id} style={styles.fileItem}>
          <Ionicons name="document-outline" size={20} color="#007AFF" />
          <View style={styles.fileInfo}>
            <Text style={styles.fileName} numberOfLines={1}>{attachment.fileName}</Text>
            <Text style={styles.fileType}>
              {attachment.type} • {new Date(attachment.uploadedAt).toLocaleDateString('vi-VN')}
            </Text>
          </View>
        </View>
      ))}
      {attachments.length === 0 ? (
        <Text style={styles.emptyAttachments}>Không có tệp đính kèm</Text>
      ) : null}
    </View>
  );
};
