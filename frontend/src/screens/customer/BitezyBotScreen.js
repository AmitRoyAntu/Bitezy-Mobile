import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, spacing } from '../../theme/colors';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import aiService from '../../api/AiService';

const INITIAL_MESSAGE = {
  id: 'welcome',
  role: 'assistant',
  text: "👋 Hi! I'm BitezyBot, your campus meal assistant.\n\nTell me your budget or craving (e.g. \"Cheap snacks under 80 BDT\" or \"Make a lunch combo for 140 BDT\") and I'll find or bundle the best meals for you!",
  suggestions: [
    'Snacks under 80 BDT',
    'Lunch combo under 140 BDT',
    'Late night snacks',
    'Which canteens are open?'
  ],
  recommended_items: [],
  combo: null,
};

const BitezyBotScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { updateQty, cart } = useCart();
  const { showToast } = useToast();

  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    // Scroll to end when messages update
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 150);
  }, [messages, loading]);

  const handleSend = async (textToSend = null) => {
    const text = (textToSend || inputText).trim();
    if (!text || loading) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      text,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setLoading(true);

    try {
      // Build history
      const history = messages.slice(-4).map((m) => ({
        role: m.role,
        content: m.text,
      }));

      const response = await aiService.chat(text, history);

      const botMsg = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        text: response.reply || "Here's what I found for you:",
        combo: response.combo || null,
        recommended_items: response.recommended_items || [],
        suggestions: response.suggestions || [
          'Under 100 BDT',
          'Healthy options',
          'Combo for 2'
        ],
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      const errorMsg = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        text: "Sorry, I had trouble checking the canteens right now. Please make sure the AI service is running or try again!",
        suggestions: ['Snacks under 80 BDT', 'Lunch combo under 140 BDT'],
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComboToCart = (combo) => {
    if (!combo || !combo.items || combo.items.length === 0) return;

    combo.items.forEach((item) => {
      updateQty(
        item.name,
        item.price,
        1,
        item.img,
        item.providerName || combo.providerName || 'Campus Canteen',
        item.desc,
        item.providerId || combo.providerId
      );
    });

    showToast(`Added ${combo.title} (${combo.totalPrice} BDT) to cart!`, 'success');
  };

  const handleAddItemToCart = (item) => {
    updateQty(
      item.name,
      item.price,
      1,
      item.img,
      item.providerName || 'Campus Canteen',
      item.desc,
      item.providerId
    );
    showToast(`Added ${item.name} to cart!`, 'success');
  };

  const renderComboCard = (combo) => {
    if (!combo) return null;
    return (
      <View style={styles.comboCard}>
        <View style={styles.comboHeader}>
          <View style={styles.comboBadge}>
            <Ionicons name="sparkles" size={14} color="#FFF" />
            <Text style={styles.comboBadgeText}>Smart Combo</Text>
          </View>
          <Text style={styles.comboPrice}>{combo.totalPrice} BDT</Text>
        </View>

        <Text style={styles.comboTitle}>{combo.title}</Text>
        <Text style={styles.comboProvider}>📍 {combo.providerName}</Text>

        <View style={styles.comboDivider} />

        <View style={styles.comboItemsList}>
          {combo.items.map((it, idx) => (
            <View key={idx} style={styles.comboItemRow}>
              {it.img ? (
                <Image source={{ uri: it.img }} style={styles.comboItemImg} />
              ) : (
                <View style={[styles.comboItemImg, styles.comboItemPlaceholder]}>
                  <Ionicons name="restaurant" size={14} color={colors.textMuted} />
                </View>
              )}
              <View style={{ flex: 1, marginHorizontal: 8 }}>
                <Text style={styles.comboItemName} numberOfLines={1}>{it.name}</Text>
                <Text style={styles.comboItemCat}>{it.category}</Text>
              </View>
              <Text style={styles.comboItemPrice}>{it.price} BDT</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.addComboBtn}
          onPress={() => handleAddComboToCart(combo)}
          activeOpacity={0.85}
        >
          <Ionicons name="bag-add" size={18} color="#FFF" />
          <Text style={styles.addComboBtnText}>Add Combo to Cart • {combo.totalPrice} BDT</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderRecommendedItems = (items) => {
    if (!items || items.length === 0) return null;
    return (
      <View style={styles.recContainer}>
        <Text style={styles.recHeading}>Recommended Dishes</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recScroll}>
          {items.map((it, idx) => (
            <View key={idx} style={styles.recCard}>
              <Image
                source={{ uri: it.img || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100' }}
                style={styles.recCardImg}
              />
              <View style={styles.recCardBody}>
                <Text style={styles.recCardName} numberOfLines={1}>{it.name}</Text>
                <Text style={styles.recCardProvider} numberOfLines={1}>📍 {it.providerName}</Text>
                <View style={styles.recCardFooter}>
                  <Text style={styles.recCardPrice}>{it.price} BDT</Text>
                  <TouchableOpacity
                    style={styles.recAddBtn}
                    onPress={() => handleAddItemToCart(it)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add" size={16} color="#FFF" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderMessageItem = ({ item }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.msgRow, isUser ? styles.msgRowUser : styles.msgRowBot]}>
        {!isUser && (
          <View style={styles.botAvatar}>
            <Ionicons name="sparkles" size={16} color="#FFF" />
          </View>
        )}
        <View style={{ maxWidth: '85%' }}>
          <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}>
            <Text style={[styles.msgText, isUser ? styles.msgTextUser : styles.msgTextBot]}>
              {item.text}
            </Text>
          </View>

          {!isUser && renderComboCard(item.combo)}
          {!isUser && renderRecommendedItems(item.recommended_items)}

          {!isUser && item.suggestions && item.suggestions.length > 0 && (
            <View style={styles.suggestionsWrapper}>
              {item.suggestions.map((sug, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.suggestionChip}
                  onPress={() => handleSend(sug)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.suggestionText}>💡 {sug}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color={colors.textDark} />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitle}>BitezyBot</Text>
            <View style={styles.onlineDot} />
          </View>
          <Text style={styles.headerSubtitle}>AI Meal & Budget Concierge</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('Cart')}
          style={styles.cartIconBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="bag-handle-outline" size={22} color={colors.textDark} />
          {cart.length > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cart.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessageItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            loading ? (
              <View style={styles.typingIndicator}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.typingText}>BitezyBot is finding options...</Text>
              </View>
            ) : null
          }
        />

        {/* Bottom Input */}
        <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <TextInput
            style={styles.input}
            placeholder="Ask BitezyBot (e.g. Lunch combo under 140 BDT)..."
            placeholderTextColor={colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={() => handleSend()}
            returnKeyType="send"
            multiline={false}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
            onPress={() => handleSend()}
            disabled={!inputText.trim() || loading}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-up" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backBtn: {
    padding: 6,
    marginRight: 8,
  },
  headerTitleBox: {
    flex: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: fonts.headingBold,
    fontSize: 18,
    color: colors.textDark,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
    marginLeft: 6,
  },
  headerSubtitle: {
    fontFamily: fonts.bodyRegular,
    fontSize: 12,
    color: colors.textMuted,
  },
  cartIconBtn: {
    padding: 8,
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: colors.primary,
    borderRadius: 9,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  cartBadgeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: '#FFF',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  msgRow: {
    flexDirection: 'row',
    marginVertical: 8,
    alignItems: 'flex-start',
  },
  msgRowUser: {
    justifyContent: 'flex-end',
  },
  msgRowBot: {
    justifyContent: 'flex-start',
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginTop: 2,
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleUser: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
    alignSelf: 'flex-end',
  },
  bubbleBot: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  msgText: {
    fontFamily: fonts.bodyRegular,
    fontSize: 14,
    lineHeight: 20,
  },
  msgTextUser: {
    color: '#FFF',
  },
  msgTextBot: {
    color: colors.textDark,
  },
  // Combo card styles
  comboCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginTop: 10,
    borderWidth: 1.5,
    borderColor: '#FED7AA',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  comboHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  comboBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  comboBadgeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: '#FFF',
  },
  comboPrice: {
    fontFamily: fonts.headingBold,
    fontSize: 16,
    color: colors.primaryDark,
  },
  comboTitle: {
    fontFamily: fonts.headingBold,
    fontSize: 15,
    color: colors.textDark,
    marginTop: 8,
  },
  comboProvider: {
    fontFamily: fonts.bodyRegular,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  comboDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 10,
  },
  comboItemsList: {
    gap: 8,
    marginBottom: 12,
  },
  comboItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  comboItemImg: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
  comboItemPlaceholder: {
    backgroundColor: colors.surfaceSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  comboItemName: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.textDark,
  },
  comboItemCat: {
    fontFamily: fonts.bodyRegular,
    fontSize: 11,
    color: colors.textMuted,
  },
  comboItemPrice: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.textDark,
  },
  addComboBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 11,
    borderRadius: 12,
    gap: 6,
  },
  addComboBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: '#FFF',
  },
  // Recommended dishes carousel
  recContainer: {
    marginTop: 10,
  },
  recHeading: {
    fontFamily: fonts.headingBold,
    fontSize: 13,
    color: colors.textDark,
    marginBottom: 8,
  },
  recScroll: {
    flexDirection: 'row',
  },
  recCard: {
    width: 140,
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
  },
  recCardImg: {
    width: '100%',
    height: 80,
  },
  recCardBody: {
    padding: 8,
  },
  recCardName: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.textDark,
  },
  recCardProvider: {
    fontFamily: fonts.bodyRegular,
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  recCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  recCardPrice: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.primary,
  },
  recAddBtn: {
    backgroundColor: colors.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Suggestions
  suggestionsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  suggestionChip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  suggestionText: {
    fontFamily: fonts.bodyRegular,
    fontSize: 11,
    color: colors.textDark,
  },
  // Typing
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 10,
    paddingLeft: 40,
  },
  typingText: {
    fontFamily: fonts.bodyRegular,
    fontSize: 12,
    color: colors.textMuted,
  },
  // Input
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontFamily: fonts.bodyRegular,
    fontSize: 14,
    color: colors.textDark,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: colors.borderLight,
  },
});

export default BitezyBotScreen;

