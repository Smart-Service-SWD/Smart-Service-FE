import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import ScreenLayout from "../../../shared/ui/ScreenLayout";
import { colors } from "../../../app/theme/colors";
import { useAuth } from "../../auth/AuthContext";
import { graphqlRequest } from "../../../shared/api/graphqlClient";
import {
  ACTIVITY_LOGS_BY_REQUEST_QUERY,
  ACTIVITY_LOGS_QUERY
} from "../../../shared/api/graphqlDocuments";
import { asErrorMessage, formatDateTime } from "../../../shared/utils/format";
import type { ActivityLogItem } from "../../../shared/types/domain";
import LabeledInput from "../../../shared/ui/LabeledInput";
import ActionButton from "../../../shared/ui/ActionButton";

interface ActivityLogsResponse {
  getActivityLogs: ActivityLogItem[];
}

interface ActivityByRequestResponse {
  getActivityLogsByServiceRequestId: ActivityLogItem[];
}

export default function ActivityMonitorScreen() {
  const { session } = useAuth();
  const [requestId, setRequestId] = useState("");
  const [allLogs, setAllLogs] = useState<ActivityLogItem[]>([]);
  const [requestLogs, setRequestLogs] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadAll = async () => {
    if (!session) {
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await graphqlRequest<ActivityLogsResponse>(
        ACTIVITY_LOGS_QUERY,
        undefined,
        session.accessToken
      );
      setAllLogs(data.getActivityLogs);
    } catch (loadError) {
      setError(asErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  const loadByRequest = async () => {
    if (!session) {
      return;
    }
    if (!requestId.trim()) {
      setError("Request ID is required");
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

  return (
    <ScreenLayout title="Activity Monitor" subtitle="Audit trail from GraphQL">
      {!!error ? <Text style={styles.error}>{error}</Text> : null}
      {loading ? <Text style={styles.meta}>Loading...</Text> : null}

      <View style={styles.card}>
        <Text style={styles.title}>Lookup by Request</Text>
        <LabeledInput
          label="Service Request ID"
          value={requestId}
          onChangeText={setRequestId}
          placeholder="Paste request ID"
          autoCapitalize="none"
        />
        <ActionButton
          label={loading ? "Loading..." : "Load Request Logs"}
          onPress={() => void loadByRequest()}
          disabled={loading}
          variant="secondary"
        />
        <Text style={styles.meta}>Result count: {requestLogs.length}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Request Logs</Text>
        {requestLogs.map((log) => (
          <View key={log.id} style={styles.row}>
            <Text style={styles.rowTitle}>{log.action}</Text>
            <Text style={styles.meta}>Request: {log.serviceRequestId}</Text>
            <Text style={styles.meta}>At: {formatDateTime(log.createdAt)}</Text>
          </View>
        ))}
        {!requestLogs.length ? <Text style={styles.meta}>No logs loaded</Text> : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>All Logs ({allLogs.length})</Text>
        {allLogs.slice(0, 25).map((log) => (
          <View key={log.id} style={styles.row}>
            <Text style={styles.rowTitle}>{log.action}</Text>
            <Text style={styles.meta}>Request: {log.serviceRequestId}</Text>
            <Text style={styles.meta}>At: {formatDateTime(log.createdAt)}</Text>
          </View>
        ))}
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
    borderRadius: 8,
    padding: 10,
    gap: 2,
    backgroundColor: "#fff"
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
  error: {
    color: colors.danger,
    fontSize: 13
  }
});

