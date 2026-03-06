import { useEffect, useState } from "react";
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

interface HomeBootstrapResponse {
  getServiceCategories: ServiceCategory[];
  getServiceDefinitions: ServiceDefinition[];
}

interface ActiveAgentResponse {
  getActiveServiceAgents: ServiceAgentItem[];
}

export default function HomeScreen() {
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
    <ScreenLayout title="Service Catalog" subtitle="Public data from GraphQL">
      {loading ? <ActivityIndicator color={colors.primary} /> : null}
      {!!error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Active Agents ({activeAgents.length})</Text>
        {activeAgents.slice(0, 8).map((agent) => (
          <Text key={agent.id} style={styles.rowSubtitle}>
            {agent.fullName}
          </Text>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Categories ({categories.length})</Text>
        {categories.map((category) => (
          <View key={category.id} style={styles.row}>
            <Text style={styles.rowTitle}>{category.name}</Text>
            <Text style={styles.rowSubtitle}>
              {category.description || "No description"}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Services ({services.length})</Text>
        {services.slice(0, 20).map((service) => (
          <View key={service.id} style={styles.row}>
            <Text style={styles.rowTitle}>{service.name}</Text>
            <Text style={styles.rowSubtitle}>
              {service.categoryName} | {formatCurrency(service.basePrice)} |{" "}
              {service.estimatedDuration}m
            </Text>
            <Text style={styles.rowSubtitle}>Bookings: {service.bookingCount}</Text>
            <Text style={styles.rowSubtitle}>
              Status: {service.isActive ? "Active" : "Inactive"}
            </Text>
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
    gap: 10
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
    gap: 2
  },
  rowTitle: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 14
  },
  rowSubtitle: {
    color: colors.textMuted,
    fontSize: 12
  },
  error: {
    color: colors.danger,
    fontSize: 13
  }
});
