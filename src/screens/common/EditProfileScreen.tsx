import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';

const PRIMARY = '#135bec';

export const EditProfileScreen: React.FC<{ navigation }> = ({ navigation }) => {
    const { user, login } = useAuth(); // Need to refresh user data context possibly later
    const [fullName, setFullName] = useState(user?.fullName || '');
    const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
    const [email, setEmail] = useState(user?.email || '');
    const [isLoading, setIsLoading] = useState(false);

    const handleUpdate = async () => {
        if (!fullName.trim() || !phoneNumber.trim() || !email.trim()) {
            Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
            return;
        }

        try {
            setIsLoading(true);
            await authService.updateProfile({
                fullName: fullName.trim(),
                phoneNumber: phoneNumber.trim(),
            });

            Alert.alert(
                'Thành công',
                'Cập nhật hồ sơ thành công. Vui lòng đăng nhập lại để làm mới phiên đăng nhập.',
                [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]
            );
        } catch (error: any) {
            console.error(error);
            const msg = error?.response?.data?.message || 'Không thể cập nhật hồ sơ, vui lòng thử lại sau.';
            Alert.alert('Lỗi cập nhật', msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Thông tin cá nhân</Text>
                    <Text style={styles.headerSub}>Cập nhật thông tin liên hệ của bạn</Text>
                </View>

                <View style={styles.formContainer}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Họ và tên</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="person-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                value={fullName}
                                onChangeText={setFullName}
                                placeholder="Nhập họ và tên"
                                placeholderTextColor="#94a3b8"
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Số điện thoại</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="call-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                value={phoneNumber}
                                onChangeText={setPhoneNumber}
                                placeholder="Nhập số điện thoại"
                                placeholderTextColor="#94a3b8"
                                keyboardType="phone-pad"
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email</Text>
                        <View style={[styles.inputWrapper, styles.disabledInputWrapper]}>
                            <Ionicons name="mail-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, styles.disabledInput]}
                                value={email}
                                editable={false}
                                placeholder="Nhập địa chỉ email"
                                placeholderTextColor="#94a3b8"
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.saveBtn, isLoading && styles.saveBtnLoading]}
                        activeOpacity={0.8}
                        onPress={handleUpdate}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
                        ) : null}
                        <Text style={styles.saveBtnText}>
                            {isLoading ? 'Đang cập nhật...' : 'Lưu thay đổi'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#ffffff' },
    scrollContent: { padding: 24, paddingBottom: 60 },
    header: { marginBottom: 32, alignItems: 'center' },
    headerTitle: { fontSize: 24, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
    headerSub: { fontSize: 14, color: '#64748b' },
    formContainer: { gap: 20 },
    inputGroup: { gap: 6 },
    label: { fontSize: 13, fontWeight: '600', color: '#334155', marginLeft: 4 },
    inputWrapper: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc',
        borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 14, height: 52,
    },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, fontSize: 15, color: '#0f172a' },
    disabledInputWrapper: { backgroundColor: '#f1f5f9', borderColor: '#cbd5e1' },
    disabledInput: { color: '#64748b' },
    saveBtn: {
        backgroundColor: PRIMARY, height: 54, borderRadius: 12,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16,
        ...Platform.select({
            ios: { shadowColor: PRIMARY, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
            android: { elevation: 4 },
        }),
    },
    saveBtnLoading: { opacity: 0.7 },
    saveBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
});
