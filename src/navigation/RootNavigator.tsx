import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../context/AuthContext';


// Auth Screens
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';


// Common Screens
import { GraphQLDemoScreen } from '../screens/common/GraphQLDemoScreen';
import { HomeScreen } from '../screens/common/HomeScreen';
import { ServiceDetailScreen } from '../screens/common/ServiceDetailScreen';
import { ServiceListScreen } from '../screens/common/ServiceListScreen';


// Customer Screens
import { AnalysisDetailScreen } from '../screens/AnalysisDetailScreen';
import { AnalysisResultScreen } from '../screens/AnalysisResultScreen';
import { CameraScreen } from '../screens/CameraScreen';
import { CreateRequestScreen } from '../screens/CreateRequestScreen';
import { HistoryScreen } from '../screens/HistoryScreen';


// Staff Screens
import { PendingEvaluationsScreen } from '../screens/staff/PendingEvaluationsScreen';
import { ReEvaluationsScreen } from '../screens/staff/ReEvaluationsScreen';
import { StaffDashboardScreen } from '../screens/staff/StaffDashboardScreen';
import { StaffProfileScreen } from '../screens/staff/StaffProfileScreen';
import { StaffRequestDetailScreen } from '../screens/staff/StaffRequestDetailScreen';

// Agent Screens
import { AgentDashboardScreen } from '../screens/agent/AgentDashboardScreen';
import { AgentProfileScreen } from '../screens/agent/AgentProfileScreen';
import { AvailableJobsScreen } from '../screens/agent/AvailableJobsScreen';
import { JobTabNavigator } from '../screens/agent/JobTabNavigator';


// Admin Screens
import { AdminDashboardScreen } from '../screens/admin/AdminDashboardScreen';
import { AdminProfileScreen } from '../screens/admin/AdminProfileScreen';
import { AgentManagementScreen } from '../screens/admin/AgentManagementScreen';
import { ReportsScreen } from '../screens/admin/ReportsScreen';
import { RequestManagementScreen } from '../screens/admin/RequestManagementScreen';
import { ServiceManagementScreen } from '../screens/admin/ServiceManagementScreen';
import { StaffManagementScreen } from '../screens/admin/StaffManagementScreen';
import { UserManagementScreen } from '../screens/admin/UserManagementScreen';


// User Screens
import { UserProfileScreen } from '../screens/user/UserProfileScreen';



const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();


