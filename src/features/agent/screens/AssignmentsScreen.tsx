import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import ScreenLayout from "../../../shared/ui/ScreenLayout";
import { colors } from "../../../app/theme/colors";
import { useAuth } from "../../auth/AuthContext";
import { graphqlRequest } from "../../../shared/api/graphqlClient";
import {
  AGENT_ASSIGNMENTS_QUERY,
  REQUEST_BY_ID_QUERY,
  SERVICE_AGENTS_QUERY,
  SERVICE_DEFINITIONS_QUERY,
  USER_BY_ID_QUERY
} from "../../../shared/api/graphqlDocuments";
import {
  asErrorMessage,
  formatCurrency,
  formatDateTime,
  formatRequestStatus,
  formatShortId
} from "../../../shared/utils/format";
import type {
  AssignmentItem,
  ServiceAgentItem,
  ServiceDefinition,
  ServiceRequestItem,
  UserProfile
} from "../../../shared/types/domain";
import ActionButton from "../../../shared/ui/ActionButton";
import {
  completeInProgressRequest,
  createActivityLog,
  startAssignedRequest
} from "../api/agentApi";

interface AssignmentResponse {
  getAssignmentsByAgentId: AssignmentItem[];
}

interface RequestByIdResponse {
  getServiceRequestById: ServiceRequestItem | null;
}

interface ServiceAgentsResponse {
  getServiceAgents: ServiceAgentItem[];
}

interface ServiceDefinitionsResponse {
  getServiceDefinitions: ServiceDefinition[];
}

interface UserByIdResponse {
  getUserById: UserProfile | null;
}

