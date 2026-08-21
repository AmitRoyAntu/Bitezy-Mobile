import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomInput from '../../components/CustomInput';
import CustomSelect from '../../components/CustomSelect';
import CustomButton from '../../components/CustomButton';
import ProfileInfoRow from '../../components/ProfileInfoRow';
import LogoutButton from '../../components/LogoutButton';
import BrandFooter from '../../components/BrandFooter';
import { colors, spacing, fonts } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import DataService from '../../api/DataService';

const SHOP_TYPES = [
  { label: 'Residential Hall Canteen', value: 'Canteen' },
  { label: 'Central Cafeteria', value: 'Cafeteria' },
  { label: 'Campus Food Cart', value: 'Cart' },
];

const SellerProfileScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { currentUser, logout } = useAuth();
  const { showToast } = useToast();

  const [provider, setProvider] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);

  // Form State
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [shopName, setShopName] = useState('');
  const [shopType, setShopType] = useState('Canteen');
  const [shopLocation, setShopLocation] = useState('');
  const [shopDescription, setShopDescription] = useState('');
  const [openTime, setOpenTime] = useState('06:00');
  const [closeTime, setCloseTime] = useState('22:00');
  const [deliveryTime, setDeliveryTime] = useState('15-20 min');
  const [shopImg, setShopImg] = useState('');

  const loadProfileData = async () => {
    try {
      const myProvider = await DataService.getMyProvider();
      setProvider(myProvider);

      setOwnerName(currentUser?.name || myProvider?.sellerName || '');
      setOwnerPhone(currentUser?.phone || myProvider?.phone || '01811112222');
      setShopName(myProvider?.name || '');
      setShopType(myProvider?.type || 'Canteen');
      setShopLocation(myProvider?.location || '');
      setShopDescription(myProvider?.description || '');
      setOpenTime(myProvider?.openTime || '06:00');
      setCloseTime(myProvider?.closeTime || '22:00');
      setDeliveryTime(myProvider?.deliveryTime || '15-20 min');
      setShopImg(myProvider?.img || '');
    } catch (err) {
      showToast('Error loading canteen settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfileData();
  }, [currentUser]);

  const handleSaveProfile = async () => {
    if (!shopName.trim()) {
      showToast('Please enter a canteen name', 'warning');
      return;
    }
    setSaveLoading(true);

    try {
      const updateData = {
        name: shopName.trim(),
        type: shopType,
        location: shopLocation.trim(),
        description: shopDescription.trim(),
        openTime: openTime.trim(),
        closeTime: closeTime.trim(),
        deliveryTime: deliveryTime.trim(),
        img: shopImg.trim() || provider?.img,
        phone: ownerPhone.trim(),
      };

      if (provider?._id || provider?.id) {
        await DataService.updateProvider(provider._id || provider.id, updateData);
      }

      await DataService.updateProfile({
        name: ownerName.trim(),
        phone: ownerPhone.trim(),
      });

      setProvider({ ...provider, ...updateData });
      setIsEditing(false);
      showToast('Canteen details saved successfully!');
    } catch (err) {
      showToast(err.message || 'Error updating settings', 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleOpenSupport = () => {
    Linking.openURL('https://wa.me/8801812345678?text=Hello%20Bitezy%20CUET%20Support').catch(() => {
      showToast('Could not open WhatsApp support', 'error');
    });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Math.max(insets.top + spacing.sm, 36) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroBgWrap}>
            <Image
              source={{
                uri:
                  shopImg ||
                  provider?.img ||
                  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80',
              }}
              style={styles.heroBg}
            />
            <View style={styles.heroScrim} />
          </View>
          <View style={styles.heroGlow} />
          <View style={styles.heroTopRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {ownerName ? ownerName.charAt(0).toUpperCase() : 'M'}
              </Text>
            </View>
            <View style={styles.heroStatusChip}>
              <View style={styles.heroStatusDot} />
              <Text style={styles.heroStatusText}>Verified Seller</Text>
            </View>
          </View>
          <View style={styles.heroBottomBlock}>
            <Text style={styles.heroEyebrow}>Your Canteen</Text>
            <Text style={styles.heroShopName} numberOfLines={1}>
              {shopName || 'Canteen Name'}
            </Text>
            <View style={styles.heroMetaRow}>
              <View style={styles.heroMetaItem}>
                <Ionicons name="person-circle-outline" size={13} color={colors.white} />
                <Text style={styles.heroMetaText} numberOfLines={1}>
                  {ownerName || 'Manager'}
                </Text>
              </View>
              <View style={styles.heroMetaDot} />
              <View style={styles.heroMetaItem}>
                <Ionicons name="mail-outline" size={13} color={colors.white} />
                <Text style={styles.heroMetaText} numberOfLines={1}>
                  {currentUser?.email}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Canteen Settings Card */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardEyebrow}>Your Kitchen</Text>
              <Text style={styles.cardTitle}>Canteen & Owner Profile</Text>
            </View>
            <TouchableOpacity
              style={[styles.editToggleBtn, isEditing && styles.editToggleBtnActive]}
              onPress={() => setIsEditing(!isEditing)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isEditing ? 'close' : 'create-outline'}
                size={14}
                color={isEditing ? colors.danger : colors.primary}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.editToggleText,
                  isEditing && { color: colors.danger },
                ]}
              >
                {isEditing ? 'Cancel' : 'Edit'}
              </Text>
            </TouchableOpacity>
          </View>

          {isEditing ? (
            <View style={styles.formContainer}>
              <Text style={styles.formEyebrow}>Owner Details</Text>
              <CustomInput
                label="Owner Name"
                value={ownerName}
                onChangeText={setOwnerName}
                placeholder="Manager Name"
              />

              <CustomInput
                label="Contact Phone"
                value={ownerPhone}
                onChangeText={setOwnerPhone}
                placeholder="018XXXXXXXX"
                keyboardType="phone-pad"
              />

              <View style={styles.formDivider} />
              <Text style={styles.formEyebrow}>Canteen Details</Text>

              <CustomInput
                label="Canteen / Shop Name"
                value={shopName}
                onChangeText={setShopName}
                placeholder="e.g. Kabi Kazi Nazrul Islam Hall Canteen"
              />

              <CustomSelect
                label="Canteen Type"
                options={SHOP_TYPES}
                value={shopType}
                onValueChange={setShopType}
              />

              <CustomInput
                label="Campus Location"
                value={shopLocation}
                onChangeText={setShopLocation}
                placeholder="e.g. Kabi Kazi Nazrul Islam Hall, Ground Floor"
              />

              <View style={styles.formDivider} />
              <Text style={styles.formEyebrow}>Hours & Delivery</Text>

              <View style={styles.timeRow}>
                <View style={{ flex: 1, marginRight: spacing.xs }}>
                  <CustomInput
                    label="Opening Time"
                    value={openTime}
                    onChangeText={setOpenTime}
                    placeholder="06:00"
                  />
                </View>
                <View style={{ flex: 1, marginLeft: spacing.xs }}>
                  <CustomInput
                    label="Closing Time"
                    value={closeTime}
                    onChangeText={setCloseTime}
                    placeholder="22:00"
                  />
                </View>
              </View>

              <CustomInput
                label="Delivery Time (Estimate)"
                value={deliveryTime}
                onChangeText={setDeliveryTime}
                placeholder="15-20 min"
              />

              <CustomInput
                label="Shop Image URL"
                value={shopImg}
                onChangeText={setShopImg}
                placeholder="https://images.unsplash.com/..."
              />

              <CustomInput
                label="Description & Notice"
                value={shopDescription}
                onChangeText={setShopDescription}
                placeholder="Special meals, daily notice, or ingredients..."
                multiline
                numberOfLines={3}
              />

              <CustomButton
                title="Save Profile Changes"
                onPress={handleSaveProfile}
                loading={saveLoading}
                style={{ marginTop: spacing.sm }}
              />
            </View>
          ) : (
            <View style={styles.detailsList}>
              <ProfileInfoRow
                icon="storefront"
                label="Shop Name"
                value={shopName}
                iconColor={colors.primary}
                iconBg="rgba(255, 75, 38, 0.08)"
              />
              <ProfileInfoRow
                icon="grid-outline"
                label="Canteen Type"
                value={shopType}
                iconColor={colors.info}
                iconBg={colors.infoLight}
              />
              <ProfileInfoRow
                icon="location"
                label="Campus Location"
                value={shopLocation || 'CUET Campus'}
                iconColor={colors.success}
                iconBg={colors.successLight}
              />
              <ProfileInfoRow
                icon="time"
                label="Operating Hours"
                value={`${openTime} - ${closeTime}`}
                iconColor={colors.rating}
                iconBg={colors.ratingBg}
              />
              <ProfileInfoRow
                icon="bicycle-outline"
                label="Delivery Speed"
                value={deliveryTime}
                iconColor={colors.primary}
                iconBg="rgba(255, 75, 38, 0.08)"
              />
              <ProfileInfoRow
                icon="call"
                label="Manager Phone"
                value={ownerPhone}
                iconColor={colors.info}
                iconBg={colors.infoLight}
                isLast={!shopDescription}
              />
              {shopDescription ? (
                <ProfileInfoRow
                  icon="document-text"
                  label="Description & Notice"
                  value={shopDescription}
                  iconColor={colors.textDark}
                  iconBg={colors.surfaceSubtle}
                  isLast
                />
              ) : null}
            </View>
          )}
        </View>

        {/* Support Card */}
        <View style={styles.supportCard}>
          <View style={styles.supportIconBox}>
            <Ionicons name="headset" size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.supportEyebrow}>Need a hand?</Text>
            <Text style={styles.supportTitle}>CUET Seller Helpline</Text>
            <Text style={styles.supportSub}>Pricing or payout help is one tap away.</Text>
          </View>
          <TouchableOpacity style={styles.supportBtn} onPress={handleOpenSupport} activeOpacity={0.85}>
            <Ionicons name="logo-whatsapp" size={14} color={colors.white} style={{ marginRight: 4 }} />
            <Text style={styles.supportBtnText}>Chat</Text>
          </TouchableOpacity>
        </View>

        {/* Customer Reviews Link */}
        <TouchableOpacity
          style={styles.reviewsLinkCard}
          onPress={() => navigation.navigate('Reviews')}
          activeOpacity={0.85}
        >
          <View style={styles.reviewsIconBox}>
            <Ionicons name="star" size={18} color={colors.rating} />
          </View>
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Text style={styles.reviewsLinkEyebrow}>Reputation</Text>
            <Text style={styles.reviewsLinkTitle}>Customer Reviews & Ratings</Text>
            <Text style={styles.reviewsLinkSub}>Read feedback from students and teachers</Text>
          </View>
          <View style={styles.reviewsChevronBox}>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </View>
        </TouchableOpacity>

        {/* Modular Logout Button */}
        <LogoutButton
          onPress={logout}
          label="Log Out Canteen Account"
          confirmTitle="Log Out Canteen"
          confirmMessage="Are you sure you want to log out of your Canteen Manager account?"
        />

        {/* Modular Brand Footer */}
        <BrandFooter
          title="Bitezy Canteen Management • v1.2.0"
          subtitle="CUET Campus Food Network"
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F7' },
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: 140 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  heroCard: {
    borderRadius: spacing.borderRadiusLg,
    overflow: 'hidden',
    marginBottom: spacing.md,
    position: 'relative',
    backgroundColor: colors.primaryDark,
    shadowColor: colors.shadowStrong,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 8,
  },
  heroBgWrap: {
    ...StyleSheet.absoluteFillObject,
  },
  heroBg: {
    width: '100%',
    height: '100%',
  },
  heroScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(18, 18, 23, 0.62)',
  },
  heroGlow: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: colors.primaryGlow,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.85)',
    shadowColor: colors.shadowStrong,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    fontFamily: fonts.headingExtraBold,
    fontSize: 22,
    color: colors.white,
  },
  heroStatusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: spacing.borderRadiusFull,
  },
  heroStatusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.success,
    marginRight: 6,
  },
  heroStatusText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.white,
    letterSpacing: 0.3,
  },
  heroBottomBlock: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  heroEyebrow: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.primaryLight,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  heroShopName: {
    fontFamily: fonts.headingExtraBold,
    fontSize: 22,
    color: colors.white,
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    flexWrap: 'wrap',
  },
  heroMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '70%',
  },
  heroMetaText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    marginLeft: 4,
  },
  heroMetaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.45)',
    marginHorizontal: 8,
  },

  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: spacing.borderRadiusLg,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 14,
    elevation: 3,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: spacing.sm,
    marginBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cardEyebrow: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.primary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  cardTitle: {
    fontFamily: fonts.headingBold,
    fontSize: 16,
    color: colors.textDark,
  },
  editToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: spacing.borderRadiusFull,
  },
  editToggleBtnActive: {
    backgroundColor: colors.dangerLight,
  },
  editToggleText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.primary,
  },

  formContainer: {
    marginTop: spacing.xs,
  },
  formEyebrow: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.primary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  formDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginTop: spacing.md,
  },
  timeRow: {
    flexDirection: 'row',
  },

  detailsList: {
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  detailTile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
    paddingVertical: 10,
    paddingHorizontal: spacing.sm,
    borderRadius: spacing.borderRadiusMd,
  },
  detailTileFull: {
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
  },
  detailIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  detailIconBoxAlt: { backgroundColor: colors.infoLight },
  detailIconBoxSuccess: { backgroundColor: colors.successLight },
  detailIconBoxRating: { backgroundColor: colors.ratingBg },
  detailIconBoxPrimary: { backgroundColor: colors.primaryLight },
  detailIconBoxInfo: { backgroundColor: colors.infoLight },
  detailIconBoxDark: { backgroundColor: colors.surfaceSubtle },
  detailLabel: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.textGray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailVal: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.textDark,
    marginTop: 2,
  },

  supportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: spacing.borderRadiusLg,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 14,
    elevation: 3,
  },
  supportIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
    shadowColor: colors.primaryGlow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  supportEyebrow: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.primary,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  supportTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.textDark,
  },
  supportSub: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textGray,
    marginTop: 2,
  },
  supportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#25D366',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: spacing.borderRadiusFull,
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  supportBtnText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.white,
  },

  reviewsLinkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: spacing.borderRadiusLg,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 14,
    elevation: 3,
  },
  reviewsIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.ratingBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewsLinkEyebrow: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.ratingText,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  reviewsLinkTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.textDark,
  },
  reviewsLinkSub: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textGray,
    marginTop: 2,
  },
  reviewsChevronBox: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SellerProfileScreen;
