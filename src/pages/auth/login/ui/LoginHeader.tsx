import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Animated, Text, View } from 'react-native';
import { styles } from '../styles';

interface LoginHeaderProps {
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
  scaleAnim: Animated.Value;
}

export const LoginHeader: React.FC<LoginHeaderProps> = ({
  fadeAnim,
  slideAnim,
  scaleAnim,
}) => {
  return (
    <Animated.View
      style={[
        styles.header,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Animated.View
        style={[
          styles.logoContainer,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <View style={styles.logoCircle}>
          <MaterialCommunityIcons
            name="shield-check"
            size={50}
            color="#0066CC"
          />
        </View>
      </Animated.View>
      <Text style={styles.title}>Welcome Back</Text>
      <Text style={styles.subtitle}>Sign in to continue</Text>
    </Animated.View>
  );
};
