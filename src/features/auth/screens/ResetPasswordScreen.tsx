import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors } from "../../../app/theme/colors";
import BrandLogo from "../../../shared/ui/BrandLogo";
import { asErrorMessage } from "../../../shared/utils/format";
import type { AuthStackParamList } from "../../../app/navigation/types";
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
  const [showPassword, setShowPassword] = useState(false);
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
    const normalizedEmail = email.trim();
    const normalizedOtp = otp.trim();
    const normalizedNewPassword = newPassword.trim();

    if (!normalizedEmail || !normalizedOtp || !normalizedNewPassword) {
      setError("Vui lòng nhập đủ email, OTP và mật khẩu mới.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setError("Email không hợp lệ.");
      return;
    }
    if (!/^\d{6}$/.test(normalizedOtp)) {
      setError("OTP phải gồm đúng 6 chữ số.");
      return;
    }
    if (normalizedNewPassword.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }

    setBusy(true);
    setError("");
    setSuccess("");

    try {
      const result = await resetPasswordApi({
        email: normalizedEmail,
        otp: normalizedOtp,
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
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back */}
          <Pressable
            style={styles.backBtn}
            onPress={() => navigation.navigate("ForgotPassword")}
          >
            <Text style={styles.backText}><MaterialIcons name="arrow-back" size={14} color={colors.primary} /> Gửi lại OTP</Text>
          </Pressable>

          {/* Hero */}
          <View style={styles.hero}>
            <View style={styles.iconBubble}>
              <BrandLogo size={48} />
            </View>
            <Text style={styles.heroTitle}>Đặt lại mật khẩu</Text>
            <Text style={styles.heroSub}>
              Nhập email, mã OTP 6 số và mật khẩu mới để khôi phục tài khoản
            </Text>
          </View>

          {/* Notice */}
          <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}><MaterialIcons name="schedule" size={14} color="#9a3412" /> Lưu ý</Text>
            <Text style={styles.noticeText}>• OTP chỉ dùng một lần và hết hạn sau 15 phút.</Text>
            <Text style={styles.noticeText}>• Sau khi đặt lại, đăng nhập bằng mật khẩu mới.</Text>
          </View>

          {/* Form card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Nhập thông tin</Text>

            {/* Email */}
            <View>
              <Text style={styles.fieldLabel}>Email</Text>
              <View style={styles.inputWrap}>
                <MaterialIcons name="mail-outline" size={18} color="#64748b" />
                <TextInput
                  style={styles.input}
                  placeholder="Email tài khoản"
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            {/* OTP */}
            <View>
              <Text style={styles.fieldLabel}>Mã OTP (6 chữ số)</Text>
              <View style={styles.inputWrap}>
                <MaterialIcons name="pin" size={18} color="#64748b" />
                <TextInput
                  style={styles.input}
                  placeholder="Nhập 6 chữ số từ Gmail"
                  placeholderTextColor="#94a3b8"
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </View>
            </View>

            {/* New Password */}
            <View>
              <Text style={styles.fieldLabel}>Mật khẩu mới</Text>
              <View style={styles.inputWrap}>
                <MaterialIcons name="lock-outline" size={18} color="#64748b" />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Tối thiểu 6 ký tự"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry={!showPassword}
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
                <Pressable onPress={() => setShowPassword((p) => !p)} style={styles.eyeBtn}>
                  <MaterialIcons name={showPassword ? "visibility-off" : "visibility"} size={20} color="#64748b" />
                </Pressable>
              </View>
            </View>

            {!!error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}><MaterialIcons name="warning-amber" size={14} color={colors.danger} /> {error}</Text>
              </View>
            )}
            {!!success && (
              <View style={styles.successBox}>
                <Text style={styles.successText}><MaterialIcons name="check-circle" size={14} color="#1d4ed8" /> {success}</Text>
              </View>
            )}

            <Pressable
              style={({ pressed }) => [
                styles.submitBtn,
                (busy || !!success || pressed) && styles.submitPressed
              ]}
              onPress={() => void onSubmit()}
              disabled={busy || !!success}
            >
              {busy ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitText}>Đặt lại mật khẩu</Text>
              )}
            </Pressable>

            <Pressable
              style={styles.secondaryBtn}
              onPress={() => navigation.navigate("Login")}
            >
              <Text style={styles.secondaryText}><MaterialIcons name="arrow-back" size={14} color="#64748b" /> Quay lại đăng nhập</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f0f4ff" },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 20
  },

  backBtn: { alignSelf: "flex-start" },
  backText: { fontSize: 14, color: colors.primary, fontWeight: "700" },

  hero: { alignItems: "center", gap: 10 },
  iconBubble: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden"
  },
  heroTitle: { fontSize: 24, fontWeight: "800", color: "#0f172a" },
  heroSub: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 21
  },

  noticeCard: {
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: "#fed7aa",
    borderRadius: 16,
    padding: 16,
    gap: 6
  },
  noticeTitle: { fontSize: 14, fontWeight: "800", color: "#9a3412", marginBottom: 2 },
  noticeText: { fontSize: 13, color: "#9a3412", lineHeight: 20 },

  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 24,
    padding: 24,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3
  },
  cardTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a", marginBottom: 4 },
  fieldLabel: { fontSize: 12, fontWeight: "700", color: "#64748b", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },

  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f4ff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10
  },
  inputIcon: { fontSize: 16 },
  input: { flex: 1, fontSize: 15, color: "#0f172a", fontWeight: "500" },
  eyeBtn: { padding: 4 },
  eyeIcon: { fontSize: 18 },

  errorBox: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 12,
    padding: 12
  },
  errorText: { fontSize: 13, color: colors.danger, fontWeight: "500" },
  successBox: {
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
    borderRadius: 12,
    padding: 12
  },
  successText: { fontSize: 13, color: "#1d4ed8", fontWeight: "600" },

  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4
  },
  submitPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "800" },

  secondaryBtn: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center"
  },
  secondaryText: { color: "#64748b", fontSize: 14, fontWeight: "700" }
});
