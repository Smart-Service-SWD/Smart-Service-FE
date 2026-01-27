import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface SystemSettings {
  appName: string;
  appVersion: string;
  maintenanceMode: boolean;
  enableNotifications: boolean;
  enableAutoBackup: boolean;
  maxFileSize: number; // MB
  sessionTimeout: number; // minutes
  supportEmail: string;
  supportPhone: string;
  privacyPolicyUrl: string;
  termsOfServiceUrl: string;
}

export const SystemSettingsScreen: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings>({
    appName: 'SmartService',
    appVersion: '1.0.0',
    maintenanceMode: false,
    enableNotifications: true,
    enableAutoBackup: true,
    maxFileSize: 10,
    sessionTimeout: 60,
    supportEmail: 'support@smartservice.com',
    supportPhone: '+84 901 234 567',
    privacyPolicyUrl: 'https://smartservice.com/privacy',
    termsOfServiceUrl: 'https://smartservice.com/terms',
  });

  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>('');

  const handleSettingChange = <K extends keyof SystemSettings>(
    key: K,
    value: SystemSettings[K]
  ) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleEditStart = (field: string, currentValue: string | number) => {
    setEditingField(field);
    setTempValue(String(currentValue));
  };

  const handleEditSave = (field: string) => {
    const value = field.includes('Size') || field.includes('Timeout') 
      ? parseInt(tempValue) || 0 
      : tempValue;
    
    handleSettingChange(field as keyof SystemSettings, value as any);
    setEditingField(null);
    setTempValue('');
    
    Alert.alert('Thành công', 'Cài đặt đã được cập nhật');
  };

  const handleEditCancel = () => {
    setEditingField(null);
    setTempValue('');
  };

  const handleMaintenanceToggle = (value: boolean) => {
    Alert.alert(
      'Xác nhận',
      value 
        ? 'Bạn có chắc chắn muốn bật chế độ bảo trì? Người dùng sẽ không thể truy cập ứng dụng.'
        : 'Bạn có chắc chắn muốn tắt chế độ bảo trì?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Xác nhận',
          onPress: () => handleSettingChange('maintenanceMode', value),
        },
      ]
    );
  };

  const SettingRow: React.FC<{
    title: string;
    description?: string;
    icon: string;
    children: React.ReactNode;
  }> = ({ title, description, icon, children }) => (
    <View style={styles.settingRow}>
      <View style={styles.settingLeft}>
        <Ionicons name={icon as any} size={20} color="#007AFF" />
        <View style={styles.settingContent}>
          <Text style={styles.settingTitle}>{title}</Text>
          {description && <Text style={styles.settingDescription}>{description}</Text>}
        </View>
      </View>
      <View style={styles.settingRight}>
        {children}
      </View>
    </View>
  );

  const EditableField: React.FC<{
    field: string;
    value: string | number;
    placeholder?: string;
    keyboardType?: 'default' | 'numeric' | 'email-address' | 'url';
  }> = ({ field, value, placeholder, keyboardType = 'default' }) => (
    <View style={styles.editableField}>
      {editingField === field ? (
        <View style={styles.editingContainer}>
          <TextInput
            style={styles.editInput}
            value={tempValue}
            onChangeText={setTempValue}
            placeholder={placeholder}
            keyboardType={keyboardType}
            autoFocus
          />
          <View style={styles.editActions}>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => handleEditSave(field)}
            >
              <Ionicons name="checkmark" size={16} color="#34C759" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={handleEditCancel}
            >
              <Ionicons name="close" size={16} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity 
          style={styles.valueContainer}
          onPress={() => handleEditStart(field, value)}
        >
          <Text style={styles.settingValue}>{value}</Text>
          <Ionicons name="pencil" size={16} color="#666" />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Cài đặt hệ thống</Text>
        </View>

        {/* App Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin ứng dụng</Text>
          <View style={styles.card}>
            <SettingRow
              title="Tên ứng dụng"
              icon="apps-outline"
            >
              <EditableField field="appName" value={settings.appName} />
            </SettingRow>
            
            <SettingRow
              title="Phiên bản"
              icon="code-outline"
            >
              <EditableField field="appVersion" value={settings.appVersion} />
            </SettingRow>
          </View>
        </View>

        {/* System Controls */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Điều khiển hệ thống</Text>
          <View style={styles.card}>
            <SettingRow
              title="Chế độ bảo trì"
              description="Tạm dừng truy cập ứng dụng để bảo trì"
              icon="construct-outline"
            >
              <Switch
                value={settings.maintenanceMode}
                onValueChange={handleMaintenanceToggle}
                trackColor={{ false: "#767577", true: "#FF3B30" }}
                thumbColor={settings.maintenanceMode ? "#ffffff" : "#f4f3f4"}
              />
            </SettingRow>
            
            <SettingRow
              title="Thông báo push"
              description="Cho phép gửi thông báo đến người dùng"
              icon="notifications-outline"
            >
              <Switch
                value={settings.enableNotifications}
                onValueChange={(value) => handleSettingChange('enableNotifications', value)}
                trackColor={{ false: "#767577", true: "#007AFF" }}
                thumbColor={settings.enableNotifications ? "#ffffff" : "#f4f3f4"}
              />
            </SettingRow>
            
            <SettingRow
              title="Sao lưu tự động"
              description="Tự động sao lưu dữ liệu hàng ngày"
              icon="cloud-upload-outline"
            >
              <Switch
                value={settings.enableAutoBackup}
                onValueChange={(value) => handleSettingChange('enableAutoBackup', value)}
                trackColor={{ false: "#767577", true: "#007AFF" }}
                thumbColor={settings.enableAutoBackup ? "#ffffff" : "#f4f3f4"}
              />
            </SettingRow>
          </View>
        </View>

        {/* Performance Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hiệu suất</Text>
          <View style={styles.card}>
            <SettingRow
              title="Kích thước file tối đa"
              description="Giới hạn kích thước file upload (MB)"
              icon="document-outline"
            >
              <EditableField 
                field="maxFileSize" 
                value={`${settings.maxFileSize} MB`} 
                keyboardType="numeric"
              />
            </SettingRow>
            
            <SettingRow
              title="Thời gian phiên"
              description="Thời gian hết hạn phiên đăng nhập (phút)"
              icon="time-outline"
            >
              <EditableField 
                field="sessionTimeout" 
                value={`${settings.sessionTimeout} phút`} 
                keyboardType="numeric"
              />
            </SettingRow>
          </View>
        </View>

        {/* Support Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin hỗ trợ</Text>
          <View style={styles.card}>
            <SettingRow
              title="Email hỗ trợ"
              icon="mail-outline"
            >
              <EditableField 
                field="supportEmail" 
                value={settings.supportEmail} 
                keyboardType="email-address"
              />
            </SettingRow>
            
            <SettingRow
              title="Số điện thoại hỗ trợ"
              icon="call-outline"
            >
              <EditableField 
                field="supportPhone" 
                value={settings.supportPhone} 
              />
            </SettingRow>
          </View>
        </View>

        {/* Legal Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Điều khoản pháp lý</Text>
          <View style={styles.card}>
            <SettingRow
              title="Chính sách bảo mật"
              icon="shield-outline"
            >
              <EditableField 
                field="privacyPolicyUrl" 
                value={settings.privacyPolicyUrl} 
                keyboardType="url"
              />
            </SettingRow>
            
            <SettingRow
              title="Điều khoản sử dụng"
              icon="document-text-outline"
            >
              <EditableField 
                field="termsOfServiceUrl" 
                value={settings.termsOfServiceUrl} 
                keyboardType="url"
              />
            </SettingRow>
          </View>
        </View>

        {/* System Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hành động hệ thống</Text>
          <View style={styles.card}>
            <TouchableOpacity 
              style={styles.actionRow}
              onPress={() => Alert.alert('Thông báo', 'Tính năng đang phát triển')}
            >
              <Ionicons name="refresh-outline" size={20} color="#007AFF" />
              <Text style={styles.actionText}>Làm mới cache hệ thống</Text>
              <Ionicons name="chevron-forward" size={16} color="#666" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionRow}
              onPress={() => Alert.alert('Thông báo', 'Tính năng đang phát triển')}
            >
              <Ionicons name="cloud-download-outline" size={20} color="#34C759" />
              <Text style={styles.actionText}>Sao lưu dữ liệu ngay</Text>
              <Ionicons name="chevron-forward" size={16} color="#666" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionRow}
              onPress={() => Alert.alert('Thông báo', 'Tính năng đang phát triển')}
            >
              <Ionicons name="analytics-outline" size={20} color="#FF9500" />
              <Text style={styles.actionText}>Xem logs hệ thống</Text>
              <Ionicons name="chevron-forward" size={16} color="#666" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionRow, styles.dangerAction]}
              onPress={() => {
                Alert.alert(
                  'Cảnh báo',
                  'Bạn có chắc chắn muốn khởi động lại hệ thống? Tất cả người dùng sẽ bị ngắt kết nối.',
                  [
                    { text: 'Hủy', style: 'cancel' },
                    { text: 'Khởi động lại', style: 'destructive' },
                  ]
                );
              }}
            >
              <Ionicons name="power-outline" size={20} color="#FF3B30" />
              <Text style={[styles.actionText, { color: '#FF3B30' }]}>Khởi động lại hệ thống</Text>
              <Ionicons name="chevron-forward" size={16} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingContent: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  settingDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  settingRight: {
    alignItems: 'flex-end',
  },
  settingValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  editableField: {
    minWidth: 100,
  },
  editingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 14,
    minWidth: 80,
    marginRight: 8,
  },
  editActions: {
    flexDirection: 'row',
  },
  editButton: {
    padding: 4,
    marginHorizontal: 2,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  actionText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  dangerAction: {
    backgroundColor: '#FF3B3010',
  },
});