export default function AssignmentsScreen() {
  const { session } = useAuth();
  const [items, setItems] = useState<AssignmentItem[]>([]);
  const [detailRequestId, setDetailRequestId] = useState("");
  const [detail, setDetail] = useState<ServiceRequestItem | null>(null);
  const [customerProfile, setCustomerProfile] = useState<UserProfile | null>(null);
  const [linkedServiceAgent, setLinkedServiceAgent] = useState<ServiceAgentItem | null>(null);
  const [serviceNamesById, setServiceNamesById] = useState<Record<string, string>>({});
  const [bindingMessage, setBindingMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = async () => {
    if (!session) {
      return;
    }

    setLoading(true);
    setError("");
    setBindingMessage("");
    try {
      const [serviceAgentData, serviceDefinitionData] = await Promise.all([
        graphqlRequest<ServiceAgentsResponse>(
          SERVICE_AGENTS_QUERY,
          undefined,
          session.accessToken
        ),
        graphqlRequest<ServiceDefinitionsResponse>(SERVICE_DEFINITIONS_QUERY)
      ]);
      const linkedAgent =
        serviceAgentData.getServiceAgents.find((agent) => agent.userId === session.userId) ??
        null;

      setServiceNamesById(
        Object.fromEntries(
          serviceDefinitionData.getServiceDefinitions.map((service) => [service.id, service.name])
        )
      );

      setLinkedServiceAgent(linkedAgent);

      if (!linkedAgent) {
        setItems([]);
        setBindingMessage(
          "Tài khoản này chưa được gắn với hồ sơ thợ kỹ thuật, nên chưa thể tải danh sách công việc."
        );
        return;
      }

      const data = await graphqlRequest<AssignmentResponse, { agentId: string }>(
        AGENT_ASSIGNMENTS_QUERY,
        { agentId: linkedAgent.id },
        session.accessToken
      );
      setItems(data.getAssignmentsByAgentId);
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
      setError("Hãy chọn một công việc từ danh sách phía trên");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const data = await graphqlRequest<RequestByIdResponse, { id: string }>(
        REQUEST_BY_ID_QUERY,
        { id: requestId.trim() },
        session.accessToken
      );
      let nextCustomerProfile: UserProfile | null = null;

      if (data.getServiceRequestById?.customerId) {
        const userData = await graphqlRequest<UserByIdResponse, { id: string }>(
          USER_BY_ID_QUERY,
          { id: data.getServiceRequestById.customerId },
          session.accessToken
        );
        nextCustomerProfile = userData.getUserById;
      }

      setDetailRequestId(requestId.trim());
      setDetail(data.getServiceRequestById);
      setCustomerProfile(nextCustomerProfile);
    } catch (loadError) {
      setError(asErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (targetStatus: "IN_PROGRESS" | "COMPLETED") => {
    if (!session || !detail) {
      setError("Hãy chọn công việc cần cập nhật.");
      return;
    }

    if (targetStatus === "IN_PROGRESS" && detail.status !== "ASSIGNED") {
      setError("Chỉ có thể bắt đầu khi công việc đang ở trạng thái Đã phân công.");
      return;
    }

    if (targetStatus === "COMPLETED" && detail.status !== "IN_PROGRESS") {
      setError("Chỉ có thể hoàn thành khi công việc đang ở trạng thái Đang thực hiện.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const successMessage =
        targetStatus === "IN_PROGRESS"
          ? "Đã chuyển công việc sang trạng thái Đang thực hiện."
          : "Đã hoàn thành công việc.";

      if (targetStatus === "IN_PROGRESS") {
        await startAssignedRequest(session.accessToken, detail.id);
        await createActivityLog(session.accessToken, {
          serviceRequestId: detail.id,
          action: `Agent ${linkedServiceAgent?.id ?? session.userId} started work`
        });
      } else {
        await completeInProgressRequest(session.accessToken, detail.id);
        await createActivityLog(session.accessToken, {
          serviceRequestId: detail.id,
          action: `Agent ${linkedServiceAgent?.id ?? session.userId} completed work`
        });
      }

      await load();
      await loadRequestDetail(detail.id);
      setSuccess(successMessage);
    } catch (actionError) {
      setError(asErrorMessage(actionError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken]);

  useEffect(() => {
    if (!items.length) {
      setDetailRequestId("");
      setDetail(null);
      setCustomerProfile(null);
      return;
    }

    const stillExists = items.some((item) => item.serviceRequestId === detailRequestId);
    if (!stillExists) {
      void loadRequestDetail(items[0].serviceRequestId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  return (
    <ScreenLayout title="Công việc của tôi" subtitle="Danh sách công việc được phân công">
      {loading ? <Text style={styles.loading}>Đang tải...</Text> : null}
      {!!error ? <Text style={styles.error}>{error}</Text> : null}
      {!!success ? <Text style={styles.success}>{success}</Text> : null}
      {!!bindingMessage ? <Text style={styles.info}>{bindingMessage}</Text> : null}

      <View style={styles.card}>
        <Text style={styles.title}>Thông tin nhận việc</Text>
        <Text style={styles.meta}>Thợ đang đăng nhập: {linkedServiceAgent?.fullName ?? "-"}</Text>
        <Text style={styles.meta}>
          Trạng thái: {linkedServiceAgent ? "Sẵn sàng nhận công việc" : "Chưa có hồ sơ thợ"}
        </Text>
      </View>

      {items.map((item) => (
        <Pressable
          key={item.id}
          style={[styles.card, detailRequestId === item.serviceRequestId && styles.cardSelected]}
          onPress={() => void loadRequestDetail(item.serviceRequestId)}
        >
          <Text style={styles.title}>Công việc {formatShortId(item.serviceRequestId)}</Text>
          <Text style={styles.meta}>Phân công lúc: {formatDateTime(item.assignedAt)}</Text>
          <Text style={styles.meta}>
            Ước tính: {formatCurrency(item.estimatedCost.amount, item.estimatedCost.currency)}
          </Text>
        </Pressable>
      ))}

      {!loading && items.length === 0 ? (
        <Text style={styles.empty}>Chưa có công việc nào</Text>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.title}>Chi tiết công việc</Text>
        {detailRequestId ? (
          <Text style={styles.selected}>Đang xem công việc: {formatShortId(detailRequestId)}</Text>
        ) : (
          <Text style={styles.hint}>Nhấn vào một công việc phía trên để xem chi tiết</Text>
        )}
        <ActionButton
          label={loading ? "Đang tải..." : "Tải lại yêu cầu đang chọn"}
          onPress={() => void loadRequestDetail(detailRequestId)}
          disabled={loading || !detailRequestId}
          variant="secondary"
        />
        {detail ? (
          <View style={styles.detail}>
            <Text style={styles.meta}>
              Trạng thái: {formatRequestStatus(detail.status)}
            </Text>
            <Text style={styles.meta}>
              Khách hàng: {customerProfile?.fullName ?? formatShortId(detail.customerId)}
            </Text>
            <Text style={styles.meta}>
              Số điện thoại: {customerProfile?.phoneNumber || "-"}
            </Text>
            {detail.serviceDefinitionId ? (
              <Text style={styles.meta}>
                Dịch vụ:{" "}
                {serviceNamesById[detail.serviceDefinitionId] ??
                  formatShortId(detail.serviceDefinitionId)}
              </Text>
            ) : null}
            <Text style={styles.meta}>Mô tả: {detail.description}</Text>
            <Text style={styles.meta}>
              Độ phức tạp: {detail.complexity?.level ?? "Chưa đánh giá"}
            </Text>
            <Text style={styles.meta}>
              Địa chỉ: {detail.addressText || "Khách hàng chưa nhập địa chỉ cho yêu cầu này."}
            </Text>
            <View style={styles.actionGroup}>
              {detail.status === "ASSIGNED" ? (
                <ActionButton
                  label={loading ? "Đang bắt đầu..." : "Bắt đầu làm việc"}
                  onPress={() => void handleStatusChange("IN_PROGRESS")}
                  disabled={loading}
                />
              ) : null}
              {detail.status === "IN_PROGRESS" ? (
                <ActionButton
                  label={loading ? "Đang hoàn thành..." : "Hoàn thành công việc"}
                  onPress={() => void handleStatusChange("COMPLETED")}
                  disabled={loading}
                />
              ) : null}
              {detail.status === "COMPLETED" ? (
                <Text style={styles.info}>Công việc này đã hoàn thành.</Text>
              ) : null}
              {detail.status !== "ASSIGNED" &&
              detail.status !== "IN_PROGRESS" &&
              detail.status !== "COMPLETED" ? (
                <Text style={styles.hint}>
                  Nút thao tác chỉ hiện khi công việc đã được phân công hoặc đang thực hiện.
                </Text>
              ) : null}
            </View>
          </View>
        ) : null}
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  loading: {
    color: colors.textMuted
  },
  error: {
    color: colors.danger,
    fontSize: 13
  },
  info: {
    color: colors.textMuted,
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
    borderRadius: 12,
    padding: 14,
    gap: 4
  },
  title: {
    color: colors.text,
    fontWeight: "700"
  },
  meta: {
    color: colors.textMuted,
    fontSize: 12
  },
  detail: {
    marginTop: 8,
    gap: 3
  },
  actionGroup: {
    gap: 10,
    marginTop: 10
  },
  empty: {
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 20
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft
  },
  selected: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "700"
  },
  hint: {
    color: colors.textMuted,
    fontSize: 12,
    fontStyle: "italic"
  }
});
