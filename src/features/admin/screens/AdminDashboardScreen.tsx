import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../../app/theme/colors";
import BrandLogo from "../../../shared/ui/BrandLogo";
import { useAuth } from "../../auth/AuthContext";
import { graphqlRequest } from "../../../shared/api/graphqlClient";
import {
  ADMIN_DASHBOARD_QUERY,
  USERS_BY_ROLE_QUERY
} from "../../../shared/api/graphqlDocuments";
import { asErrorMessage, formatCurrency } from "../../../shared/utils/format";
import type { UserProfile } from "../../../shared/types/domain";
import ActionButton from "../../../shared/ui/ActionButton";

interface DashboardSummary {
  totalUsers: number;
  totalStaff: number;
  totalAgents: number;
  totalServices: number;
  totalRequests: number;
  pendingRequests: number;
  completedRequests: number;
  todayRevenue: number;
  monthlyRevenue: number;
}

interface AdminDashboardResponse {
  getDashboardSummary: DashboardSummary;
}

interface UsersByRoleResponse {
  getUsersByRole: UserProfile[];
}

const getUserInitials = (fullName?: string | null) => {
  const parts = fullName?.trim().split(/\s+/).filter(Boolean) ?? [];

  if (!parts.length) {
    return "U";
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
};

export default function AdminDashboardScreen() {
  const { session } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [agents, setAgents] = useState<UserProfile[]>([]);
  const [staffs, setStaffs] = useState<UserProfile[]>([]);
  const [customers, setCustomers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const load = async () => {
    if (!session) {
      return;
    }

    setLoading(true);
    setError("");
    try {
      const [data, agentData, staffData, customerData] = await Promise.all([
        graphqlRequest<AdminDashboardResponse>(
          ADMIN_DASHBOARD_QUERY,
          undefined,
          session.accessToken
        ),
        graphqlRequest<UsersByRoleResponse, { role: string }>(
          USERS_BY_ROLE_QUERY,
          { role: "AGENT" },
          session.accessToken
        ),
        graphqlRequest<UsersByRoleResponse, { role: string }>(
          USERS_BY_ROLE_QUERY,
          { role: "STAFF" },
          session.accessToken
        ),
        graphqlRequest<UsersByRoleResponse, { role: string }>(
          USERS_BY_ROLE_QUERY,
          { role: "CUSTOMER" },
          session.accessToken
        )
      ]);
      setSummary(data.getDashboardSummary);
      setAgents(agentData.getUsersByRole);
      setStaffs(staffData.getUsersByRole);
      setCustomers(customerData.getUsersByRole);
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

  const overviewTiles = useMemo(
    () => [
      { label: "Người dùng", value: summary?.totalUsers ?? 0, icon: "group" as const },
      { label: "Yêu cầu", value: summary?.totalRequests ?? 0, icon: "assignment" as const },
      { label: "Hôm nay", value: formatCurrency(summary?.todayRevenue ?? 0), icon: "attach-money" as const },
      { label: "Tháng", value: formatCurrency(summary?.monthlyRevenue ?? 0), icon: "bar-chart" as const }
    ],
    [summary]
  );

  const groups = [
    {
      title: "Thợ kỹ thuật",
      users: agents,
      emptyText: "Chưa có thợ kỹ thuật nào trong hệ thống."
    },
    {
      title: "Nhân viên",
      users: staffs,
      emptyText: "Chưa có tài khoản staff nào trong hệ thống."
    },
    {
      title: "Khách hàng",
      users: customers,
      emptyText: "Chưa có khách hàng nào trong hệ thống."
    }
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logoBox}>
              <BrandLogo size={40} />
            </View>
            <View>
              <Text style={styles.headerTitle}>Bảng điều khiển</Text>
              <Text style={styles.headerSub}>Tổng quan hệ thống</Text>
            </View>
          </View>
        </View>

        {/* Error */}
        {!!error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}><MaterialIcons name="warning-amber" size={14} color={colors.danger} /> {error}</Text>
          </View>
        )}

        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.primary} size="small" />
            <Text style={styles.loadingText}>Đang tải...</Text>
          </View>
        )}

        {/* Overview metrics */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tổng quan nhanh</Text>
          <View style={styles.metricGrid}>
            {overviewTiles.map((tile) => (
              <View key={tile.label} style={styles.metricTile}>
                <MaterialIcons name={tile.icon} size={22} color={colors.text} />
                <Text style={styles.metricValue}>{tile.value}</Text>
                <Text style={styles.metricLabel}>{tile.label}</Text>
              </View>
            ))}
          </View>
          <ActionButton
            label={loading ? "Đang làm mới..." : "Làm mới dữ liệu"}
            onPress={() => void load()}
            disabled={loading}
            variant="secondary"
          />
        </View>

        {/* Operation balance */}
        {summary ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Cân bằng vận hành</Text>
            <View style={styles.badgeRow}>
              <View style={[styles.statusPill, { backgroundColor: "#eff6ff" }]}>
                <Text style={[styles.statusText, { color: "#2563eb" }]}>Staff {summary.totalStaff}</Text>
              </View>
              <View style={[styles.statusPill, { backgroundColor: "#f0fdf4" }]}>
                <Text style={[styles.statusText, { color: "#16a34a" }]}>Agent {summary.totalAgents}</Text>
              </View>
              <View style={[styles.statusPill, { backgroundColor: "#fefce8" }]}>
                <Text style={[styles.statusText, { color: "#ca8a04" }]}>Dịch vụ {summary.totalServices}</Text>
              </View>
              <View style={[styles.statusPill, { backgroundColor: "#f0f4ff" }]}>
                <Text style={[styles.statusText, { color: "#64748b" }]}>Hoàn thành {summary.completedRequests}</Text>
              </View>
            </View>
            <Text style={styles.metaText}>
              Chờ xử lý: {summary.pendingRequests} • Dịch vụ: {summary.totalServices}
            </Text>
          </View>
        ) : null}

        {/* User groups */}
        {groups.map((group) => {
          const key = group.title;
          const expanded = !!expandedGroups[key];

          return (
            <View key={key} style={styles.card}>
              <View style={styles.groupHeader}>
                <Pressable
                  style={styles.groupHeaderPressable}
                  onPress={() => toggleGroup(key)}
                  hitSlop={8}
                >
                  <Text style={styles.cardTitle}>{group.title} ({group.users.length})</Text>
                  <MaterialIcons
                    name={expanded ? "expand-less" : "expand-more"}
                    size={22}
                    color={colors.text}
                  />
                </Pressable>
              </View>

              {expanded ? (
                <>
                  <View style={styles.userList}>
                    {group.users.map((user) => (
                      <View key={user.id} style={styles.userCard}>
                        <View style={styles.userAvatar}>
                          <Text style={styles.userAvatarText}>{getUserInitials(user.fullName)}</Text>
                        </View>
                        <View style={styles.userContent}>
                          <View style={styles.userHeader}>
                            <Text style={styles.userName}>{user.fullName}</Text>
                            <View
                              style={[
                                styles.statusPill,
                                { backgroundColor: user.isLocked ? "#fef2f2" : "#eff6ff" }
                              ]}
                            >
                              <Text
                                style={[
                                  styles.statusText,
                                  { color: user.isLocked ? "#dc2626" : "#2563eb" }
                                ]}
                              >
                                {user.isLocked ? "Khóa" : "Hoạt động"}
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.userEmail}>{user.email}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                  {!group.users.length ? (
                    <Text style={styles.emptyText}>{group.emptyText}</Text>
                  ) : null}
                </>
              ) : null}
            </View>
          );
        })}

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f0f4ff" },
  scroll: { flex: 1 },
  content: { paddingTop: 16, paddingBottom: 20, gap: 14 },

  header: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.55)",
    gap: 14,
    alignItems: "flex-start",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 8,
    marginHorizontal: 20
  },
  headerLeft: { flexDirection: "row", gap: 12, flex: 1, alignItems: "flex-start" },
  logoBox: { width: 50, height: 50, borderRadius: 14, overflow: "hidden", flexShrink: 0 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#0f172a" },
  headerSub: { fontSize: 12, color: "#64748b", marginTop: 2 },

  errorBox: {
    marginHorizontal: 20,
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 12,
    padding: 12
  },
  errorText: { fontSize: 13, color: colors.danger },
  loadingRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 8 },
  loadingText: { fontSize: 13, color: "#64748b" },

  card: {
    marginHorizontal: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 20,
    padding: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2
  },
  cardTitle: { fontSize: 15, fontWeight: "800", color: "#0f172a" },

  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  metricTile: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#f0f4ff",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 4
  },
  metricIcon: { fontSize: 20 },
  metricValue: { fontSize: 20, fontWeight: "800", color: colors.text },
  metricLabel: { fontSize: 11, color: "#64748b" },

  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  statusPill: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 10, fontWeight: "800" },
  metaText: { fontSize: 11, color: "#64748b" },

  userList: { gap: 10 },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10
  },
  groupHeaderPressable: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#f0f4ff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    padding: 12
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "center"
  },
  userAvatarText: {
    color: "#2563eb",
    fontSize: 16,
    fontWeight: "800"
  },
  userContent: { flex: 1, gap: 4 },
  userHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10
  },
  userName: { flex: 1, color: "#0f172a", fontSize: 14, fontWeight: "800" },
  userEmail: { color: "#64748b", fontSize: 12, lineHeight: 18 },
  emptyText: { color: "#94a3b8", fontSize: 13, textAlign: "center", paddingVertical: 8 }
});
