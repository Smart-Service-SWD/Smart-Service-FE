import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import ScreenLayout from "../../../shared/ui/ScreenLayout";
import { colors } from "../../../app/theme/colors";
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

export default function AdminFeedbackScreen() {
  const { session } = useAuth();
  const [feedbacks, setFeedbacks] = useState<ServiceFeedbackItem[]>([]);
  const [requestsById, setRequestsById] = useState<Record<string, ServiceRequestItem>>({});
  const [userNamesById, setUserNamesById] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const averageRating = useMemo(() => {
    if (!feedbacks.length) {
      return 0;
    }

    const total = feedbacks.reduce((sum, item) => sum + item.rating, 0);
    return Number((total / feedbacks.length).toFixed(1));
  }, [feedbacks]);

  const load = async () => {
    if (!session) {
      return;
    }

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
        Object.fromEntries(requestData.getServiceRequests.map((request) => [request.id, request]))
      );
      setUserNamesById(
        Object.fromEntries(userData.getUsers.map((user) => [user.id, user.fullName]))
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
    <ScreenLayout
      title="Lịch sử feedback"
      subtitle="Toàn bộ phản hồi khách hàng trong hệ thống"
    >
      {loading ? <Text style={styles.meta}>Đang tải feedback...</Text> : null}
      {!!error ? <Text style={styles.error}>{error}</Text> : null}

      <ActionButton
        label={loading ? "Đang làm mới..." : "Làm mới"}
        onPress={() => void load()}
        disabled={loading}
        variant="secondary"
      />

      <View style={styles.card}>
        <Text style={styles.title}>Tổng quan</Text>
        <Text style={styles.meta}>Tổng feedback: {feedbacks.length}</Text>
        <Text style={styles.meta}>Điểm trung bình: {averageRating}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Toàn bộ lịch sử</Text>
        {feedbacks.map((feedback) => {
          const request = requestsById[feedback.serviceRequestId];

          return (
            <View key={feedback.id} style={styles.item}>
              <Text style={styles.itemTitle}>
                {request?.description ?? `Yêu cầu ${formatShortId(feedback.serviceRequestId)}`}
              </Text>
              <Text style={styles.meta}>
                Mã yêu cầu: {formatShortId(feedback.serviceRequestId)}
              </Text>
              <Text style={styles.meta}>
                Khách hàng:{" "}
                {userNamesById[feedback.createdByUserId] ?? formatShortId(feedback.createdByUserId)}
              </Text>
              <Text style={styles.meta}>Điểm: {feedback.rating}/5</Text>
              <Text style={styles.meta}>Nhận xét: {feedback.comment?.trim() || "-"}</Text>
              <Text style={styles.meta}>
                Trạng thái yêu cầu: {formatRequestStatus(request?.status)}
              </Text>
              <Text style={styles.meta}>Gửi lúc: {formatDateTime(feedback.createdAt)}</Text>
            </View>
          );
        })}
        {!feedbacks.length ? (
          <Text style={styles.meta}>Chưa có feedback nào trong hệ thống.</Text>
        ) : null}
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    gap: 8
  },
  title: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 15
  },
  item: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 10,
    gap: 3,
    backgroundColor: "#fff"
  },
  itemTitle: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 13
  },
  meta: {
    color: colors.textMuted,
    fontSize: 13
  },
  error: {
    color: colors.danger,
    fontSize: 13
  }
});
