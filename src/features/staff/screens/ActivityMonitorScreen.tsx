import { useEffect, useMemo, useState } from "react";
import { useRoute, type RouteProp } from "@react-navigation/native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import ScreenLayout from "../../../shared/ui/ScreenLayout";
import { colors } from "../../../app/theme/colors";
import type { StaffTabParamList } from "../../../app/navigation/types";
import { useAuth } from "../../auth/AuthContext";
import { graphqlRequest } from "../../../shared/api/graphqlClient";
import {
  ACTIVITY_LOGS_BY_REQUEST_QUERY,
  ACTIVITY_LOGS_QUERY,
  ALL_REQUESTS_QUERY
} from "../../../shared/api/graphqlDocuments";
import {
  asErrorMessage,
  formatDateTime,
  formatRequestStatus,
  formatShortId
} from "../../../shared/utils/format";
import type { ActivityLogItem, ServiceRequestItem } from "../../../shared/types/domain";
import ActionButton from "../../../shared/ui/ActionButton";

interface ActivityLogsResponse {
  getActivityLogs: ActivityLogItem[];
}

interface ActivityByRequestResponse {
  getActivityLogsByServiceRequestId: ActivityLogItem[];
}

interface AllRequestsResponse {
  getServiceRequests: ServiceRequestItem[];
}

export default function ActivityMonitorScreen() {
  const route = useRoute<RouteProp<StaffTabParamList, "ActivityMonitor">>();
  const { session } = useAuth();
  const [selectedRequestId, setSelectedRequestId] = useState("");
  const [allLogs, setAllLogs] = useState<ActivityLogItem[]>([]);
  const [requestLogs, setRequestLogs] = useState<ActivityLogItem[]>([]);
  const [requests, setRequests] = useState<ServiceRequestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedRequest = useMemo(
    () => requests.find((item) => item.id === selectedRequestId) ?? null,
    [requests, selectedRequestId]
  );

  const recentRequests = useMemo(
    () =>
      requests
        .slice()
        .sort(
          (left, right) =>
            new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
        )
        .slice(0, 8),
    [requests]
  );

  const getRequestLabel = (requestId: string) => {
    const request = requests.find((item) => item.id === requestId);
    return request?.description || `Yêu cầu ${formatShortId(requestId)}`;
  };

  const loadAll = async () => {
    if (!session) {
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [logData, requestData] = await Promise.all([
        graphqlRequest<ActivityLogsResponse>(
          ACTIVITY_LOGS_QUERY,
          undefined,
          session.accessToken
        ),
        graphqlRequest<AllRequestsResponse>(
          ALL_REQUESTS_QUERY,
          undefined,
          session.accessToken
        )
      ]);

      setAllLogs(logData.getActivityLogs);
      setRequests(requestData.getServiceRequests);
    } catch (loadError) {
      setError(asErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  const loadByRequest = async (requestId: string) => {
    if (!session || !requestId.trim()) {
      setRequestLogs([]);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await graphqlRequest<ActivityByRequestResponse, { serviceRequestId: string }>(
        ACTIVITY_LOGS_BY_REQUEST_QUERY,
        { serviceRequestId: requestId.trim() },
        session.accessToken
      );
      setSelectedRequestId(requestId.trim());
      setRequestLogs(data.getActivityLogsByServiceRequestId);
    } catch (loadError) {
      setError(asErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken]);

  useEffect(() => {
    const routeRequestId = route.params?.requestId;
    if (!routeRequestId) {
      return;
    }

    void loadByRequest(routeRequestId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.params?.requestId]);

  useEffect(() => {
    if (selectedRequestId) {
      return;
    }

    const firstRequestWithLog = allLogs[0]?.serviceRequestId;
    if (firstRequestWithLog) {
      void loadByRequest(firstRequestWithLog);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allLogs, selectedRequestId]);

  return (
    <ScreenLayout
      title="Lịch sử hoạt động"
      subtitle="Staff nhấn vào yêu cầu hoặc log để xem lịch sử, không cần nhập mã tay"
    >
      {!!error ? <Text style={styles.error}>{error}</Text> : null}
      {loading ? <Text style={styles.meta}>Đang tải...</Text> : null}

      <View style={styles.card}>
        <Text style={styles.title}>Yêu cầu gần đây</Text>
        <Text style={styles.meta}>Nhấn vào một yêu cầu để xem toàn bộ log của đơn đó.</Text>
        {recentRequests.map((request) => (
          <Pressable
            key={request.id}
            style={[
              styles.row,
              selectedRequestId === request.id && styles.rowActive
            ]}
            onPress={() => void loadByRequest(request.id)}
          >
            <Text style={styles.rowTitle}>{request.description}</Text>
            <Text style={styles.meta}>Mã: {formatShortId(request.id)}</Text>
            <Text style={styles.meta}>
              Trạng thái: {formatRequestStatus(request.status)}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Nhật ký theo yêu cầu</Text>
        {selectedRequest ? (
          <>
            <Text style={styles.rowTitle}>{selectedRequest.description}</Text>
            <Text style={styles.meta}>Mã: {formatShortId(selectedRequest.id)}</Text>
            <Text style={styles.meta}>
              Trạng thái: {formatRequestStatus(selectedRequest.status)}
            </Text>
          </>
        ) : (
          <Text style={styles.meta}>Chưa chọn yêu cầu.</Text>
        )}
        <Text style={styles.meta}>Số kết quả: {requestLogs.length}</Text>
        {requestLogs.map((log) => (
          <View key={log.id} style={styles.row}>
            <Text style={styles.rowTitle}>{log.action}</Text>
            <Text style={styles.meta}>Thời gian: {formatDateTime(log.createdAt)}</Text>
          </View>
        ))}
        {!requestLogs.length ? <Text style={styles.meta}>Chưa có nhật ký</Text> : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Toàn bộ nhật ký ({allLogs.length})</Text>
        <Text style={styles.meta}>
          Staff có thể nhấn một log để lọc theo yêu cầu tương ứng.
        </Text>
        {allLogs.slice(0, 25).map((log) => (
          <Pressable
            key={log.id}
            style={styles.row}
            onPress={() => void loadByRequest(log.serviceRequestId)}
          >
            <Text style={styles.rowTitle}>{log.action}</Text>
            <Text style={styles.meta}>
              {getRequestLabel(log.serviceRequestId)} · {formatShortId(log.serviceRequestId)}
            </Text>
            <Text style={styles.meta}>Thời gian: {formatDateTime(log.createdAt)}</Text>
          </Pressable>
        ))}
        <ActionButton
          label={loading ? "Đang tải..." : "Tải lại nhật ký"}
          onPress={() => void loadAll()}
          disabled={loading}
          variant="secondary"
        />
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
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
    borderRadius: 10,
    padding: 10,
    gap: 2,
    backgroundColor: "#fff"
  },
  rowActive: {
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
    fontSize: 12,
    lineHeight: 18
  },
  error: {
    color: colors.danger,
    fontSize: 13
  }
});
