import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import ScreenLayout from "../../../shared/ui/ScreenLayout";
import { colors } from "../../../app/theme/colors";
import { useAuth } from "../../auth/AuthContext";
import { graphqlRequest } from "../../../shared/api/graphqlClient";
import { ME_QUERY } from "../../../shared/api/graphqlDocuments";
import {
  asErrorMessage,
  formatBooleanLabel,
  formatRoleLabel
} from "../../../shared/utils/format";
import ActionButton from "../../../shared/ui/ActionButton";
import LabeledInput from "../../../shared/ui/LabeledInput";
import { changePassword, updateProfile } from "../api/profileApi";
import type { UserProfile } from "../../../shared/types/domain";

interface MeResponse {
  me: UserProfile | null;
}

export default function ProfileScreen() {
  const { session, logout, refreshSession } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const load = async () => {
    if (!session) {
      return;
    }
    try {
      setError("");
      const data = await graphqlRequest<MeResponse>(ME_QUERY, undefined, session.accessToken);
      setProfile(data.me);
      setFullName(data.me?.fullName ?? "");
      setPhoneNumber(data.me?.phoneNumber ?? "");
    } catch (loadError) {
      setError(asErrorMessage(loadError));
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken]);

  const handleRefreshToken = async () => {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await refreshSession();
      await load();
      setSuccess("Đã làm mới phiên đăng nhập");
    } catch (refreshError) {
      setError(asErrorMessage(refreshError));
    } finally {
      setBusy(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!session) {
      return;
    }
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await updateProfile(session.accessToken, {
        fullName,
        phoneNumber
      });
      setSuccess("Đã cập nhật hồ sơ");
      await load();
    } catch (updateError) {
      setError(asErrorMessage(updateError));
    } finally {
      setBusy(false);
    }
  };

  const handleChangePassword = async () => {
    if (!session) {
      return;
    }
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await changePassword(session.accessToken, {
        currentPassword,
        newPassword
      });
      setCurrentPassword("");
      setNewPassword("");
      setSuccess("Đã đổi mật khẩu");
    } catch (passwordError) {
      setError(asErrorMessage(passwordError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenLayout
      title="Tài khoản"
      subtitle="Quản lý thông tin cá nhân, mật khẩu và phiên đăng nhập hiện tại"
    >
      <View style={styles.card}>
        <Text style={styles.label}>Email đăng nhập</Text>
        <Text style={styles.value}>{session?.email ?? "-"}</Text>
        <Text style={styles.label}>Vai trò hiện tại</Text>
        <Text style={styles.value}>{formatRoleLabel(session?.role)}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Thông tin từ hệ thống</Text>
        <Text style={styles.label}>Họ tên</Text>
        <Text style={styles.value}>{profile?.fullName ?? "-"}</Text>
        <Text style={styles.label}>Số điện thoại</Text>
        <Text style={styles.value}>{profile?.phoneNumber ?? "-"}</Text>
        <Text style={styles.label}>Trạng thái khóa</Text>
        <Text style={styles.value}>
          {formatBooleanLabel(profile?.isLocked ?? false, "Đã khóa", "Hoạt động")}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Cập nhật hồ sơ</Text>
        <LabeledInput label="Họ và tên" value={fullName} onChangeText={setFullName} />
        <LabeledInput
          label="Số điện thoại"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
        />
        <ActionButton
          label={busy ? "Đang lưu..." : "Lưu hồ sơ"}
          onPress={() => void handleUpdateProfile()}
          disabled={busy}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Đổi mật khẩu</Text>
        <LabeledInput
          label="Mật khẩu hiện tại"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
        />
        <LabeledInput
          label="Mật khẩu mới"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
        />
        <ActionButton
          label={busy ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
          onPress={() => void handleChangePassword()}
          disabled={busy}
        />
      </View>

      {!!error ? <Text style={styles.error}>{error}</Text> : null}
      {!!success ? <Text style={styles.success}>{success}</Text> : null}

      <ActionButton
        label={busy ? "Đang làm mới..." : "Làm mới phiên đăng nhập"}
        onPress={() => void handleRefreshToken()}
        disabled={busy}
      />
      <ActionButton label="Đăng xuất" onPress={() => void logout()} variant="danger" />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
    gap: 6
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 15,
    marginBottom: 4
  },
  label: {
    color: colors.textMuted,
    fontSize: 12
  },
  value: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600"
  },
  error: {
    color: colors.danger,
    fontSize: 13
  },
  success: {
    color: colors.success,
    fontSize: 13
  },
  disabledButton: {
    opacity: 0.7
  }
});
