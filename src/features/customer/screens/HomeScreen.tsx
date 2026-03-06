import { useEffect, useState } from "react";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import ScreenLayout from "../../../shared/ui/ScreenLayout";
import { colors } from "../../../app/theme/colors";
import { graphqlRequest } from "../../../shared/api/graphqlClient";
import {
  ACTIVE_SERVICE_AGENTS_QUERY,
  HOME_BOOTSTRAP_QUERY
} from "../../../shared/api/graphqlDocuments";
import { asErrorMessage, formatCurrency } from "../../../shared/utils/format";
import type { ServiceAgentItem, ServiceCategory, ServiceDefinition } from "../../../shared/types/domain";
import type { CustomerTabParamList } from "../../../app/navigation/types";
import ActionButton from "../../../shared/ui/ActionButton";

interface HomeBootstrapResponse {
  getServiceCategories: ServiceCategory[];
  getServiceDefinitions: ServiceDefinition[];
}

interface ActiveAgentResponse {
  getActiveServiceAgents: ServiceAgentItem[];
}

export default function HomeScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<CustomerTabParamList>>();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [services, setServices] = useState<ServiceDefinition[]>([]);
  const [activeAgents, setActiveAgents] = useState<ServiceAgentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [homeData, agentData] = await Promise.all([
        graphqlRequest<HomeBootstrapResponse>(HOME_BOOTSTRAP_QUERY),
        graphqlRequest<ActiveAgentResponse>(ACTIVE_SERVICE_AGENTS_QUERY)
      ]);
      setCategories(homeData.getServiceCategories);
      setServices(homeData.getServiceDefinitions);
      setActiveAgents(agentData.getActiveServiceAgents);
    } catch (loadError) {
      setError(asErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <ScreenLayout
      title="Trung tâm dịch vụ"
      subtitle="Theo dõi dịch vụ, tạo yêu cầu mới và thao tác nhanh ngay trên FE"
    >
      {loading ? <ActivityIndicator color={colors.primary} /> : null}
      {!!error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.heroCard}>
        <Text style={styles.sectionTitle}>Hướng dẫn thao tác trên FE</Text>
        <Text style={styles.heroText}>1. Vào mục “Tạo mới” để gửi yêu cầu dịch vụ.</Text>
        <Text style={styles.heroText}>2. Theo dõi trạng thái tại mục “Yêu cầu”.</Text>
        <Text style={styles.heroText}>3. Khi hoàn thành, vào “Đánh giá” để phản hồi.</Text>
        <View style={styles.actionGroup}>
          <ActionButton
            label="Tạo yêu cầu mới"
            onPress={() => navigation.navigate("CreateRequest")}
          />
          <ActionButton
            label="Xem yêu cầu của tôi"
            onPress={() => navigation.navigate("MyRequests")}
            variant="secondary"
          />
        </View>
      </View>

      <View style={styles.summaryGrid}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{categories.length}</Text>
          <Text style={styles.summaryLabel}>Danh mục</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{services.length}</Text>
          <Text style={styles.summaryLabel}>Dịch vụ</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{activeAgents.length}</Text>
          <Text style={styles.summaryLabel}>KTV đang trực</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Nhân sự đang trực ({activeAgents.length})</Text>
        {activeAgents.slice(0, 8).map((agent) => (
          <Text key={agent.id} style={styles.rowSubtitle}>
            {agent.fullName}
          </Text>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Danh mục dịch vụ ({categories.length})</Text>
        {categories.map((category) => (
          <View key={category.id} style={styles.row}>
            <Text style={styles.rowTitle}>{category.name}</Text>
            <Text style={styles.rowSubtitle}>
              {category.description || "Chưa có mô tả"}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Dịch vụ nổi bật ({services.length})</Text>
        {services.slice(0, 20).map((service) => (
          <View key={service.id} style={styles.row}>
            <Text style={styles.rowTitle}>{service.name}</Text>
            <Text style={styles.rowSubtitle}>
              {service.categoryName} • {formatCurrency(service.basePrice)} •{" "}
              {service.estimatedDuration} phút
            </Text>
            <Text style={styles.rowSubtitle}>Số lượt đặt: {service.bookingCount}</Text>
            <Text style={styles.rowSubtitle}>
              Trạng thái: {service.isActive ? "Đang mở" : "Tạm ngưng"}
            </Text>
          </View>
        ))}
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    gap: 8
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
    gap: 10
  },
  heroText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20
  },
  actionGroup: {
    gap: 10,
    marginTop: 6
  },
  summaryGrid: {
    flexDirection: "row",
    gap: 10
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: "center",
    gap: 4
  },
  summaryNumber: {
    color: colors.primary,
    fontWeight: "800",
    fontSize: 22
  },
  summaryLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center"
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 16
  },
  row: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    backgroundColor: "#fff",
    gap: 4
  },
  rowTitle: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 14
  },
  rowSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19
  },
  error: {
    color: colors.danger,
    fontSize: 13
  }
});
