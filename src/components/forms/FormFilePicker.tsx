import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FileText, Upload, X } from 'lucide-react-native';

import { FormErrorText } from './FormErrorText';
import { RequiredLabel } from './RequiredLabel';

export interface PickedFile {
  name: string;
  size: number;
  mimeType: string;
  uri: string;
}

interface Props {
  label: string;
  file?: PickedFile | null;
  onPick: () => void;
  onRemove?: () => void;
  error?: string;
  required?: boolean;
  helper?: string;
  disabled?: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FormFilePicker({
  label,
  file,
  onPick,
  onRemove,
  error,
  required,
  helper,
  disabled,
}: Props) {
  const hasError = !!error;

  return (
    <View style={styles.wrap}>
      <RequiredLabel label={label} required={required} />
      {helper ? <Text style={styles.helper}>{helper}</Text> : null}

      {file ? (
        <View style={[styles.preview, hasError && styles.previewError]}>
          <FileText size={20} color="#374151" style={{ marginRight: 10 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
            <Text style={styles.fileMeta}>{formatBytes(file.size)} · {file.mimeType}</Text>
          </View>
          {onRemove && (
            <TouchableOpacity onPress={onRemove} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={16} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.pickBtn, hasError && styles.pickBtnError, disabled && styles.pickBtnDisabled]}
          onPress={onPick}
          disabled={disabled}
          activeOpacity={0.8}
        >
          <Upload size={16} color={disabled ? '#9CA3AF' : '#C76B2D'} />
          <Text style={[styles.pickText, disabled && styles.pickTextDisabled]}>
            Choose file…
          </Text>
        </TouchableOpacity>
      )}

      <Text style={styles.allowedTypes}>Allowed: PDF, JPG, PNG, WEBP · Max 5 MB</Text>
      <FormErrorText error={error} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  helper: { fontSize: 11, color: '#6B7280', marginTop: -2 },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F9FAFB',
  },
  previewError: { borderColor: '#DC2626', backgroundColor: '#FEF2F2' },
  fileName: { fontSize: 13, fontWeight: '700', color: '#111827' },
  fileMeta: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  pickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#FFCFA3',
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: '#FFF3E8',
  },
  pickBtnError: { borderColor: '#FECACA', backgroundColor: '#FEF2F2' },
  pickBtnDisabled: { backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' },
  pickText: { fontSize: 14, fontWeight: '700', color: '#C76B2D' },
  pickTextDisabled: { color: '#9CA3AF' },
  allowedTypes: { fontSize: 11, color: '#9CA3AF' },
});
