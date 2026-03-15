import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../../app/theme/colors";
import { useAuth } from "../../auth/AuthContext";
import { ApiError } from "../../../shared/api/httpClient";
import { graphqlRequest } from "../../../shared/api/graphqlClient";
import { ME_QUERY, USER_BY_ID_QUERY } from "../../../shared/api/graphqlDocuments";
import {
  asErrorMessage,
  formatBooleanLabel,
  formatRoleLabel
} from "../../../shared/utils/format";
import { changePassword, updateProfile } from "../api/profileApi";
import type { UserProfile } from "../../../shared/types/domain";

interface MeResponse {
  me: UserProfile | null;
}

interface UserByIdResponse {
  getUserById: UserProfile | null;
}

const getInitials = (fullName?: string | null) => {
  const parts = fullName?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (!parts.length) return "U";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
};

type ActivePanel = "edit" | "password" | "info" | null;

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
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const load = async () => {
    if (!session) return;

    const sessionProfile: UserProfile = {
      id: session.userId,
      email: session.email,
      fullName: session.fullName,
      phoneNumber: "",
      role: session.role,
      isLocked: false
    };

    try {
      setError("");
      let nextProfile: UserProfile | null = null;

      try {
        const meData = await graphqlRequest<MeResponse>(
          ME_QUERY,
          undefined,
          session.accessToken
        );
        nextProfile = meData.me;
      } catch {
        nextProfile = null;
      }

      if (!nextProfile) {
        const userData = await graphqlRequest<UserByIdResponse, { id: string }>(
          USER_BY_ID_QUERY,
          { id: session.userId },
          session.accessToken
        );
        nextProfile = userData.getUserById;
      }

      const resolvedProfile = nextProfile ?? sessionProfile;
      setProfile(resolvedProfile);
      setFullName(resolvedProfile.fullName ?? session.fullName ?? "");
      setPhoneNumber(resolvedProfile.phoneNumber ?? "");
    } catch (loadError) {
      setProfile(sessionProfile);
      setFullName(sessionProfile.fullName);
      setPhoneNumber(sessionProfile.phoneNumber);
      setError(asErrorMessage(loadError));
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken]);

  const handleUpdateProfile = async () => {
    if (!session) return;

    const normalizedFullName = fullName.trim();
    const normalizedPhoneNumber = phoneNumber.trim();

    if (!normalizedFullName || !normalizedPhoneNumber) {
      setError("Họ tên và số điện thoại không được để trống.");
      return;
    }

    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await updateProfile(session.accessToken, {
        fullName: normalizedFullName,
        phoneNumber: normalizedPhoneNumber
      });
      setSuccess("Đã cập nhật hồ sơ thành công.");
      await load();
    } catch (updateError) {
      setError(asErrorMessage(updateError));
    } finally {
      setBusy(false);
    }
  };

  const handleChangePassword = async () => {
    if (!session) return;

    if (!currentPassword || !newPassword) {
      setError("Vui lòng nhập cả mật khẩu hiện tại và mật khẩu mới.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }
    if (newPassword === currentPassword) {
      setError("Mật khẩu mới cần khác mật khẩu hiện tại.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError("Mật khẩu nhập lại chưa khớp.");
      return;
    }

    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await changePassword(session.accessToken, { currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setSuccess("Đã đổi mật khẩu thành công.");
    } catch (passwordError) {
      if (
        passwordError instanceof ApiError &&
        passwordError.errorCode === "AUTH_401_INVALID_CREDENTIALS"
      ) {
        setError("Mật khẩu hiện tại không đúng.");
        return;
      }
      setError(asErrorMessage(passwordError));
    } finally {
      setBusy(false);
    }
  };

  const handleRefreshToken = async () => {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await refreshSession();
      await load();
      setSuccess("Đã làm mới phiên đăng nhập.");
    } catch (refreshError) {
      setError(asErrorMessage(refreshError));
    } finally {
      setBusy(false);
    }
  };

  const togglePanel = (panel: ActivePanel) => {
    setError("");
    setSuccess("");
    setActivePanel(prev => (prev === panel ? null : panel));
  };

  const resolvedFullName = profile?.fullName ?? session?.fullName ?? "Người dùng";
  const roleLabel = formatRoleLabel(session?.role);
  const lockLabel = formatBooleanLabel(profile?.isLocked ?? false, "Đã khóa", "Hoạt động");
  const initials = useMemo(() => getInitials(resolvedFullName), [resolvedFullName]);
  const phoneDisplay = profile?.phoneNumber?.trim() || "Chưa cập nhật";
  const isLocked = profile?.isLocked ?? false;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      {/* Sticky Header */}
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Text style={styles.headerTitle}>Hồ sơ cá nhân</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar + Info Hero */}
        <View style={styles.heroSection}>
          {/* Avatar */}
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.avatarCameraBadge}>
              <Text style={styles.cameraIcon}>📷</Text>
            </View>
          </View>

          {/* Name + Role */}
          <View style={styles.heroMeta}>
            <View style={styles.nameRow}>
              <Text style={styles.heroName}>{resolvedFullName}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>{roleLabel.toUpperCase()}</Text>
              </View>
            </View>

            {/* Contact info */}
            <View style={styles.contactList}>
              <View style={styles.contactRow}>
                <Text style={styles.contactIcon}>✉️</Text>
                <Text style={styles.contactText}>{session?.email ?? "-"}</Text>
              </View>
              <View style={styles.contactRow}>
                <Text style={styles.contactIcon}>📞</Text>
                <Text style={styles.contactText}>{phoneDisplay}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Status row */}
        <View style={styles.statusRow}>
          <View style={[styles.statusPill, isLocked ? styles.statusPillDanger : styles.statusPillSuccess]}>
            <Text style={[styles.statusPillText, isLocked ? styles.statusTextDanger : styles.statusTextSuccess]}>
              {isLocked ? "🔒 Đã khóa" : "✅ Hoạt động"}
            </Text>
          </View>
          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>
              {session ? "🟢 Phiên đang hoạt động" : "⚪ Không có phiên"}
            </Text>
          </View>
        </View>

        {/* Messages */}
        {!!error && (
          <View style={styles.messageBox}>
            <Text style={styles.messageBadge}>⚠️ Lỗi</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        {!!success && (
          <View style={[styles.messageBox, styles.successBox]}>
            <Text style={styles.messageBadge}>✅ Thành công</Text>
            <Text style={styles.successText}>{success}</Text>
          </View>
        )}

        {/* Action Cards */}
        <View style={styles.actionList}>

          {/* Edit Profile */}
          <View style={styles.actionCard}>
            <Pressable
              style={({ pressed }) => [styles.actionCardHeader, pressed && styles.actionCardPressed]}
              onPress={() => togglePanel("edit")}
            >
              <View style={styles.actionIconWrap}>
                <Text style={styles.actionIconEmoji}>✏️</Text>
              </View>
              <View style={styles.actionCardText}>
                <Text style={styles.actionCardTitle}>Chỉnh sửa hồ sơ</Text>
                <Text style={styles.actionCardSub}>Thay đổi thông tin cá nhân</Text>
              </View>
              <Text style={styles.chevron}>{activePanel === "edit" ? "⌃" : "›"}</Text>
            </Pressable>

            {activePanel === "edit" && (
              <View style={styles.actionCardBody}>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Họ và tên</Text>
                  <TextInput
                    style={styles.formInput}
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Nhập họ và tên"
                    placeholderTextColor={colors.textMuted}
                    selectionColor={colors.primary}
                  />
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Số điện thoại</Text>
                  <TextInput
                    style={styles.formInput}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    placeholder="09xx xxx xxx"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="phone-pad"
                    selectionColor={colors.primary}
                  />
                </View>
                <Pressable
                  style={({ pressed }) => [styles.saveButton, busy && styles.saveButtonDisabled, pressed && !busy && styles.saveButtonPressed]}
                  onPress={() => void handleUpdateProfile()}
                  disabled={busy}
                >
                  <Text style={styles.saveButtonText}>{busy ? "Đang lưu..." : "Lưu hồ sơ"}</Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* Change Password */}
          <View style={styles.actionCard}>
            <Pressable
              style={({ pressed }) => [styles.actionCardHeader, pressed && styles.actionCardPressed]}
              onPress={() => togglePanel("password")}
            >
              <View style={styles.actionIconWrap}>
                <Text style={styles.actionIconEmoji}>🔑</Text>
              </View>
              <View style={styles.actionCardText}>
                <Text style={styles.actionCardTitle}>Cập nhật mật khẩu</Text>
                <Text style={styles.actionCardSub}>Bảo mật tài khoản</Text>
              </View>
              <Text style={styles.chevron}>{activePanel === "password" ? "⌃" : "›"}</Text>
            </Pressable>

            {activePanel === "password" && (
              <View style={styles.actionCardBody}>
                {/* Current Password */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Mật khẩu hiện tại</Text>
                  <View style={styles.inputRow}>
                    <TextInput
                      style={[styles.formInput, styles.inputFlex]}
                      value={currentPassword}
                      onChangeText={setCurrentPassword}
                      placeholder="••••••••"
                      placeholderTextColor={colors.textMuted}
                      secureTextEntry={!showCurrent}
                      selectionColor={colors.primary}
                    />
                    <Pressable style={styles.eyeBtn} onPress={() => setShowCurrent(v => !v)}>
                      <Text>{showCurrent ? "🙈" : "👁️"}</Text>
                    </Pressable>
                  </View>
                </View>
                {/* New Password */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Mật khẩu mới</Text>
                  <View style={styles.inputRow}>
                    <TextInput
                      style={[styles.formInput, styles.inputFlex]}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      placeholder="Ít nhất 6 ký tự"
                      placeholderTextColor={colors.textMuted}
                      secureTextEntry={!showNew}
                      selectionColor={colors.primary}
                    />
                    <Pressable style={styles.eyeBtn} onPress={() => setShowNew(v => !v)}>
                      <Text>{showNew ? "🙈" : "👁️"}</Text>
                    </Pressable>
                  </View>
                </View>
                {/* Confirm Password */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Nhập lại mật khẩu mới</Text>
                  <View style={styles.inputRow}>
                    <TextInput
                      style={[styles.formInput, styles.inputFlex]}
                      value={confirmNewPassword}
                      onChangeText={setConfirmNewPassword}
                      placeholder="••••••••"
                      placeholderTextColor={colors.textMuted}
                      secureTextEntry={!showConfirm}
                      selectionColor={colors.primary}
                    />
                    <Pressable style={styles.eyeBtn} onPress={() => setShowConfirm(v => !v)}>
                      <Text>{showConfirm ? "🙈" : "👁️"}</Text>
                    </Pressable>
                  </View>
                </View>
                <Pressable
                  style={({ pressed }) => [styles.saveButton, styles.saveButtonSecondary, busy && styles.saveButtonDisabled, pressed && !busy && styles.saveButtonPressed]}
                  onPress={() => void handleChangePassword()}
                  disabled={busy}
                >
                  <Text style={[styles.saveButtonText, styles.saveButtonSecondaryText]}>
                    {busy ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
                  </Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* Account Info */}
          <View style={styles.actionCard}>
            <Pressable
              style={({ pressed }) => [styles.actionCardHeader, pressed && styles.actionCardPressed]}
              onPress={() => togglePanel("info")}
            >
              <View style={styles.actionIconWrap}>
                <Text style={styles.actionIconEmoji}>🪪</Text>
              </View>
              <View style={styles.actionCardText}>
                <Text style={styles.actionCardTitle}>Thông tin tài khoản</Text>
                <Text style={styles.actionCardSub}>Chi tiết định danh hệ thống</Text>
              </View>
              <Text style={styles.chevron}>{activePanel === "info" ? "⌃" : "›"}</Text>
            </Pressable>

            {activePanel === "info" && (
              <View style={styles.actionCardBody}>
                <View style={styles.infoList}>
                  {[
                    { label: "Email", value: session?.email ?? "-" },
                    { label: "Vai trò", value: roleLabel },
                    { label: "Họ tên", value: profile?.fullName ?? "-" },
                    { label: "Số điện thoại", value: phoneDisplay },
                    { label: "Trạng thái", value: lockLabel }
                  ].map(({ label, value }) => (
                    <View key={label} style={styles.infoRow}>
                      <Text style={styles.infoLabel}>{label}</Text>
                      <Text style={styles.infoValue}>{value}</Text>
                    </View>
                  ))}
                </View>
                <Pressable
                  style={({ pressed }) => [styles.saveButton, styles.saveButtonSecondary, busy && styles.saveButtonDisabled, pressed && !busy && styles.saveButtonPressed]}
                  onPress={() => void handleRefreshToken()}
                  disabled={busy}
                >
                  <Text style={[styles.saveButtonText, styles.saveButtonSecondaryText]}>
                    {busy ? "Đang làm mới..." : "Làm mới phiên đăng nhập"}
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>

        {/* Logout Button */}
        <Pressable
          style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutButtonPressed]}
          onPress={() => void logout()}
        >
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f0f4ff"
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9"
  },
  headerSpacer: {
    width: 40
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
    flex: 1
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: {
    paddingBottom: 40,
    gap: 0
  },

  // Hero
  heroSection: {
    alignItems: "center",
    paddingTop: 32,
    paddingBottom: 16,
    paddingHorizontal: 24,
    backgroundColor: "#ffffff",
    gap: 16
  },
  avatarWrap: {
    position: "relative"
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#f0f4ff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4
  },
  avatarText: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "800"
  },
  avatarCameraBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff"
  },
  cameraIcon: {
    fontSize: 12
  },
  heroMeta: {
    alignItems: "center",
    gap: 10
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  heroName: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.3
  },
  roleBadge: {
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 2
  },
  roleBadgeText: {
    color: "#2563eb",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8
  },
  contactList: {
    gap: 4,
    alignItems: "center"
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  contactIcon: {
    fontSize: 14
  },
  contactText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: "500"
  },

  // Status pills
  statusRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9"
  },
  statusPill: {
    backgroundColor: "#f1f5f9",
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 5
  },
  statusPillSuccess: {
    backgroundColor: colors.successSoft
  },
  statusPillDanger: {
    backgroundColor: colors.dangerSoft
  },
  statusPillText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: "600"
  },
  statusTextSuccess: {
    color: colors.success
  },
  statusTextDanger: {
    color: colors.danger
  },

  // Messages
  messageBox: {
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 14,
    padding: 14,
    gap: 4
  },
  successBox: {
    backgroundColor: "#eff6ff",
    borderColor: "#bfdbfe"
  },
  messageBadge: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text
  },
  errorText: {
    fontSize: 13,
    color: colors.danger,
    lineHeight: 19
  },
  successText: {
    fontSize: 13,
    color: colors.success,
    lineHeight: 19
  },

  // Action Cards
  actionList: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12
  },
  actionCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1
  },
  actionCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 14
  },
  actionCardPressed: {
    backgroundColor: "#f0f4ff"
  },
  actionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  },
  actionIconEmoji: {
    fontSize: 18
  },
  actionCardText: {
    flex: 1,
    gap: 2
  },
  actionCardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text
  },
  actionCardSub: {
    fontSize: 12,
    color: colors.textMuted
  },
  chevron: {
    fontSize: 20,
    color: "#cbd5e1",
    fontWeight: "300"
  },

  // Expanded panel body
  actionCardBody: {
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    padding: 16,
    gap: 14
  },

  // Form elements inside panels
  formGroup: {
    gap: 6
  },
  formLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
    marginLeft: 2
  },
  formInput: {
    backgroundColor: "#f0f4ff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: colors.text
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f4ff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    overflow: "hidden"
  },
  inputFlex: {
    flex: 1,
    borderWidth: 0,
    backgroundColor: "transparent"
  },
  eyeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center"
  },

  // Save button in panels
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4
  },
  saveButtonSecondary: {
    backgroundColor: colors.primarySoft
  },
  saveButtonDisabled: {
    opacity: 0.6
  },
  saveButtonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }]
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700"
  },
  saveButtonSecondaryText: {
    color: colors.primaryStrong
  },

  // Info list inside account info panel
  infoList: {
    gap: 0,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    borderRadius: 12,
    overflow: "hidden"
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f4ff"
  },
  infoLabel: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: "500"
  },
  infoValue: {
    fontSize: 13,
    color: colors.text,
    fontWeight: "600",
    maxWidth: "60%",
    textAlign: "right"
  },

  // Logout
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 16,
    paddingVertical: 16
  },
  logoutButtonPressed: {
    backgroundColor: "#fee2e2"
  },
  logoutIcon: {
    fontSize: 18
  },
  logoutText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#dc2626"
  }
});
