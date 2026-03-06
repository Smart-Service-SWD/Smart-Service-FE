import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import ScreenLayout from "../../../shared/ui/ScreenLayout";
import { colors } from "../../../app/theme/colors";
import { useAuth } from "../../auth/AuthContext";
import { graphqlRequest } from "../../../shared/api/graphqlClient";
import {
  FEEDBACK_BY_REQUEST_QUERY,
  MY_REQUESTS_QUERY,
  REQUEST_BY_ID_QUERY
} from "../../../shared/api/graphqlDocuments";
import {
  asErrorMessage,
  formatCurrency,
  formatDateTime
} from "../../../shared/utils/format";
import type { ServiceFeedbackItem, ServiceRequestItem } from "../../../shared/types/domain";
import LabeledInput from "../../../shared/ui/LabeledInput";
import ActionButton from "../../../shared/ui/ActionButton";

interface MyRequestsResponse {
  getMyServiceRequests: ServiceRequestItem[];
}

interface RequestByIdResponse {
  getServiceRequestById: ServiceRequestItem | null;
}

interface FeedbackByRequestResponse {
  getFeedbackByServiceRequestId: ServiceFeedbackItem[];
  getAverageRatingByServiceRequestId: number;
}

const filters = [
  { label: "All", value: null },
  { label: "Awaiting Analysis", value: "AWAITING_ANALYSIS" },
  { label: "Created", value: "CREATED" },
  { label: "Urgent", value: "URGENT_DISPATCH" },
  { label: "Pending Review", value: "PENDING_REVIEW" },
  { label: "Assigned", value: "ASSIGNED" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Completed", value: "COMPLETED" }
] as const;

export default function MyRequestsScreen() {
  const { session } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [items, setItems] = useState<ServiceRequestItem[]>([]);
  const [detailRequestId, setDetailRequestId] = useState("");
  const [detail, setDetail] = useState<ServiceRequestItem | null>(null);
  const [detailFeedbacks, setDetailFeedbacks] = useState<ServiceFeedbackItem[]>([]);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    if (!session) {
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await graphqlRequest<MyRequestsResponse, { status?: string | null }>(
        MY_REQUESTS_QUERY,
        { status: statusFilter },
        session.accessToken
      );
      setItems(data.getMyServiceRequests);
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
      const [requestData, feedbackData] = await Promise.all([
        graphqlRequest<RequestByIdResponse, { id: string }>(
          REQUEST_BY_ID_QUERY,
          { id: detailRequestId.trim() },
          session.accessToken
        ),
        graphqlRequest<FeedbackByRequestResponse, { serviceRequestId: string }>(
          FEEDBACK_BY_REQUEST_QUERY,
          { serviceRequestId: detailRequestId.trim() },
          session.accessToken
        )
      ]);

      setDetail(requestData.getServiceRequestById);
      setDetailFeedbacks(feedbackData.getFeedbackByServiceRequestId);
      setAverageRating(feedbackData.getAverageRatingByServiceRequestId);
    } catch (loadError) {
      setError(asErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, session?.accessToken]);

  return (
    <ScreenLayout title="My Requests" subtitle="GraphQL: getMyServiceRequests">
      <View style={styles.filterRow}>
        {filters.map((filter) => {
          const active = filter.value === statusFilter;
          return (
            <Pressable
              key={filter.label}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setStatusFilter(filter.value)}
            >
              <Text
                style={[styles.filterChipText, active && styles.filterChipTextActive]}
              >
                {filter.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {loading ? <Text style={styles.loading}>Loading...</Text> : null}
      {!!error ? <Text style={styles.error}>{error}</Text> : null}

      {items.map((item) => (
        <View key={item.id} style={styles.card}>
          <Text style={styles.cardTitle}>{item.description}</Text>
          <Text style={styles.meta}>Status: {item.status}</Text>
          <Text style={styles.meta}>Created: {formatDateTime(item.createdAt)}</Text>
          <Text style={styles.meta}>
            Complexity: {item.complexity?.level ?? "Not evaluated"}
          </Text>
          <Text style={styles.meta}>
            Estimated Cost:{" "}
            {item.estimatedCost
              ? formatCurrency(item.estimatedCost.amount, item.estimatedCost.currency)
              : "N/A"}
          </Text>
          {item.addressText ? <Text style={styles.meta}>Address: {item.addressText}</Text> : null}
        </View>
      ))}

      {!loading && items.length === 0 ? (
        <Text style={styles.empty}>No requests for this filter</Text>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Request Detail + Feedback</Text>
        <LabeledInput
          label="Request ID"
          value={detailRequestId}
          onChangeText={setDetailRequestId}
          placeholder="Paste request ID"
          autoCapitalize="none"
        />
        <ActionButton
          label={loading ? "Loading..." : "Load Detail"}
          onPress={() => void loadRequestDetail()}
          disabled={loading}
          variant="secondary"
        />
        {detail ? (
          <View style={styles.detailBox}>
            <Text style={styles.meta}>Status: {detail.status}</Text>
            <Text style={styles.meta}>Description: {detail.description}</Text>
            <Text style={styles.meta}>
              Complexity: {detail.complexity?.level ?? "Not evaluated"}
            </Text>
            <Text style={styles.meta}>Average Rating: {averageRating ?? 0}</Text>
            <Text style={styles.meta}>Feedback Count: {detailFeedbacks.length}</Text>
          </View>
        ) : null}
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
  filterChipText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "600"
  },
  filterChipTextActive: {
    color: colors.primary
  },
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
  cardTitle: {
    color: colors.text,
    fontWeight: "700"
  },
  meta: {
    color: colors.textMuted,
    fontSize: 12
  },
  detailBox: {
    gap: 3,
    marginTop: 8
  },
  empty: {
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 16
  }
});
