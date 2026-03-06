import { Ionicons } from '@expo/vector-icons';
import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';

type TabIconResolver = (
  routeName: string,
  focused: boolean
) => keyof typeof Ionicons.glyphMap;

interface CreateTabScreenOptionsParams {
  activeTintColor: string;
  resolveIcon: TabIconResolver;
}

export const createTabScreenOptions = ({
  activeTintColor,
  resolveIcon,
}: CreateTabScreenOptionsParams) => {
  return ({ route }: { route: { name: string } }): BottomTabNavigationOptions => ({
    headerShown: false,
    tabBarIcon: ({ focused, color, size }) => {
      const iconName = resolveIcon(route.name, focused);
      return <Ionicons name={iconName} size={size} color={color} />;
    },
    tabBarActiveTintColor: activeTintColor,
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
  });
};

