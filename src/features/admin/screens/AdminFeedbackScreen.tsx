import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../../app/theme/colors";
import BrandLogo from "../../../shared/ui/BrandLogo";
import { useAuth } from "../../auth/AuthContext";
import { graphqlRequest } from "../../../shared/api/graphqlClient";
import {
  ALL_REQUESTS_QUERY,
  SERVICE_FEEDBACKS_QUERY,
  USERS_QUERY
} from "../../../shared/api/graphqlDocuments";
import {
  asErrorMessage,
  formatDateTime,
  formatRequestStatus,
  formatShortId
} from "../../../shared/utils/format";
import type {
  ServiceFeedbackItem,
  ServiceRequestItem,
  UserProfile
} from "../../../shared/types/domain";
import ActionButton from "../../../shared/ui/ActionButton";

interface ServiceFeedbacksResponse {
  getServiceFeedbacks: ServiceFeedbackItem[];
}

interface AllRequestsResponse {
  getServiceRequests: ServiceRequestItem[];
}

interface UsersResponse {
  getUsers: UserProfile[];
}

const getRatingColor = (rating: number) => {
  if (rating >= 4) return { bg: "#f0fdf4", text: "#16a34a" };
  if (rating === 3) return { bg: "#fefce8", text: "#ca8a04" };
  return { bg: "#fef2f2", text: "#dc2626" };
};

