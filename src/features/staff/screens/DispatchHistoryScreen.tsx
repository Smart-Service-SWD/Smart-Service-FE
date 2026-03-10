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
      subtitle="Chỉ hiển thị các yêu cầu đã được gán thợ"
    >
      {loading ? <Text style={styles.meta}>Đang tải lịch sử phân công...</Text> : null}
      {!!error ? <Text style={styles.error}>{error}</Text> : null}

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

      <View style={styles.card}>
        <Text style={styles.title}>Chọn yêu cầu</Text>
        {orderedRequests.map((request) => {
          const active = request.id === selectedRequestId;
          return (
            <Pressable
              key={request.id}
              style={[styles.selectionCard, active && styles.selectionCardActive]}
              onPress={() => setSelectedRequestId(request.id)}
            >
              <Text style={styles.selectionTitle}>{request.description}</Text>
              <Text style={styles.meta}>Mã: {formatShortId(request.id)}</Text>
              <Text style={styles.meta}>Khách hàng: {getCustomerName(request.customerId)}</Text>
              <Text style={styles.meta}>Trạng thái: {formatRequestStatus(request.status)}</Text>
              <Text style={styles.meta}>
                Thợ hiện tại: {getAgentName(request.assignedProviderId)}
              </Text>
              <Text style={styles.meta}>Tạo lúc: {formatDateTime(request.createdAt)}</Text>
            </Pressable>
          );
        })}
        {!orderedRequests.length ? (
          <Text style={styles.meta}>Chưa có yêu cầu nào đã được gán thợ.</Text>
        ) : null}
      </View>

      {selectedRequest ? (
        <View style={styles.card}>
          <Text style={styles.title}>Chi tiết yêu cầu đang xem</Text>
          <Text style={styles.selectionTitle}>{selectedRequest.description}</Text>
          <Text style={styles.meta}>Mã: {formatShortId(selectedRequest.id)}</Text>
          <Text style={styles.meta}>
            Khách hàng: {getCustomerName(selectedRequest.customerId)}
          </Text>
          <Text style={styles.meta}>Trạng thái: {formatRequestStatus(selectedRequest.status)}</Text>
          <Text style={styles.meta}>
            Thợ hiện tại: {getAgentName(selectedRequest.assignedProviderId)}
          </Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.title}>Assignment đã tạo ({assignments.length})</Text>
        {assignments.map((assignment) => (
          <View key={assignment.id} style={styles.selectionCard}>
            <Text style={styles.selectionTitle}>Thợ: {getAgentName(assignment.agentId)}</Text>
            <Text style={styles.meta}>
              Phân công lúc: {formatDateTime(assignment.assignedAt)}
            </Text>
            <Text style={styles.meta}>
              Chi phí ước tính:{" "}
              {formatCurrency(
                assignment.estimatedCost.amount,
                assignment.estimatedCost.currency
              )}
            </Text>
          </View>
        ))}
        {assignments.length === 0 ? (
          <Text style={styles.meta}>Chưa có assignment nào cho yêu cầu đang chọn.</Text>
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
    borderRadius: 14,
    padding: 14,
    gap: 8
  },
  title: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 15
  },
  selectionCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 10,
    gap: 3,
    backgroundColor: "#fff"
  },
  selectionCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft
  },
  selectionTitle: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 13
  },
  meta: {
    color: colors.textMuted,
    fontSize: 12
  },
  error: {
    color: colors.danger,
    fontSize: 13
  }
});
