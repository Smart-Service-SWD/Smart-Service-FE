import { useEffect, useMemo, useState } from "react";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import ScreenLayout from "../../../shared/ui/ScreenLayout";
import { colors } from "../../../app/theme/colors";
import type { StaffTabParamList } from "../../../app/navigation/types";
import { useAuth } from "../../auth/AuthContext";
import { graphqlRequest } from "../../../shared/api/graphqlClient";
import {
  ALL_REQUESTS_QUERY,
  SERVICE_AGENTS_QUERY,
  SERVICE_DEFINITIONS_QUERY,
  USERS_QUERY
} from "../../../shared/api/graphqlDocuments";
import {
  asErrorMessage,
  formatDateTime,
  formatRequestStatus,
  formatShortId
} from "../../../shared/utils/format";
import type {
  ServiceAgentItem,
  ServiceDefinition,
  ServiceRequestItem,
  UserProfile
} from "../../../shared/types/domain";
import ActionButton from "../../../shared/ui/ActionButton";

interface AllRequestsResponse {
  getServiceRequests: ServiceRequestItem[];
}

interface ServiceDefinitionsResponse {
  getServiceDefinitions: ServiceDefinition[];
}

interface ServiceAgentsResponse {
  getServiceAgents: ServiceAgentItem[];
}

interface UsersResponse {
  getUsers: UserProfile[];
}

const statusOptions = [
  "ALL",
  "CREATED",
  "URGENT_DISPATCH",
  "PENDING_REVIEW",
  "ASSIGNED",
  "COMPLETED"
] as const;

const statusLabels: Record<(typeof statusOptions)[number], string> = {
  ALL: "Tất cả",
  CREATED: "Mới tạo",
  URGENT_DISPATCH: "Khẩn cấp",
  PENDING_REVIEW: "Sẵn sàng điều phối",
  ASSIGNED: "Đã phân công",
  COMPLETED: "Hoàn thành"
};

const canOpenDispatch = (request: ServiceRequestItem | null) =>
  request?.status === "CREATED" ||
  request?.status === "URGENT_DISPATCH" ||
  request?.status === "PENDING_REVIEW";

