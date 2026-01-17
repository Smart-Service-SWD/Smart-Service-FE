import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

export const StaffDashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    pendingRequests: 0,
    activeRequests: 0,
    completedToday: 0,
    availableAgents: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // TODO: Call API to get staff dashboard stats
      // const data = await staffService.getDashboardStats();
      // setStats(data);
      
      // Mock data for now
      setTimeout(() => {
        setStats({
          pendingRequests: 12,
          activeRequests: 8,
          completedToday: 15,
          availableAgents: 23
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

  const StatCard = ({ icon, title, value, color, onPress }) => (
    <TouchableOpacity 
      style={[styles.statCard, { borderLeftColor: color }]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={32} color={color} />
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
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
        <Text style={styles.greeting}>Hello, {user?.fullName}!</Text>
        <Text style={styles.role}>Staff Dashboard</Text>
      </View>

      <View style={styles.statsContainer}>
        <StatCard
          icon="time-outline"
          title="Pending Requests"
          value={stats.pendingRequests}
          color="#FF9500"
          onPress={() => navigation.navigate('RequestManagement', { status: 'pending' })}
        />
        
        <StatCard
          icon="flash-outline"
          title="Active Requests"
          value={stats.activeRequests}
          color="#007AFF"
          onPress={() => navigation.navigate('RequestManagement', { status: 'active' })}
        />
        
        <StatCard
          icon="checkmark-circle-outline"
          title="Completed Today"
          value={stats.completedToday}
          color="#34C759"
          onPress={() => navigation.navigate('RequestManagement', { status: 'completed' })}
        />
        
        <StatCard
          icon="people-outline"
          title="Available Agents"
          value={stats.availableAgents}
          color="#5856D6"
          onPress={() => navigation.navigate('AgentManagement')}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('RequestManagement')}
        >
          <Ionicons name="list-outline" size={24} color="#007AFF" />
          <Text style={styles.actionButtonText}>Manage Service Requests</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('AgentManagement')}
        >
          <Ionicons name="people-outline" size={24} color="#007AFF" />
          <Text style={styles.actionButtonText}>Manage Service Providers</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('AssignmentManagement')}
        >
          <Ionicons name="git-merge-outline" size={24} color="#007AFF" />
          <Text style={styles.actionButtonText}>Assignment Management</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('Reports')}
        >
          <Ionicons name="analytics-outline" size={24} color="#007AFF" />
          <Text style={styles.actionButtonText}>View Reports</Text>
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
  statsContainer: {
    padding: 16,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statContent: {
    flex: 1,
    marginLeft: 16,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  statTitle: {
    fontSize: 14,
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
