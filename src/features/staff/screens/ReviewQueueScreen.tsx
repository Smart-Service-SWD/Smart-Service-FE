import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import ScreenLayout from "../../../shared/ui/ScreenLayout";
import { colors } from "../../../app/theme/colors";
import { useAuth } from "../../auth/AuthContext";
import { graphqlRequest } from "../../../shared/api/graphqlClient";
import {
  ALL_REQUESTS_QUERY
} from "../../../shared/api/graphqlDocuments";
import {
  asErrorMessage,
  formatDateTime,
  formatRequestStatus
} from "../../../shared/utils/format";
import type { ServiceRequestItem } from "../../../shared/types/domain";
import LabeledInput from "../../../shared/ui/LabeledInput";
import ActionButton from "../../../shared/ui/ActionButton";
import { createActivityLog, evaluateComplexity } from "../api/staffApi";

interface AllRequestsResponse {
  getServiceRequests: ServiceRequestItem[];
}

const statusOptions = [
  "ALL",
  "AWAITING_ANALYSIS",
  "CREATED",
  "URGENT_DISPATCH",
  "PENDING_REVIEW",
  "APPROVED",
  "ASSIGNED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED"
] as const;

const statusLabels: Record<(typeof statusOptions)[number], string> = {
  ALL: "Tất cả",
  AWAITING_ANALYSIS: "Chờ AI phân tích",
  CREATED: "Mới tạo",
  URGENT_DISPATCH: "Khẩn cấp",
  PENDING_REVIEW: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  ASSIGNED: "Đã phân công",
  IN_PROGRESS: "Đang thực hiện",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy"
};

