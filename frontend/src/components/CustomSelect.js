import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  FlatList,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../theme/colors';

const CustomSelect = ({
  label,
  value,
  options = [],
  onSelect,
  placeholder = 'Select an option',
  error,
  style,
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const selectedOption = options.find((opt) =>
    typeof opt === 'string' ? opt === value : opt.value === value
  );

  const displayLabel = selectedOption
    ? typeof selectedOption === 'string'
      ? selectedOption
      : selectedOption.label
    : value || placeholder;

  const isSelected = !!value;

  const handleChoose = (item) => {
    const val = typeof item === 'string' ? item : item.value;
    onSelect(val);
    setModalVisible(false);
  };

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <TouchableOpacity
        style={[
          styles.selectButton,
          error ? styles.inputError : null,
          modalVisible ? styles.selectButtonFocused : null,
        ]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <Text
          style={[
            styles.selectText,
            !isSelected && styles.placeholderText,
          ]}
          numberOfLines={1}
        >
          {displayLabel}
        </Text>
        <Ionicons
          name="chevron-down"
          size={18}
          color={modalVisible ? colors.primary : colors.textGray}
        />
      </TouchableOpacity>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* Dropdown Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{label || 'Select Option'}</Text>
                  <TouchableOpacity
                    style={styles.closeBtn}
                    onPress={() => setModalVisible(false)}
                  >
                    <Ionicons name="close" size={22} color={colors.textGray} />
                  </TouchableOpacity>
                </View>

                <FlatList
                  data={options}
                  keyExtractor={(item, index) =>
                    typeof item === 'string' ? item : item.value || String(index)
                  }
                  renderItem={({ item }) => {
                    const itemVal = typeof item === 'string' ? item : item.value;
                    const itemLabel = typeof item === 'string' ? item : item.label;
                    const isItemActive = itemVal === value;

                    return (
                      <TouchableOpacity
                        style={[
                          styles.optionItem,
                          isItemActive && styles.optionItemActive,
                        ]}
                        onPress={() => handleChoose(item)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            isItemActive && styles.optionTextActive,
                          ]}
                        >
                          {itemLabel}
                        </Text>
                        {isItemActive && (
                          <Ionicons
                            name="checkmark"
                            size={18}
                            color={colors.primary}
                          />
                        )}
                      </TouchableOpacity>
                    );
                  }}
                  contentContainerStyle={styles.listContainer}
                  ItemSeparatorComponent={() => <View style={styles.separator} />}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
    width: '100%',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: spacing.xs,
  },
  selectButton: {
    height: 48,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.borderRadiusSm,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectButtonFocused: {
    borderColor: colors.primary,
  },
  inputError: {
    borderColor: colors.danger,
  },
  selectText: {
    fontSize: 14,
    color: colors.textDark,
    flex: 1,
    marginRight: spacing.sm,
    fontWeight: '500',
  },
  placeholderText: {
    color: colors.textLight,
    fontWeight: '400',
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '80%',
    backgroundColor: colors.card,
    borderRadius: spacing.borderRadiusLg,
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textDark,
  },
  closeBtn: {
    padding: 4,
  },
  listContainer: {
    paddingVertical: spacing.xs,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  optionItemActive: {
    backgroundColor: colors.primaryLight,
  },
  optionText: {
    fontSize: 14,
    color: colors.textDark,
    fontWeight: '500',
    flex: 1,
  },
  optionTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
  },
});

export default CustomSelect;
