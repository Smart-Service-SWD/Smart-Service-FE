import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import ScreenLayout from "../../../shared/ui/ScreenLayout";
import { colors } from "../../../app/theme/colors";
import { asErrorMessage } from "../../../shared/utils/format";
import type { AuthStackParamList } from "../../../app/navigation/types";
import ActionButton from "../../../shared/ui/ActionButton";
import LabeledInput from "../../../shared/ui/LabeledInput";
import { forgotPasswordApi } from "../api/authApi";

type ForgotPasswordScreenProps = NativeStackScreenProps<
  AuthStackParamList,
  "ForgotPassword"
>;

export default function ForgotPasswordScreen({
  route,
  navigation
}: ForgotPasswordScreenProps) {
  const [email, setEmail] = useState(route.params?.email ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (route.params?.email) {
      setEmail(route.params.email);
    }
  }, [route.params?.email]);

  const onSubmit = async () => {
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setError("Vui lòng nhập email.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setError("Email không hợp lệ.");
      return;
    }

    setBusy(true);
    setError("");
    setSuccess("");

    try {
      const result = await forgotPasswordApi({ email: normalizedEmail });
      setSuccess(result.message);
    } catch (submissionError) {
      setError(asErrorMessage(submissionError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenLayout
      title="Quên mật khẩu"
      subtitle="Nhập email để hệ thống gửi OTP 6 số về Gmail đã đăng ký"
    >
      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>Cách dùng</Text>
        <Text style={styles.heroText}>1. Nhập đúng email tài khoản.</Text>
        <Text style={styles.heroText}>2. Nhấn gửi OTP.</Text>
        <Text style={styles.heroText}>3. Mở Gmail lấy mã và sang bước đặt lại mật khẩu.</Text>
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

        {!!error ? <Text style={styles.error}>{error}</Text> : null}
        {!!success ? <Text style={styles.success}>{success}</Text> : null}

        <ActionButton
          label={busy ? "Đang gửi OTP..." : "Gửi OTP"}
          onPress={() => void onSubmit()}
          disabled={busy}
        />
        <ActionButton
          label="Tôi đã có OTP"
          onPress={() =>
            navigation.navigate("ResetPassword", { email: email.trim() || undefined })
          }
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
