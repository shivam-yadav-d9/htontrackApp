import * as DocumentPicker from 'expo-document-picker';
import { FileText, Upload } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StaffPageHeader } from '@/components/StaffPageHeader';
import { documentService } from '@/services/document.service';
import type { DocumentType, StaffDocument } from '@/types/document.types';
import { COLORS, BorderRadius, Shadow, Spacing } from '@/constants/theme';

const DOCUMENT_TYPES: DocumentType[] = [
  'Identity Document',
  'Training Proof',
  'Assignment Proof',
  'Store Audit Proof',
  'Compliance Document',
  'Profile Verification',
];

const ALLOWED_MIME = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
const MAX_SIZE_MB = 5;

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  pending:     { bg: '#FEF3C7', text: '#92400E', label: 'Pending Review' },
  resubmitted: { bg: '#DBEAFE', text: '#1E40AF', label: 'Resubmitted' },
  approved:    { bg: '#DCFCE7', text: '#166534', label: 'Approved' },
  rejected:    { bg: '#FEE2E2', text: '#B91C1C', label: 'Rejected' },
};

export default function DocumentsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [docs, setDocs] = useState<StaffDocument[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [selectedType, setSelectedType] = useState<DocumentType>(DOCUMENT_TYPES[0]);
  const [remarks, setRemarks] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [pendingFile, setPendingFile] = useState<{
    name: string; mimeType?: string; sizeMb?: number;
  } | null>(null);
  const [pickError, setPickError] = useState('');

  useEffect(() => { loadDocs(); }, []);

  async function loadDocs() {
    try {
      const data = await documentService.getMyDocuments();
      setDocs(data);
    } catch (err) {
      console.log('Documents load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadDocs();
  }

  async function handlePickFile() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ALLOWED_MIME,
        copyToCacheDirectory: false,
        multiple: false,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];

      if (asset.size && asset.size > MAX_SIZE_MB * 1024 * 1024) {
        setPickError(`File exceeds ${MAX_SIZE_MB} MB limit.`);
        return;
      }
      if (asset.mimeType && !ALLOWED_MIME.includes(asset.mimeType)) {
        setPickError('Only PDF, JPG, and PNG files are allowed.');
        return;
      }

      setPickError('');
      setPendingFile({
        name: asset.name,
        mimeType: asset.mimeType,
        sizeMb: asset.size ? +(asset.size / (1024 * 1024)).toFixed(2) : undefined,
      });
    } catch {
      setPickError('Failed to pick file. Please try again.');
    }
  }

  async function handleSubmit() {
    if (!pendingFile) {
      setPickError('Please select a file first.');
      return;
    }
    setSubmitting(true);
    try {
      const ext = (pendingFile.mimeType ?? '').split('/')[1] ?? pendingFile.name.split('.').pop() ?? '';
      const newDoc = await documentService.uploadDocumentMeta({
        document_type: selectedType,
        file_name: pendingFile.name,
        file_type: ext,
        file_size_mb: pendingFile.sizeMb,
        remarks: remarks.trim() || undefined,
        expiry_date: expiryDate.trim() || undefined,
      });
      setDocs((prev) => [newDoc, ...prev]);
      setPendingFile(null);
      setRemarks('');
      setExpiryDate('');
      Alert.alert('Submitted', 'Document submitted for manager review.');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to submit document.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StaffPageHeader title="Documents" subtitle={`${docs.length} submitted`} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.orange]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Upload Card */}
        <View style={[styles.card, Shadow.card]}>
          <Text style={styles.cardTitle}>Submit Document</Text>

          <Text style={styles.fieldLabel}>Document Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
            <View style={styles.typeRow}>
              {DOCUMENT_TYPES.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeChip, selectedType === t && styles.typeChipActive]}
                  onPress={() => setSelectedType(t)}
                >
                  <Text style={[styles.typeChipText, selectedType === t && styles.typeChipTextActive]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <TouchableOpacity
            style={[styles.dropZone, pendingFile && styles.dropZoneActive]}
            onPress={handlePickFile}
            activeOpacity={0.75}
          >
            <Upload size={22} color={pendingFile ? COLORS.blue : COLORS.gray} />
            <Text style={[styles.dropText, pendingFile && styles.dropTextActive]}>
              {pendingFile ? pendingFile.name : 'Tap to select file (PDF, JPG, PNG · max 5 MB)'}
            </Text>
          </TouchableOpacity>
          {pickError ? <Text style={styles.errText}>{pickError}</Text> : null}

          <TextInput
            style={styles.input}
            value={remarks}
            onChangeText={setRemarks}
            placeholder="Remarks (optional)…"
            placeholderTextColor={COLORS.gray}
          />
          <TextInput
            style={styles.input}
            value={expiryDate}
            onChangeText={setExpiryDate}
            placeholder="Expiry date YYYY-MM-DD (optional)…"
            placeholderTextColor={COLORS.gray}
          />

          <TouchableOpacity
            style={[styles.submitBtn, (!pendingFile || submitting) && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={!pendingFile || submitting}
          >
            {submitting
              ? <ActivityIndicator size="small" color={COLORS.white} />
              : <Text style={styles.submitBtnText}>Submit Document</Text>}
          </TouchableOpacity>
        </View>

        {/* History */}
        <Text style={styles.sectionTitle}>My Documents</Text>
        {loading ? (
          <ActivityIndicator color={COLORS.orange} style={{ marginTop: 20 }} />
        ) : docs.length === 0 ? (
          <View style={styles.empty}>
            <FileText size={36} color={COLORS.border} />
            <Text style={styles.emptyText}>No documents submitted yet.</Text>
          </View>
        ) : (
          docs.map((doc) => {
            const s = STATUS_STYLE[doc.status] ?? STATUS_STYLE.pending;
            return (
              <View key={doc.id} style={[styles.docCard, Shadow.card]}>
                <View style={styles.docTop}>
                  <View style={styles.docIconBox}>
                    <FileText size={20} color={COLORS.orange} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.docName} numberOfLines={1}>{doc.file_name}</Text>
                    <Text style={styles.docMeta}>
                      {[doc.document_type, doc.file_type?.toUpperCase(), doc.file_size_mb ? `${doc.file_size_mb} MB` : null]
                        .filter(Boolean).join(' · ')}
                    </Text>
                  </View>
                  <View style={[styles.statusChip, { backgroundColor: s.bg }]}>
                    <Text style={[styles.statusText, { color: s.text }]}>{s.label}</Text>
                  </View>
                </View>

                {doc.remarks ? (
                  <Text style={styles.docRemarks}>Remarks: {doc.remarks}</Text>
                ) : null}

                {doc.expiry_date ? (
                  <Text style={styles.docMeta}>Expires: {doc.expiry_date}</Text>
                ) : null}

                {doc.status === 'rejected' && doc.manager_remarks ? (
                  <View style={styles.rejectionBox}>
                    <Text style={styles.rejectionLabel}>Manager Feedback</Text>
                    <Text style={styles.rejectionText}>{doc.manager_remarks}</Text>
                  </View>
                ) : null}

                {doc.created_at ? (
                  <Text style={styles.docDate}>
                    {new Date(doc.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </Text>
                ) : null}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.beige },
  content: { padding: Spacing.three, gap: Spacing.two, paddingBottom: 40 },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  cardTitle: { fontSize: 15, fontWeight: '800', color: COLORS.blue },

  fieldLabel: { fontSize: 12, fontWeight: '700', color: COLORS.gray, textTransform: 'uppercase' },
  typeRow: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  typeChip: {
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.beigeLight,
  },
  typeChipActive: { borderColor: COLORS.blue, backgroundColor: COLORS.blue },
  typeChipText: { fontSize: 12, fontWeight: '600', color: COLORS.gray },
  typeChipTextActive: { color: COLORS.white },

  dropZone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.medium,
    padding: 14,
    backgroundColor: COLORS.beigeLight,
  },
  dropZoneActive: { borderColor: COLORS.blue, backgroundColor: '#EFF6FF' },
  dropText: { flex: 1, fontSize: 13, color: COLORS.gray },
  dropTextActive: { color: COLORS.blue, fontWeight: '600' },

  errText: { fontSize: 12, color: '#DC2626' },

  input: {
    backgroundColor: COLORS.beigeLight,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: Spacing.two,
    paddingVertical: 10,
    fontSize: 13,
    color: COLORS.black,
  },

  submitBtn: {
    backgroundColor: COLORS.blue,
    borderRadius: BorderRadius.medium,
    paddingVertical: 13,
    alignItems: 'center',
    minHeight: 46,
  },
  btnDisabled: { opacity: 0.5 },
  submitBtnText: { color: COLORS.white, fontWeight: '800', fontSize: 14 },

  sectionTitle: { fontSize: 15, fontWeight: '800', color: COLORS.blue },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyText: { color: COLORS.gray, fontSize: 14 },

  docCard: {
    backgroundColor: COLORS.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  docTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  docIconBox: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.medium,
    backgroundColor: COLORS.orangeLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docName: { fontSize: 14, fontWeight: '700', color: COLORS.blue },
  docMeta: { fontSize: 11, color: COLORS.gray, marginTop: 1 },
  statusChip: {
    borderRadius: BorderRadius.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },

  docRemarks: { fontSize: 12, color: COLORS.grayDark },
  docDate: { fontSize: 11, color: COLORS.gray, marginTop: 2 },

  rejectionBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: BorderRadius.small,
    borderLeftWidth: 3,
    borderLeftColor: '#DC2626',
    padding: 10,
    gap: 4,
  },
  rejectionLabel: { fontSize: 10, fontWeight: '800', color: '#DC2626', textTransform: 'uppercase' },
  rejectionText: { fontSize: 12, color: '#7F1D1D', lineHeight: 18 },
});
