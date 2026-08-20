import React, { useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fonts } from '../theme/colors';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FoodItemCard = ({ item, quantity = 0, onUpdateQty }) => {
  const qtyScaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (quantity > 0) {
      const isNative = Platform.OS !== 'web';
      Animated.sequence([
        Animated.timing(qtyScaleAnim, {
          toValue: 1.25,
          duration: 80,
          useNativeDriver: isNative,
        }),
        Animated.spring(qtyScaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 140,
          useNativeDriver: isNative,
        }),
      ]).start();
    }
  }, [quantity]);

  const handleUpdate = (change) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
    onUpdateQty(item, change);
  };

  return (
    <View style={styles.card}>
      <Image
        source={{ uri: item.img || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&auto=format&fit=crop&q=80' }}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.info}>
        <View>
          <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.desc} numberOfLines={2}>
            {item.desc || item.description || 'Fresh campus delicacy prepared daily'}
          </Text>
        </View>

        <View style={styles.bottomRow}>
          <Text style={styles.price}>৳ {item.price}</Text>

          {quantity > 0 ? (
            <View style={styles.counter}>
              <TouchableOpacity
                style={styles.counterBtn}
                onPress={() => handleUpdate(-1)}
                activeOpacity={0.7}
              >
                <Ionicons name="remove" size={15} color={colors.primary} />
              </TouchableOpacity>
              <Animated.Text
                style={[
                  styles.qtyText,
                  { transform: [{ scale: qtyScaleAnim }] },
                ]}
              >
                {quantity}
              </Animated.Text>
              <TouchableOpacity
                style={styles.counterBtn}
                onPress={() => handleUpdate(1)}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={15} color={colors.primary} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => handleUpdate(1)}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={16} color={colors.primary} style={{ marginRight: 2 }} />
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: spacing.borderRadiusMd,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      ios: {
        shadowColor: colors.secondary,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 10px rgba(18, 18, 23, 0.04)',
      },
    }),
  },
  image: {
    width: 84,
    height: 84,
    borderRadius: spacing.borderRadiusMd - 2,
    backgroundColor: colors.border,
  },
  info: {
    flex: 1,
    marginLeft: spacing.md,
    justifyContent: 'space-between',
  },
  name: {
    fontFamily: fonts.headingSemiBold,
    fontSize: 15,
    color: colors.textDark,
    letterSpacing: -0.2,
  },
  desc: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textGray,
    marginTop: 2,
    lineHeight: 16,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  price: {
    fontFamily: fonts.headingBold,
    fontSize: 16,
    color: colors.primary,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: spacing.borderRadiusFull,
    borderWidth: 1,
    borderColor: 'rgba(255, 75, 38, 0.2)',
  },
  addBtnText: {
    fontFamily: fonts.bold,
    color: colors.primary,
    fontSize: 13,
  },
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: spacing.borderRadiusFull,
    borderWidth: 1,
    borderColor: 'rgba(255, 75, 38, 0.2)',
  },
  counterBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    fontFamily: fonts.bold,
    paddingHorizontal: 6,
    color: colors.primaryDark,
    fontSize: 13,
    minWidth: 20,
    textAlign: 'center',
  },
});

export default FoodItemCard;

