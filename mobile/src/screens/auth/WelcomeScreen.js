import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, spacing } from '../../theme/colors';
import Logo from '../../components/Logo';
import BrandFooter from '../../components/BrandFooter';

const HOW_IT_WORKS = [
  {
    icon: 'search-outline',
    title: '1. Browse Providers',
    desc: 'Explore authentic menus from QK Hall, Sufia Kamal, Central Cafeteria, and campus food carts.',
    color: colors.primary,
    bg: colors.primaryLight,
  },
  {
    icon: 'bag-handle-outline',
    title: '2. Easy Ordering',
    desc: 'Customize meals, add to cart, and choose between "Delivery to Room" or "Self Pickup".',
    color: colors.info,
    bg: colors.infoLight,
  },
  {
    icon: 'timer-outline',
    title: '3. Live Tracking',
    desc: 'Track food preparation in real-time from the kitchen straight to your dormitory.',
    color: colors.success,
    bg: colors.successLight,
  },
];

const WelcomeScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Navbar */}
      <View style={styles.navBar}>
        <Logo size="small" showTagline={false} align="left" />
        <TouchableOpacity
          style={styles.navSignInBtn}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.7}
        >
          <Text style={styles.navSignInText}>Sign In</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.badgeRow}>
            <View style={styles.heroPill}>
              <Ionicons name="sparkles" size={13} color={colors.primary} />
              <Text style={styles.heroPillText}>CUET Smart Dining Platform</Text>
            </View>
          </View>

          <Text style={styles.heroTitle}>
            Your Favorite Bites, <Text style={styles.heroTitleAccent}>Delivered to Your Hall.</Text>
          </Text>

          <Text style={styles.heroSubtitle}>
            Browse menus from all campus canteens and cafeterias, and get fresh food delivered to your dormitory or ready for pickup in minutes.
          </Text>

          {/* Action Buttons */}
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => navigation.navigate('Register')}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={18} color={colors.white} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryBtnText}>Sign In to Account</Text>
            </TouchableOpacity>
          </View>

          {/* Trust Badges */}
          <View style={styles.trustBadge}>
            <View style={styles.avatarGroup}>
              <View style={[styles.avatarCircle, { backgroundColor: '#FF6B6B' }]}>
                <Ionicons name="person" size={12} color="#FFF" />
              </View>
              <View style={[styles.avatarCircle, { backgroundColor: '#4ECDC4', marginLeft: -8 }]}>
                <Ionicons name="person" size={12} color="#FFF" />
              </View>
              <View style={[styles.avatarCircle, { backgroundColor: '#45B7D1', marginLeft: -8 }]}>
                <Ionicons name="person" size={12} color="#FFF" />
              </View>
            </View>
            <Text style={styles.trustText}>
              Trusted by <Text style={{ fontFamily: fonts.bold }}>1000+ students</Text> across all CUET halls
            </Text>
          </View>

          {/* Quick Perks Row */}
          <View style={styles.perksRow}>
            <View style={styles.perkItem}>
              <View style={[styles.perkIconBadge, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="bicycle" size={18} color={colors.primary} />
              </View>
              <Text style={styles.perkTitle}>~15 Mins</Text>
              <Text style={styles.perkDesc}>Hall Delivery</Text>
            </View>

            <View style={styles.perkItem}>
              <View style={[styles.perkIconBadge, { backgroundColor: colors.warningLight }]}>
                <Ionicons name="star" size={18} color={colors.rating} />
              </View>
              <Text style={styles.perkTitle}>4.8 / 5</Text>
              <Text style={styles.perkDesc}>Top Rated</Text>
            </View>

            <View style={styles.perkItem}>
              <View style={[styles.perkIconBadge, { backgroundColor: colors.successLight }]}>
                <Ionicons name="shield-checkmark" size={18} color={colors.success} />
              </View>
              <Text style={styles.perkTitle}>100% Fresh</Text>
              <Text style={styles.perkDesc}>Campus Quality</Text>
            </View>
          </View>
        </View>

        {/* How It Works Section */}
        <View style={styles.howSection}>
          <Text style={styles.howSectionTag}>SIMPLE 3-STEP PROCESS</Text>
          <Text style={styles.howSectionTitle}>How Bitezy Works</Text>
          <Text style={styles.howSectionSubtitle}>
            Ordering delicious food on campus has never been this simple.
          </Text>

          <View style={styles.howGrid}>
            {HOW_IT_WORKS.map((step, idx) => (
              <View key={idx} style={styles.howCard}>
                <View style={[styles.howIconWrapper, { backgroundColor: step.bg }]}>
                  <Ionicons name={step.icon} size={24} color={step.color} />
                </View>
                <Text style={styles.howCardTitle}>{step.title}</Text>
                <Text style={styles.howCardDesc}>{step.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Bottom CTA Banner */}
        <View style={styles.bottomCtaBanner}>
          <View style={styles.ctaIconBadge}>
            <Ionicons name="fast-food" size={28} color={colors.white} />
          </View>
          <Text style={styles.ctaBannerTitle}>Ready to satisfy your cravings?</Text>
          <Text style={styles.ctaBannerDesc}>
            Join thousands of CUET students and order your favorite meal right now.
          </Text>
          <TouchableOpacity
            style={styles.ctaBannerBtn}
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaBannerBtnText}>Create Free Account</Text>
          </TouchableOpacity>
        </View>

        <BrandFooter />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  navBar: {
    height: 56,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  navSignInBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: spacing.borderRadiusFull,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  navSignInText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.textDark,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroSection: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: spacing.borderRadiusFull,
    borderWidth: 1,
    borderColor: colors.primaryGlow,
  },
  heroPillText: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.primary,
    letterSpacing: 0.3,
  },
  heroTitle: {
    fontSize: 32,
    fontFamily: fonts.headingExtraBold,
    color: colors.textDark,
    lineHeight: 38,
    letterSpacing: -0.8,
    marginBottom: spacing.sm + 4,
  },
  heroTitleAccent: {
    color: colors.primary,
  },
  heroSubtitle: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textGray,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  actionContainer: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: spacing.borderRadiusMd,
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    fontFamily: fonts.headingBold,
    fontSize: 16,
    color: colors.white,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    paddingVertical: 15,
    borderRadius: spacing.borderRadiusMd,
    borderWidth: 1.2,
    borderColor: colors.borderDark,
  },
  secondaryBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: colors.textDark,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
    padding: spacing.md,
    borderRadius: spacing.borderRadiusMd,
    gap: spacing.sm + 2,
    marginBottom: spacing.lg,
  },
  avatarGroup: {
    flexDirection: 'row',
  },
  avatarCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  trustText: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textGray,
    flex: 1,
    lineHeight: 16,
  },
  perksRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  perkItem: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: spacing.borderRadiusMd,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  perkIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  perkTitle: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: colors.textDark,
    marginBottom: 2,
  },
  perkDesc: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: colors.textGray,
  },
  howSection: {
    backgroundColor: colors.surfaceSubtle,
    padding: spacing.lg,
    paddingVertical: spacing.xl,
  },
  howSectionTag: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: colors.primary,
    letterSpacing: 1,
    marginBottom: 4,
    textAlign: 'center',
  },
  howSectionTitle: {
    fontSize: 24,
    fontFamily: fonts.headingBold,
    color: colors.textDark,
    textAlign: 'center',
    marginBottom: 6,
  },
  howSectionSubtitle: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.textGray,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  howGrid: {
    gap: spacing.md,
  },
  howCard: {
    backgroundColor: colors.card,
    borderRadius: spacing.borderRadiusMd,
    padding: spacing.md + 2,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  howIconWrapper: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm + 2,
  },
  howCardTitle: {
    fontSize: 16,
    fontFamily: fonts.headingBold,
    color: colors.textDark,
    marginBottom: 4,
  },
  howCardDesc: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.textGray,
    lineHeight: 19,
  },
  bottomCtaBanner: {
    margin: spacing.lg,
    backgroundColor: colors.secondary,
    borderRadius: spacing.borderRadiusLg,
    padding: spacing.lg + 4,
    alignItems: 'center',
  },
  ctaIconBadge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  ctaBannerTitle: {
    fontSize: 20,
    fontFamily: fonts.headingBold,
    color: colors.white,
    textAlign: 'center',
    marginBottom: 6,
  },
  ctaBannerDesc: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
  ctaBannerBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: spacing.borderRadiusFull,
  },
  ctaBannerBtnText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.white,
  },
});

export default WelcomeScreen;
