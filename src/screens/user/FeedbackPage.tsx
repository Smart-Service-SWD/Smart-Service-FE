import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { submitFeedback } from "../../services/userService";

interface Props {
  navigation: any;
  route: { params?: { serviceRequestId?: string } };
}

export const FeedbackScreen = ({ navigation, route }: Props) => {
  const serviceRequestId = route?.params?.serviceRequestId ?? "";
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!serviceRequestId) {
      Alert.alert("Lỗi", "Không xác định được yêu cầu dịch vụ");
      return;
    }
    if (rating === 0) {
      Alert.alert("Thiếu thông tin", "Vui lòng chọn số sao đánh giá");
      return;
    }
    if (!comment.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập nhận xét của bạn");
      return;
    }

    setLoading(true);
    try {
      await submitFeedback({ serviceRequestId, rating, comment: comment.trim() });
      Alert.alert("Cảm ơn!", "Đánh giá của bạn đã được ghi nhận.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      const msg = error?.response?.data?.message ?? error?.message ?? "Không thể gửi đánh giá";
      Alert.alert("Lỗi", msg);
    } finally {
      setLoading(false);
    }
  };

  const RATING_LABELS = ["", "Tệ", "Không tốt", "Bình thường", "Tốt", "Xuất sắc"];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đánh giá dịch vụ</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Star rating */}
        <View style={styles.ratingSection}>
          <Text style={styles.ratingTitle}>Bạn cảm thấy thế nào?</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map(i => (
              <TouchableOpacity key={i} onPress={() => setRating(i)} style={styles.starBtn}>
                <Ionicons
                  name={i <= rating ? "star" : "star-outline"}
                  size={42}
                  color={i <= rating ? "#FBBF24" : "#D1D5DB"}
                />
              </TouchableOpacity>
            ))}
          </View>
          {rating > 0 && (
            <Text style={styles.ratingLabel}>{RATING_LABELS[rating]}</Text>
          )}
        </View>

        {/* Comment */}
        <Text style={styles.label}>Nhận xét *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={comment}
          onChangeText={setComment}
          placeholder="Chia sẻ trải nghiệm của bạn về dịch vụ..."
          multiline
          numberOfLines={5}
          placeholderTextColor="#9CA3AF"
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[styles.submitBtn, (loading || rating === 0) && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading || rating === 0}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="send" size={18} color="#fff" />
              <Text style={styles.submitBtnText}>Gửi đánh giá</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    backgroundColor: "#F59E0B",
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backBtn: { padding: 4, width: 40 },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 18, fontWeight: "700", color: "#fff" },
  content: { padding: 24, paddingBottom: 40 },
  ratingSection: { alignItems: "center", paddingVertical: 32 },
  ratingTitle: { fontSize: 18, fontWeight: "700", color: "#1F2937", marginBottom: 20 },
  starsRow: { flexDirection: "row", gap: 8 },
  starBtn: { padding: 4 },
  ratingLabel: { marginTop: 12, fontSize: 16, fontWeight: "600", color: "#F59E0B" },
  label: { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 8 },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111827",
  },
  textArea: { minHeight: 130, textAlignVertical: "top" },
  submitBtn: {
    flexDirection: "row",
    backgroundColor: "#F59E0B",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 24,
  },
  submitBtnDisabled: { backgroundColor: "#FCD34D" },
  submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
