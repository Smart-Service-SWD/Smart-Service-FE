import { useEffect, useState } from "react";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../../app/theme/colors";
import BrandLogo from "../../../shared/ui/BrandLogo";
import { graphqlRequest } from "../../../shared/api/graphqlClient";
import { HOME_BOOTSTRAP_QUERY } from "../../../shared/api/graphqlDocuments";
import { asErrorMessage, formatCurrency } from "../../../shared/utils/format";
import type { ServiceCategory, ServiceDefinition } from "../../../shared/types/domain";
import type { CustomerTabParamList } from "../../../app/navigation/types";
import { useAuth } from "../../auth/AuthContext";

interface HomeBootstrapResponse {
  getServiceCategories: ServiceCategory[];
  getServiceDefinitions: ServiceDefinition[];
}

const formatComplexityRange = (range?: number[] | null): string => {
  if (!range || range.length < 2) return "1-3";
  return `${range[0]}-${range[1]}`;
};

// Map category names to emoji icons
const CATEGORY_ICONS: Record<string, string> = {
  default: "🔧"
};
const CATEGORY_ICON_LIST = ["⚡", "🖥️", "🧹", "⚖️", "🔧", "🏠", "📱", "🚗"];

function getCategoryIcon(name: string, index: number): string {
  return CATEGORY_ICONS[name] ?? CATEGORY_ICON_LIST[index % CATEGORY_ICON_LIST.length] ?? "🔧";
}

