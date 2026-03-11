import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import ScreenLayout from "../../../shared/ui/ScreenLayout";
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
import ActionButton from "../../../shared/ui/ActionButton";
import LabeledInput from "../../../shared/ui/LabeledInput";
import SectionCard from "../../../shared/ui/SectionCard";
import StatusBadge from "../../../shared/ui/StatusBadge";
import MetricTile from "../../../shared/ui/MetricTile";
import DetailRow from "../../../shared/ui/DetailRow";
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

  if (!parts.length) {
    return "U";
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
};

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

  const load = async () => {
    if (!session) {
      return;
    }

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
      await changePassword(session.accessToken, {
        currentPassword,
        newPassword
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setSuccess("Đã đổi mật khẩu");
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

  const resolvedFullName = profile?.fullName ?? session?.fullName ?? "Người dùng";
  const roleLabel = formatRoleLabel(session?.role);
  const lockLabel = formatBooleanLabel(profile?.isLocked ?? false, "Đã khóa", "Hoạt động");
  const initials = useMemo(() => getInitials(resolvedFullName), [resolvedFullName]);

  return (
    <ScreenLayout
      title="Tài khoản"
      subtitle="Quản lý thông tin cá nhân, mật khẩu và phiên đăng nhập hiện tại"
    >
      <SectionCard tone="primary">
        <View style={styles.heroRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.heroContent}>
            <Text style={styles.heroName}>{resolvedFullName}</Text>
            <Text style={styles.heroEmail}>{session?.email ?? "-"}</Text>
            <View style={styles.badgeRow}>
              <StatusBadge label={roleLabel} tone="primary" />
              <StatusBadge
                label={lockLabel}
                tone={profile?.isLocked ? "danger" : "success"}
              />
            </View>
          </View>
        </View>

        <View style={styles.metricGrid}>
          <MetricTile
            label="Số điện thoại"
            value={profile?.phoneNumber?.trim() ? profile.phoneNumber : "Chưa cập nhật"}
            helper="Thông tin dùng để staff và hệ thống liên hệ"
          />
          <MetricTile
            label="Phiên hiện tại"
            value={session ? "Đang hoạt động" : "Không có"}
            helper="Có thể làm mới token mà không cần đăng nhập lại"
            tone="success"
          />
        </View>
      </SectionCard>

      {!!error ? (
        <SectionCard tone="danger">
          <Text style={styles.messageTitle}>Có lỗi xảy ra</Text>
          <Text style={styles.error}>{error}</Text>
        </SectionCard>
      ) : null}

      {!!success ? (
        <SectionCard tone="success">
          <Text style={styles.messageTitle}>Cập nhật thành công</Text>
          <Text style={styles.success}>{success}</Text>
        </SectionCard>
      ) : null}

      <SectionCard
        title="Thông tin từ hệ thống"
        subtitle="Dữ liệu hồ sơ hiện đang đồng bộ với tài khoản đang đăng nhập"
      >
        <View style={styles.detailList}>
          <DetailRow label="Email đăng nhập" value={session?.email ?? "-"} />
          <DetailRow label="Vai trò hiện tại" value={roleLabel} />
          <DetailRow label="Họ tên" value={profile?.fullName ?? "-"} />
          <DetailRow
            label="Số điện thoại"
            value={profile?.phoneNumber?.trim() ? profile.phoneNumber : "Chưa cập nhật"}
          />
          <DetailRow label="Trạng thái khóa" value={lockLabel} />
        </View>
      </SectionCard>

      <SectionCard
        title="Cập nhật hồ sơ"
        subtitle="Giữ lại email đăng nhập hiện tại, chỉ chỉnh thông tin hiển thị và liên hệ"
      >
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
      </SectionCard>

      <SectionCard
        title="Đổi mật khẩu"
        subtitle="Dùng khi bạn muốn thay mật khẩu của tài khoản hiện tại"
      >
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
          hint="Ít nhất 6 ký tự và nên khác mật khẩu hiện tại."
        />
        <LabeledInput
          label="Nhập lại mật khẩu mới"
          value={confirmNewPassword}
          onChangeText={setConfirmNewPassword}
          secureTextEntry
        />
        <ActionButton
          label={busy ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
          onPress={() => void handleChangePassword()}
          disabled={busy}
          variant="secondary"
        />
      </SectionCard>

      <SectionCard
        title="Phiên đăng nhập"
        subtitle="Làm mới token hoặc đăng xuất khỏi thiết bị này"
      >
        <ActionButton
          label={busy ? "Đang làm mới..." : "Làm mới phiên đăng nhập"}
          onPress={() => void handleRefreshToken()}
          disabled={busy}
          variant="secondary"
        />
        <ActionButton label="Đăng xuất" onPress={() => void logout()} variant="danger" />
      </SectionCard>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center"
  },
  avatarText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800"
  },
  heroContent: {
    flex: 1,
    gap: 4
  },
  heroName: {
    color: colors.text,
    fontSize: 21,
    fontWeight: "800"
  },
  heroEmail: {
    color: colors.textSoft,
    fontSize: 13,
    lineHeight: 18
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 2
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  detailList: {
    gap: 10
  },
  messageTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800"
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    lineHeight: 18
  },
  success: {
    color: colors.success,
    fontSize: 13,
    lineHeight: 18
  }
});