export default function AdminFeedbackScreen() {
  const { session } = useAuth();
  const [feedbacks, setFeedbacks] = useState<ServiceFeedbackItem[]>([]);
  const [requestsById, setRequestsById] = useState<Record<string, ServiceRequestItem>>({});
  const [userNamesById, setUserNamesById] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const averageRating = useMemo(() => {
    if (!feedbacks.length) return 0;
    const total = feedbacks.reduce((sum, item) => sum + item.rating, 0);
    return Number((total / feedbacks.length).toFixed(1));
  }, [feedbacks]);

  const lowRatingCount = useMemo(
    () => feedbacks.filter((item) => item.rating <= 2).length,
    [feedbacks]
  );

  const load = async () => {
    if (!session) return;
    setLoading(true);
    setError("");
    try {
      const [feedbackData, requestData, userData] = await Promise.all([
        graphqlRequest<ServiceFeedbacksResponse>(
          SERVICE_FEEDBACKS_QUERY,
          undefined,
          session.accessToken
        ),
        graphqlRequest<AllRequestsResponse>(
          ALL_REQUESTS_QUERY,
          undefined,
          session.accessToken
        ),
        graphqlRequest<UsersResponse>(USERS_QUERY, undefined, session.accessToken)
      ]);
      setFeedbacks(feedbackData.getServiceFeedbacks);
      setRequestsById(
        Object.fromEntries(requestData.getServiceRequests.map((r) => [r.id, r]))
      );
      setUserNamesById(
        Object.fromEntries(userData.getUsers.map((u) => [u.id, u.fullName]))
      );
    } catch (loadError) {
      setError(asErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logoBox}>
              <BrandLogo size={40} />
            </View>
            <View>
              <Text style={styles.headerTitle}>Lịch sử feedback</Text>
              <Text style={styles.headerSub}>Phản hồi khách hàng</Text>
            </View>
          </View>
        </View>

        {/* Error */}
        {!!error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}><MaterialIcons name="warning-amber" size={14} color={colors.danger} /> {error}</Text>
          </View>
        )}
        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.primary} size="small" />
            <Text style={styles.loadingText}>Đang tải...</Text>
          </View>
        )}

        {/* Overview */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tổng quan phản hồi</Text>
          <View style={styles.countRow}>
            <View style={styles.countBadge}>
              <Text style={styles.countNumber}>{feedbacks.length}</Text>
              <Text style={styles.countLabel}>Tổng feedback</Text>
            </View>
            <View style={styles.countBadge}>
              <Text style={styles.countNumber}>{averageRating}/5</Text>
              <Text style={styles.countLabel}>Trung bình</Text>
            </View>
            <View style={styles.countBadge}>
              <Text style={styles.countNumber}>{lowRatingCount}</Text>
              <Text style={styles.countLabel}>Đánh giá thấp</Text>
            </View>
          </View>
          <ActionButton
            label={loading ? "Đang làm mới..." : "Làm mới feedback"}
            onPress={() => void load()}
            disabled={loading}
            variant="secondary"
          />
        </View>

        {/* Feedback list */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Toàn bộ lịch sử ({feedbacks.length})</Text>
          {feedbacks.map((feedback) => {
            const request = requestsById[feedback.serviceRequestId];
            const ratingColor = getRatingColor(feedback.rating);
            return (
              <View key={feedback.id} style={styles.feedbackItem}>
                <View style={styles.feedbackHeader}>
                  <Text style={styles.feedbackTitle} numberOfLines={2}>
                    {request?.description ?? `Yêu cầu ${formatShortId(feedback.serviceRequestId)}`}
                  </Text>
                  <View style={[styles.statusPill, { backgroundColor: ratingColor.bg }]}>
                    <Text style={[styles.statusText, { color: ratingColor.text }]}>
                      {feedback.rating}/5
                    </Text>
                  </View>
                </View>
                <View style={styles.badgeRow}>
                  <View style={[styles.statusPill, { backgroundColor: "#f0f4ff" }]}>
                    <Text style={[styles.statusText, { color: "#64748b" }]}>
                      {formatRequestStatus(request?.status)}
                    </Text>
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: "#eff6ff" }]}>
                    <Text style={[styles.statusText, { color: "#2563eb" }]}>
                      {formatDateTime(feedback.createdAt)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.metaText}>
                  Mã: {formatShortId(feedback.serviceRequestId)}
                </Text>
                <Text style={styles.metaText}>
                  Khách: {userNamesById[feedback.createdByUserId] ?? formatShortId(feedback.createdByUserId)}
                </Text>
                <Text style={styles.commentText}>
                  {feedback.comment?.trim() || "Khách hàng không để lại nhận xét chi tiết."}
                </Text>
              </View>
            );
          })}
          {!feedbacks.length ? (
            <Text style={styles.emptyText}>Chưa có feedback nào trong hệ thống.</Text>
          ) : null}
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f0f4ff" },
  scroll: { flex: 1 },
  content: { paddingTop: 16, paddingBottom: 20, gap: 14 },

  header: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.55)",
    gap: 14,
    alignItems: "flex-start",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 8,
    marginHorizontal: 20
  },
  headerLeft: { flexDirection: "row", gap: 12, flex: 1, alignItems: "flex-start" },
  logoBox: { width: 50, height: 50, borderRadius: 14, overflow: "hidden", flexShrink: 0 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#0f172a" },
  headerSub: { fontSize: 12, color: "#64748b", marginTop: 2 },

  errorBox: {
    marginHorizontal: 20,
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 12,
    padding: 12
  },
  errorText: { fontSize: 13, color: colors.danger },
  loadingRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 8 },
  loadingText: { fontSize: 13, color: "#64748b" },

  card: {
    marginHorizontal: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 20,
    padding: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2
  },
  cardTitle: { fontSize: 15, fontWeight: "800", color: "#0f172a" },

  countRow: { flexDirection: "row", gap: 10 },
  countBadge: {
    flex: 1,
    backgroundColor: "#f0f4ff",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0"
  },
  countNumber: { fontSize: 20, fontWeight: "800", color: colors.text },
  countLabel: { fontSize: 11, color: "#64748b", marginTop: 2 },

  feedbackItem: {
    backgroundColor: "#f0f4ff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    padding: 12,
    gap: 8
  },
  feedbackHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8
  },
  feedbackTitle: { flex: 1, fontSize: 13, fontWeight: "700", color: "#0f172a", lineHeight: 19 },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  statusPill: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 10, fontWeight: "800" },
  metaText: { fontSize: 11, color: "#64748b" },
  commentText: { fontSize: 13, color: "#374151", lineHeight: 19 },
  emptyText: { color: "#94a3b8", fontSize: 13, textAlign: "center", paddingVertical: 8 }
});
