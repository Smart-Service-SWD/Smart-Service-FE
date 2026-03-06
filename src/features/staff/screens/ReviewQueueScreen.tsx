import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import ScreenLayout from "../../../shared/ui/ScreenLayout";
import { colors } from "../../../app/theme/colors";
import { useAuth } from "../../auth/AuthContext";
import { graphqlRequest } from "../../../shared/api/graphqlClient";
import {
  REQUESTS_BY_STATUS_QUERY
} from "../../../shared/api/graphqlDocuments";
import { asErrorMessage, formatDateTime } from "../../../shared/utils/format";
import type { ServiceRequestItem } from "../../../shared/types/domain";
import LabeledInput from "../../../shared/ui/LabeledInput";
import ActionButton from "../../../shared/ui/ActionButton";
import { createActivityLog, evaluateComplexity } from "../api/staffApi";

interface PendingResponse {
  getServiceRequestsByStatus: ServiceRequestItem[];
}

const statusOptions = [
  "AWAITING_ANALYSIS",
  "CREATED",
  "URGENT_DISPATCH",
  "PENDING_REVIEW",
  "ASSIGNED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED"
] as const;

export default function ReviewQueueScreen() {
  const { session } = useAuth();
  const [selectedStatus, setSelectedStatus] =
    useState<(typeof statusOptions)[number]>("CREATED");
  const [items, setItems] = useState<ServiceRequestItem[]>([]);
  const [requestId, setRequestId] = useState("");
  const [complexityLevel, setComplexityLevel] = useState("3");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = async () => {
    if (!session) {
      return;
    }

    setLoading(true);
    setError("");
    try {
      const data = await graphqlRequest<PendingResponse, { status: string }>(
        REQUESTS_BY_STATUS_QUERY,
        { status: selectedStatus },
        session.accessToken
      );
      setItems(data.getServiceRequestsByStatus);
    } catch (loadError) {
      setError(asErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluate = async () => {
    if (!session) {
      return;
    }
    if (!requestId.trim()) {
      setError("Request ID is required");
      return;
    }
    const level = Number.parseInt(complexityLevel, 10);
    if (Number.isNaN(level) || level < 1 || level > 5) {
      setError("Complexity level must be 1-5");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await evaluateComplexity(session.accessToken, requestId.trim(), level);
      await createActivityLog(session.accessToken, {
        serviceRequestId: requestId.trim(),
        action: `Staff evaluated complexity to ${level}`
      });
      setSuccess("Complexity evaluated and activity log added");
      await load();
    } catch (actionError) {
      setError(asErrorMessage(actionError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatus, session?.accessToken]);

  return (
    <ScreenLayout title="Review Queue" subtitle="Requests pending staff review">
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
                {status}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {loading ? <Text style={styles.loading}>Loading...</Text> : null}
      {!!error ? <Text style={styles.error}>{error}</Text> : null}
      {!!success ? <Text style={styles.success}>{success}</Text> : null}

      {items.map((item) => (
        <Pressable
          key={item.id}
          style={styles.card}
          onPress={() => setRequestId(item.id)}
        >
          <Text style={styles.title}>{item.description}</Text>
          <Text style={styles.meta}>Customer: {item.customerId}</Text>
          <Text style={styles.meta}>Status: {item.status}</Text>
          <Text style={styles.meta}>Created: {formatDateTime(item.createdAt)}</Text>
          <Text style={styles.meta}>Complexity: {item.complexity?.level ?? "N/A"}</Text>
        </Pressable>
      ))}

      {!loading && items.length === 0 ? (
        <Text style={styles.empty}>No pending review requests</Text>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.title}>Evaluate Complexity (PATCH)</Text>
        <LabeledInput
          label="Service Request ID"
          value={requestId}
          onChangeText={setRequestId}
          placeholder="Select from list or paste manually"
          autoCapitalize="none"
        />
        <LabeledInput
          label="Complexity Level (1-5)"
          value={complexityLevel}
          onChangeText={setComplexityLevel}
          keyboardType="number-pad"
        />
        <ActionButton
          label={loading ? "Evaluating..." : "Evaluate + Log"}
          onPress={() => void handleEvaluate()}
          disabled={loading}
        />
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
  loading: {
    color: colors.textMuted
  },
  error: {
    color: colors.danger,
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
  empty: {
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 20
  }
});
