import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { styles } from './styles';

interface ProfileInfoSectionProps {
  sectionTitle?: string;
  loading: boolean;
  loadingColor: string;
  email: string;
  phone: string;
  roleDescription: string;
}

export const ProfileInfoSection: React.FC<ProfileInfoSectionProps> = ({
  sectionTitle = 'Thông tin tài khoản',
  loading,
  loadingColor,
  email,
  phone,
  roleDescription,
}) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{sectionTitle}</Text>

      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={loadingColor} />
          <Text style={styles.loadingText}>Đang tải hồ sơ...</Text>
        </View>
      ) : (
        <>
          <View style={styles.infoItem}>
            <Ionicons name="mail-outline" size={20} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{email}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="call-outline" size={20} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Số điện thoại</Text>
              <Text style={styles.infoValue}>{phone}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Vai trò</Text>
              <Text style={styles.infoValue}>{roleDescription}</Text>
            </View>
          </View>
        </>
      )}
    </View>
  );
};
