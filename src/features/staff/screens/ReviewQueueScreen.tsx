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
  formatCurrency,
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
import SectionCard from "../../../shared/ui/SectionCard";
import MetricTile from "../../../shared/ui/MetricTile";
import StatusBadge from "../../../shared/ui/StatusBadge";

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

const getStatusTone = (status?: string | null) => {
  if (status === "URGENT_DISPATCH") {
    return "danger" as const;
  }

  if (status === "PENDING_REVIEW") {
    return "warning" as const;
  }

  if (status === "COMPLETED") {
    return "success" as const;
  }

  return "primary" as const;
};

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

  return (
    <ScreenLayout
      title="Yêu cầu chờ xử lý"
      subtitle="Staff có thể mở điều phối hoặc xem lịch sử ngay tại từng card, không cần kéo xuống cuối màn"
    >
      <SectionCard tone="primary" title="Nhịp thao tác của staff">
        <Text style={styles.helperText}>1. Lọc đơn theo trạng thái để giảm nhiễu trên mobile.</Text>
        <Text style={styles.helperText}>2. Xem nhanh thông tin chính ngay trong card yêu cầu.</Text>
        <Text style={styles.helperText}>3. Bấm điều phối hoặc lịch sử trực tiếp tại card tương ứng.</Text>
      </SectionCard>

      <SectionCard title="Tổng quan hàng chờ" subtitle="Các con số quan trọng cho staff trong ca trực hiện tại">
        <View style={styles.metricGrid}>
          <MetricTile label="Cần xử lý" value={actionableCount} helper="Đơn mới hoặc khẩn" tone="warning" />
          <MetricTile label="Đang hiển thị" value={filteredItems.length} helper="Theo bộ lọc hiện tại" tone="primary" />
          <MetricTile label="Tổng số đơn" value={items.length} helper="Tất cả yêu cầu đã tải" tone="success" />
        </View>
      </SectionCard>

      <SectionCard title="Bộ lọc trạng thái" subtitle="Chạm để thu hẹp danh sách đơn theo bước xử lý">
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
      </SectionCard>

      {loading ? (
        <SectionCard tone="muted">
          <Text style={styles.loading}>Đang tải danh sách yêu cầu...</Text>
        </SectionCard>
      ) : null}

      {!!error ? (
        <SectionCard tone="danger">
          <Text style={styles.error}>{error}</Text>
        </SectionCard>
      ) : null}

      <SectionCard
        title={`Danh sách yêu cầu (${filteredItems.length})`}
        subtitle="Mỗi card có action trực tiếp để staff thao tác ngay"
      >
        <View style={styles.requestList}>
          {filteredItems.map((item) => (
            <View
              key={item.id}
              style={[
                styles.requestCard,
                selectedRequestId === item.id && styles.requestCardActive
              ]}
            >
              <Pressable style={styles.cardBody} onPress={() => setSelectedRequestId(item.id)}>
                <View style={styles.requestHeader}>
                  <Text style={styles.requestTitle}>{item.description}</Text>
                  <StatusBadge
                    label={formatRequestStatus(item.status)}
                    tone={getStatusTone(item.status)}
                  />
                </View>
                <View style={styles.badgeRow}>
                  <StatusBadge label={formatShortId(item.id)} tone="neutral" />
                  <StatusBadge label={formatDateTime(item.createdAt)} tone="primary" />
                </View>
                {item.serviceDefinitionId ? (
                  <Text style={styles.meta}>
                    Dịch vụ: {serviceNamesById[item.serviceDefinitionId] ?? formatShortId(item.serviceDefinitionId)}
                  </Text>
                ) : null}
                <Text style={styles.meta}>Khách hàng: {getCustomerName(item.customerId)}</Text>
                <Text style={styles.meta}>Thợ đã gán: {getAssignedAgentName(item.assignedProviderId)}</Text>
                <Text style={styles.meta}>Độ phức tạp: {item.complexity?.level ?? "Chưa có"}</Text>
                {item.estimatedCost ? (
                  <Text style={styles.meta}>
                    Chi phí ước tính: {formatCurrency(item.estimatedCost.amount, item.estimatedCost.currency)}
                  </Text>
                ) : null}
                <Text style={styles.meta}>AI báo giá: {getAiValueLabel(item.estimatedPrice, item.wasAnalyzedByAI)}</Text>
              </Pressable>

              <View style={styles.requestActions}>
                {canOpenDispatch(item) ? (
                  <ActionButton
                    label="Mở điều phối"
                    onPress={() => {
                      setSelectedRequestId(item.id);
                      navigation.navigate("DispatchCenter", { requestId: item.id });
                    }}
                  />
                ) : null}
                {item.assignedProviderId ? (
                  <ActionButton
                    label="Xem lịch sử"
                    onPress={() => {
                      setSelectedRequestId(item.id);
                      navigation.navigate("DispatchHistory", { requestId: item.id });
                    }}
                    variant="secondary"
                  />
                ) : null}
              </View>
            </View>
          ))}
        </View>
        {!loading && filteredItems.length === 0 ? (
          <Text style={styles.empty}>Không có yêu cầu ở bộ lọc này.</Text>
        ) : null}
      </SectionCard>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  helperText: {
    color: colors.textSoft,
    fontSize: 13,
    lineHeight: 19
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  filterChip: {
    borderWidth: 1,
    borderColor: "rgba(100, 116, 139, 0.18)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: colors.surfaceRaised
  },
  filterChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft
  },
  filterText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: "800"
  },
  filterTextActive: {
    color: colors.primaryStrong
  },
  requestList: {
    gap: 10
  },
  requestCard: {
    borderWidth: 1,
    borderColor: "rgba(100, 116, 139, 0.16)",
    borderRadius: 20,
    padding: 13,
    gap: 10,
    backgroundColor: colors.surfaceRaised
  },
  requestCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoftAlt
  },
  cardBody: {
    gap: 8
  },
  requestHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10
  },
  requestTitle: {
    color: colors.text,
    fontWeight: "800",
    fontSize: 14,
    flex: 1,
    lineHeight: 20
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  requestActions: {
    gap: 8
  },
  meta: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18
  },
  loading: {
    color: colors.textMuted,
    fontSize: 13
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    lineHeight: 18
  },
  empty: {
    color: colors.textMuted,
    textAlign: "center",
    fontSize: 13
  }
});
