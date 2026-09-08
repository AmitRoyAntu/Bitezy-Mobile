import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  Dimensions,
  Platform,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, spacing } from "../../theme/colors";
import BrandFooter from "../../components/BrandFooter";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Floating food badge data — emoji-based so no external images required
const FOOD_BADGES = [
  { emoji: "🍔", size: 48, top: "14%", left: "8%", delay: 200 },
  { emoji: "🍜", size: 56, top: "6%", right: "14%", delay: 400 },
  { emoji: "🍕", size: 42, top: "30%", left: "24%", delay: 600 },
  { emoji: "☕", size: 38, top: "20%", right: "32%", delay: 300 },
  { emoji: "🥘", size: 50, top: "34%", right: "10%", delay: 500 },
  { emoji: "🧃", size: 36, top: "38%", left: "5%", delay: 700 },
];

// Perk/stat items
const PERKS = [
  { icon: "bicycle-outline", label: "~15 min", sub: "Delivery", color: "#FF6B35" },
  { icon: "star", label: "4.8★", sub: "Rated", color: "#F59E0B" },
  { icon: "shield-checkmark", label: "Fresh", sub: "Quality", color: "#00B761" },
  { icon: "storefront-outline", label: "10+", sub: "Canteens", color: "#246BFD" },
];

// How it works steps
const HOW_IT_WORKS = [
  {
    icon: "search-outline",
    title: "Browse Providers",
    desc: "Explore authentic menus from all campus canteens and food carts.",
    color: colors.primary,
    bg: colors.primaryLight,
  },
  {
    icon: "bag-handle-outline",
    title: "Easy Ordering",
    desc: "Customize meals, add to cart, and choose delivery or pickup.",
    color: colors.info,
    bg: colors.infoLight,
  },
  {
    icon: "timer-outline",
    title: "Live Tracking",
    desc: "Track food preparation in real-time from kitchen to your hall.",
    color: colors.success,
    bg: colors.successLight,
  },
];

const WelcomeScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  // Animations
  const heroFade = useRef(new Animated.Value(0)).current;
  const heroSlide = useRef(new Animated.Value(30)).current;
  const ctaScale = useRef(new Animated.Value(0.85)).current;
  const ctaOpacity = useRef(new Animated.Value(0)).current;
  const badgeAnims = useRef(FOOD_BADGES.map(() => new Animated.Value(0))).current;
  const perkAnims = useRef(PERKS.map(() => new Animated.Value(0))).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Hero text fade-in + slide up
    Animated.parallel([
      Animated.timing(heroFade, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(heroSlide, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Food badges pop-in one by one
    badgeAnims.forEach((anim, i) => {
      Animated.spring(anim, {
        toValue: 1,
        friction: 5,
        tension: 80,
        delay: FOOD_BADGES[i].delay,
        useNativeDriver: true,
      }).start();
    });

    // 3. CTA button entrance
    Animated.sequence([
      Animated.delay(500),
      Animated.parallel([
        Animated.spring(ctaScale, {
          toValue: 1,
          friction: 6,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.timing(ctaOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // 4. Perk items stagger in
    perkAnims.forEach((anim, i) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 400,
        delay: 700 + i * 120,
        useNativeDriver: true,
      }).start();
    });

    // 5. Continuous subtle pulse on CTA arrow
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.secondary} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* ===== DARK HERO SECTION ===== */}
        <View style={[styles.heroSection, { paddingTop: insets.top + 20 }]}>
          {/* Decorative swirl circles */}
          <View style={[styles.swirlCircle, styles.swirl1]} />
          <View style={[styles.swirlCircle, styles.swirl2]} />
          <View style={[styles.swirlCircle, styles.swirl3]} />

          {/* Floating Food Badges */}
          {FOOD_BADGES.map((badge, index) => {
            const posStyle = {};
            if (badge.top) posStyle.top = badge.top;
            if (badge.left) posStyle.left = badge.left;
            if (badge.right) posStyle.right = badge.right;

            return (
              <Animated.View
                key={index}
                style={[
                  styles.foodBadge,
                  posStyle,
                  {
                    width: badge.size,
                    height: badge.size,
                    borderRadius: badge.size / 2,
                    transform: [{ scale: badgeAnims[index] }],
                    opacity: badgeAnims[index],
                  },
                ]}
              >
                <Text style={{ fontSize: badge.size * 0.5 }}>{badge.emoji}</Text>
              </Animated.View>
            );
          })}

          {/* Central hero food icon (big pop) */}
          <Animated.View
            style={[
              styles.centralFoodBadge,
              {
                transform: [
                  { scale: badgeAnims[0] },
                  { translateY: heroSlide },
                ],
                opacity: heroFade,
              },
            ]}
          >
            <Text style={styles.centralEmoji}>🍛</Text>
            <View style={styles.centralGlow} />
          </Animated.View>

          {/* Logo in the hero */}
          <Animated.View
            style={[
              styles.heroLogoRow,
              {
                opacity: heroFade,
                transform: [{ translateY: heroSlide }],
              },
            ]}
          >
            <View style={styles.logoIconBadge}>
              <Ionicons name="fast-food" size={18} color={colors.white} />
            </View>
            <Text style={styles.logoText}>
              Bite<Text style={styles.logoAccent}>zy</Text>
            </Text>
          </Animated.View>
        </View>

        {/* ===== MAIN CONTENT (white card overlaps hero) ===== */}
        <View style={styles.contentCard}>
          {/* Headline */}
          <Animated.View
            style={{
              opacity: heroFade,
              transform: [{ translateY: heroSlide }],
            }}
          >
            <Text style={styles.headlineTitle}>
              Grab your{"\n"}
              <Text style={styles.headlineAccent}>Delicious food!</Text>
            </Text>
            <Text style={styles.headlineSubtitle}>
              Order from campus canteens & get it delivered right to your hall
              room. Fresh, fast, and made for CUETians.
            </Text>
          </Animated.View>

          {/* Perks Row */}
          <View style={styles.perksRow}>
            {PERKS.map((perk, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.perkItem,
                  {
                    opacity: perkAnims[i],
                    transform: [
                      {
                        translateY: perkAnims[i].interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <View
                  style={[
                    styles.perkIconBg,
                    { backgroundColor: perk.color + "18" },
                  ]}
                >
                  <Ionicons name={perk.icon} size={18} color={perk.color} />
                </View>
                <Text style={styles.perkLabel}>{perk.label}</Text>
                <Text style={styles.perkSub}>{perk.sub}</Text>
              </Animated.View>
            ))}
          </View>

          {/* CTA Buttons */}
          <Animated.View
            style={[
              styles.ctaContainer,
              {
                opacity: ctaOpacity,
                transform: [{ scale: ctaScale }],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.getStartedBtn}
              onPress={() => navigation.navigate("Register")}
              activeOpacity={0.85}
            >
              <Text style={styles.getStartedText}>Let's Eat !!!</Text>
              <Animated.View
                style={[
                  styles.arrowCircle,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              >
                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color={colors.primary}
                />
              </Animated.View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.signInBtn}
              onPress={() => navigation.navigate("Login")}
              activeOpacity={0.8}
            >
              <Text style={styles.signInText}>
                Already have an account?{" "}
                <Text style={styles.signInLink}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Trust line */}
          <View style={styles.trustRow}>
            <View style={styles.avatarStack}>
              {["#FF6B6B", "#4ECDC4", "#45B7D1", "#F093FB"].map((c, i) => (
                <View
                  key={i}
                  style={[
                    styles.miniAvatar,
                    { backgroundColor: c, marginLeft: i === 0 ? 0 : -8 },
                  ]}
                >
                  <Ionicons name="person" size={10} color="#FFF" />
                </View>
              ))}
            </View>
            <Text style={styles.trustLabel}>
              Trusted by{" "}
              <Text style={{ fontFamily: fonts.bold }}>1,000+</Text> CUET
              students
            </Text>
          </View>
        </View>

        {/* ===== HOW IT WORKS SECTION ===== */}
        <View style={styles.howSection}>
          <Text style={styles.howTag}>SIMPLE 3-STEP PROCESS</Text>
          <Text style={styles.howTitle}>How Bitezy Works</Text>
          <Text style={styles.howSubtitle}>
            Ordering delicious food on campus has never been this simple.
          </Text>

          <View style={styles.howGrid}>
            {HOW_IT_WORKS.map((step, idx) => (
              <View key={idx} style={styles.howCard}>
                <View
                  style={[styles.howIconWrapper, { backgroundColor: step.bg }]}
                >
                  <Ionicons name={step.icon} size={24} color={step.color} />
                </View>
                <View style={styles.howTextBlock}>
                  <Text style={styles.howCardTitle}>
                    {idx + 1}. {step.title}
                  </Text>
                  <Text style={styles.howCardDesc}>{step.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ===== BOTTOM CTA BANNER ===== */}
        <View style={styles.bottomBanner}>
          <View style={styles.bannerIconBadge}>
            <Ionicons name="fast-food" size={28} color={colors.white} />
          </View>
          <Text style={styles.bannerTitle}>
            Ready to satisfy your cravings?
          </Text>
          <Text style={styles.bannerDesc}>
            Join thousands of CUET students and order your favorite meal right
            now.
          </Text>
          <TouchableOpacity
            style={styles.bannerBtn}
            onPress={() => navigation.navigate("Register")}
            activeOpacity={0.85}
          >
            <Text style={styles.bannerBtnText}>Create Free Account</Text>
          </TouchableOpacity>
        </View>

        {/* ===== FOOTER ===== */}
        <BrandFooter showSpacer={false} />
        <View style={{ height: insets.bottom + 16 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.secondary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },

  // ===== HERO (dark section) =====
  heroSection: {
    height: 340,
    backgroundColor: colors.secondary,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  swirlCircle: {
    position: "absolute",
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.07)",
  },
  swirl1: {
    width: 280,
    height: 280,
    top: -40,
    right: -80,
  },
  swirl2: {
    width: 200,
    height: 200,
    bottom: 10,
    left: -60,
  },
  swirl3: {
    width: 140,
    height: 140,
    top: 60,
    left: "45%",
    borderColor: "rgba(255,75,38,0.12)",
  },

  // Floating food emoji badges
  foodBadge: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 2,
  },

  // Central hero food
  centralFoodBadge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(255,75,38,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
    zIndex: 3,
  },
  centralEmoji: {
    fontSize: 48,
  },
  centralGlow: {
    position: "absolute",
    width: 116,
    height: 116,
    borderRadius: 58,
    borderWidth: 2,
    borderColor: "rgba(255,75,38,0.15)",
  },

  // Logo in hero
  heroLogoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    zIndex: 4,
  },
  logoIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  logoText: {
    fontFamily: fonts.headingExtraBold,
    fontSize: 26,
    color: colors.white,
    letterSpacing: -0.6,
  },
  logoAccent: {
    color: colors.primary,
  },

  // ===== MAIN CONTENT CARD =====
  contentCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -24,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg + 10,
    paddingBottom: spacing.lg,
    zIndex: 10,
  },

  headlineTitle: {
    fontSize: 30,
    fontFamily: fonts.headingExtraBold,
    color: colors.textDark,
    letterSpacing: -0.8,
    lineHeight: 38,
  },
  headlineAccent: {
    color: colors.primary,
  },
  headlineSubtitle: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textGray,
    lineHeight: 22,
    marginTop: 10,
    marginBottom: 24,
  },

  // Perks row
  perksRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 28,
  },
  perkItem: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 2,
  },
  perkIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  perkLabel: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.textDark,
  },
  perkSub: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textGray,
    marginTop: 2,
  },

  // CTA Container
  ctaContainer: {
    marginBottom: 20,
  },
  getStartedBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderRadius: spacing.borderRadiusFull,
    paddingVertical: 16,
    paddingHorizontal: 28,
    gap: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
    marginBottom: 16,
  },
  getStartedText: {
    fontFamily: fonts.headingBold,
    fontSize: 18,
    color: colors.white,
    letterSpacing: 0.3,
  },
  arrowCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  signInBtn: {
    alignItems: "center",
    paddingVertical: 8,
  },
  signInText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textGray,
  },
  signInLink: {
    fontFamily: fonts.bold,
    color: colors.primary,
  },

  // Trust row
  trustRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingTop: 4,
  },
  avatarStack: {
    flexDirection: "row",
  },
  miniAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.white,
  },
  trustLabel: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textGray,
  },

  // ===== HOW IT WORKS SECTION =====
  howSection: {
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl + 4,
  },
  howTag: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: colors.primary,
    letterSpacing: 1,
    marginBottom: 4,
    textAlign: "center",
  },
  howTitle: {
    fontSize: 22,
    fontFamily: fonts.headingBold,
    color: colors.textDark,
    textAlign: "center",
    marginBottom: 6,
  },
  howSubtitle: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.textGray,
    textAlign: "center",
    marginBottom: spacing.lg,
    lineHeight: 19,
  },
  howGrid: {
    gap: spacing.md,
  },
  howCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: spacing.borderRadiusMd,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  howIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  howTextBlock: {
    flex: 1,
  },
  howCardTitle: {
    fontSize: 15,
    fontFamily: fonts.headingBold,
    color: colors.textDark,
    marginBottom: 3,
  },
  howCardDesc: {
    fontSize: 12.5,
    fontFamily: fonts.regular,
    color: colors.textGray,
    lineHeight: 18,
  },

  // ===== BOTTOM CTA BANNER =====
  bottomBanner: {
    margin: spacing.lg,
    backgroundColor: colors.secondary,
    borderRadius: spacing.borderRadiusLg,
    padding: spacing.lg + 4,
    alignItems: "center",
  },
  bannerIconBadge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  bannerTitle: {
    fontSize: 20,
    fontFamily: fonts.headingBold,
    color: colors.white,
    textAlign: "center",
    marginBottom: 6,
  },
  bannerDesc: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: "rgba(255,255,255,0.75)",
    textAlign: "center",
    lineHeight: 19,
    marginBottom: spacing.lg,
  },
  bannerBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: spacing.borderRadiusFull,
  },
  bannerBtnText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.white,
  },
});

export default WelcomeScreen;
