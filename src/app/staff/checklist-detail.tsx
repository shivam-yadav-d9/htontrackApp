import { router, useLocalSearchParams } from 'expo-router';
import { CheckCircle2, MessageSquare, Star } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { ManagerPageHeader } from '@/components/ManagerPageHeader';
import { checklistService } from '@/services/checklist.service';
import type {
  ChecklistAssignmentDetail,
  ChecklistItemSubmission,
  ChecklistTemplateItem,
} from '@/types/checklist.types';
import { BorderRadius, COLORS, Shadow, Spacing } from '@/constants/theme';

type ItemState = {
  response_value: any;
  remarks: string;
};

const YES_NO_OPTIONS = [
  { value: 'yes',      label: 'Yes',      color: '#166534', bg: '#DCFCE7' },
  { value: 'no',       label: 'No',       color: '#B91C1C', bg: '#FEE2E2' },
];

const DONE_NOT_DONE_OPTIONS = [
  { value: 'done',     label: 'Done',     color: '#166534', bg: '#DCFCE7' },
  { value: 'not_done', label: 'Not Done', color: '#B91C1C', bg: '#FEE2E2' },
];

function initFromSubmissions(
  items: ChecklistTemplateItem[],
  submissions: ChecklistItemSubmission[],
): Record<string, ItemState> {
  const subMap: Record<string, ChecklistItemSubmission> = {};
  for (const s of submissions) subMap[s.item_id] = s;
  const state: Record<string, ItemState> = {};
  for (const item of items) {
    const existing = subMap[item.id];
    state[item.id] = {
      response_value: existing?.response_value ?? null,
      remarks: existing?.remarks ?? '',
    };
  }
  return state;
}

