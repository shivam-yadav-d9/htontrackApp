import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { RequiredLabel } from './RequiredLabel';
import { FormErrorText } from './FormErrorText';
import { CharacterCounter } from './CharacterCounter';

interface Props {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  maxLength?: number;
  minHeight?: number;
  editable?: boolean;
  helper?: string;
}

export function FormTextArea({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  required,
  maxLength,
  minHeight = 100,
  editable = true,
  helper,
}: Props) {
  const hasError = !!error;
  return (
    <View style={styles.wrap}>
      <RequiredLabel label={label} required={required} />
      {helper ? <Text style={styles.helper}>{helper}</Text> : null}
      <TextInput
        style={[
          styles.input,
          { minHeight },
          hasError && styles.inputError,
          !editable && styles.inputDisabled,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        multiline
        textAlignVertical="top"
        editable={editable}
        maxLength={maxLength ? maxLength + 50 : undefined}
      />
      {maxLength ? <CharacterCounter current={value.length} max={maxLength} /> : null}
      <FormErrorText error={error} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  helper: { fontSize: 11, color: '#6B7280', marginTop: -2 },
  input: {
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  inputError: { borderColor: '#DC2626', backgroundColor: '#FEF2F2' },
  inputDisabled: { backgroundColor: '#F9FAFB', color: '#6B7280' },
});
