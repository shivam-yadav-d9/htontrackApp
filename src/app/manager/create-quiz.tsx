import { router } from 'expo-router';
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ManagerPageHeader } from '@/components/ManagerPageHeader';
import { AppButton } from '@/components/ui/AppButton';
import { quizService } from '@/services/quiz.service';
import type {
  AssignScope,
  QuizOptionPayload,
  QuizPriority,
  QuizQuestionPayload,
} from '@/types/quiz.types';
import { BorderRadius, COLORS, Shadow, Spacing } from '@/constants/theme';

const PRIORITIES: QuizPriority[] = ['low', 'medium', 'high', 'urgent'];
const PRIORITY_COLORS: Record<QuizPriority, { bg: string; text: string }> = {
  urgent: { bg: '#FEE2E2', text: '#B91C1C' },
  high: { bg: '#FEF3C7', text: '#92400E' },
  medium: { bg: '#DBEAFE', text: '#1D4ED8' },
  low: { bg: '#F3F4F6', text: '#6B7280' },
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function makeOption(): QuizOptionPayload {
  return { id: uid(), text: '' };
}

function makeQuestion(): QuizQuestionPayload & { expanded: boolean } {
  return {
    id: uid(),
    question: '',
    question_type: 'single_choice',
    options: [makeOption(), makeOption()],
    correct_answer_ids: [],
    points: 1,
    explanation: '',
    expanded: true,
  };
}

export default function CreateQuizScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState<QuizPriority>('medium');
  const [durationMinutes, setDurationMinutes] = useState('15');
  const [passPercentage, setPassPercentage] = useState('60');
  const [dueDate, setDueDate] = useState('');
  const [assignScope, setAssignScope] = useState<AssignScope>('store');
  const [questions, setQuestions] = useState<
    (QuizQuestionPayload & { expanded: boolean })[]
  >([makeQuestion(), makeQuestion()]);
  const [submitting, setSubmitting] = useState(false);

  function updateQuestion(
    idx: number,
    patch: Partial<QuizQuestionPayload & { expanded: boolean }>
  ) {
    setQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, ...patch } : q))
    );
  }

  function addOption(qIdx: number) {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIdx ? { ...q, options: [...q.options, makeOption()] } : q
      )
    );
  }

  function removeOption(qIdx: number, optId: string) {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        return {
          ...q,
          options: q.options.filter((o) => o.id !== optId),
          correct_answer_ids: q.correct_answer_ids.filter((id) => id !== optId),
        };
      })
    );
  }

  function updateOption(qIdx: number, optId: string, text: string) {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        return {
          ...q,
          options: q.options.map((o) => (o.id === optId ? { ...o, text } : o)),
        };
      })
    );
  }

  function toggleCorrect(qIdx: number, optId: string, isSingle: boolean) {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const already = q.correct_answer_ids.includes(optId);
        let next: string[];
        if (isSingle) {
          next = already ? [] : [optId];
        } else {
          next = already
            ? q.correct_answer_ids.filter((id) => id !== optId)
            : [...q.correct_answer_ids, optId];
        }
        return { ...q, correct_answer_ids: next };
      })
    );
  }

  function addQuestion() {
    setQuestions((prev) => [...prev, makeQuestion()]);
  }

  function removeQuestion(idx: number) {
    if (questions.length <= 1) return;
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit() {
    if (!title.trim()) return Alert.alert('Error', 'Title is required');
    if (!description.trim()) return Alert.alert('Error', 'Description is required');
    for (const q of questions) {
      if (!q.question.trim()) return Alert.alert('Error', 'All questions need text');
      if (q.options.length < 2) return Alert.alert('Error', 'Each question needs at least 2 options');
      if (q.options.some((o) => !o.text.trim())) return Alert.alert('Error', 'All option fields must be filled');
      if (q.correct_answer_ids.length === 0) return Alert.alert('Error', 'Mark at least one correct answer per question');
    }
    setSubmitting(true);
    try {
      await quizService.createQuiz({
        title: title.trim(),
        description: description.trim(),
        instructions: instructions.trim() || undefined,
        category: category.trim() || undefined,
        priority,
        duration_minutes: parseInt(durationMinutes) || 15,
        pass_percentage: parseInt(passPercentage) || 60,
        due_date: dueDate.trim() || undefined,
        assign_scope: assignScope,
        assigned_to: [],
        questions: questions.map(({ expanded, ...q }) => ({
          ...q,
          explanation: q.explanation?.trim() || undefined,
        })),
      });
      Alert.alert('Quiz Created', 'Your quiz has been published to store staff.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create quiz');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ManagerPageHeader title="Create Quiz" showBack onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quiz Details</Text>
          <TextInput
            style={styles.input}
            placeholder="Quiz title *"
            placeholderTextColor={COLORS.gray}
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Description *"
            placeholderTextColor={COLORS.gray}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Instructions for staff (optional)"
            placeholderTextColor={COLORS.gray}
            value={instructions}
            onChangeText={setInstructions}
            multiline
            numberOfLines={2}
          />
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="Category (optional)"
              placeholderTextColor={COLORS.gray}
              value={category}
              onChangeText={setCategory}
            />
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="Due date YYYY-MM-DD"
              placeholderTextColor={COLORS.gray}
              value={dueDate}
              onChangeText={setDueDate}
            />
          </View>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="Duration (min)"
              placeholderTextColor={COLORS.gray}
              value={durationMinutes}
              onChangeText={setDurationMinutes}
              keyboardType="number-pad"
            />
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="Pass % (0-100)"
              placeholderTextColor={COLORS.gray}
              value={passPercentage}
              onChangeText={setPassPercentage}
              keyboardType="number-pad"
            />
          </View>
        </View>

        {/* Priority */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Priority</Text>
          <View style={styles.chipRow}>
            {PRIORITIES.map((p) => {
              const c = PRIORITY_COLORS[p];
              const sel = priority === p;
              return (
                <TouchableOpacity
                  key={p}
                  style={[styles.chip, { backgroundColor: sel ? c.bg : COLORS.grayLight, borderColor: sel ? c.text : COLORS.border, borderWidth: 1 }]}
                  onPress={() => setPriority(p)}
                  activeOpacity={0.8}>
                  <Text style={[styles.chipText, { color: sel ? c.text : COLORS.gray }]}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Assign Scope */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assign To</Text>
          <View style={styles.chipRow}>
            {(['store', 'individual'] as AssignScope[]).map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.chip, { backgroundColor: assignScope === s ? COLORS.blueLight : COLORS.grayLight, borderColor: assignScope === s ? COLORS.blue : COLORS.border, borderWidth: 1 }]}
                onPress={() => setAssignScope(s)}
                activeOpacity={0.8}>
                <Text style={[styles.chipText, { color: assignScope === s ? COLORS.blue : COLORS.gray }]}>
                  {s === 'store' ? 'All Store Staff' : 'Specific Staff'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Questions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Questions ({questions.length})</Text>
          </View>

          {questions.map((q, qIdx) => {
            const isSingle = q.question_type === 'single_choice' || q.question_type === 'true_false';
            return (
              <View key={q.id} style={styles.questionCard}>
                <TouchableOpacity
                  style={styles.questionHeader}
                  onPress={() => updateQuestion(qIdx, { expanded: !q.expanded })}
                  activeOpacity={0.8}>
                  <View style={styles.questionHeaderLeft}>
                    <View style={styles.qNumBadge}>
                      <Text style={styles.qNumText}>{qIdx + 1}</Text>
                    </View>
                    <Text style={styles.questionPreview} numberOfLines={1}>
                      {q.question.trim() || 'New question'}
                    </Text>
                  </View>
                  <View style={styles.questionHeaderRight}>
                    {questions.length > 1 && (
                      <TouchableOpacity onPress={() => removeQuestion(qIdx)} style={styles.deleteBtn}>
                        <Trash2 size={14} color={COLORS.error} />
                      </TouchableOpacity>
                    )}
                    {q.expanded ? (
                      <ChevronUp size={18} color={COLORS.gray} />
                    ) : (
                      <ChevronDown size={18} color={COLORS.gray} />
                    )}
                  </View>
                </TouchableOpacity>

                {q.expanded && (
                  <View style={styles.questionBody}>
                    <TextInput
                      style={[styles.input, styles.textarea]}
                      placeholder="Question text *"
                      placeholderTextColor={COLORS.gray}
                      value={q.question}
                      onChangeText={(t) => updateQuestion(qIdx, { question: t })}
                      multiline
                      numberOfLines={2}
                    />

                    <View style={styles.row}>
                      <View style={[styles.halfInput]}>
                        <Text style={styles.fieldLabel}>Type</Text>
                        <View style={styles.chipRowSmall}>
                          {(['single_choice', 'multiple_choice', 'true_false'] as const).map((qt) => (
                            <TouchableOpacity
                              key={qt}
                              style={[styles.chipSm, q.question_type === qt && styles.chipSmActive]}
                              onPress={() => updateQuestion(qIdx, { question_type: qt, correct_answer_ids: [] })}
                              activeOpacity={0.8}>
                              <Text style={[styles.chipSmText, q.question_type === qt && styles.chipSmTextActive]}>
                                {qt === 'single_choice' ? 'Single' : qt === 'multiple_choice' ? 'Multi' : 'T/F'}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                      <View style={styles.halfInput}>
                        <Text style={styles.fieldLabel}>Points</Text>
                        <TextInput
                          style={[styles.input, { marginBottom: 0 }]}
                          value={String(q.points ?? 1)}
                          onChangeText={(t) => updateQuestion(qIdx, { points: parseInt(t) || 1 })}
                          keyboardType="number-pad"
                        />
                      </View>
                    </View>

                    <Text style={styles.fieldLabel}>Options (tap circle to mark correct)</Text>
                    {q.options.map((opt, oIdx) => {
                      const isCorrect = q.correct_answer_ids.includes(opt.id);
                      return (
                        <View key={opt.id} style={styles.optionRow}>
                          <TouchableOpacity
                            style={[styles.optionDot, isCorrect && styles.optionDotCorrect]}
                            onPress={() => toggleCorrect(qIdx, opt.id, isSingle)}>
                            {isCorrect && <CheckCircle2 size={16} color={COLORS.success} />}
                          </TouchableOpacity>
                          <TextInput
                            style={[styles.input, styles.optionInput]}
                            placeholder={`Option ${oIdx + 1}`}
                            placeholderTextColor={COLORS.gray}
                            value={opt.text}
                            onChangeText={(t) => updateOption(qIdx, opt.id, t)}
                          />
                          {q.options.length > 2 && (
                            <TouchableOpacity onPress={() => removeOption(qIdx, opt.id)}>
                              <Trash2 size={14} color={COLORS.error} />
                            </TouchableOpacity>
                          )}
                        </View>
                      );
                    })}
                    {q.options.length < 6 && (
                      <TouchableOpacity style={styles.addOptionBtn} onPress={() => addOption(qIdx)}>
                        <Plus size={13} color={COLORS.blue} />
                        <Text style={styles.addOptionText}>Add option</Text>
                      </TouchableOpacity>
                    )}

                    <TextInput
                      style={styles.input}
                      placeholder="Explanation (shown after attempt, optional)"
                      placeholderTextColor={COLORS.gray}
                      value={q.explanation ?? ''}
                      onChangeText={(t) => updateQuestion(qIdx, { explanation: t })}
                    />
                  </View>
                )}
              </View>
            );
          })}

          <TouchableOpacity style={styles.addQuestionBtn} onPress={addQuestion}>
            <Plus size={16} color={COLORS.orange} />
            <Text style={styles.addQuestionText}>Add Question</Text>
          </TouchableOpacity>
        </View>

        <AppButton
          label="Publish Quiz"
          onPress={handleSubmit}
          loading={submitting}
          icon={<BookOpen size={16} color={COLORS.white} />}
        />
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.beige },
  content: { padding: Spacing.three, gap: Spacing.three },
  section: {
    backgroundColor: COLORS.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.three,
    gap: Spacing.two,
    ...Shadow.card,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.grayDark },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BorderRadius.medium,
    padding: Spacing.two,
    fontSize: 14,
    color: COLORS.grayDark,
    backgroundColor: COLORS.white,
    marginBottom: 0,
  },
  textarea: { minHeight: 60, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: Spacing.two },
  halfInput: { flex: 1 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  chipText: { fontSize: 12, fontWeight: '600' },
  fieldLabel: { fontSize: 12, color: COLORS.gray, fontWeight: '600', marginBottom: 4 },
  chipRowSmall: { flexDirection: 'row', gap: 4 },
  chipSm: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: COLORS.grayLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipSmActive: { backgroundColor: COLORS.blueLight, borderColor: COLORS.blue },
  chipSmText: { fontSize: 11, color: COLORS.gray, fontWeight: '600' },
  chipSmTextActive: { color: COLORS.blue },
  questionCard: {
    backgroundColor: COLORS.beigeLight,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.two,
    backgroundColor: COLORS.white,
  },
  questionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one, flex: 1 },
  questionHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  qNumBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qNumText: { fontSize: 11, fontWeight: '800', color: COLORS.white },
  questionPreview: { fontSize: 13, color: COLORS.grayDark, flex: 1 },
  deleteBtn: { padding: 4 },
  questionBody: { padding: Spacing.two, gap: Spacing.two },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  optionDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionDotCorrect: { borderColor: COLORS.success },
  optionInput: { flex: 1, marginBottom: 0 },
  addOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  addOptionText: { fontSize: 12, color: COLORS.blue, fontWeight: '600' },
  addQuestionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    padding: Spacing.two,
    borderRadius: BorderRadius.medium,
    borderWidth: 1.5,
    borderColor: COLORS.orange,
    borderStyle: 'dashed',
  },
  addQuestionText: { fontSize: 14, fontWeight: '700', color: COLORS.orange },
});
