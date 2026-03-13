import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import ScreenLayout from "../../../shared/ui/ScreenLayout";
import { colors } from "../../../app/theme/colors";
import { useAuth } from "../../auth/AuthContext";
import { graphqlRequest } from "../../../shared/api/graphqlClient";
import {
  ALL_REQUESTS_QUERY,
  ASSIGNMENTS_BY_REQUEST_QUERY,
  MATCHING_RESULTS_BY_REQUEST_QUERY,
  SERVICE_DEFINITIONS_QUERY,
  USER_BY_ID_QUERY
} from "../../../shared/api/graphqlDocuments";
import {
  asErrorMessage,
  formatDateTime,
  formatRequestStatus,
  formatShortId
} from "../../../shared/utils/format";
import type {
  AssignmentItem,
  MatchingResultItem,
  ServiceDefinition,
  ServiceRequestItem,
  UserProfile
} from "../../../shared/types/domain";
import ActionButton from "../../../shared/ui/ActionButton";

interface AllRequestsResponse {
  getServiceRequests: ServiceRequestItem[];
}

interface AssignmentByRequestResponse {
  getAssignmentsByServiceRequestId: AssignmentItem[];
}

interface MatchingByRequestResponse {
  getMatchingResultsByServiceRequestId: MatchingResultItem[];
}

interface ServiceDefinitionsResponse {
  getServiceDefinitions: ServiceDefinition[];
}

