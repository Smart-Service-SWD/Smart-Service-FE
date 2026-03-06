import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  FlatList,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ToastService } from '../../shared/ui/toast';
import { useHomeData } from '../../features/common/home/model/useHomeData';
import { BANNERS } from './home/home.constants';
import { styles } from './home/home.styles';
import {
  HomeScreenProps,
} from './home/home.types';
import { HomeBanner } from './home/ui/HomeBanner';
import { CategoryCard } from './home/ui/CategoryCard';
import { FeaturedServiceCard } from './home/ui/FeaturedServiceCard';
import { UserMenu } from './home/ui/UserMenu';
import { DeveloperToolsRow } from './home/ui/DeveloperToolsRow';
import { QuickActionsGrid } from './home/ui/QuickActionsGrid';
import { SafetyInfoCard } from './home/ui/SafetyInfoCard';

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const {
    user,
    logout,
    menuVisible,
    refreshing,
    currentBannerIndex,
    serviceCategories,
    featuredServices,
    setMenuVisible,
    onRefresh,
  } = useHomeData();

  const currentBanner = BANNERS[currentBannerIndex];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Hello{user ? `, ${user.fullName}` : ''}! 👋</Text>
          <Text style={styles.subGreeting}>What service do you need today?</Text>
        </View>
        {user ? (
          <>
            <TouchableOpacity onPress={() => setMenuVisible((v) => !v)} style={styles.avatarButton}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={24} color="#007AFF" />
              </View>
            </TouchableOpacity>
            {menuVisible && (
              <UserMenu
                fullName={user.fullName}
                role={user.role || 'User'}
                onClose={() => setMenuVisible(false)}
                onViewProfile={() => {
                  setMenuVisible(false);
                  navigation.navigate('Profile');
                }}
                onLogout={() => {
                  setMenuVisible(false);
                  logout();
                }}
              />
            )}
          </>
        ) : (
          <TouchableOpacity
            onPress={() => navigation.navigate('Profile')}
            style={styles.loginButton}
          >
            <Ionicons name="log-in-outline" size={20} color="#fff" />
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>
        )}
      </View>

      <HomeBanner
        banner={currentBanner}
        banners={BANNERS}
        currentIndex={currentBannerIndex}
      />

      <DeveloperToolsRow
        onOpenGraphQlDemo={() => navigation.navigate('GraphQLDemo')}
        onTestToast={() => {
          ToastService.show({
            type: 'success',
            title: 'Thành công!',
            message: 'Toast custom hoạt động mượt mà.',
            duration: 3000,
          });
        }}
      />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Service Categories</Text>
        <FlatList
          data={serviceCategories}
          renderItem={({ item }) => (
            <CategoryCard
              item={item}
              onPress={(category) =>
                navigation.navigate('ServiceList', { category: category.name, categoryId: category.id })}
            />
          )}
          keyExtractor={(item) => item.id}
          numColumns={4}
          scrollEnabled={false}
          columnWrapperStyle={styles.categoryRow}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <QuickActionsGrid
          onCreateRequest={() => navigation.navigate('NewRequest')}
          onOpenMyRequests={() => navigation.navigate('MyRequests')}
          onOpenServiceCatalog={() => navigation.navigate('GraphQLDemo')}
          onOpenProfile={() => navigation.navigate('Profile')}
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Services</Text>
          <TouchableOpacity onPress={() => navigation.navigate('ServiceList', { category: 'Tất cả' })}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={featuredServices}
          renderItem={({ item }) => (
            <FeaturedServiceCard
              item={item}
              onPress={(service) => navigation.navigate('ServiceDetail', { service })}
            />
          )}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.featuredList}
        />
      </View>

      <SafetyInfoCard />
    </ScrollView>
  );
};

