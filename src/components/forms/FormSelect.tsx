import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';

import { RequiredLabel } from './RequiredLabel';
import { FormErrorText } from './FormErrorText';

export interface SelectOption {
  value: string;
  label: string;
}

interface Props {
  label: string;
  value: string;
  options: SelectOption[];
  onSelect: (value: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  helper?: string;
}

export function FormSelect({
  label,
  value,
  options,
  onSelect,
  placeholder = 'Select an option…',
  error,
  required,
  helper,
}: Props) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  const hasError = !!error;

  return (
    <View style={styles.wrap}>
      <RequiredLabel label={label} required={required} />
      {helper ? <Text style={styles.helper}>{helper}</Text> : null}

      <TouchableOpacity
        style={[styles.trigger, hasError && styles.triggerError]}
        onPress={() => setOpen((v) => !v)}
        activeOpacity={0.8}
      >
        <Text style={[styles.triggerText, !selected && styles.placeholder]}>
          {selected ? selected.label : placeholder}
        </Text>
        {open ? (
          <ChevronUp size={16} color="#6B7280" />
        ) : (
          <ChevronDown size={16} color="#6B7280" />
        )}
      </TouchableOpacity>

      {open && (
        <View style={styles.dropdown}>
          <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled>
            {options.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.option, value === opt.value && styles.optionSelected]}
                onPress={() => {
                  onSelect(opt.value);
                  setOpen(false);
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.optionText, value === opt.value && styles.optionTextSelected]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <FormErrorText error={error} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  helper: { fontSize: 11, color: '#6B7280', marginTop: -2 },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: '#FFFFFF',
  },
  triggerError: { borderColor: '#DC2626', backgroundColor: '#FEF2F2' },
  triggerText: { fontSize: 15, color: '#111827', fontWeight: '500', flex: 1 },
  placeholder: { color: '#9CA3AF', fontWeight: '400' },
  dropdown: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    maxHeight: 200,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    marginTop: -4,
  },
  option: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  optionSelected: { backgroundColor: '#FFF3E8' },
  optionText: { fontSize: 14, color: '#374151' },
  optionTextSelected: { color: '#C76B2D', fontWeight: '700' },
});
