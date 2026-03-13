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
import SectionCard from "../../../shared/ui/SectionCard";
import MetricTile from "../../../shared/ui/MetricTile";
import StatusBadge from "../../../shared/ui/StatusBadge";

interface ServiceFeedbacksResponse {
  getServiceFeedbacks: ServiceFeedbackItem[];
}

interface AllRequestsResponse {
  getServiceRequests: ServiceRequestItem[];
}

interface UsersResponse {
  getUsers: UserProfile[];
}

const getRatingTone = (rating: number) => {
  if (rating >= 4) {
    return "success" as const;
  }

  if (rating === 3) {
    return "warning" as const;
  }

  return "danger" as const;
};

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

  const lowRatingCount = useMemo(
    () => feedbacks.filter((item) => item.rating <= 2).length,
    [feedbacks]
  );

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
      subtitle="Toàn bộ phản hồi khách hàng trong hệ thống theo bố cục dễ đọc trên mobile"
    >
      <SectionCard tone="primary" title="Tổng quan phản hồi">
        <View style={styles.metricGrid}>
          <MetricTile
            label="Tổng feedback"
            value={feedbacks.length}
            helper="Số phản hồi đã lưu"
            tone="primary"
          />
          <MetricTile
            label="Điểm trung bình"
            value={`${averageRating}/5`}
            helper="Mức hài lòng chung"
            tone="success"
          />
          <MetricTile
            label="Đánh giá thấp"
            value={lowRatingCount}
            helper="Rating từ 1 đến 2 sao"
            tone="warning"
          />
        </View>
        <ActionButton
          label={loading ? "Đang làm mới..." : "Làm mới feedback"}
          onPress={() => void load()}
          disabled={loading}
          variant="secondary"
        />
      </SectionCard>

      {loading ? (
        <SectionCard tone="muted">
          <Text style={styles.meta}>Đang tải feedback...</Text>
        </SectionCard>
      ) : null}

      {!!error ? (
        <SectionCard tone="danger">
          <Text style={styles.error}>{error}</Text>
        </SectionCard>
      ) : null}

      <SectionCard
        title={`Toàn bộ lịch sử (${feedbacks.length})`}
        subtitle="Admin có thể quét nhanh từng phản hồi, trạng thái đơn và thời điểm gửi"
      >
        <View style={styles.feedbackList}>
          {feedbacks.map((feedback) => {
            const request = requestsById[feedback.serviceRequestId];

            return (
              <View key={feedback.id} style={styles.item}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemTitle}>
                    {request?.description ?? `Yêu cầu ${formatShortId(feedback.serviceRequestId)}`}
                  </Text>
                  <StatusBadge
                    label={`${feedback.rating}/5`}
                    tone={getRatingTone(feedback.rating)}
                  />
                </View>
                <View style={styles.badgeRow}>
                  <StatusBadge
                    label={formatRequestStatus(request?.status)}
                    tone="neutral"
                  />
                  <StatusBadge label={formatDateTime(feedback.createdAt)} tone="primary" />
                </View>
                <Text style={styles.meta}>
                  Mã yêu cầu: {formatShortId(feedback.serviceRequestId)}
                </Text>
                <Text style={styles.meta}>
                  Khách hàng: {userNamesById[feedback.createdByUserId] ?? formatShortId(feedback.createdByUserId)}
                </Text>
                <Text style={styles.comment}>
                  {feedback.comment?.trim() || "Khách hàng không để lại nhận xét chi tiết."}
                </Text>
              </View>
            );
          })}
        </View>
        {!feedbacks.length ? (
          <Text style={styles.meta}>Chưa có feedback nào trong hệ thống.</Text>
        ) : null}
      </SectionCard>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  feedbackList: {
    gap: 10
  },
  item: {
    borderWidth: 1,
    borderColor: "rgba(100, 116, 139, 0.16)",
    borderRadius: 20,
    padding: 14,
    gap: 8,
    backgroundColor: colors.surfaceRaised
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10
  },
  itemTitle: {
    flex: 1,
    color: colors.text,
    fontWeight: "800",
    fontSize: 14,
    lineHeight: 20
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  meta: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18
  },
  comment: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 20
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    lineHeight: 18
  }
});