// Home Stack Navigator (for service browsing)
const HomeStackNavigator = () => {
  const { user } = useAuth();
  
  // If user is ADMIN, show Admin Dashboard
  if (user && user.role === 'ADMIN') {
    return (
      <Stack.Navigator
        id="HomeStack"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen
          name="AdminDashboard"
          component={AdminDashboardScreen}
          options={{ title: 'Admin Dashboard' }}
        />
      </Stack.Navigator>
    );
  }
  
  // If user is STAFF, show Staff Dashboard
  if (user && user.role === 'STAFF') {
    return (
      <Stack.Navigator
        id="HomeStack"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen
          name="StaffDashboard"
          component={StaffDashboardScreen}
          options={{ title: 'Staff Dashboard' }}
        />
      </Stack.Navigator>
    );
  }


  // If user is AGENT, show Agent Dashboard
  if (user && user.role === 'AGENT') {
    return (
      <Stack.Navigator
        id="HomeStack"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen
          name="AgentDashboard"
          component={AgentDashboardScreen}
          options={{ title: 'Agent Dashboard' }}
        />
      </Stack.Navigator>
    );
  }


  // Default: Customer/Guest view
  return (
    <Stack.Navigator
      id="HomeStack"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="HomeMain"
        component={HomeScreen}
        options={{ title: 'Home' }}
      />
      <Stack.Screen
        name="ServiceList"
        component={ServiceListScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ServiceDetail"
        component={ServiceDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="GraphQLDemo"
        component={GraphQLDemoScreen}
        options={{ title: 'GraphQL Demo', headerShown: true }}
      />
      <Stack.Screen
        name="CreateRequest"
        component={CreateRequestScreen}
        options={{ 
          headerShown: true,
          title: 'Book Service',
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
        }}
      />
    </Stack.Navigator>
  );
};


// Auth Navigator
const AuthNavigator = () => {
  return (
    <AuthStack.Navigator
      id="AuthStack"
      screenOptions={{
        headerShown: false,
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  );
};


// Customer (Camera) Stack Navigator
const CameraStackNavigator = () => {
  return (
    <Stack.Navigator
      id="CameraStack"
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#007AFF',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen
        name="CameraMain"
        component={CameraScreen}
        options={{ title: 'Service Analysis' }}
      />
      <Stack.Screen
        name="AnalysisResult"
        component={AnalysisResultScreen}
        options={{ title: 'Result' }}
      />
      <Stack.Screen
        name="CreateRequest"
        component={CreateRequestScreen}
        options={{ title: 'Create Request' }}
      />
    </Stack.Navigator>
  );
};


const HistoryStackNavigator = () => {
  return (
    <Stack.Navigator
      id="HistoryStack"
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#007AFF',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen
        name="HistoryMain"
        component={HistoryScreen}
        options={{ title: 'History' }}
      />
      <Stack.Screen
        name="AnalysisDetail"
        component={AnalysisDetailScreen}
        options={{ title: 'Details' }}
      />
      <Stack.Screen
        name="CreateRequest"
        component={CreateRequestScreen}
        options={{ title: 'Create Request' }}
      />
    </Stack.Navigator>
  );
};


// Profile Stack Navigator (includes Login/Register)
const ProfileStackNavigator = () => {
  const { user, token } = useAuth();
  const isAuthenticated = !!user && !!token;
  
  // Xác định component Profile dựa trên role
  const getProfileComponent = () => {
    if (!user) return null;
    
    switch (user.role) {
      case 'ADMIN':
        return AdminProfileScreen;
      case 'STAFF':
        return StaffProfileScreen;
      case 'AGENT':
        return AgentProfileScreen;
      case 'USER':
      default:
        return UserProfileScreen;  // ← Component mới
    }
  };
  
  const ProfileComponent = getProfileComponent();
  
  return (
    <Stack.Navigator
      id="ProfileStack"
      screenOptions={{
        headerShown: false,  // Ẩn header vì UserProfileScreen đã có header riêng
      }}
    >
      {isAuthenticated && ProfileComponent ? (
        <Stack.Screen
          name="ProfileMain"
          component={ProfileComponent}
          options={{ title: 'Profile' }}
        />
      ) : (
        <>
          <Stack.Screen
            name="ProfileLogin"
            component={LoginScreen}
            options={{ title: 'Login' }}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{ title: 'Sign Up' }}
          />
          <Stack.Screen
            name="ForgotPassword"
            component={ForgotPasswordScreen}
            options={{ title: 'Reset Password' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};


// --- [THÊM MỚI] Stack riêng cho Agent Home để điều hướng con ---
const AgentHomeStack = () => {
  return (
    <Stack.Navigator
      id="AgentHomeStack" // <--- THÊM DÒNG NÀY
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="AgentDashboardMain" component={AgentDashboardScreen} />
      <Stack.Screen name="AvailableJobs" component={AvailableJobsScreen} />
      <Stack.Screen name="JobTabs" component={JobTabNavigator} />
    </Stack.Navigator>
  );
};



// Agent Tab Navigator
const AgentTabNavigator = () => {
  return (
    <Tab.Navigator
      id="AgentTabs"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;


          if (route.name === 'AgentHome') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'AgentProfile') {
            iconName = focused ? 'person' : 'person-outline';
          }


          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#34C759',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#e0e0e0',
          paddingBottom: 5,
          paddingTop: 5,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      })}
    >
      <Tab.Screen
        name="AgentHome"
        component={AgentHomeStack} // <-- [SỬA] Dùng Stack thay vì DashboardScreen trực tiếp
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen
        name="AgentProfile"
        component={AgentProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
};


// Staff Tab Navigator
const StaffTabNavigator = () => {
  return (
    <Tab.Navigator
      id="StaffTabs"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;


          if (route.name === 'StaffDashboard') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          } else if (route.name === 'PendingEvaluations') {
            iconName = focused ? 'checkmark-circle' : 'checkmark-circle-outline';
          } else if (route.name === 'ReEvaluations') {
            iconName = focused ? 'refresh-circle' : 'refresh-circle-outline';
          } else if (route.name === 'StaffProfile') {
            iconName = focused ? 'person' : 'person-outline';
          }


          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#e0e0e0',
          paddingBottom: 5,
          paddingTop: 5,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      })}
    >
      <Tab.Screen
        name="StaffDashboard"
        component={StaffDashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen
        name="PendingEvaluations"
        component={PendingEvaluationsScreen}
        options={{ title: 'Confirm AI' }}
      />
      <Tab.Screen
        name="ReEvaluations"
        component={ReEvaluationsScreen}
        options={{ title: 'Re-evaluate' }}
      />
      <Tab.Screen
        name="StaffProfile"
        component={StaffProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

// Staff Stack Navigator (wraps tabs + detail screen)
const StaffStackNavigator = () => {
  return (
    <Stack.Navigator
      id="StaffStack"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="StaffTabs" component={StaffTabNavigator} />
      <Stack.Screen
        name="StaffRequestDetail"
        component={StaffRequestDetailScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

// Admin Dashboard Stack Navigator (AdminDashboard + sub-management screens)
const AdminDashboardStackNavigator = () => {
  return (
    <Stack.Navigator
      id="AdminDashboardStack"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="AdminDashboardMain" component={AdminDashboardScreen} />
      <Stack.Screen
        name="StaffManagement"
        component={StaffManagementScreen}
        options={{ headerShown: true, title: 'Quản lý nhân viên', headerStyle: { backgroundColor: '#007AFF' }, headerTintColor: '#fff' }}
      />
      <Stack.Screen
        name="AgentManagement"
        component={AgentManagementScreen}
        options={{ headerShown: true, title: 'Quản lý thợ', headerStyle: { backgroundColor: '#007AFF' }, headerTintColor: '#fff' }}
      />
      <Stack.Screen
        name="RequestManagement"
        component={RequestManagementScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

// Admin Tab Navigator
const AdminTabNavigator = () => {
  return (
    <Tab.Navigator
      id="AdminTabs"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;


          if (route.name === 'AdminDashboard') {
            iconName = focused ? 'analytics' : 'analytics-outline';
          } else if (route.name === 'UserManagement') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'ServiceManagement') {
            iconName = focused ? 'construct' : 'construct-outline';
          } else if (route.name === 'Reports') {
            iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          } else if (route.name === 'AdminProfile') {
            iconName = focused ? 'person' : 'person-outline';
          }


          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#e0e0e0',
          paddingBottom: 5,
          paddingTop: 5,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      })}
    >
      <Tab.Screen
        name="AdminDashboard"
        component={AdminDashboardStackNavigator}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen
        name="UserManagement"
        component={UserManagementScreen}
        options={{ title: 'Người dùng' }}
      />
      <Tab.Screen
        name="ServiceManagement"
        component={ServiceManagementScreen}
        options={{ title: 'Dịch vụ' }}
      />
      <Tab.Screen
        name="Reports"
        component={ReportsScreen}
        options={{ title: 'Báo cáo' }}
      />
      <Tab.Screen
        name="AdminProfile"
        component={AdminProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
};


// App Navigator (Always available - no login required to browse)
const AppNavigator = () => {
  const { user } = useAuth();


  // If user is ADMIN, show Admin-specific tabs
  if (user && user.role === 'ADMIN') {
    return <AdminTabNavigator />;
  }

  // If user is STAFF, show Staff-specific tabs + detail screen
  if (user && user.role === 'STAFF') {
    return <StaffStackNavigator />;
  }


  // If user is AGENT, show Agent-specific tabs
  if (user && user.role === 'AGENT') {
    return <AgentTabNavigator />;
  }


  // Default tabs for USER and guests
  return (
    <Tab.Navigator
      id="AppTabs"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;


          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Camera') {
            iconName = focused ? 'camera' : 'camera-outline';
          } else if (route.name === 'History') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }


          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#e0e0e0',
          paddingBottom: 5,
          paddingTop: 5,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackNavigator}
        options={{ title: 'Home' }}
      />
      <Tab.Screen
        name="Camera"
        component={CameraStackNavigator}
        options={{ title: 'Analyze' }}
      />
      <Tab.Screen
        name="History"
        component={HistoryStackNavigator}
        options={{ title: 'History' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackNavigator}
        options={{ title: 'Account' }}
      />
    </Tab.Navigator>
  );
};


export const RootNavigator = () => {
  const { loading } = useAuth();


  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }


  return (
    <NavigationContainer theme={{ ...DefaultTheme, colors: { ...DefaultTheme.colors, background: '#fff' } }}>
      <AppNavigator />
    </NavigationContainer>
  );
};
