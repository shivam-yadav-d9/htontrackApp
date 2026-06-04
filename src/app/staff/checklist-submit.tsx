import { router, useLocalSearchParams } from 'expo-router';
import { CheckCircle2 } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ManagerPageHeader } from '@/components/ManagerPageHeader';
import { AppButton } from '@/components/ui/AppButton';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { checklistService } from '@/services/checklist.service';
import type { Checklist, ChecklistAnswer, ChecklistItem } from '@/types/checklist.types';
import { BorderRadius, COLORS, Shadow, Spacing } from '@/constants/theme';

const ANSWER_OPTIONS: { value: ChecklistAnswer; label: string; color: string; bg: string }[] = [
  { value: 'yes', label: 'Yes', color: '#166534', bg: '#DCFCE7' },
  { value: 'no', label: 'No', color: '#B91C1C', bg: '#FEE2E2' },
  { value: 'na', label: 'N/A', color: '#6B7280', bg: '#F3F4F6' },
];

type ItemAnswerState = {
  answer: ChecklistAnswer | null;
  remarks: string;
};

export default function ChecklistSubmitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [answers, setAnswers] = useState<Record<string, ItemAnswerState>>({});
  const [overallRemarks, setOverallRemarks] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const load = useCallback(async () => {
    if (!id || id === 'undefined') return;
    setLoading(true);
    setError('');
    try {
      const data = await checklistService.getChecklist(id);
      setChecklist(data);
      const initial: Record<string, ItemAnswerState> = {};
      for (const item of data.items) {
        initial[item.id] = { answer: null, remarks: '' };
      }
      setAnswers(initial);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load checklist');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  function setAnswer(itemId: string, answer: ChecklistAnswer) {
    setAnswers((prev) => ({ ...prev, [itemId]: { ...prev[itemId], answer } }));
  }

  function setRemarks(itemId: string, remarks: string) {
    setAnswers((prev) => ({ ...prev, [itemId]: { ...prev[itemId], remarks } }));
  }

  async function handleSubmit() {
    if (!checklist) return;

    const requiredItems = checklist.items.filter((it) => it.is_required);
    const unanswered = requiredItems.filter((it) => !answers[it.id]?.answer);
    if (unanswered.length > 0) {
      return Alert.alert('Incomplete', `Please answer all required items (${unanswered.length} remaining)`);
    }

    const responses = checklist.items
      .filter((it) => answers[it.id]?.answer)
      .map((it) => ({
        item_id: it.id,
        answer: answers[it.id].answer as ChecklistAnswer,
        remarks: answers[it.id].remarks || undefined,
      }));

    setSubmitting(true);
    try {
      await checklistService.submitChecklist(id, {
        responses,
        overall_remarks: overallRemarks.trim() || undefined,
      });
      setSubmitted(true);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to submit checklist');
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
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ManagerPageHeader title="Checklist" showBack onBack={() => router.back()} />
        <View style={styles.successState}>
          <CheckCircle2 size={56} color={COLORS.success} />
          <Text style={styles.successTitle}>Checklist Submitted!</Text>
          <Text style={styles.successSub}>
            Your responses have been recorded successfully.
          </Text>
          <TouchableOpacity style={styles.doneBtn} onPress={() => router.back()}>
            <Text style={styles.doneBtnText}>Back to Checklists</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const requiredCount = checklist!.items.filter((it) => it.is_required).length;
  const answeredCount = Object.values(answers).filter((a) => a.answer !== null).length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ManagerPageHeader
        title={checklist!.title}
        showBack
        onBack={() => router.back()}
      />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Progress */}
        <View style={styles.progressCard}>
          <View style={styles.progressInfo}>
            <Text style={styles.progressLabel}>Progress</Text>
            <Text style={styles.progressCount}>
              {answeredCount} / {checklist!.items.length} answered
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[
              styles.progressFill,
              { width: `${checklist!.items.length > 0 ? (answeredCount / checklist!.items.length) * 100 : 0}%` as any },
            ]} />
          </View>
          {checklist!.description && (
            <Text style={styles.clDesc}>{checklist!.description}</Text>
          )}
        </View>

        {/* Items */}
        {checklist!.items.map((item, idx) => {
          const state = answers[item.id];
          return (
            <View key={item.id} style={[styles.itemCard, Shadow.card]}>
              <View style={styles.itemHeader}>
                <View style={styles.itemNumBadge}>
                  <Text style={styles.itemNumText}>{idx + 1}</Text>
                </View>
                <View style={styles.itemTitleBlock}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  {item.description ? (
                    <Text style={styles.itemDesc}>{item.description}</Text>
                  ) : null}
                </View>
                {item.is_required && (
                  <View style={styles.reqBadge}>
                    <Text style={styles.reqBadgeText}>Required</Text>
                  </View>
                )}
              </View>

              <View style={styles.answerRow}>
                {ANSWER_OPTIONS.map((opt) => {
                  const selected = state?.answer === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[
                        styles.answerBtn,
                        { backgroundColor: selected ? opt.bg : COLORS.grayLight,
                          borderColor: selected ? opt.color : COLORS.border },
                      ]}
                      onPress={() => setAnswer(item.id, opt.value)}
                      activeOpacity={0.8}>
                      <Text style={[styles.answerBtnText, { color: selected ? opt.color : COLORS.gray }]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {state?.answer === 'no' && (
                <TextInput
                  style={styles.remarksInput}
                  placeholder="Describe the issue..."
                  placeholderTextColor={COLORS.gray}
                  value={state.remarks}
                  onChangeText={(t) => setRemarks(item.id, t)}
                  multiline
                />
              )}
            </View>
          );
        })}

        {/* Overall Remarks */}
        <View style={styles.remarksCard}>
          <Text style={styles.remarksLabel}>Overall Remarks (optional)</Text>
          <TextInput
            style={styles.remarksInput}
            placeholder="Any general notes or observations..."
            placeholderTextColor={COLORS.gray}
            value={overallRemarks}
            onChangeText={setOverallRemarks}
            multiline
            numberOfLines={3}
          />
        </View>

        <AppButton
          label="Submit Checklist"
          onPress={handleSubmit}
          loading={submitting}
        />
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.beige },
  content: { padding: Spacing.three, gap: Spacing.two },
  progressCard: {
    backgroundColor: COLORS.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.three,
    gap: Spacing.one,
    ...Shadow.card,
  },
  progressInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { fontSize: 13, fontWeight: '600', color: COLORS.gray },
  progressCount: { fontSize: 13, fontWeight: '700', color: COLORS.orange },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.grayLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: COLORS.orange, borderRadius: 3 },
  clDesc: { fontSize: 13, color: COLORS.gray, lineHeight: 18 },
  itemCard: {
    backgroundColor: COLORS.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  itemHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.one },
  itemNumBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.orange,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  itemNumText: { fontSize: 11, fontWeight: '800', color: COLORS.white },
  itemTitleBlock: { flex: 1, gap: 2 },
  itemTitle: { fontSize: 14, fontWeight: '700', color: COLORS.grayDark },
  itemDesc: { fontSize: 12, color: COLORS.gray },
  reqBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
  },
  reqBadgeText: { fontSize: 9, fontWeight: '700', color: '#92400E' },
  answerRow: { flexDirection: 'row', gap: Spacing.one },
  answerBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: BorderRadius.medium,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  answerBtnText: { fontSize: 13, fontWeight: '700' },
  remarksInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BorderRadius.medium,
    padding: Spacing.two,
    fontSize: 13,
    color: COLORS.grayDark,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  remarksCard: {
    backgroundColor: COLORS.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.three,
    gap: Spacing.one,
    ...Shadow.card,
  },
  remarksLabel: { fontSize: 13, fontWeight: '700', color: COLORS.grayDark },
  successState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.two,
  },
  successTitle: { fontSize: 22, fontWeight: '900', color: COLORS.grayDark },
  successSub: { fontSize: 14, color: COLORS.gray, textAlign: 'center', lineHeight: 20 },
  doneBtn: {
    backgroundColor: COLORS.orange,
    borderRadius: BorderRadius.medium,
    paddingHorizontal: 32,
    paddingVertical: 14,
    marginTop: 8,
  },
  doneBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '800' },
});
