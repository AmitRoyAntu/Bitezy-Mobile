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
          <Image
            source={{
              uri:
                shopImg ||
                provider?.img ||
                'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80',
            }}
            style={styles.heroBanner}
          />
          <View style={styles.heroOverlay}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {ownerName ? ownerName.charAt(0).toUpperCase() : 'M'}
              </Text>
            </View>
            <Text style={styles.heroShopName}>{shopName || 'Canteen Name'}</Text>
            <Text style={styles.heroOwnerSub}>
              {ownerName} • {currentUser?.email}
            </Text>
          </View>
        </View>

        {/* Canteen Settings Card */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Canteen & Owner Profile</Text>
            <TouchableOpacity
              style={styles.editToggleBtn}
              onPress={() => setIsEditing(!isEditing)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isEditing ? 'close' : 'create-outline'}
                size={16}
                color={isEditing ? colors.danger : colors.primary}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.editToggleText,
                  isEditing && { color: colors.danger },
                ]}
              >
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </Text>
            </TouchableOpacity>
          </View>

          {isEditing ? (
            <View style={styles.formContainer}>
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
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Shop Name</Text>
                <Text style={styles.detailVal}>{shopName || 'N/A'}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Type</Text>
                <Text style={styles.detailVal}>{shopType}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Location</Text>
                <Text style={styles.detailVal}>{shopLocation || 'CUET Campus'}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Operating Hours</Text>
                <Text style={styles.detailVal}>{openTime} - {closeTime}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Delivery Speed</Text>
                <Text style={styles.detailVal}>{deliveryTime}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Manager Phone</Text>
                <Text style={styles.detailVal}>{ownerPhone}</Text>
              </View>

              {shopDescription ? (
                <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.detailLabel}>Description</Text>
                  <Text style={[styles.detailVal, { marginTop: 3 }]}>{shopDescription}</Text>
                </View>
              ) : null}
            </View>
          )}
        </View>

        {/* Support Card */}
        <View style={styles.supportCard}>
          <View style={styles.supportIconBox}>
            <Ionicons name="headset-outline" size={24} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.supportTitle}>CUET Seller Helpline</Text>
            <Text style={styles.supportSub}>Need assistance with menu pricing or payout transfers?</Text>
          </View>
          <TouchableOpacity style={styles.supportBtn} onPress={handleOpenSupport} activeOpacity={0.85}>
            <Ionicons name="logo-whatsapp" size={16} color={colors.white} style={{ marginRight: 4 }} />
            <Text style={styles.supportBtnText}>Help</Text>
          </TouchableOpacity>
        </View>

        {/* Customer Reviews Link */}
        <TouchableOpacity
          style={styles.reviewsLinkCard}
          onPress={() => navigation.navigate('Reviews')}
          activeOpacity={0.85}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="star" size={20} color="#FF9F43" style={{ marginRight: 10 }} />
            <View>
              <Text style={styles.reviewsLinkTitle}>Customer Reviews & Ratings</Text>
              <Text style={styles.reviewsLinkSub}>Read feedback from students and teachers</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
        </TouchableOpacity>

        {/* Log Out Button */}
        <CustomButton
          title="Log Out"
          onPress={logout}
          variant="outline"
          style={styles.logoutBtn}
        />

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  heroCard: {
    height: 180,
    borderRadius: spacing.borderRadiusMd,
    overflow: 'hidden',
    marginBottom: spacing.md,
    position: 'relative',
  },
  heroBanner: { width: '100%', height: '100%' },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    padding: spacing.md,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    borderWidth: 2,
    borderColor: colors.white,
  },
  avatarText: {
    fontFamily: fonts.headingBold,
    fontSize: 18,
    color: colors.white,
  },
  heroShopName: {
    fontFamily: fonts.headingExtraBold,
    fontSize: 18,
    color: colors.white,
  },
  heroOwnerSub: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 1,
  },

  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: spacing.borderRadiusMd,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cardTitle: {
    fontFamily: fonts.headingBold,
    fontSize: 15,
    color: colors.textDark,
  },
  editToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: spacing.borderRadiusSm,
  },
  editToggleText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.primary,
  },

  formContainer: {
    marginTop: spacing.sm,
  },
  timeRow: {
    flexDirection: 'row',
  },

  detailsList: {
    marginTop: spacing.xs,
  },
  detailRow: {
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: colors.textGray,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  detailVal: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.textDark,
    marginTop: 2,
  },

  supportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: spacing.borderRadiusMd,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    gap: spacing.sm,
  },
  supportIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  supportTitle: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.textDark,
  },
  supportSub: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textGray,
    marginTop: 1,
  },
  supportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#25D366',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: spacing.borderRadiusSm,
  },
  supportBtnText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.white,
  },

  reviewsLinkCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: spacing.borderRadiusMd,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  reviewsLinkTitle: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.textDark,
  },
  reviewsLinkSub: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textGray,
    marginTop: 1,
  },

  logoutBtn: {
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
});

export default SellerProfileScreen;
