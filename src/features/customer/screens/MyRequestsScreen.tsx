import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import ScreenLayout from "../../../shared/ui/ScreenLayout";
import { colors } from "../../../app/theme/colors";
import { useAuth } from "../../auth/AuthContext";
import { graphqlRequest } from "../../../shared/api/graphqlClient";
import {
  FEEDBACK_BY_REQUEST_QUERY,
  MY_REQUESTS_QUERY,
  REQUEST_BY_ID_QUERY
} from "../../../shared/api/graphqlDocuments";
import {
  asErrorMessage,
  formatCurrency,
  formatDateTime,
  formatRequestStatus
} from "../../../shared/utils/format";
import type { ServiceFeedbackItem, ServiceRequestItem } from "../../../shared/types/domain";
import LabeledInput from "../../../shared/ui/LabeledInput";
import ActionButton from "../../../shared/ui/ActionButton";

interface MyRequestsResponse {
  getMyServiceRequests: ServiceRequestItem[];
}

interface RequestByIdResponse {
  getServiceRequestById: ServiceRequestItem | null;
}

interface FeedbackByRequestResponse {
  getFeedbackByServiceRequestId: ServiceFeedbackItem[];
  getAverageRatingByServiceRequestId: number;
}

const filters = [
  { label: "Tất cả", value: null },
  { label: "Chờ AI", value: "AWAITING_ANALYSIS" },
  { label: "Mới tạo", value: "CREATED" },
  { label: "Khẩn cấp", value: "URGENT_DISPATCH" },
  { label: "Chờ duyệt", value: "PENDING_REVIEW" },
  { label: "Đã phân công", value: "ASSIGNED" },
  { label: "Đang làm", value: "IN_PROGRESS" },
  { label: "Hoàn thành", value: "COMPLETED" }
] as const;

export default function MyRequestsScreen() {
  const { session } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [items, setItems] = useState<ServiceRequestItem[]>([]);
  const [detailRequestId, setDetailRequestId] = useState("");
  const [detail, setDetail] = useState<ServiceRequestItem | null>(null);
  const [detailFeedbacks, setDetailFeedbacks] = useState<ServiceFeedbackItem[]>([]);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    if (!session) {
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await graphqlRequest<MyRequestsResponse, { status?: string | null }>(
        MY_REQUESTS_QUERY,
        { status: statusFilter },
        session.accessToken
      );
      setItems(data.getMyServiceRequests);
    } catch (loadError) {
      setError(asErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  const loadRequestDetail = async (requestedId?: string) => {
    if (!session) {
      return;
    }
    const requestId = requestedId ?? detailRequestId;

    if (!requestId.trim()) {
      setError("Vui lòng nhập mã yêu cầu");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const [requestData, feedbackData] = await Promise.all([
        graphqlRequest<RequestByIdResponse, { id: string }>(
          REQUEST_BY_ID_QUERY,
          { id: requestId.trim() },
          session.accessToken
        ),
        graphqlRequest<FeedbackByRequestResponse, { serviceRequestId: string }>(
          FEEDBACK_BY_REQUEST_QUERY,
          { serviceRequestId: requestId.trim() },
          session.accessToken
        )
      ]);

      setDetailRequestId(requestId.trim());
      setDetail(requestData.getServiceRequestById);
      setDetailFeedbacks(feedbackData.getFeedbackByServiceRequestId);
      setAverageRating(feedbackData.getAverageRatingByServiceRequestId);
    } catch (loadError) {
      setError(asErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, session?.accessToken]);

  return (
    <ScreenLayout
      title="Yêu cầu của tôi"
      subtitle="Theo dõi trạng thái, chi phí ước tính và xem chi tiết từng yêu cầu"
    >
      <View style={styles.filterRow}>
        {filters.map((filter) => {
          const active = filter.value === statusFilter;
          return (
            <Pressable
              key={filter.label}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setStatusFilter(filter.value)}
            >
              <Text
                style={[styles.filterChipText, active && styles.filterChipTextActive]}
              >
                {filter.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {loading ? <Text style={styles.loading}>Đang tải dữ liệu...</Text> : null}
      {!!error ? <Text style={styles.error}>{error}</Text> : null}

      {items.map((item) => (
        <Pressable
          key={item.id}
          style={styles.card}
          onPress={() => void loadRequestDetail(item.id)}
        >
          <Text style={styles.cardTitle}>{item.description}</Text>
          <Text style={styles.meta}>Trạng thái: {formatRequestStatus(item.status)}</Text>
          <Text style={styles.meta}>Tạo lúc: {formatDateTime(item.createdAt)}</Text>
          <Text style={styles.meta}>
            Độ phức tạp: {item.complexity?.level ?? "Chưa đánh giá"}
          </Text>
          <Text style={styles.meta}>
            Chi phí ước tính:{" "}
            {item.estimatedCost
              ? formatCurrency(item.estimatedCost.amount, item.estimatedCost.currency)
              : "Chưa có"}
          </Text>
          {item.addressText ? <Text style={styles.meta}>Địa chỉ: {item.addressText}</Text> : null}
          <Text style={styles.tapHint}>Nhấn để xem chi tiết và phản hồi</Text>
        </Pressable>
      ))}

      {!loading && items.length === 0 ? (
        <Text style={styles.empty}>Chưa có yêu cầu nào theo bộ lọc này</Text>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Chi tiết yêu cầu & đánh giá</Text>
        <LabeledInput
          label="Mã yêu cầu"
          value={detailRequestId}
          onChangeText={setDetailRequestId}
          placeholder="Dán mã yêu cầu"
          autoCapitalize="none"
          hint="Bạn có thể nhấn trực tiếp vào một thẻ ở trên để tự điền mã"
        />
        <ActionButton
          label={loading ? "Đang tải..." : "Xem chi tiết"}
          onPress={() => void loadRequestDetail()}
          disabled={loading}
          variant="secondary"
        />
        {detail ? (
          <View style={styles.detailBox}>
            <Text style={styles.meta}>Trạng thái: {formatRequestStatus(detail.status)}</Text>
            <Text style={styles.meta}>Mô tả: {detail.description}</Text>
            <Text style={styles.meta}>
              Độ phức tạp: {detail.complexity?.level ?? "Chưa đánh giá"}
            </Text>
            <Text style={styles.meta}>Điểm trung bình: {averageRating ?? 0}</Text>
            <Text style={styles.meta}>Số lượt đánh giá: {detailFeedbacks.length}</Text>
          </View>
        ) : null}
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  filterChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#fff"
  },
  filterChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft
  },
  filterChipText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "600"
  },
  filterChipTextActive: {
    color: colors.primary
  },
  loading: {
    color: colors.textMuted
  },
  error: {
    color: colors.danger,
    fontSize: 13
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
    gap: 6
  },
  cardTitle: {
    color: colors.text,
    fontWeight: "700"
  },
  meta: {
    color: colors.textMuted,
    fontSize: 12
  },
  detailBox: {
    gap: 3,
    marginTop: 8
  },
  tapHint: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 6
  },
  empty: {
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 16
  }
});
