import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

export const ProfileScreen: React.FC<{ navigation  }> = ({ navigation  }) => {
  const { user, logout, ROLES } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => logout()
        }
      ]
    );
  };

  const getRoleDisplay = (role: any) => {
    switch (role) {
      case 'CUSTOMER':
      case 'USER':
      case ROLES.USER:
        return { name: 'Customer', icon: 'person' as any, color: '#007AFF' };
      case ROLES.AGENT:
      case 'AGENT':
        return { name: 'Service Provider', icon: 'construct' as any, color: '#34C759' };
      case ROLES.STAFF:
      case 'STAFF':
      case 'ADMIN':
        return { name: 'Staff', icon: 'briefcase' as any, color: '#FF9500' };
      default:
        return { name: 'User', icon: 'person' as any, color: '#8E8E93' };
    }
  };

  const roleInfo = getRoleDisplay(user?.role);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.avatarContainer, { backgroundColor: roleInfo.color }]}>
          <Ionicons name={roleInfo.icon} size={50} color="#fff" />
        </View>
        <Text style={styles.name}>{user?.fullName || 'User'}</Text>
        <View style={[styles.roleBadge, { backgroundColor: roleInfo.color }]}>
          <Text style={styles.roleText}>{roleInfo.name}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Information</Text>
        
        <View style={styles.infoItem}>
          <Ionicons name="mail-outline" size={20} color="#666" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user?.email || 'N/A'}</Text>
          </View>
        </View>

        <View style={styles.infoItem}>
          <Ionicons name="call-outline" size={20} color="#666" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>{user?.phoneNumber || 'N/A'}</Text>
          </View>
        </View>

        <View style={styles.infoItem}>
          <Ionicons name="shield-checkmark-outline" size={20} color="#666" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Role</Text>
            <Text style={styles.infoValue}>{roleInfo.name}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
        
        <TouchableOpacity 
          style={styles.actionItem}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Ionicons name="create-outline" size={20} color="#007AFF" />
          <Text style={styles.actionText}>Edit Profile</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionItem}
          onPress={() => navigation.navigate('ChangePassword')}
        >
          <Ionicons name="lock-closed-outline" size={20} color="#007AFF" />
          <Text style={styles.actionText}>Change Password</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionItem, styles.logoutItem]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
          <Text style={[styles.actionText, styles.logoutText]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  roleBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  roleText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  logoutItem: {
    borderBottomWidth: 0,
  },
  logoutText: {
    color: '#FF3B30',
  },
});
