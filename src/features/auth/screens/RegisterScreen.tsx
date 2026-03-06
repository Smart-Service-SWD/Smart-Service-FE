import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import ScreenLayout from "../../../shared/ui/ScreenLayout";
import { colors } from "../../../app/theme/colors";
import { useAuth } from "../AuthContext";
import { asErrorMessage } from "../../../shared/utils/format";
import type { AuthStackParamList } from "../../../app/navigation/types";
import ActionButton from "../../../shared/ui/ActionButton";
import LabeledInput from "../../../shared/ui/LabeledInput";

type RegisterScreenProps = NativeStackScreenProps<AuthStackParamList, "Register">;

export default function RegisterScreen({ navigation }: RegisterScreenProps) {
  const { register } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async () => {
    setBusy(true);
    setError("");

    try {
      await register({ fullName, email, phoneNumber, password });
    } catch (submissionError) {
      setError(asErrorMessage(submissionError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenLayout
      title="Tạo tài khoản"
      subtitle="Tài khoản mới sẽ mặc định là vai trò Khách hàng"
    >
      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>Hướng dẫn</Text>
        <Text style={styles.heroText}>- Nhập đúng email và số điện thoại đang dùng</Text>
        <Text style={styles.heroText}>- Mật khẩu nên từ 6 ký tự trở lên</Text>
        <Text style={styles.heroText}>- Sau khi đăng ký xong, hệ thống sẽ tự đăng nhập</Text>
      </View>

      <View style={styles.card}>
        <LabeledInput
          label="Họ và tên"
          value={fullName}
          onChangeText={setFullName}
          placeholder="Nguyễn Văn A"
        />

        <LabeledInput
          label="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          placeholder="customer@example.com"
        />

        <LabeledInput
          label="Số điện thoại"
          keyboardType="phone-pad"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          placeholder="0900000000"
        />

        <LabeledInput
          label="Mật khẩu"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Tối thiểu 6 ký tự"
          hint="Bạn có thể đổi mật khẩu sau trong mục Tài khoản"
        />

        {!!error ? <Text style={styles.error}>{error}</Text> : null}

        <ActionButton
          label={busy ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
          onPress={() => void onSubmit()}
          disabled={busy}
        />
        <ActionButton
          label="Quay lại đăng nhập"
          onPress={() => navigation.goBack()}
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
  }
});