interface UserByIdResponse {
  getUserById: UserProfile | null;
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

export default function AgentRequestBoardScreen() {
  const { session } = useAuth();
  const [items, setItems] = useState<ServiceRequestItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<(typeof statusOptions)[number]>("ALL");
  const [selectedRequestId, setSelectedRequestId] = useState("");
  const [serviceNamesById, setServiceNamesById] = useState<Record<string, string>>({});
  const [customerProfile, setCustomerProfile] = useState<UserProfile | null>(null);
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [matches, setMatches] = useState<MatchingResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const filteredItems = useMemo(() => {
    if (statusFilter === "ALL") {
      return items;
    }
    return items.filter((item) => item.status === statusFilter);
  }, [items, statusFilter]);

  const selectedRequest = useMemo(
    () => items.find((item) => item.id === selectedRequestId) ?? null,
    [items, selectedRequestId]
  );

  const loadBoard = async () => {
    if (!session) {
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [requestData, serviceData] = await Promise.all([
        graphqlRequest<AllRequestsResponse>(
          ALL_REQUESTS_QUERY,
          undefined,
          session.accessToken
        ),
        graphqlRequest<ServiceDefinitionsResponse>(SERVICE_DEFINITIONS_QUERY)
      ]);
      setItems(requestData.getServiceRequests);
      setServiceNamesById(
        Object.fromEntries(serviceData.getServiceDefinitions.map((service) => [service.id, service.name]))
      );
    } catch (loadError) {
      setError(asErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  const loadLinkedData = async (requestedId?: string) => {
    if (!session) {
      return;
    }

    const requestId = requestedId ?? selectedRequestId;
    if (!requestId.trim()) {
      setError("Hãy chọn một yêu cầu từ danh sách");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const request = items.find((item) => item.id === requestId.trim()) ?? null;
      const [assignmentData, matchingData, userData] = await Promise.all([
        graphqlRequest<AssignmentByRequestResponse, { serviceRequestId: string }>(
          ASSIGNMENTS_BY_REQUEST_QUERY,
          { serviceRequestId: requestId.trim() },
          session.accessToken
        ),
        graphqlRequest<MatchingByRequestResponse, { serviceRequestId: string }>(
          MATCHING_RESULTS_BY_REQUEST_QUERY,
          { serviceRequestId: requestId.trim() },
          session.accessToken
        ),
        request?.customerId
          ? graphqlRequest<UserByIdResponse, { id: string }>(
              USER_BY_ID_QUERY,
              { id: request.customerId },
              session.accessToken
            )
          : Promise.resolve<UserByIdResponse | null>(null)
      ]);
      setSelectedRequestId(requestId.trim());
      setAssignments(assignmentData.getAssignmentsByServiceRequestId);
      setMatches(matchingData.getMatchingResultsByServiceRequestId);
      setCustomerProfile(userData?.getUserById ?? null);
    } catch (loadError) {
      setError(asErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedRequest) {
      return;
    }

    setCustomerProfile(null);
  }, [selectedRequest]);

  useEffect(() => {
    void loadBoard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken]);

  return (
    <ScreenLayout title="Bảng yêu cầu" subtitle="Danh sách yêu cầu dịch vụ">
      <View style={styles.filterRow}>
        {statusOptions.map((option) => {
          const active = statusFilter === option;
          return (
            <Pressable
              key={option}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setStatusFilter(option)}
            >
              <Text style={[styles.filterText, active && styles.filterTextActive]}>
                {option === "ALL" ? "Tất cả" : formatRequestStatus(option)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {!!error ? <Text style={styles.error}>{error}</Text> : null}
      {loading ? <Text style={styles.meta}>Đang tải...</Text> : null}

      <View style={styles.card}>
        <Text style={styles.title}>Yêu cầu ({filteredItems.length})</Text>
        {filteredItems.slice(0, 25).map((item) => (
          <Pressable
            key={item.id}
            style={[styles.row, selectedRequestId === item.id && styles.rowSelected]}
            onPress={() => void loadLinkedData(item.id)}
          >
            <Text style={styles.rowTitle}>{item.description}</Text>
            <Text style={styles.meta}>Mã: {formatShortId(item.id)}</Text>
            {item.serviceDefinitionId ? (
              <Text style={styles.meta}>
                Dịch vụ:{" "}
                {serviceNamesById[item.serviceDefinitionId] ??
                  formatShortId(item.serviceDefinitionId)}
              </Text>
            ) : null}
            <Text style={styles.meta}>Trạng thái: {formatRequestStatus(item.status)}</Text>
            <Text style={styles.meta}>Tạo lúc: {formatDateTime(item.createdAt)}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Tra cứu công việc &amp; matching</Text>
        {selectedRequest ? (
          <Text style={styles.selected}>Đã chọn: {selectedRequest.description}</Text>
        ) : (
          <Text style={styles.hint}>Nhấn vào yêu cầu phía trên để chọn</Text>
        )}
        {selectedRequest ? (
          <>
            <Text style={styles.meta}>Mã: {formatShortId(selectedRequest.id)}</Text>
            <Text style={styles.meta}>
              Khách hàng: {customerProfile?.fullName ?? formatShortId(selectedRequest.customerId)}
            </Text>
            <Text style={styles.meta}>
              Số điện thoại: {customerProfile?.phoneNumber || "-"}
            </Text>
            <Text style={styles.meta}>
              Địa chỉ:{" "}
              {selectedRequest.addressText || "Khách hàng chưa nhập địa chỉ cho yêu cầu này."}
            </Text>
            {selectedRequest.serviceDefinitionId ? (
              <Text style={styles.meta}>
                Dịch vụ:{" "}
                {serviceNamesById[selectedRequest.serviceDefinitionId] ??
                  formatShortId(selectedRequest.serviceDefinitionId)}
              </Text>
            ) : null}
            <Text style={styles.meta}>
              Trạng thái: {formatRequestStatus(selectedRequest.status)}
            </Text>
            <Text style={styles.meta}>Tạo lúc: {formatDateTime(selectedRequest.createdAt)}</Text>
          </>
        ) : null}
        <ActionButton
          label={loading ? "Đang tải..." : "Tải dữ liệu liên kết"}
          onPress={() => void loadLinkedData(selectedRequestId)}
          disabled={loading || !selectedRequestId}
          variant="secondary"
        />
        <Text style={styles.meta}>Công việc: {assignments.length}</Text>
        <Text style={styles.meta}>Kết quả matching: {matches.length}</Text>
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
    borderRadius: 12,
    padding: 14,
    gap: 8
  },
  title: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 15
  },
  row: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 10,
    gap: 2,
    backgroundColor: "#fff"
  },
  rowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft
  },
  rowTitle: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 13
  },
  meta: {
    color: colors.textMuted,
    fontSize: 12
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
  },
  error: {
    color: colors.danger,
    fontSize: 13
  }
});
