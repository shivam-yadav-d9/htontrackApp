import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, ChevronLeft, ChevronRight, Send } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS, BorderRadius, Spacing, Shadow } from '@/constants/theme';
import { courseService } from '@/services/course.service';

type Question = {
  id: string;
  question: string;
  options: string[];
  marks?: number;
  difficulty?: string;
};

export default function CourseAssessmentScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!courseId || courseId === 'undefined') return;
    setLoading(true);
    try {
      const course = await courseService.getStaffCourseLMS(courseId);
      const qs: Question[] = ((course as any).questions ?? []).filter(
        (q: any) => q.status === 'active' || !q.status,
      );
      if (qs.length === 0) {
        Alert.alert('No Questions', 'This course has no assessment questions yet.', [
          { text: 'Go Back', onPress: () => router.back() },
        ]);
        return;
      }
      setQuestions(qs);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to load', [
        { text: 'Go Back', onPress: () => router.back() },
      ]);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => { load(); }, [load]);

  function selectOption(questionId: string, option: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  }

  function handleSubmit() {
    const unanswered = questions.filter((q) => !answers[q.id]);
    if (unanswered.length > 0) {
      Alert.alert(
        'Incomplete',
        `You have ${unanswered.length} unanswered question(s). Submit anyway?`,
        [
          { text: 'Review', style: 'cancel' },
          { text: 'Submit', style: 'destructive', onPress: doSubmit },
        ],
      );
      return;
    }
    Alert.alert(
      'Submit Assessment',
      'Are you sure you want to submit? You cannot change answers after submission.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Submit', onPress: doSubmit },
      ],
    );
  }

  async function doSubmit() {
    setSubmitting(true);
    try {
      const payload = questions.map((q) => ({
        question_id: q.id,
        selected_answer: answers[q.id] ?? '',
      }));
      await courseService.submitAssessment(courseId, payload);
      router.replace({ pathname: '/staff/course-result', params: { courseId } });
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={20} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Assessment</Text>
        </View>
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.orange} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!loading && questions.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={20} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Assessment</Text>
        </View>
        <View style={styles.center}>
          <Text style={{ color: COLORS.gray, fontSize: 15 }}>No questions available.</Text>
          <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16, padding: 12 }}>
            <Text style={{ color: COLORS.orange, fontWeight: '700' }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const total = questions.length;
  const answered = Object.keys(answers).length;
  const question = questions[currentIdx];
  const selected = answers[question?.id] ?? null;

  if (!question) return null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color={COLORS.white} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Assessment</Text>
          <Text style={styles.headerSub}>{answered}/{total} answered</Text>
        </View>
      </View>

      {/* Question dots */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dotsRow} contentContainerStyle={styles.dotsContent}>
        {questions.map((q, i) => (
          <TouchableOpacity
            key={q.id}
            onPress={() => setCurrentIdx(i)}
            style={[
              styles.dot,
              answers[q.id] ? styles.dotAnswered : styles.dotUnanswered,
              i === currentIdx && styles.dotActive,
            ]}>
            <Text style={[styles.dotText, i === currentIdx && { color: COLORS.white }]}>{i + 1}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Question card */}
        <View style={[styles.questionCard, Shadow.card]}>
          <View style={styles.questionMeta}>
            <Text style={styles.questionNum}>Q{currentIdx + 1}</Text>
            {question.difficulty && (
              <View style={[
                styles.diffBadge,
                { backgroundColor: question.difficulty === 'easy' ? COLORS.success + '22' : COLORS.warning + '22' },
              ]}>
                <Text style={[
                  styles.diffText,
                  { color: question.difficulty === 'easy' ? COLORS.success : COLORS.warning },
                ]}>
                  {question.difficulty}
                </Text>
              </View>
            )}
            {question.marks && (
              <Text style={styles.marksText}>{question.marks} mark{question.marks > 1 ? 's' : ''}</Text>
            )}
          </View>
          <Text style={styles.questionText}>{question.question}</Text>
        </View>

        {/* Options */}
        {(question.options ?? []).map((option, oi) => {
          const isSelected = selected === option;
          return (
            <TouchableOpacity
              key={oi}
              style={[styles.optionRow, isSelected && styles.optionSelected]}
              onPress={() => selectOption(question.id, option)}>
              <View style={[styles.optionRadio, isSelected && styles.optionRadioSelected]}>
                {isSelected && <View style={styles.optionRadioInner} />}
              </View>
              <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                {option}
              </Text>
            </TouchableOpacity>
          );
        })}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Bottom nav */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={[styles.navBtn, currentIdx === 0 && styles.navBtnDisabled]}
          onPress={() => setCurrentIdx((i) => Math.max(0, i - 1))}
          disabled={currentIdx === 0}>
          <ChevronLeft size={18} color={currentIdx === 0 ? COLORS.border : COLORS.orange} />
          <Text style={[styles.navText, currentIdx === 0 && { color: COLORS.border }]}>Prev</Text>
        </TouchableOpacity>

        {currentIdx < total - 1 ? (
          <TouchableOpacity
            style={styles.navBtnNext}
            onPress={() => setCurrentIdx((i) => Math.min(total - 1, i + 1))}>
            <Text style={styles.navBtnNextText}>Next</Text>
            <ChevronRight size={18} color={COLORS.white} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.navBtnNext, { backgroundColor: COLORS.success }]}
            onPress={handleSubmit}
            disabled={submitting}>
            {submitting
              ? <ActivityIndicator color={COLORS.white} />
              : <>
                  <Send size={16} color={COLORS.white} />
                  <Text style={styles.navBtnNextText}>Submit</Text>
                </>
            }
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.beige },
  header: {
    backgroundColor: COLORS.blue,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    gap: Spacing.two,
  },
  backBtn: { padding: 4, marginTop: 2 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: COLORS.white },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  dotsRow: { maxHeight: 56, borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: COLORS.white },
  dotsContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.two, paddingVertical: 10, gap: 6 },
  dot: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  dotAnswered: { backgroundColor: COLORS.success + '22', borderColor: COLORS.success },
  dotUnanswered: { backgroundColor: COLORS.beigeLight, borderColor: COLORS.border },
  dotActive: { backgroundColor: COLORS.orange, borderColor: COLORS.orange },
  dotText: { fontSize: 12, fontWeight: '700', color: COLORS.grayDark },

  content: { padding: Spacing.three, gap: Spacing.two, paddingBottom: 20 },

  questionCard: {
    backgroundColor: COLORS.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  questionMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, flexWrap: 'wrap' },
  questionNum: { fontSize: 12, fontWeight: '900', color: COLORS.orange, textTransform: 'uppercase', letterSpacing: 1 },
  diffBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  diffText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  marksText: { fontSize: 12, color: COLORS.gray },
  questionText: { fontSize: 15, fontWeight: '700', color: COLORS.grayDark, lineHeight: 22 },

  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: COLORS.white,
    borderRadius: BorderRadius.medium,
    padding: Spacing.two,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  optionSelected: {
    borderColor: COLORS.orange,
    backgroundColor: COLORS.orangeLight,
  },
  optionRadio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
  },
  optionRadioSelected: { borderColor: COLORS.orange },
  optionRadioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.orange },
  optionText: { flex: 1, fontSize: 14, color: COLORS.grayDark, lineHeight: 20 },
  optionTextSelected: { color: COLORS.orangeDark, fontWeight: '700' },

  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.white,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    gap: Spacing.two,
  },
  navBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 8 },
  navBtnDisabled: { opacity: 0.4 },
  navText: { fontSize: 13, fontWeight: '700', color: COLORS.orange },
  navBtnNext: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.orange,
    borderRadius: BorderRadius.medium,
    paddingVertical: 12,
  },
  navBtnNextText: { color: COLORS.white, fontWeight: '800', fontSize: 14 },
});
