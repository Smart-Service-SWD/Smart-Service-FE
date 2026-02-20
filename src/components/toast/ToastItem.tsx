import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming
} from 'react-native-reanimated';
import { EdgeInsets } from 'react-native-safe-area-context';
import { ToastOptions } from './types';

interface ToastItemProps {
    toast: ToastOptions | null;
    onHide: () => void;
    insets: EdgeInsets;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onHide, insets }) => {
    const [activeToast, setActiveToast] = useState<ToastOptions | null>(null);

    // Sileo-like Animation Values
    const translateY = useSharedValue(-50);
    const opacity = useSharedValue(0);
    const scale = useSharedValue(0.85);

    useEffect(() => {
        if (toast) {
            setActiveToast(toast);
            // Sileo signature: very bouncy, rubber-banding spring entrance
            translateY.value = withSpring(0, {
                damping: 12, // Lower damping = more bouncy
                stiffness: 150, // Slightly looser spring
                mass: 0.8,
                overshootClamping: false
            });
            opacity.value = withTiming(1, { duration: 150 });
            scale.value = withSpring(1, {
                damping: 15,
                stiffness: 180,
                mass: 0.8
            });

        } else if (activeToast) {
            // Sileo signature: slight zoom out and fade up/down on exit
            translateY.value = withTiming(-30, { duration: 200 });
            opacity.value = withTiming(0, { duration: 150 }, (finished) => {
                if (finished) {
                    runOnJS(setActiveToast)(null);
                }
            });
            scale.value = withTiming(0.9, { duration: 200 });
        }
    }, [toast]);

    // Swipe to dismiss with Sileo-like physics resistance
    const onGestureEvent = (event: any) => {
        if (event.nativeEvent.translationY < -15) {
            // Apply a rubber-band effect before hiding
            translateY.value = withSpring(event.nativeEvent.translationY, {
                damping: 20,
                stiffness: 400
            });
            onHide();
        }
    };

    const getIcon = () => {
        if (!activeToast) return null;
        switch (activeToast.type) {
            case 'success':
                return <MaterialCommunityIcons name="check-circle" size={20} color="#10B981" />;
            case 'error':
                return <MaterialCommunityIcons name="alert-circle" size={20} color="#EF4444" />;
            case 'warning':
                return <MaterialCommunityIcons name="alert" size={20} color="#F59E0B" />;
            case 'info':
            default:
                return <MaterialCommunityIcons name="information" size={20} color="#3B82F6" />;
        }
    };

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateY: translateY.value },
                { scale: scale.value }
            ] as any,
            opacity: opacity.value,
        };
    });

    if (!activeToast) return null;

    return (
        <View style={[styles.container, { top: insets.top + (activeToast.position === 'bottom' ? undefined : 15), bottom: activeToast.position === 'bottom' ? insets.bottom + 20 : undefined }]} pointerEvents="box-none">
            <PanGestureHandler onGestureEvent={onGestureEvent}>
                <Animated.View style={[styles.sileoToastCard, animatedStyle]}>
                    <View style={styles.iconContainer}>{getIcon()}</View>
                    <View style={styles.contentContainer}>
                        {activeToast.title && <Text style={styles.title}>{activeToast.title}</Text>}
                        {!!activeToast.message && <Text style={styles.message}>{activeToast.message}</Text>}
                    </View>
                </Animated.View>
            </PanGestureHandler>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        zIndex: 9999,
        elevation: 9999,
    },
    // Sileo-specific Aesthetics: Pill shaped, ultra-minimal, dark glassmorphism feel
    sileoToastCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 9999, // Perfect pill shape
        backgroundColor: 'rgba(23, 23, 23, 0.9)', // Deep dark with slight transparency
        minWidth: 200,
        maxWidth: '85%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 15,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)', // Very subtle inner ring
    },
    iconContainer: {
        marginRight: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    contentContainer: {
        flexShrink: 1,
        justifyContent: 'center', // Center text vertically
    },
    title: {
        color: '#F9FAFB',
        fontSize: 14,
        fontWeight: '600',
        lineHeight: 20,
        letterSpacing: 0.2,
    },
    message: {
        color: '#A1A1AA', // Sileo uses very muted gray for descriptions
        fontSize: 13,
        lineHeight: 18,
        marginTop: 1,
    }
});

export default ToastItem;

