import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors } from "../../../app/theme/colors";
import { useAuth } from "../AuthContext";
import { asErrorMessage } from "../../../shared/utils/format";
import type { AuthStackParamList } from "../../../app/navigation/types";

type RegisterScreenProps = NativeStackScreenProps<AuthStackParamList, "Register">;

export default function RegisterScreen({ navigation }: RegisterScreenProps) {
  const { register } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async () => {
    const normalizedFullName = fullName.trim();
    const normalizedEmail = email.trim();
    const normalizedPhoneNumber = phoneNumber.trim();

    if (!normalizedFullName || !normalizedEmail || !normalizedPhoneNumber || !password) {
      setError("Vui lòng nhập đầy đủ họ tên, email, số điện thoại và mật khẩu.");
      return;
    }

    if (!normalizedEmail.includes("@")) {
      setError("Email không hợp lệ.");
      return;
    }

    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    if (!termsAccepted) {
      setError("Vui lòng đồng ý với điều khoản dịch vụ.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      await register({
        fullName: normalizedFullName,
        email: normalizedEmail,
        phoneNumber: normalizedPhoneNumber,
        password
      });
    } catch (submissionError) {
      setError(asErrorMessage(submissionError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      {/* Sticky Header */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Tạo tài khoản mới</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Chào mừng bạn! 👋</Text>
          <Text style={styles.welcomeSubtitle}>
            Vui lòng điền thông tin bên dưới để bắt đầu sử dụng các dịch vụ của chúng tôi.
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Full Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Họ và tên</Text>
            <View style={styles.inputWrap}>
              <Text style={styles.inputIcon}>👤</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập họ và tên của bạn"
                placeholderTextColor={colors.textMuted}
                value={fullName}
                onChangeText={setFullName}
                selectionColor={colors.primary}
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <View style={styles.inputWrap}>
              <Text style={styles.inputIcon}>✉️</Text>
              <TextInput
                style={styles.input}
                placeholder="example@gmail.com"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                selectionColor={colors.primary}
              />
            </View>
          </View>

          {/* Phone */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Số điện thoại</Text>
            <View style={styles.inputWrap}>
              <Text style={styles.inputIcon}>📞</Text>
              <TextInput
                style={styles.input}
                placeholder="09xx xxx xxx"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                selectionColor={colors.primary}
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Mật khẩu</Text>
            <View style={styles.inputWrap}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={[styles.input, styles.inputWithAction]}
                placeholder="••••••••"
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                selectionColor={colors.primary}
              />
              <Pressable
                style={styles.eyeButton}
                onPress={() => setShowPassword(v => !v)}
              >
                <Text style={styles.eyeIcon}>{showPassword ? "🙈" : "👁️"}</Text>
              </Pressable>
            </View>
          </View>

          {/* Confirm Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Xác nhận mật khẩu</Text>
            <View style={styles.inputWrap}>
              <Text style={styles.inputIcon}>🔑</Text>
              <TextInput
                style={[styles.input, styles.inputWithAction]}
                placeholder="••••••••"
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                selectionColor={colors.primary}
              />
              <Pressable
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(v => !v)}
              >
                <Text style={styles.eyeIcon}>{showConfirmPassword ? "🙈" : "👁️"}</Text>
              </Pressable>
            </View>
          </View>

          {/* Terms Checkbox */}
          <Pressable
            style={styles.termsRow}
            onPress={() => setTermsAccepted(v => !v)}
          >
            <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
              {termsAccepted && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.termsText}>
              Tôi đồng ý với các{" "}
              <Text style={styles.termsLink}>Điều khoản dịch vụ</Text>
              {" "}và{" "}
              <Text style={styles.termsLink}>Chính sách bảo mật</Text>
              {" "}của nền tảng.
            </Text>
          </Pressable>

          {/* Error */}
          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          )}

          {/* Register Button */}
          <Pressable
            style={({ pressed }) => [
              styles.submitButton,
              busy && styles.submitButtonDisabled,
              pressed && !busy && styles.submitButtonPressed
            ]}
            onPress={() => void onSubmit()}
            disabled={busy}
          >
            <Text style={styles.submitButtonText}>
              {busy ? "Đang tạo tài khoản..." : "Đăng ký"}
            </Text>
          </Pressable>
        </View>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Hoặc đăng ký bằng</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Social Buttons */}
        <View style={styles.socialRow}>
          <Pressable style={({ pressed }) => [styles.socialButton, pressed && styles.socialButtonPressed]}>
            <Text style={styles.socialIcon}>G</Text>
            <Text style={styles.socialLabel}>Google</Text>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.socialButton, pressed && styles.socialButtonPressed]}>
            <Text style={[styles.socialIcon, { color: "#1877F2" }]}>f</Text>
            <Text style={styles.socialLabel}>Facebook</Text>
          </Pressable>
        </View>

        {/* Login Link */}
        <View style={styles.loginRow}>
          <Text style={styles.loginText}>Đã có tài khoản? </Text>
          <Pressable onPress={() => navigation.goBack()}>
            <Text style={styles.loginLink}>Đăng nhập</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9"
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
    flex: 1,
    textAlign: "center"
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center"
  },
  backButtonPressed: {
    backgroundColor: "#f1f5f9"
  },
  backIcon: {
    fontSize: 20,
    color: colors.text
  },

  // Scroll
  scroll: {
    flex: 1
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
    gap: 24
  },

  // Welcome
  welcomeSection: {
    gap: 6
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.5
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 21
  },

  // Form
  form: {
    gap: 18
  },
  inputGroup: {
    gap: 6
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
    marginLeft: 4
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f4ff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    overflow: "hidden"
  },
  inputIcon: {
    fontSize: 16,
    paddingLeft: 14,
    paddingRight: 4
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    fontSize: 14,
    color: colors.text
  },
  inputWithAction: {
    paddingRight: 4
  },
  eyeButton: {
    paddingHorizontal: 12,
    paddingVertical: 14,
    justifyContent: "center",
    alignItems: "center"
  },
  eyeIcon: {
    fontSize: 16
  },

  // Terms
  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginTop: 4
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "#cbd5e1",
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
    flexShrink: 0
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  checkmark: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800"
  },
  termsText: {
    flex: 1,
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 19
  },
  termsLink: {
    color: colors.primary,
    fontWeight: "600"
  },

  // Error
  errorBox: {
    backgroundColor: "#fef2f2",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#fecaca"
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    lineHeight: 18
  },

  // Submit button
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4
  },
  submitButtonDisabled: {
    opacity: 0.65
  },
  submitButtonPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.92
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800"
  },

  // Divider
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#f1f5f9"
  },
  dividerText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: "500"
  },

  // Social
  socialRow: {
    flexDirection: "row",
    gap: 12
  },
  socialButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    backgroundColor: colors.surface,
    gap: 8
  },
  socialButtonPressed: {
    backgroundColor: "#f0f4ff"
  },
  socialIcon: {
    fontSize: 18,
    fontWeight: "800",
    color: "#ea4335"
  },
  socialLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155"
  },

  // Login link
  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center"
  },
  loginText: {
    fontSize: 14,
    color: colors.textMuted
  },
  loginLink: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "700"
  }
});
