import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Banner } from '../home.types';
import { styles } from '../home.styles';

interface HomeBannerProps {
  banner: Banner;
  banners: Banner[];
  currentIndex: number;
}

export const HomeBanner: React.FC<HomeBannerProps> = ({
  banner,
  banners,
  currentIndex,
}) => {
  return (
    <View style={[styles.banner, { backgroundColor: banner.color }]}>
      <View style={styles.bannerContent}>
        <View style={styles.bannerTextContainer}>
          <Text style={styles.bannerSubtitle}>{banner.subtitle}</Text>
          <Text style={styles.bannerTitle}>{banner.title}</Text>
          <Text style={styles.bannerDescription}>{banner.description}</Text>
        </View>
        <View style={styles.bannerIconContainer}>
          <Ionicons name={banner.icon} size={40} color="#FFFFFF" />
        </View>
      </View>
      <View style={styles.bannerIndicators}>
        {banners.map((_, index) => (
          <View
            key={index}
            style={[
              styles.indicator,
              index === currentIndex && styles.activeIndicator,
            ]}
          />
        ))}
      </View>
    </View>
  );
};
