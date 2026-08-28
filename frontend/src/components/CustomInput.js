import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput } from 'react-native';
import { colors, spacing, fonts } from '../theme/colors';

const CustomInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType = 'default',
  autoCapitalize = 'none',
  error,
  multiline = false,
  numberOfLines = 1,
  style,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          isFocused ? styles.inputFocused : null,
          error ? styles.inputError : null,
          multiline ? styles.multilineInput : null,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textLight}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        numberOfLines={numberOfLines}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.textDark,
    marginBottom: 6,
  },
  input: {
    fontFamily: fonts.regular,
    height: 50,
    backgroundColor: colors.inputBg,
    borderWidth: 1.2,
    borderColor: colors.borderDark,

    borderRadius: spacing.borderRadiusMd,
    paddingHorizontal: spacing.md,
    fontSize: 14,
    color: colors.textDark,
  },
  inputFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  multilineInput: {
    height: 96,
    textAlignVertical: 'top',
    paddingTop: spacing.md,
  },
  inputError: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerLight,
  },
  errorText: {
    fontFamily: fonts.medium,
    color: colors.danger,
    fontSize: 12,
    marginTop: 4,
  },
});

export default CustomInput;

