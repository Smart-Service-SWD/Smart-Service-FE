import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import ScreenLayout from "../../../shared/ui/ScreenLayout";
import { colors } from "../../../app/theme/colors";
import { useAuth } from "../../auth/AuthContext";
import { graphqlRequest } from "../../../shared/api/graphqlClient";
import {
  AGENT_ASSIGNMENTS_QUERY,
  REQUEST_BY_ID_QUERY
} from "../../../shared/api/graphqlDocuments";
import {
  asErrorMessage,
  formatCurrency,
  formatDateTime
} from "../../../shared/utils/format";
import type { AssignmentItem, ServiceRequestItem } from "../../../shared/types/domain";
import LabeledInput from "../../../shared/ui/LabeledInput";
import ActionButton from "../../../shared/ui/ActionButton";

interface AssignmentResponse {
  getAssignmentsByAgentId: AssignmentItem[];
}

interface RequestByIdResponse {
  getServiceRequestById: ServiceRequestItem | null;
}

export default function AssignmentsScreen() {
  const { session } = useAuth();
  const [items, setItems] = useState<AssignmentItem[]>([]);
  const [detailRequestId, setDetailRequestId] = useState("");
  const [detail, setDetail] = useState<ServiceRequestItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    if (!session) {
      return;
    }

    setLoading(true);
    setError("");
    try {
      const data = await graphqlRequest<AssignmentResponse, { agentId: string }>(
        AGENT_ASSIGNMENTS_QUERY,
        { agentId: session.userId },
        session.accessToken
      );
      setItems(data.getAssignmentsByAgentId);
    } catch (loadError) {
      setError(asErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  const loadRequestDetail = async () => {
    if (!session) {
      return;
    }
    if (!detailRequestId.trim()) {
      setError("Request ID is required");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const data = await graphqlRequest<RequestByIdResponse, { id: string }>(
        REQUEST_BY_ID_QUERY,
        { id: detailRequestId.trim() },
        session.accessToken
      );
      setDetail(data.getServiceRequestById);
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
    <ScreenLayout title="Assignments" subtitle="Agent view from GraphQL">
      {loading ? <Text style={styles.loading}>Loading...</Text> : null}
      {!!error ? <Text style={styles.error}>{error}</Text> : null}

      {items.map((item) => (
        <View key={item.id} style={styles.card}>
          <Text style={styles.title}>Request: {item.serviceRequestId}</Text>
          <Text style={styles.meta}>Assigned: {formatDateTime(item.assignedAt)}</Text>
          <Text style={styles.meta}>
            Estimated: {formatCurrency(item.estimatedCost.amount, item.estimatedCost.currency)}
          </Text>
        </View>
      ))}

      {!loading && items.length === 0 ? (
        <Text style={styles.empty}>No assignments available</Text>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.title}>Request Detail Lookup</Text>
        <LabeledInput
          label="Request ID"
          value={detailRequestId}
          onChangeText={setDetailRequestId}
          placeholder="Paste request ID from assignment"
          autoCapitalize="none"
        />
        <ActionButton
          label={loading ? "Loading..." : "Load Request Detail"}
          onPress={() => void loadRequestDetail()}
          disabled={loading}
          variant="secondary"
        />
        {detail ? (
          <View style={styles.detail}>
            <Text style={styles.meta}>Status: {detail.status}</Text>
            <Text style={styles.meta}>Description: {detail.description}</Text>
            <Text style={styles.meta}>
              Complexity: {detail.complexity?.level ?? "Not evaluated"}
            </Text>
            <Text style={styles.meta}>Address: {detail.addressText || "-"}</Text>
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
  empty: {
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 20
  }
});
