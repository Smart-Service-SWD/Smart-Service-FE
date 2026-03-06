import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';
import { styles } from '../home.styles';

export const SafetyInfoCard: React.FC = () => {
  return (
    <View style={styles.infoSection}>
      <Ionicons name="shield-checkmark" size={32} color="#34C759" />
      <View style={styles.infoText}>
        <Text style={styles.infoTitle}>Safe & Verified Professionals</Text>
        <Text style={styles.infoDescription}>
          All our service providers are background checked and verified
        </Text>
      </View>
    </View>
  );
};
