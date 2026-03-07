import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import ScreenLayout from "../../../shared/ui/ScreenLayout";
import { colors } from "../../../app/theme/colors";
import { useAuth } from "../AuthContext";
import { asErrorMessage } from "../../../shared/utils/format";
import type { AuthStackParamList } from "../../../app/navigation/types";
import ActionButton from "../../../shared/ui/ActionButton";
import LabeledInput from "../../../shared/ui/LabeledInput";

type LoginScreenProps = NativeStackScreenProps<AuthStackParamList, "Login">;

export default function LoginScreen({ navigation, route }: LoginScreenProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(route.params?.notice ?? "");

  useEffect(() => {
    if (route.params?.notice) {
      setNotice(route.params.notice);
      navigation.setParams({ notice: undefined });
    }
  }, [navigation, route.params?.notice]);

  const onSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Vui lòng nhập đầy đủ email và mật khẩu.");
      return;
    }

    setBusy(true);
    setError("");
    setNotice("");

    try {
      await login({ email: email.trim(), password });
    } catch (submissionError) {
      setError(asErrorMessage(submissionError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenLayout
      title="Đăng nhập"
      subtitle="Sử dụng tài khoản đã có để truy cập hệ thống Smart Service"
    >
      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>Bắt đầu nhanh</Text>
        <Text style={styles.heroText}>1. Nhập email đã đăng ký</Text>
        <Text style={styles.heroText}>2. Nhập mật khẩu của bạn</Text>
        <Text style={styles.heroText}>3. Nhấn “Đăng nhập” để vào hệ thống</Text>
      </View>

      <View style={styles.card}>
        <LabeledInput
          label="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          placeholder="customer@example.com"
          hint="Ví dụ: customer@example.com"
        />

        <LabeledInput
          label="Mật khẩu"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          placeholder="Nhập mật khẩu"
          actionLabel={showPassword ? "Ẩn" : "Hiện"}
          onActionPress={() => setShowPassword((prev) => !prev)}
        />

        {!!notice ? <Text style={styles.notice}>{notice}</Text> : null}
        {!!error ? <Text style={styles.error}>{error}</Text> : null}

        <ActionButton
          label={busy ? "Đang đăng nhập..." : "Đăng nhập"}
          onPress={() => void onSubmit()}
          disabled={busy}
        />
        <ActionButton
          label="Quên mật khẩu"
          onPress={() => navigation.navigate("ForgotPassword")}
          variant="secondary"
        />
        <ActionButton
          label="Tạo tài khoản mới"
          onPress={() => navigation.navigate("Register")}
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
  notice: {
    color: colors.success,
    fontSize: 13
  }
});