function getDurationLabel(minutes: number): string {
  if (minutes < 60) return `${minutes} phút`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} giờ ${m} phút` : `${h} giờ`;
}

interface CategoryCardProps {
  category: ServiceCategory;
  services: ServiceDefinition[];
  iconEmoji: string;
  isExpanded: boolean;
  onToggle: () => void;
  onCreateRequest: () => void;
}

function CategoryCard({
  category,
  services,
  iconEmoji,
  isExpanded,
  onToggle,
  onCreateRequest
}: CategoryCardProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredServices = searchQuery.trim()
    ? services.filter((s) =>
        s.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
      )
    : services;

  return (
    <View style={catStyles.card}>
      {/* Header — always visible */}
      <Pressable
        style={({ pressed }) => [catStyles.header, pressed && catStyles.headerPressed]}
        onPress={onToggle}
      >
        <View style={catStyles.iconWrap}>
          <Text style={catStyles.icon}>{iconEmoji}</Text>
        </View>
        <View style={catStyles.headerText}>
          <Text style={catStyles.categoryName}>{category.name}</Text>
          <Text style={catStyles.categoryCount}>{services.length} dịch vụ</Text>
        </View>
        <View style={[catStyles.chevronWrap, isExpanded && catStyles.chevronExpanded]}>
          <Text style={catStyles.chevron}>›</Text>
        </View>
      </Pressable>

      {/* Expanded sub-services */}
      {isExpanded && (
        <View style={catStyles.body}>
          {category.description ? (
            <Text style={catStyles.categoryDesc}>{category.description}</Text>
          ) : null}

          {/* Search bar */}
          {services.length > 0 && (
            <View style={catStyles.searchWrap}>
              <Text style={catStyles.searchIcon}>🔍</Text>
              <TextInput
                style={catStyles.searchInput}
                placeholder="Tìm dịch vụ..."
                placeholderTextColor="#94a3b8"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery("")}>
                  <Text style={catStyles.searchClear}>✕</Text>
                </Pressable>
              )}
            </View>
          )}

          {filteredServices.length === 0 ? (
            <View style={catStyles.emptyWrap}>
              <Text style={catStyles.emptyText}>
                {searchQuery.trim()
                  ? `Không tìm thấy dịch vụ "${searchQuery.trim()}"`
                  : "Chưa có dịch vụ trong danh mục này"}
              </Text>
            </View>
          ) : (
            <View style={catStyles.serviceList}>
              {filteredServices.map((svc, idx) => (
                <View key={svc.id}>
                  {idx > 0 && <View style={catStyles.divider} />}
                  <Pressable
                    style={({ pressed }) => [catStyles.serviceRow, pressed && catStyles.serviceRowPressed]}
                    onPress={onCreateRequest}
                  >
                    <View style={catStyles.serviceInfo}>
                      <View style={catStyles.serviceNameRow}>
                        <Text style={catStyles.serviceName}>{svc.name}</Text>
                        {svc.isDangerous && (
                          <View style={catStyles.dangerBadge}>
                            <Text style={catStyles.dangerBadgeText}>⚠️ Rủi ro</Text>
                          </View>
                        )}
                      </View>
                      {svc.description ? (
                        <Text style={catStyles.serviceDesc} numberOfLines={2}>
                          {svc.description}
                        </Text>
                      ) : null}
                      <View style={catStyles.serviceMeta}>
                        <Text style={catStyles.metaChip}>🕐 {getDurationLabel(svc.estimatedDuration)}</Text>
                        <Text style={catStyles.metaChip}>📋 AI: {formatComplexityRange(svc.complexityRange)}</Text>
                        {svc.bookingCount > 0 && (
                          <Text style={catStyles.metaChip}>🔥 {svc.bookingCount} lượt</Text>
                        )}
                      </View>
                    </View>
                    <View style={catStyles.servicePriceCol}>
                      <Text style={catStyles.servicePrice}>{formatCurrency(svc.basePrice)}</Text>
                      <View style={catStyles.bookBtn}>
                        <Text style={catStyles.bookBtnText}>Đặt</Text>
                      </View>
                    </View>
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<CustomerTabParamList>>();
  const { session } = useAuth();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [services, setServices] = useState<ServiceDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const homeData = await graphqlRequest<HomeBootstrapResponse>(HOME_BOOTSTRAP_QUERY);
      setCategories(homeData.getServiceCategories);
      setServices(homeData.getServiceDefinitions.filter((s) => s.isActive));
    } catch (loadError) {
      setError(asErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  // Group services by categoryName
  const servicesByCategory = (catName: string) =>
    services.filter((s) => s.categoryName === catName);

  // Only show up to first 4 categories
  const displayedCategories = categories.slice(0, 4);

  // Featured = top 3 by bookingCount across all services
  const featured = [...services]
    .sort((a, b) => b.bookingCount - a.bookingCount)
    .slice(0, 3);

  const toggleCategory = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const firstName = session?.fullName?.split(" ").pop() ?? "bạn";

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logoBox}>
              <BrandLogo size={40} />
            </View>
            <View>
              <Text style={styles.headerTitle}>Trung tâm dịch vụ</Text>
              <Text style={styles.headerSub}>Chào mừng, {firstName} 👋</Text>
            </View>
          </View>
        </View>

        {/* ── Loading / Error ── */}
        {loading && (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={colors.primary} size="small" />
            <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
          </View>
        )}
        {!!error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
          </View>
        )}

        {/* ── Hero Quick Guide ── */}
        <View style={styles.heroCard}>
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>Hướng dẫn nhanh</Text>
            <View style={styles.heroStep}>
              <View style={styles.stepBadge}><Text style={styles.stepNum}>1</Text></View>
              <Text style={styles.stepText}>Chọn loại dịch vụ bạn cần</Text>
            </View>
            <View style={styles.heroStep}>
              <View style={styles.stepBadge}><Text style={styles.stepNum}>2</Text></View>
              <Text style={styles.stepText}>Gửi yêu cầu và nhận báo giá</Text>
            </View>
            <View style={styles.heroStep}>
              <View style={styles.stepBadge}><Text style={styles.stepNum}>3</Text></View>
              <Text style={styles.stepText}>Theo dõi tiến trình và đánh giá</Text>
            </View>
            <View style={styles.heroActions}>
              <Pressable
                style={({ pressed }) => [styles.heroBtnPrimary, pressed && styles.heroBtnPressed]}
                onPress={() => navigation.navigate("CreateRequest")}
              >
                <Text style={styles.heroBtnPrimaryText}>+ Tạo yêu cầu mới</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.heroBtnSecondary, pressed && styles.heroBtnPressed]}
                onPress={() => navigation.navigate("MyRequests")}
              >
                <Text style={styles.heroBtnSecondaryText}>Yêu cầu của tôi</Text>
              </Pressable>
            </View>
          </View>
          <Text style={styles.heroBgEmoji}>⚡</Text>
        </View>

        {/* ── Summary Stats ── */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: "#eff6ff" }]}>
              <Text style={styles.statIcon}>📁</Text>
            </View>
            <View>
              <Text style={styles.statCount}>{categories.length}</Text>
              <Text style={styles.statLabel}>Danh mục</Text>
            </View>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: "#eff6ff" }]}>
              <Text style={styles.statIcon}>🛠️</Text>
            </View>
            <View>
              <Text style={styles.statCount}>{services.length}</Text>
              <Text style={styles.statLabel}>Dịch vụ</Text>
            </View>
          </View>
        </View>

        {/* ── Featured Services ── */}
        {featured.length > 0 && (
          <View style={styles.carouselSectionWrap}>
            <View style={[styles.sectionHeader, { paddingHorizontal: 20 }]}>
              <Text style={styles.sectionTitle}>Dịch vụ nổi bật 🔥</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredCarousel}
              snapToInterval={280 + 16}
              decelerationRate="fast"
            >
              {featured.map((svc) => (
                <Pressable
                  key={svc.id}
                  style={({ pressed }) => [styles.featuredCard, pressed && styles.featuredCardPressed]}
                  onPress={() => navigation.navigate("CreateRequest")}
                >
                  <View style={styles.featuredImageBg}>
                    <Text style={styles.featuredImageFallback}>🔧</Text>
                    <View style={styles.featuredBadge}>
                      <Text style={styles.featuredBadgeText}>Phổ biến</Text>
                    </View>
                  </View>
                  <View style={styles.featuredContent}>
                    <Text style={styles.featuredCatText}>{svc.categoryName}</Text>
                    <Text style={styles.featuredName} numberOfLines={1}>{svc.name}</Text>
                    <View style={styles.featuredMetaRow}>
                      <Text style={styles.featuredPrice}>{formatCurrency(svc.basePrice)}</Text>
                    </View>
                    <View style={styles.featuredDetails}>
                      <View style={styles.featuredDetailItem}>
                        <Text style={styles.featuredDetailIcon}>🕐</Text>
                        <Text style={styles.featuredDetailText}>{getDurationLabel(svc.estimatedDuration)}</Text>
                      </View>
                      <View style={styles.featuredDetailItem}>
                        <Text style={styles.featuredDetailIcon}>🔥</Text>
                        <Text style={styles.featuredDetailText}>{svc.bookingCount} lượt</Text>
                      </View>
                    </View>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── Category Cards (4 max, expandable) ── */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Danh mục dịch vụ</Text>
            {categories.length > 4 && (
              <Pressable>
                <Text style={styles.sectionLink}>Tất cả</Text>
              </Pressable>
            )}
          </View>
          <Text style={styles.sectionHint}>Nhấn vào danh mục để xem các dịch vụ</Text>

          <View style={styles.categoryList}>
            {displayedCategories.map((cat, index) => (
              <CategoryCard
                key={cat.id}
                category={cat}
                services={servicesByCategory(cat.name)}
                iconEmoji={getCategoryIcon(cat.name, index)}
                isExpanded={expandedId === cat.id}
                onToggle={() => toggleCategory(cat.id)}
                onCreateRequest={() => navigation.navigate("CreateRequest")}
              />
            ))}

            {!loading && categories.length === 0 && (
              <View style={styles.emptySection}>
                <Text style={styles.emptySectionText}>Chưa có danh mục nào</Text>
              </View>
            )}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Category card styles ─────────────────────────────────────────
const catStyles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 14
  },
  headerPressed: {
    backgroundColor: "#f0f4ff"
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  },
  icon: {
    fontSize: 22
  },
  headerText: {
    flex: 1,
    gap: 2
  },
  categoryName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a"
  },
  categoryCount: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "500"
  },
  chevronWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "0deg" }]
  },
  chevronExpanded: {
    backgroundColor: "#eff6ff",
    transform: [{ rotate: "90deg" }]
  },
  chevron: {
    fontSize: 20,
    color: "#64748b",
    fontWeight: "600",
    lineHeight: 22,
    marginLeft: 2
  },

  // Expanded body
  body: {
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingBottom: 8
  },
  categoryDesc: {
    fontSize: 13,
    color: "#64748b",
    lineHeight: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4
  },
  emptyWrap: {
    padding: 20,
    alignItems: "center"
  },
  emptyText: {
    color: "#94a3b8",
    fontSize: 13
  },
  serviceList: {
    paddingHorizontal: 16,
    paddingTop: 8
  },
  divider: {
    height: 1,
    backgroundColor: "#f0f4ff",
    marginVertical: 4
  },
  serviceRow: {
    flexDirection: "row",
    paddingVertical: 12,
    gap: 12,
    alignItems: "flex-start"
  },
  serviceRowPressed: {
    opacity: 0.75
  },
  serviceInfo: {
    flex: 1,
    gap: 5
  },
  serviceNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap"
  },
  serviceName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
    flex: 1
  },
  dangerBadge: {
    backgroundColor: "#fff7ed",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "#fed7aa"
  },
  dangerBadgeText: {
    fontSize: 10,
    color: "#c2410c",
    fontWeight: "600"
  },
  serviceDesc: {
    fontSize: 12,
    color: "#94a3b8",
    lineHeight: 17
  },
  serviceMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6
  },
  metaChip: {
    fontSize: 11,
    color: "#64748b",
    backgroundColor: "#f0f4ff",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    fontWeight: "500"
  },
  servicePriceCol: {
    alignItems: "flex-end",
    gap: 8,
    flexShrink: 0
  },
  servicePrice: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.primary
  },
  bookBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5
  },
  bookBtnText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700"
  },

  // Search bar
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 2,
    gap: 8
  },
  searchIcon: {
    fontSize: 14
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#0f172a",
    paddingVertical: 10
  },
  searchClear: {
    fontSize: 14,
    color: "#94a3b8",
    fontWeight: "600",
    padding: 4
  }
});

// ─── Main screen styles ───────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f0f4ff"
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingBottom: 20,
    gap: 20
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: "rgba(248,250,252,0.9)"
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  logoBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  logoIcon: {
    fontSize: 22
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: -0.3
  },
  headerSub: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 1
  },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center"
  },
  notifIcon: {
    fontSize: 18
  },

  // Loading / Error
  loadingWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 20
  },
  loadingText: {
    fontSize: 13,
    color: colors.textMuted
  },
  errorBox: {
    marginHorizontal: 20,
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 12,
    padding: 12
  },
  errorText: {
    fontSize: 13,
    color: colors.danger
  },

  // Hero card
  heroCard: {
    marginHorizontal: 20,
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
    borderRadius: 22,
    padding: 22,
    overflow: "hidden",
    position: "relative"
  },
  heroContent: {
    gap: 10,
    zIndex: 1
  },
  heroTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.primary,
    marginBottom: 4
  },
  heroStep: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  stepBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  },
  stepNum: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800"
  },
  stepText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1e40af",
    flex: 1
  },
  heroActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8
  },
  heroBtnPrimary: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3
  },
  heroBtnPrimaryText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800"
  },
  heroBtnSecondary: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center"
  },
  heroBtnSecondaryText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "700"
  },
  heroBtnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }]
  },
  heroBgEmoji: {
    position: "absolute",
    right: -10,
    bottom: -10,
    fontSize: 110,
    opacity: 0.07,
    zIndex: 0
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20
  },
  statCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1
  },
  statIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  statIcon: {
    fontSize: 20
  },
  statCount: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0f172a"
  },
  statLabel: {
    fontSize: 10,
    color: "#94a3b8",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5
  },

  // Section wrapper
  sectionWrap: {
    paddingHorizontal: 20,
    gap: 12
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a"
  },
  sectionLink: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary
  },
  sectionHint: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: -6
  },

  // Category list
  categoryList: {
    gap: 12
  },
  emptySection: {
    padding: 32,
    alignItems: "center"
  },
  emptySectionText: {
    color: "#94a3b8",
    fontSize: 14
  },

  // Featured services
  carouselSectionWrap: {
    gap: 12
  },
  featuredCarousel: {
    paddingHorizontal: 20,
    gap: 16,
    paddingBottom: 8
  },
  featuredCard: {
    width: 280,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3
  },
  featuredCardPressed: {
    transform: [{ scale: 0.98 }]
  },
  featuredImageBg: {
    height: 140,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
    position: "relative"
  },
  featuredImageFallback: {
    fontSize: 40,
    opacity: 0.2
  },
  featuredBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  featuredBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  featuredContent: {
    padding: 16
  },
  featuredCatText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: 4
  },
  featuredName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 10
  },
  featuredMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12
  },
  featuredPrice: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.primary
  },
  featuredDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16
  },
  featuredDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  featuredDetailIcon: {
    fontSize: 13
  },
  featuredDetailText: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500"
  }
});
