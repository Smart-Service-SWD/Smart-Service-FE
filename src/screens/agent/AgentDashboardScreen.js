import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

export const AgentDashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [stats, setStats] = useState({
    pendingAssignments: 0,
    activeJobs: 0,
    completedToday: 0,
    earnings: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // TODO: Call API to get agent dashboard stats
      // const data = await agentService.getDashboardStats();
      // setStats(data);
      
      // Mock data for now
      setTimeout(() => {
        setStats({
          pendingAssignments: 3,
          activeJobs: 2,
          completedToday: 5,
          earnings: 1250000
        });
        setLoading(false);
        setRefreshing(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const toggleAvailability = async () => {
    setIsAvailable(!isAvailable);
    // TODO: Call API to update availability status
    // await agentService.updateAvailability(!isAvailable);
  };

  const StatCard = ({ icon, title, value, color, suffix = '', onPress }) => (
    <TouchableOpacity 
      style={[styles.statCard, { borderLeftColor: color }]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={28} color={color} />
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}{suffix}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#34C759" />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.fullName}!</Text>
          <Text style={styles.role}>Service Provider</Text>
        </View>
        <View style={styles.availabilityContainer}>
          <Text style={styles.availabilityLabel}>
            {isAvailable ? 'Available' : 'Offline'}
          </Text>
          <Switch
            value={isAvailable}
            onValueChange={toggleAvailability}
            trackColor={{ false: '#767577', true: '#34C759' }}
            thumbColor={isAvailable ? '#fff' : '#f4f3f4'}
          />
        </View>
      </View>

      <View style={styles.statsGrid}>
        <StatCard
          icon="notifications-outline"
          title="New Assignments"
          value={stats.pendingAssignments}
          color="#FF9500"
          onPress={() => navigation.navigate('MyAssignments', { filter: 'pending' })}
        />
        
        <StatCard
          icon="construct-outline"
          title="Active Jobs"
          value={stats.activeJobs}
          color="#007AFF"
          onPress={() => navigation.navigate('MyAssignments', { filter: 'active' })}
        />
      </View>

      <View style={styles.statsGrid}>
        <StatCard
          icon="checkmark-done-outline"
          title="Completed Today"
          value={stats.completedToday}
          color="#34C759"
          onPress={() => navigation.navigate('MyAssignments', { filter: 'completed' })}
        />
        
        <StatCard
          icon="cash-outline"
          title="Today's Earnings"
          value={stats.earnings.toLocaleString()}
          suffix="đ"
          color="#5856D6"
          onPress={() => navigation.navigate('Earnings')}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('MyAssignments')}
        >
          <Ionicons name="list-outline" size={24} color="#34C759" />
          <Text style={styles.actionButtonText}>View My Assignments</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('ServiceHistory')}
        >
          <Ionicons name="time-outline" size={24} color="#34C759" />
          <Text style={styles.actionButtonText}>Service History</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('Earnings')}
        >
          <Ionicons name="wallet-outline" size={24} color="#34C759" />
          <Text style={styles.actionButtonText}>Earnings & Payments</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('MyCapabilities')}
        >
          <Ionicons name="build-outline" size={24} color="#34C759" />
          <Text style={styles.actionButtonText}>My Capabilities</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  role: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  availabilityContainer: {
    alignItems: 'flex-end',
  },
  availabilityLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#34C759',
    marginBottom: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    padding: 8,
    paddingTop: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 8,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statContent: {
    marginTop: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 8,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
});
