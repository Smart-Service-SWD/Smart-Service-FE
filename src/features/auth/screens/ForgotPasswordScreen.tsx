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
          <Pressable style={styles.backBtn} onPress={() => navigation.navigate("Login")}>
            <Text style={styles.backText}><MaterialIcons name="arrow-back" size={14} color={colors.primary} /> Quay lại đăng nhập</Text>
          </Pressable>

          {/* Hero */}
          <View style={styles.hero}>
            <View style={styles.iconBubble}>
              <BrandLogo size={48} />
            </View>
            <Text style={styles.heroTitle}>Quên mật khẩu?</Text>
            <Text style={styles.heroSub}>
              Nhập email để nhận mã OTP 6 số qua Gmail đã đăng ký
            </Text>
          </View>

          {/* Steps */}
          <View style={styles.stepsCard}>
            {["Nhập đúng email tài khoản", "Nhấn gửi OTP", "Mở Gmail lấy mã và sang bước đặt lại"].map(
              (step, i) => (
                <View key={i} style={styles.step}>
                  <View style={styles.stepBadge}>
                    <Text style={styles.stepNum}>{i + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              )
            )}
          </View>

          {/* Form card */}
          <View style={styles.card}>
            <View style={styles.inputWrap}>
              <MaterialIcons name="mail-outline" size={18} color="#64748b" />
              <TextInput
                style={styles.input}
                placeholder="Email của bạn"
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
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
              style={({ pressed }) => [styles.submitBtn, (busy || pressed) && styles.submitPressed]}
              onPress={() => void onSubmit()}
              disabled={busy}
            >
              {busy ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitText}>Gửi OTP</Text>
              )}
            </Pressable>

            <Pressable
              style={styles.secondaryBtn}
              onPress={() =>
                navigation.navigate("ResetPassword", { email: email.trim() || undefined })
              }
            >
              <Text style={styles.secondaryText}>Tôi đã có OTP <MaterialIcons name="arrow-forward" size={14} color={colors.primary} /></Text>
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

  stepsCard: {
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
    borderRadius: 18,
    padding: 18,
    gap: 12
  },
  step: { flexDirection: "row", alignItems: "center", gap: 12 },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  },
  stepNum: { color: "#fff", fontSize: 11, fontWeight: "800" },
  stepText: { fontSize: 13, color: "#1e40af", fontWeight: "600", flex: 1 },

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
    borderColor: "#bfdbfe",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#eff6ff"
  },
  secondaryText: { color: colors.primary, fontSize: 14, fontWeight: "700" }
});