export default function ChecklistDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading]   = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]       = useState('');
  const [detail, setDetail]     = useState<ChecklistAssignmentDetail | null>(null);
  const [answers, setAnswers]   = useState<Record<string, ItemState>>({});
  const [finalRemarks, setFinalRemarks] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const load = useCallback(async () => {
    if (!id || id === 'undefined') return;
    setLoading(true);
    setError('');
    try {
      const data = await checklistService.getAssignmentDetail(id);
      setDetail(data);
      setAnswers(initFromSubmissions(data.items, data.submissions));
      if (['submitted', 'reviewed'].includes(data.assignment.status)) {
        setSubmitted(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load checklist');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  function setItemValue(itemId: string, value: any) {
    setAnswers((prev) => ({ ...prev, [itemId]: { ...prev[itemId], response_value: value } }));
  }

  function setItemRemarks(itemId: string, remarks: string) {
    setAnswers((prev) => ({ ...prev, [itemId]: { ...prev[itemId], remarks } }));
  }

  async function handleSubmit() {
    if (!detail) return;
    const requiredItems = detail.items.filter((it) => it.is_required);
    const unanswered = requiredItems.filter((it) => {
      const v = answers[it.id]?.response_value;
      return v === null || v === undefined || v === '';
    });
    if (unanswered.length > 0) {
      Alert.alert(
        'Incomplete',
        `Please answer all required items (${unanswered.length} remaining).`,
      );
      return;
    }

    const items = detail.items
      .filter((it) => {
        const v = answers[it.id]?.response_value;
        return v !== null && v !== undefined && v !== '';
      })
      .map((it) => ({
        item_id: it.id,
        response_value: answers[it.id].response_value,
        remarks: answers[it.id].remarks || undefined,
      }));

    setSubmitting(true);
    try {
      await checklistService.submitFullAssignment(id, {
        items,
        final_remarks: finalRemarks.trim() || undefined,
      });
      setSubmitted(true);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ManagerPageHeader title="Checklist" showBack onBack={() => router.back()} />
        <LoadingState message="Loading checklist..." />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ManagerPageHeader title="Checklist" showBack onBack={() => router.back()} />
        <ErrorState message={error} onRetry={load} />
      </SafeAreaView>
    );
  }

  if (submitted) {
    const reviewStatus = detail?.assignment.review_status;
    const managerRemarks = detail?.assignment.manager_remarks;
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ManagerPageHeader title="Checklist" showBack onBack={() => router.back()} />
        <View style={styles.doneWrap}>
          <CheckCircle2 size={64} color={COLORS.success} />
          <Text style={styles.doneTitle}>
            {reviewStatus === 'approved' ? 'Approved!' : 'Submitted!'}
          </Text>
          <Text style={styles.doneSub}>
            {reviewStatus === 'approved'
              ? 'Your checklist was reviewed and approved by the manager.'
              : reviewStatus === 'needs_correction'
              ? 'Manager has requested corrections. Please re-submit.'
              : 'Your checklist has been submitted and is awaiting review.'}
          </Text>
          {managerRemarks && (
            <View style={styles.remarkBanner}>
              <MessageSquare size={14} color={COLORS.blue} />
              <Text style={styles.remarkBannerText}>{managerRemarks}</Text>
            </View>
          )}
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Back to Checklists</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { assignment, template, items } = detail!;
  const answeredCount = items.filter((it) => {
    const v = answers[it.id]?.response_value;
    return v !== null && v !== undefined && v !== '';
  }).length;
  const pct = items.length > 0 ? Math.round((answeredCount / items.length) * 100) : 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ManagerPageHeader
        title={template.title}
        showBack
        onBack={() => router.back()}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          {/* Header card */}
          <View style={[styles.headerCard, Shadow.card]}>
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.headerType}>{template.checklist_type?.toUpperCase()}</Text>
                <Text style={styles.headerDue}>Due: {assignment.due_date}</Text>
              </View>
              <View style={styles.pctBubble}>
                <Text style={styles.pctNum}>{pct}%</Text>
                <Text style={styles.pctLbl}>Done</Text>
              </View>
            </View>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: `${pct}%` as any }]} />
            </View>
            {template.description ? (
              <Text style={styles.headerDesc}>{template.description}</Text>
            ) : null}
          </View>

          {/* Items */}
          {items.map((item, idx) => (
            <ItemCard
              key={item.id}
              item={item}
              index={idx}
              state={answers[item.id]}
              onValueChange={(v) => setItemValue(item.id, v)}
              onRemarksChange={(r) => setItemRemarks(item.id, r)}
            />
          ))}

          {/* Final remarks */}
          <View style={[styles.remarksCard, Shadow.card]}>
            <Text style={styles.remarksLabel}>Final Remarks (optional)</Text>
            <TextInput
              style={styles.remarksInput}
              placeholder="Any general notes or observations..."
              placeholderTextColor={COLORS.gray}
              value={finalRemarks}
              onChangeText={setFinalRemarks}
              multiline
              numberOfLines={3}
            />
          </View>

          <AppButton
            label={`Submit Checklist (${answeredCount}/${items.length})`}
            onPress={handleSubmit}
            loading={submitting}
          />
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ItemCard({
  item, index, state, onValueChange, onRemarksChange,
}: {
  item: ChecklistTemplateItem;
  index: number;
  state: ItemState | undefined;
  onValueChange: (v: any) => void;
  onRemarksChange: (r: string) => void;
}) {
  const value = state?.response_value ?? null;
  const remarks = state?.remarks ?? '';
  const hasValue = value !== null && value !== undefined && value !== '';

  return (
    <View style={[styles.itemCard, Shadow.card]}>
      <View style={styles.itemHeader}>
        <View style={[styles.numBadge, hasValue && styles.numBadgeDone]}>
          {hasValue
            ? <CheckCircle2 size={14} color={COLORS.white} />
            : <Text style={styles.numText}>{index + 1}</Text>
          }
        </View>
        <View style={styles.itemTitleWrap}>
          <Text style={styles.itemText}>{item.item_text}</Text>
        </View>
        {item.is_required && (
          <View style={styles.reqBadge}>
            <Text style={styles.reqText}>*</Text>
          </View>
        )}
      </View>

      {/* Input by item_type */}
      {(item.item_type === 'yes_no') && (
        <ToggleGroup
          options={YES_NO_OPTIONS}
          value={value}
          onChange={onValueChange}
        />
      )}
      {(item.item_type === 'done_not_done') && (
        <ToggleGroup
          options={DONE_NOT_DONE_OPTIONS}
          value={value}
          onChange={onValueChange}
        />
      )}
      {(item.item_type === 'rating') && (
        <RatingInput value={value} onChange={onValueChange} />
      )}
      {(item.item_type === 'text') && (
        <TextInput
          style={styles.textInput}
          placeholder="Enter your response..."
          placeholderTextColor={COLORS.gray}
          value={value ?? ''}
          onChangeText={onValueChange}
          multiline
        />
      )}
      {(item.item_type === 'number') && (
        <TextInput
          style={[styles.textInput, styles.numberInput]}
          placeholder="Enter a number..."
          placeholderTextColor={COLORS.gray}
          value={value !== null && value !== undefined ? String(value) : ''}
          onChangeText={(t) => onValueChange(t === '' ? null : Number(t))}
          keyboardType="numeric"
        />
      )}
      {(item.item_type === 'photo_required') && (
        <View style={styles.photoPlaceholder}>
          <Text style={styles.photoText}>Photo upload required</Text>
          <TouchableOpacity
            style={styles.photoBtn}
            onPress={() => onValueChange('photo_uploaded')}>
            <Text style={styles.photoBtnText}>
              {value ? '✓ Photo attached' : 'Mark as attached'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Remarks field */}
      {item.allow_remarks && (
        <TextInput
          style={styles.remarksInput}
          placeholder="Add remarks (optional)..."
          placeholderTextColor={COLORS.gray}
          value={remarks}
          onChangeText={onRemarksChange}
        />
      )}
    </View>
  );
}

function ToggleGroup({
  options, value, onChange,
}: {
  options: { value: string; label: string; color: string; bg: string }[];
  value: any;
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.toggleBtn,
              { backgroundColor: selected ? opt.bg : COLORS.grayLight,
                borderColor: selected ? opt.color : COLORS.border },
            ]}
            onPress={() => onChange(opt.value)}
            activeOpacity={0.8}>
            <Text style={[styles.toggleText, { color: selected ? opt.color : COLORS.gray }]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function RatingInput({ value, onChange }: { value: any; onChange: (v: number) => void }) {
  const current = Number(value) || 0;
  return (
    <View style={styles.ratingRow}>
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity key={n} onPress={() => onChange(n)} activeOpacity={0.7}>
          <Star
            size={32}
            color={n <= current ? COLORS.warning : COLORS.border}
            fill={n <= current ? COLORS.warning : 'transparent'}
          />
        </TouchableOpacity>
      ))}
      {current > 0 && (
        <Text style={styles.ratingLabel}>{current}/5</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.beige },
  content: { padding: Spacing.three, gap: Spacing.two },

  headerCard: {
    backgroundColor: COLORS.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.three,
    gap: 10,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerType: { fontSize: 11, fontWeight: '700', color: COLORS.gray, letterSpacing: 0.5 },
  headerDue: { fontSize: 13, fontWeight: '600', color: COLORS.grayDark, marginTop: 2 },
  pctBubble: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.orangeLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pctNum: { fontSize: 14, fontWeight: '900', color: COLORS.orange },
  pctLbl: { fontSize: 9, fontWeight: '600', color: COLORS.orange },
  progressBg: {
    height: 6,
    backgroundColor: COLORS.grayLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: COLORS.orange, borderRadius: 3 },
  headerDesc: { fontSize: 13, color: COLORS.gray, lineHeight: 18 },

  itemCard: {
    backgroundColor: COLORS.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.three,
    gap: 10,
  },
  itemHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  numBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.orange,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  numBadgeDone: { backgroundColor: COLORS.success },
  numText: { fontSize: 12, fontWeight: '800', color: COLORS.white },
  itemTitleWrap: { flex: 1 },
  itemText: { fontSize: 14, fontWeight: '700', color: COLORS.grayDark, lineHeight: 20 },
  reqBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  reqText: { fontSize: 12, fontWeight: '900', color: '#92400E' },

  toggleRow: { flexDirection: 'row', gap: 8 },
  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: BorderRadius.medium,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  toggleText: { fontSize: 14, fontWeight: '700' },

  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ratingLabel: { fontSize: 13, fontWeight: '700', color: COLORS.warning, marginLeft: 4 },

  textInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BorderRadius.medium,
    padding: Spacing.two,
    fontSize: 14,
    color: COLORS.grayDark,
    minHeight: 72,
    textAlignVertical: 'top',
  },
  numberInput: { minHeight: 44, textAlignVertical: 'center' },

  photoPlaceholder: {
    backgroundColor: COLORS.grayLight,
    borderRadius: BorderRadius.medium,
    padding: Spacing.two,
    alignItems: 'center',
    gap: 8,
  },
  photoText: { fontSize: 13, color: COLORS.gray },
  photoBtn: {
    backgroundColor: COLORS.blue,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.medium,
  },
  photoBtnText: { color: COLORS.white, fontSize: 13, fontWeight: '700' },

  remarksInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BorderRadius.medium,
    padding: Spacing.two,
    fontSize: 13,
    color: COLORS.grayDark,
    minHeight: 40,
  },
  remarksCard: {
    backgroundColor: COLORS.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.three,
    gap: 8,
  },
  remarksLabel: { fontSize: 13, fontWeight: '700', color: COLORS.grayDark },

  doneWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.two,
  },
  doneTitle: { fontSize: 24, fontWeight: '900', color: COLORS.grayDark },
  doneSub: { fontSize: 14, color: COLORS.gray, textAlign: 'center', lineHeight: 22 },
  remarkBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: COLORS.blueLight,
    borderRadius: BorderRadius.medium,
    padding: Spacing.two,
    marginTop: 4,
  },
  remarkBannerText: { flex: 1, fontSize: 13, color: COLORS.blue, lineHeight: 18 },
  backBtn: {
    backgroundColor: COLORS.orange,
    borderRadius: BorderRadius.medium,
    paddingHorizontal: 32,
    paddingVertical: 14,
    marginTop: 8,
  },
  backBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '800' },
});