export default function ReviewQueueScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<StaffTabParamList>>();
  const { session } = useAuth();
  const [selectedStatus, setSelectedStatus] =
    useState<(typeof statusOptions)[number]>("ALL");
  const [items, setItems] = useState<ServiceRequestItem[]>([]);
  const [serviceNamesById, setServiceNamesById] = useState<Record<string, string>>({});
  const [customerNamesById, setCustomerNamesById] = useState<Record<string, string>>({});
  const [agentNamesById, setAgentNamesById] = useState<Record<string, string>>({});
  const [selectedRequestId, setSelectedRequestId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const filteredItems = useMemo(() => {
    if (selectedStatus === "ALL") {
      return items;
    }

    return items.filter((item) => item.status === selectedStatus);
  }, [items, selectedStatus]);

  const selectedRequest = useMemo(
    () => items.find((item) => item.id === selectedRequestId) ?? null,
    [items, selectedRequestId]
  );

  const actionableCount = useMemo(
    () =>
      items.filter(
        (item) =>
          item.status === "CREATED" ||
          item.status === "URGENT_DISPATCH" ||
          item.status === "PENDING_REVIEW"
      ).length,
    [items]
  );

  const getCustomerName = (customerId?: string | null) =>
    customerId ? customerNamesById[customerId] ?? formatShortId(customerId) : "-";

  const getAssignedAgentName = (agentId?: string | null) =>
    agentId ? agentNamesById[agentId] ?? formatShortId(agentId) : "Chưa gán";

  const getAiValueLabel = (
    value?: string | null,
    wasAnalyzedByAI?: boolean
  ) => {
    if (value?.trim()) {
      return value;
    }

    return wasAnalyzedByAI ? "AI chưa trả về" : "Chưa phân tích AI";
  };

  const load = async () => {
    if (!session) {
      return;
    }

    setLoading(true);
    setError("");
    try {
      const [requestData, serviceData, userData, agentData] = await Promise.all([
        graphqlRequest<AllRequestsResponse>(
          ALL_REQUESTS_QUERY,
          undefined,
          session.accessToken
        ),
        graphqlRequest<ServiceDefinitionsResponse>(SERVICE_DEFINITIONS_QUERY),
        graphqlRequest<UsersResponse>(USERS_QUERY, undefined, session.accessToken),
        graphqlRequest<ServiceAgentsResponse>(
          SERVICE_AGENTS_QUERY,
          undefined,
          session.accessToken
        )
      ]);
      setItems(requestData.getServiceRequests);
      setServiceNamesById(
        Object.fromEntries(
          serviceData.getServiceDefinitions.map((service) => [service.id, service.name])
        )
      );
      setCustomerNamesById(
        Object.fromEntries(userData.getUsers.map((user) => [user.id, user.fullName]))
      );
      setAgentNamesById(
        Object.fromEntries(agentData.getServiceAgents.map((agent) => [agent.id, agent.fullName]))
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

  useEffect(() => {
    const nextSelected = filteredItems.find((item) => item.id === selectedRequestId);
    if (nextSelected) {
      return;
    }

    setSelectedRequestId(filteredItems[0]?.id ?? "");
  }, [filteredItems, selectedRequestId]);

  return (
    <ScreenLayout
      title="Yêu cầu chờ xử lý"
      subtitle="Staff chọn đơn từ đây rồi sang tab Điều phối để chốt độ phức tạp và gán thợ"
    >
      <View style={styles.helperCard}>
        <Text style={styles.helperTitle}>Luồng staff</Text>
        <Text style={styles.helperText}>1. Xem các yêu cầu mới hoặc khẩn cấp.</Text>
        <Text style={styles.helperText}>2. Chọn đơn cần xử lý.</Text>
        <Text style={styles.helperText}>3. Mở tab Điều phối để chốt độ phức tạp và gán thợ.</Text>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryText}>
          Đơn staff cần xử lý: {actionableCount} • Tổng số đơn: {items.length}
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

      <View style={styles.card}>
        <Text style={styles.title}>Danh sách yêu cầu</Text>
        {filteredItems.map((item) => (
          <Pressable
            key={item.id}
            style={[
              styles.requestCard,
              selectedRequestId === item.id && styles.requestCardActive
            ]}
            onPress={() => setSelectedRequestId(item.id)}
          >
            <Text style={styles.requestTitle}>{item.description}</Text>
            <Text style={styles.meta}>Mã: {formatShortId(item.id)}</Text>
            {item.serviceDefinitionId ? (
              <Text style={styles.meta}>
                Dịch vụ:{" "}
                {serviceNamesById[item.serviceDefinitionId] ??
                  formatShortId(item.serviceDefinitionId)}
              </Text>
            ) : null}
            <Text style={styles.meta}>Khách hàng: {getCustomerName(item.customerId)}</Text>
            <Text style={styles.meta}>
              Thợ đã gán: {getAssignedAgentName(item.assignedProviderId)}
            </Text>
            <Text style={styles.meta}>Trạng thái: {formatRequestStatus(item.status)}</Text>
            <Text style={styles.meta}>Tạo lúc: {formatDateTime(item.createdAt)}</Text>
            <Text style={styles.meta}>
              Độ phức tạp hiện tại: {item.complexity?.level ?? "Chưa có"}
            </Text>
            <Text style={styles.meta}>
              AI báo giá: {getAiValueLabel(item.estimatedPrice, item.wasAnalyzedByAI)}
            </Text>
            <Text style={styles.meta}>
              AI dự kiến: {getAiValueLabel(item.estimatedDuration, item.wasAnalyzedByAI)}
            </Text>
          </Pressable>
        ))}
        {!loading && filteredItems.length === 0 ? (
          <Text style={styles.empty}>Không có yêu cầu ở bộ lọc này.</Text>
        ) : null}
      </View>

      {selectedRequest ? (
        <View style={styles.card}>
          <Text style={styles.title}>Yêu cầu đang chọn</Text>
          <Text style={styles.requestTitle}>{selectedRequest.description}</Text>
          <Text style={styles.meta}>Mã: {formatShortId(selectedRequest.id)}</Text>
          {selectedRequest.serviceDefinitionId ? (
            <Text style={styles.meta}>
              Dịch vụ:{" "}
              {serviceNamesById[selectedRequest.serviceDefinitionId] ??
                formatShortId(selectedRequest.serviceDefinitionId)}
            </Text>
          ) : null}
          <Text style={styles.meta}>
            Khách hàng: {getCustomerName(selectedRequest.customerId)}
          </Text>
          <Text style={styles.meta}>
            Thợ đã gán: {getAssignedAgentName(selectedRequest.assignedProviderId)}
          </Text>
          <Text style={styles.meta}>
            Trạng thái: {formatRequestStatus(selectedRequest.status)}
          </Text>
          <Text style={styles.meta}>
            AI báo giá:{" "}
            {getAiValueLabel(selectedRequest.estimatedPrice, selectedRequest.wasAnalyzedByAI)}
          </Text>
          <Text style={styles.meta}>
            AI dự kiến:{" "}
            {getAiValueLabel(
              selectedRequest.estimatedDuration,
              selectedRequest.wasAnalyzedByAI
            )}
          </Text>
          <Text style={styles.meta}>
            Nếu đơn còn mới, staff sẽ chốt độ phức tạp ngay trong tab Điều phối.
          </Text>
          <View style={styles.actions}>
            {canOpenDispatch(selectedRequest) ? (
              <ActionButton
                label="Mở điều phối cho đơn này"
                onPress={() =>
                  navigation.navigate("DispatchCenter", { requestId: selectedRequest.id })
                }
              />
            ) : (
              <Text style={styles.meta}>
                Đơn này không còn ở bước điều phối.
              </Text>
            )}
            {selectedRequest.assignedProviderId ? (
              <ActionButton
                label="Xem lịch sử phân công"
                onPress={() =>
                  navigation.navigate("DispatchHistory", { requestId: selectedRequest.id })
                }
                variant="secondary"
              />
            ) : (
              <Text style={styles.meta}>Đơn này chưa được gán thợ nên chưa có lịch sử phân công.</Text>
            )}
          </View>
        </View>
      ) : null}
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
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    gap: 10
  },
  title: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 15
  },
  requestCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 12,
    gap: 4,
    backgroundColor: "#fff"
  },
  requestCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft
  },
  requestTitle: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 14
  },
  meta: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18
  },
  loading: {
    color: colors.textMuted
  },
  error: {
    color: colors.danger,
    fontSize: 13
  },
  empty: {
    color: colors.textMuted,
    textAlign: "center"
  },
  actions: {
    gap: 10
  }
});
