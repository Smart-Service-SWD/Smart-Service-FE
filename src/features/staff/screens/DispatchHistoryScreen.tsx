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
  ASSIGNMENTS_BY_REQUEST_QUERY,
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
  AssignmentItem,
  ServiceAgentItem,
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

interface AssignmentResponse {
  getAssignmentsByServiceRequestId: AssignmentItem[];
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

export default function DispatchHistoryScreen() {
  const { session } = useAuth();
  const navigation = useNavigation<BottomTabNavigationProp<StaffTabParamList>>();
  const route = useRoute<RouteProp<StaffTabParamList, "DispatchHistory">>();
  const [requests, setRequests] = useState<ServiceRequestItem[]>([]);
  const [agents, setAgents] = useState<ServiceAgentItem[]>([]);
  const [customerNamesById, setCustomerNamesById] = useState<Record<string, string>>({});
  const [selectedRequestId, setSelectedRequestId] = useState(route.params?.requestId ?? "");
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
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

  const selectedRequest = useMemo(
    () => requests.find((item) => item.id === selectedRequestId) ?? null,
    [requests, selectedRequestId]
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

  const loadRequestHistory = async (requestId: string) => {
    if (!session || !requestId.trim()) {
      setAssignments([]);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const assignmentData = await graphqlRequest<AssignmentResponse, { serviceRequestId: string }>(
        ASSIGNMENTS_BY_REQUEST_QUERY,
        { serviceRequestId: requestId },
        session.accessToken
      );

      setAssignments(assignmentData.getAssignmentsByServiceRequestId);
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

  useEffect(() => {
    if (!selectedRequestId) {
      setAssignments([]);
      return;
    }

    void loadRequestHistory(selectedRequestId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRequestId, session?.accessToken]);

  return (
    <ScreenLayout
      title="Lịch sử phân công"
      subtitle="Xem lại yêu cầu đã gán thợ cùng chi phí ước tính và từng assignment đã tạo"
    >
      <SectionCard tone="primary" title="Tổng quan lịch sử phân công">
        <View style={styles.metricGrid}>
          <MetricTile label="Yêu cầu có gán" value={orderedRequests.length} helper="Đã có provider" tone="primary" />
          <MetricTile label="Assignment" value={assignments.length} helper="Của yêu cầu đang chọn" tone="success" />
        </View>
        <ActionButton
          label={loading ? "Đang làm mới..." : "Làm mới"}
          onPress={() => {
            void loadInitialData();
            if (selectedRequestId) {
              void loadRequestHistory(selectedRequestId);
            }
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

      <SectionCard title="Chọn yêu cầu" subtitle="Danh sách các yêu cầu đã có thợ để staff xem lại lịch sử gán và chi phí ước tính">
        <View style={styles.requestList}>
          {orderedRequests.map((request) => {
            const active = request.id === selectedRequestId;
            return (
              <Pressable
                key={request.id}
                style={[styles.selectionCard, active && styles.selectionCardActive]}
                onPress={() => setSelectedRequestId(request.id)}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.selectionTitle}>{request.description}</Text>
                  <StatusBadge label={formatRequestStatus(request.status)} tone="primary" />
                </View>
                <View style={styles.badgeRow}>
                  <StatusBadge label={formatShortId(request.id)} tone="neutral" />
                  <StatusBadge label={formatDateTime(request.createdAt)} tone="primary" />
                </View>
                <Text style={styles.meta}>Khách hàng: {getCustomerName(request.customerId)}</Text>
                <Text style={styles.meta}>Thợ hiện tại: {getAgentName(request.assignedProviderId)}</Text>
                <Text style={styles.meta}>Chi phí ước tính: {getEstimatedCostLabel(request)}</Text>
              </Pressable>
            );
          })}
        </View>
        {!orderedRequests.length ? <Text style={styles.meta}>Chưa có yêu cầu nào đã được gán thợ.</Text> : null}
      </SectionCard>

      {selectedRequest ? (
        <SectionCard title="Chi tiết yêu cầu đang xem">
          <Text style={styles.selectionTitle}>{selectedRequest.description}</Text>
          <View style={styles.badgeRow}>
            <StatusBadge label={formatRequestStatus(selectedRequest.status)} tone="primary" />
            <StatusBadge label={formatShortId(selectedRequest.id)} tone="neutral" />
          </View>
          <Text style={styles.meta}>Khách hàng: {getCustomerName(selectedRequest.customerId)}</Text>
          <Text style={styles.meta}>Thợ hiện tại: {getAgentName(selectedRequest.assignedProviderId)}</Text>
          <Text style={styles.meta}>Chi phí ước tính: {getEstimatedCostLabel(selectedRequest)}</Text>
        </SectionCard>
      ) : null}

      <SectionCard title={`Assignment đã tạo (${assignments.length})`} subtitle="Mỗi dòng đại diện cho một lần ghi nhận phân công trên hệ thống">
        <View style={styles.assignmentList}>
          {assignments.map((assignment) => (
            <View key={assignment.id} style={styles.selectionCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.selectionTitle}>Thợ: {getAgentName(assignment.agentId)}</Text>
                <StatusBadge label={formatDateTime(assignment.assignedAt)} tone="primary" />
              </View>
              <Text style={styles.meta}>
                Chi phí ước tính: {formatCurrency(assignment.estimatedCost.amount, assignment.estimatedCost.currency)}
              </Text>
            </View>
          ))}
        </View>
        {assignments.length === 0 ? <Text style={styles.meta}>Chưa có assignment nào cho yêu cầu đang chọn.</Text> : null}
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
  requestList: {
    gap: 10
  },
  assignmentList: {
    gap: 10
  },
  selectionCard: {
    borderWidth: 1,
    borderColor: "rgba(100, 116, 139, 0.16)",
    borderRadius: 20,
    padding: 12,
    gap: 8,
    backgroundColor: colors.surfaceRaised
  },
  selectionCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoftAlt
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
    fontSize: 14,
    flex: 1,
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
  error: {
    color: colors.danger,
    fontSize: 13,
    lineHeight: 18
  }
});
