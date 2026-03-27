import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { colors } from "../../../app/theme/colors";
import BrandLogo from "../../../shared/ui/BrandLogo";
import { useAuth } from "../../auth/AuthContext";
import { graphqlRequest } from "../../../shared/api/graphqlClient";
import { MY_SERVICE_AGENT_QUERY } from "../../../shared/api/graphqlDocuments";
import {
  asErrorMessage,
  formatCurrency,
  formatDateTime
} from "../../../shared/utils/format";
import type { ServiceAgentItem } from "../../../shared/types/domain";
import { getPayoutsByAgent, type PayoutItem } from "../api/agentApi";

interface MyServiceAgentResponse {
  getMyServiceAgent: ServiceAgentItem | null;
}

export default function PayoutHistoryScreen() {
  const { session } = useAuth();
  const [payouts, setPayouts] = useState<PayoutItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError("");

    try {
      const agentData = await graphqlRequest<MyServiceAgentResponse>(
        MY_SERVICE_AGENT_QUERY,
        undefined,
        session.accessToken
      );

      const linkedAgent = agentData.getMyServiceAgent;

      if (!linkedAgent) {
        setPayouts([]);
        setError("Không tìm thấy hồ sơ thợ gắn với tài khoản này.");
        return;
      }

      const data = await getPayoutsByAgent(session.accessToken, linkedAgent.id);
      setPayouts(data.sort((a, b) => new Date(b.payoutDate).getTime() - new Date(a.payoutDate).getTime()));
    } catch (err) {
      setError(asErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const renderItem = ({ item }: { item: PayoutItem }) => (
    <View style={styles.payoutCard}>
      <View style={styles.payoutHeader}>
        <View style={styles.iconBox}>
          <MaterialIcons name="account-balance-wallet" size={20} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.payoutDate}>{formatDateTime(item.payoutDate)}</Text>
          <Text style={styles.requestId}>Đơn hàng: #{item.serviceRequestId.substring(0, 8)}</Text>
        </View>
        <Text style={styles.netAmount}>{formatCurrency(item.netAmount.amount, item.netAmount.currency)}</Text>
      </View>
      
      <View style={styles.divider} />
      
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Tổng thu:</Text>
        <Text style={styles.detailValue}>{formatCurrency(item.amount.amount, item.amount.currency)}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Phí hệ thống ({item.commissionRate * 100}%):</Text>
        <Text style={[styles.detailValue, { color: colors.danger }]}>
          -{formatCurrency(item.amount.amount - item.netAmount.amount, item.amount.currency)}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <BrandLogo size={36} />
          <View>
            <Text style={styles.title}>Lịch sử thu nhập</Text>
            <Text style={styles.subtitle}>Danh sách các khoản đã tất toán</Text>
          </View>
        </View>
      </View>

      {!!error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={payouts}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="history" size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>Chưa có lịch sử thu nhập.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    backgroundColor: "#fff",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0"
  },
  headerContent: { flexDirection: "row", alignItems: "center", gap: 12 },
  title: { fontSize: 18, fontWeight: "800", color: "#0f172a" },
  subtitle: { fontSize: 12, color: "#64748b" },
  listContent: { padding: 20, gap: 14 },
  payoutCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2
  },
  payoutHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  iconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#eff6ff", alignItems: "center", justifyContent: "center" },
  payoutDate: { fontSize: 12, color: "#64748b" },
  requestId: { fontSize: 13, fontWeight: "700", color: "#0f172a" },
  netAmount: { fontSize: 16, fontWeight: "800", color: "#16a34a" },
  divider: { height: 1, backgroundColor: "#f1f5f9", marginBottom: 12 },
  detailRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  detailLabel: { fontSize: 13, color: "#64748b" },
  detailValue: { fontSize: 13, fontWeight: "600", color: "#334155" },
  errorBox: { margin: 20, padding: 12, borderRadius: 12, backgroundColor: "#fef2f2" },
  errorText: { color: colors.danger, fontSize: 13, textAlign: "center" },
  loadingCenter: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 100, gap: 12 },
  emptyText: { color: "#94a3b8", fontSize: 14 }
});




