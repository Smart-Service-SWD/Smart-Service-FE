import { useEffect, useMemo, useState } from "react";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import ScreenLayout from "../../../shared/ui/ScreenLayout";
import { colors } from "../../../app/theme/colors";
import type { StaffTabParamList } from "../../../app/navigation/types";
import { useAuth } from "../../auth/AuthContext";
import { graphqlRequest } from "../../../shared/api/graphqlClient";
import {
  ALL_REQUESTS_QUERY,
  SERVICE_AGENTS_QUERY,
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
  ServiceRequestItem,
  UserProfile
} from "../../../shared/types/domain";
import ActionButton from "../../../shared/ui/ActionButton";
import SectionCard from "../../../shared/ui/SectionCard";
import StatusBadge from "../../../shared/ui/StatusBadge";

interface AllRequestsResponse {
  getServiceRequests: ServiceRequestItem[];
}

interface ServiceAgentsResponse {
  getServiceAgents: ServiceAgentItem[];
}

interface UsersResponse {
  getUsers: UserProfile[];
}

const getEstimatedCostLabel = (request: ServiceRequestItem | null) => {
  if (!request?.estimatedCost) {
    return "Chưa có chi phí ước tính";
  }

  return formatCurrency(request.estimatedCost.amount, request.estimatedCost.currency);
};

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