export default function ReviewQueueScreen() {
  const { session } = useAuth();
  const [selectedStatus, setSelectedStatus] =
    useState<(typeof statusOptions)[number]>("ALL");
  const [items, setItems] = useState<ServiceRequestItem[]>([]);
  const [requestId, setRequestId] = useState("");
  const [complexityLevel, setComplexityLevel] = useState("3");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const filteredItems = useMemo(() => {
    if (selectedStatus === "ALL") {
      return items;
    }

    return items.filter((item) => item.status === selectedStatus);
  }, [items, selectedStatus]);

  const selectedRequest = useMemo(
    () => items.find((item) => item.id === requestId.trim()) ?? null,
    [items, requestId]
  );

  const load = async () => {
    if (!session) {
      return;
    }

    setLoading(true);
    setError("");
    try {
      const data = await graphqlRequest<AllRequestsResponse>(
        ALL_REQUESTS_QUERY,
        undefined,
        session.accessToken
      );
      setItems(data.getServiceRequests);
    } catch (loadError) {
      setError(asErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluate = async () => {
    if (!session) {
      return;
    }
    if (!requestId.trim()) {
      setError("Vui lòng chọn hoặc nhập mã yêu cầu");
      return;
    }
    if (selectedRequest && selectedRequest.status !== "CREATED") {
      setError(
        `Chỉ có thể đánh giá khi yêu cầu ở trạng thái "Mới tạo". Trạng thái hiện tại: ${formatRequestStatus(
          selectedRequest.status
        )}.`
      );
      return;
    }
    const level = Number.parseInt(complexityLevel, 10);
    if (Number.isNaN(level) || level < 1 || level > 5) {
      setError("Độ phức tạp phải từ 1 đến 5");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await evaluateComplexity(session.accessToken, requestId.trim(), level);
      await createActivityLog(session.accessToken, {
        serviceRequestId: requestId.trim(),
        action: `Staff evaluated complexity to ${level}`
      });
      setSuccess("Đã đánh giá độ phức tạp và ghi log hoạt động");
      await load();
    } catch (actionError) {
      setError(asErrorMessage(actionError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatus, session?.accessToken]);

  return (
    <ScreenLayout
      title="Duyệt yêu cầu"
      subtitle="Staff xem danh sách service request tại đây, rồi nhấn vào thẻ để tự điền mã yêu cầu"
    >
      <View style={styles.helperCard}>
        <Text style={styles.helperTitle}>Cách dùng màn này</Text>
        <Text style={styles.helperText}>1. Chọn bộ lọc trạng thái ở bên dưới.</Text>
        <Text style={styles.helperText}>2. Nhấn vào một thẻ yêu cầu để tự điền mã.</Text>
        <Text style={styles.helperText}>
          3. Chỉ yêu cầu ở trạng thái “Mới tạo” mới chấm độ phức tạp được.
        </Text>
      </View>

      <View style={styles.filterRow}>
        {statusOptions.map((status) => {
          const active = status === selectedStatus;
          return (
            <Pressable
              key={status}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setSelectedStatus(status)}
            >
              <Text style={[styles.filterText, active && styles.filterTextActive]}>
                {statusLabels[status]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {loading ? <Text style={styles.loading}>Đang tải danh sách yêu cầu...</Text> : null}
      {!!error ? <Text style={styles.error}>{error}</Text> : null}
      {!!success ? <Text style={styles.success}>{success}</Text> : null}

      <View style={styles.summaryCard}>
        <Text style={styles.summaryText}>
          Đang hiển thị: {filteredItems.length} yêu cầu • Bộ lọc: {statusLabels[selectedStatus]}
        </Text>
      </View>

      {filteredItems.map((item) => (
        <Pressable
          key={item.id}
          style={[styles.card, requestId === item.id && styles.cardSelected]}
          onPress={() => {
            setRequestId(item.id);
            setError("");
            setSuccess("");
          }}
        >
          <Text style={styles.title}>{item.description}</Text>
          <Text style={styles.meta}>Mã yêu cầu: {item.id}</Text>
          <Text style={styles.meta}>Khách hàng: {item.customerId}</Text>
          <Text style={styles.meta}>Trạng thái: {formatRequestStatus(item.status)}</Text>
          <Text style={styles.meta}>Tạo lúc: {formatDateTime(item.createdAt)}</Text>
          <Text style={styles.meta}>
            Độ phức tạp hiện tại: {item.complexity?.level ?? "Chưa có"}
          </Text>
          <Text style={styles.tapHint}>Nhấn để tự điền mã yêu cầu bên dưới</Text>
        </Pressable>
      ))}

      {!loading && filteredItems.length === 0 ? (
        <Text style={styles.empty}>
          Không có service request ở bộ lọc này. Hãy thử chuyển sang “Tất cả”, “Chờ AI
          phân tích” hoặc “Khẩn cấp”.
        </Text>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.title}>Đánh giá độ phức tạp</Text>
        <LabeledInput
          label="Mã yêu cầu dịch vụ"
          value={requestId}
          onChangeText={setRequestId}
          placeholder="Nhấn một thẻ ở trên hoặc dán mã thủ công"
          autoCapitalize="none"
          hint="Nếu danh sách đang trống thì request đó có thể đang ở trạng thái khác"
        />
        <LabeledInput
          label="Độ phức tạp (1-5)"
          value={complexityLevel}
          onChangeText={setComplexityLevel}
          keyboardType="number-pad"
        />
        {selectedRequest ? (
          <Text style={styles.selectionText}>
            Yêu cầu đang chọn: {formatRequestStatus(selectedRequest.status)}
          </Text>
        ) : null}
        <ActionButton
          label={loading ? "Đang đánh giá..." : "Đánh giá + ghi log"}
          onPress={() => void handleEvaluate()}
          disabled={loading}
        />
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  helperCard: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
    gap: 4
  },
  helperTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700"
  },
  helperText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19
  },
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
  filterText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "700"
  },
  filterTextActive: {
    color: colors.primary
  },
  loading: {
    color: colors.textMuted
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  summaryText: {
    color: colors.textMuted,
    fontSize: 13
  },
  error: {
    color: colors.danger,
    fontSize: 13
  },
  success: {
    color: colors.success,
    fontSize: 13
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    gap: 5
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft
  },
  title: {
    color: colors.text,
    fontWeight: "700"
  },
  meta: {
    color: colors.textMuted,
    fontSize: 12
  },
  tapHint: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4
  },
  selectionText: {
    color: colors.textMuted,
    fontSize: 12
  },
  empty: {
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 20
  }
});
