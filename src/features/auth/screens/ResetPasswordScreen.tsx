import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import ScreenLayout from "../../../shared/ui/ScreenLayout";
import { colors } from "../../../app/theme/colors";
import { asErrorMessage } from "../../../shared/utils/format";
import type { AuthStackParamList } from "../../../app/navigation/types";
import ActionButton from "../../../shared/ui/ActionButton";
import LabeledInput from "../../../shared/ui/LabeledInput";
import { resetPasswordApi } from "../api/authApi";

type ResetPasswordScreenProps = NativeStackScreenProps<
  AuthStackParamList,
  "ResetPassword"
>;

export default function ResetPasswordScreen({
  navigation,
  route
}: ResetPasswordScreenProps) {
  const [email, setEmail] = useState(route.params?.email ?? "");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (route.params?.email) {
      setEmail(route.params.email);
    }
  }, [route.params?.email]);

  useEffect(() => {
    if (!success) {
      return undefined;
    }

    const timer = setTimeout(() => {
      navigation.replace("Login", {
        notice: "Đặt lại mật khẩu thành công. Hãy đăng nhập bằng mật khẩu mới."
      });
    }, 1500);

    return () => clearTimeout(timer);
  }, [navigation, success]);

  const onSubmit = async () => {
    if (!email.trim() || !otp.trim() || !newPassword.trim()) {
      setError("Vui lòng nhập đủ email, OTP và mật khẩu mới.");
      return;
    }
    if (newPassword.trim().length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }

    setBusy(true);
    setError("");
    setSuccess("");

    try {
      const result = await resetPasswordApi({
        email: email.trim(),
        otp: otp.trim(),
        newPassword
      });
      setSuccess(`${result.message} Đang quay lại màn hình đăng nhập...`);
      setOtp("");
      setNewPassword("");
    } catch (submissionError) {
      setError(asErrorMessage(submissionError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenLayout
      title="Đặt lại mật khẩu"
      subtitle="Nhập email, OTP 6 số và mật khẩu mới để hoàn tất khôi phục tài khoản"
    >
      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>Lưu ý</Text>
        <Text style={styles.heroText}>- OTP chỉ dùng một lần và hết hạn sau 15 phút.</Text>
        <Text style={styles.heroText}>- Sau khi đặt lại thành công, hãy đăng nhập lại bằng mật khẩu mới.</Text>
      </View>

      <View style={styles.card}>
        <LabeledInput
          label="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          placeholder="customer@example.com"
        />
        <LabeledInput
          label="OTP"
          value={otp}
          onChangeText={setOtp}
          keyboardType="number-pad"
          placeholder="6 chữ số"
        />
        <LabeledInput
          label="Mật khẩu mới"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          placeholder="Tối thiểu 6 ký tự"
        />

        {!!error ? <Text style={styles.error}>{error}</Text> : null}
        {!!success ? <Text style={styles.success}>{success}</Text> : null}

        <ActionButton
          label={busy ? "Đang đặt lại..." : "Đặt lại mật khẩu"}
          onPress={() => void onSubmit()}
          disabled={busy || !!success}
        />
        <ActionButton
          label="Gửi lại OTP"
          onPress={() => navigation.navigate("ForgotPassword")}
          variant="secondary"
        />
        <ActionButton
          label="Quay lại đăng nhập"
          onPress={() => navigation.navigate("Login")}
          variant="secondary"
        />
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    gap: 6
  },
  heroTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700"
  },
  heroText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    gap: 12
  },
  error: {
    color: colors.danger,
    fontSize: 13
  },
  success: {
    color: colors.success,
    fontSize: 13
  }
});
