import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { CalendarDays } from 'lucide-react-native';

import { RequiredLabel } from './RequiredLabel';
import { FormErrorText } from './FormErrorText';

interface Props {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  helper?: string;
  editable?: boolean;
}

export function FormDatePicker({
  label,
  value,
  onChangeText,
  placeholder = 'YYYY-MM-DD',
  error,
  required,
  helper,
  editable = true,
}: Props) {
  const hasError = !!error;
  return (
    <View style={styles.wrap}>
      <RequiredLabel label={label} required={required} />
      {helper ? <Text style={styles.helper}>{helper}</Text> : null}
      <View style={[styles.row, hasError && styles.rowError, !editable && styles.rowDisabled]}>
        <CalendarDays size={17} color={hasError ? '#DC2626' : '#9CA3AF'} style={styles.icon} />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          keyboardType="numeric"
          maxLength={10}
          editable={editable}
        />
      </View>
      <Text style={styles.hint}>Format: YYYY-MM-DD (e.g. 2025-01-31)</Text>
      <FormErrorText error={error} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 4 },
  helper: { fontSize: 11, color: '#6B7280' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
  },
  rowError: { borderColor: '#DC2626', backgroundColor: '#FEF2F2' },
  rowDisabled: { backgroundColor: '#F9FAFB' },
  icon: { marginRight: 8 },
  input: { flex: 1, paddingVertical: 13, fontSize: 15, color: '#111827' },
  hint: { fontSize: 11, color: '#9CA3AF', marginTop: 0 },
});