export default function DispatchHistoryScreen() {
  const { session } = useAuth();
  const navigation = useNavigation<BottomTabNavigationProp<StaffTabParamList>>();
  const route = useRoute<RouteProp<StaffTabParamList, "DispatchHistory">>();
  const [requests, setRequests] = useState<ServiceRequestItem[]>([]);
  const [agents, setAgents] = useState<ServiceAgentItem[]>([]);
  const [customerNamesById, setCustomerNamesById] = useState<Record<string, string>>({});
  const [selectedRequestId, setSelectedRequestId] = useState(route.params?.requestId ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const orderedRequests = useMemo(
    () =>
      [...requests].sort(
        (left, right) =>
          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
      ),
    [requests]
  );

  const getCustomerName = (customerId?: string | null) =>
    customerId ? customerNamesById[customerId] ?? formatShortId(customerId) : "-";

  const getAgentName = (agentId?: string | null) =>
    agentId
      ? agents.find((agent) => agent.id === agentId)?.fullName ?? formatShortId(agentId)
      : "Chưa gán";

  const loadInitialData = async () => {
    if (!session) {
      return;
    }

    setLoading(true);
    setError("");
    try {
      const [requestData, agentData, userData] = await Promise.all([
        graphqlRequest<AllRequestsResponse>(ALL_REQUESTS_QUERY, undefined, session.accessToken),
        graphqlRequest<ServiceAgentsResponse>(
          SERVICE_AGENTS_QUERY,
          undefined,
          session.accessToken
        ),
        graphqlRequest<UsersResponse>(USERS_QUERY, undefined, session.accessToken)
      ]);

      const assignedRequests = requestData.getServiceRequests.filter(
        (request) => !!request.assignedProviderId
      );

      setRequests(assignedRequests);
      setAgents(agentData.getServiceAgents);
      setCustomerNamesById(
        Object.fromEntries(userData.getUsers.map((user) => [user.id, user.fullName]))
      );
      setSelectedRequestId((current) => {
        const routeRequestId = route.params?.requestId;

        if (current && assignedRequests.some((item) => item.id === current)) {
          return current;
        }

        if (routeRequestId && assignedRequests.some((item) => item.id === routeRequestId)) {
          return routeRequestId;
        }

        return assignedRequests[0]?.id ?? "";
      });
    } catch (loadError) {
      setError(asErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken]);

  useEffect(() => {
    if (!route.params?.requestId) {
      return;
    }

    setSelectedRequestId(route.params.requestId);
    navigation.setParams({ requestId: undefined });
  }, [navigation, route.params?.requestId]);

  return (
    <ScreenLayout
      title="Lịch sử phân công"
      subtitle="Xem lại các yêu cầu đã gán thợ cùng chi phí ước tính hiện tại"
    >
      <SectionCard
        tone="primary"
        title="Tổng quan lịch sử phân công"
        subtitle="Tra cứu nhanh các đơn đã có kỹ thuật viên, ưu tiên trải nghiệm mobile gọn và dễ quét"
      >
        <View style={styles.summaryPanel}>
          <View style={styles.summaryMain}>
            <Text style={styles.summaryEyebrow}>Kho lịch sử đang sẵn sàng</Text>
            <Text style={styles.summaryValue}>{orderedRequests.length}</Text>
            <Text style={styles.summaryHelper}>yêu cầu đã có provider để staff mở lại bất kỳ lúc nào</Text>
          </View>
          <View style={styles.summaryState}>
            <Text style={styles.summaryStateLabel}>{loading ? "Đang đồng bộ" : "Đang chọn"}</Text>
            <Text style={styles.summaryStateValue}>
              {selectedRequestId ? formatShortId(selectedRequestId) : "Chưa chọn"}
            </Text>
          </View>
        </View>
        <ActionButton
          label={loading ? "Đang làm mới..." : "Làm mới"}
          onPress={() => {
            void loadInitialData();
          }}
          disabled={loading}
          variant="secondary"
        />
      </SectionCard>

      {loading ? (
        <SectionCard tone="muted">
          <Text style={styles.meta}>Đang tải lịch sử phân công...</Text>
        </SectionCard>
      ) : null}

      {!!error ? (
        <SectionCard tone="danger">
          <Text style={styles.error}>{error}</Text>
        </SectionCard>
      ) : null}

      <SectionCard
        title={`Yêu cầu đã gán (${orderedRequests.length})`}
        subtitle="Chạm vào một card để xem lại lịch sử của yêu cầu đó"
      >
        <View style={styles.requestList}>
          {orderedRequests.map((request) => {
            const active = request.id === selectedRequestId;
            return (
              <Pressable
                key={request.id}
                style={[styles.selectionCard, active && styles.selectionCardActive]}
                onPress={() => setSelectedRequestId(request.id)}
              >
                <View style={styles.cardBody}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.selectionTitle}>{request.description}</Text>
                    <StatusBadge
                      label={formatRequestStatus(request.status)}
                      tone={getStatusTone(request.status)}
                    />
                  </View>

                  <View style={styles.badgeRow}>
                    <StatusBadge label={formatShortId(request.id)} tone="neutral" />
                    <StatusBadge label={formatDateTime(request.createdAt)} tone="primary" />
                    {active ? <StatusBadge label="Đang xem" tone="success" /> : null}
                  </View>

                  <View style={styles.infoStack}>
                    <Text style={styles.meta}>Khách hàng: {getCustomerName(request.customerId)}</Text>
                    <Text style={styles.meta}>Thợ hiện tại: {getAgentName(request.assignedProviderId)}</Text>
                    <Text style={styles.meta}>Chi phí ước tính: {getEstimatedCostLabel(request)}</Text>
                  </View>
                </View>

                <View style={[styles.cardFooter, active && styles.cardFooterActive]}>
                  <Text style={[styles.cardFooterText, active && styles.cardFooterTextActive]}>
                    {active
                      ? "Card này đang được chọn để staff xem lại lịch sử phân công."
                      : "Chạm để mở lại lịch sử của yêu cầu này."}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
        {!orderedRequests.length ? (
          <Text style={styles.meta}>Chưa có yêu cầu nào đã được gán thợ.</Text>
        ) : null}
      </SectionCard>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  summaryPanel: {
    gap: 10
  },
  summaryMain: {
    borderWidth: 1,
    borderColor: colors.primarySoft,
    borderRadius: 22,
    padding: 16,
    gap: 6,
    backgroundColor: colors.surface
  },
  summaryEyebrow: {
    color: colors.primaryStrong,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.7
  },
  summaryValue: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "900"
  },
  summaryHelper: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18
  },
  summaryState: {
    borderWidth: 1,
    borderColor: "rgba(15, 118, 110, 0.18)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
    backgroundColor: colors.primarySoft
  },
  summaryStateLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700"
  },
  summaryStateValue: {
    color: colors.primaryStrong,
    fontSize: 15,
    fontWeight: "800"
  },
  requestList: {
    gap: 12
  },
  selectionCard: {
    borderWidth: 1,
    borderColor: "rgba(100, 116, 139, 0.16)",
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: colors.surfaceRaised
  },
  selectionCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoftAlt,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 10
    },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 2
  },
  cardBody: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
    gap: 10
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10
  },
  selectionTitle: {
    color: colors.text,
    fontWeight: "800",
    fontSize: 15,
    flex: 1,
    lineHeight: 21
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  infoStack: {
    gap: 6
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: "rgba(100, 116, 139, 0.12)",
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.surfaceMuted
  },
  cardFooterActive: {
    backgroundColor: colors.primarySoft
  },
  cardFooterText: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600"
  },
  cardFooterTextActive: {
    color: colors.primaryStrong
  },
  meta: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    lineHeight: 18
  }
});
