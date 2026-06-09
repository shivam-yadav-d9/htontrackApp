import { storage } from "@/utils/storage";
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, ChevronLeft, ChevronRight, Send } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS, BorderRadius, Spacing, Shadow } from '@/constants/theme';
import { lmsService } from '@/services/lms.service';

type Question = {
  _id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  marks: number;
};

export default function CourseAssessmentScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [savingAnswer, setSavingAnswer] = useState(false);

  // Hold the attemptId for the entire session
  const attemptIdRef = useRef<string | null>(null);

  const load = useCallback(async () => {
    if (!courseId || courseId === 'undefined') return;

    setLoading(true);
    try {
      // 1. Fetch questions
      const fetchedQuestions = await lmsService.getCourseQuestions(courseId);
      setQuestions(
        Array.isArray(fetchedQuestions)
          ? fetchedQuestions
          : fetchedQuestions?.data || []
      );
      // 2. Start attempt — get employeeId from AsyncStorage
      const raw = await storage.getItem("karmyogi_user");

      console.log("RAW USER =>", raw);

      const user = raw ? JSON.parse(raw) : null;

      console.log("PARSED USER =>", user);

      const employeeId =
        user?._id ||
        user?.id ||
        user?.employeeId;
      console.log("USER OBJECT =>", user);
      console.log("EMPLOYEE ID =>", employeeId);

      if (!employeeId) {
        Alert.alert(
          "Error",
          "User session not found. Please log in again."
        );

        router.replace("/auth/login");
        return;
      }

      const attempt = await lmsService.startAttempt(
        courseId,
        employeeId
      );

      console.log("ATTEMPT RESPONSE", attempt);

      attemptIdRef.current = attempt?.data?._id || attempt?._id;
    } catch (err) {
      Alert.alert(
        'Error',
        err instanceof Error ? err.message : 'Failed to load assessment',
      );
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => { load(); }, [load]);

  // Select an option — save answer to API immediately
  async function selectOption(questionId: string, optionIndex: number) {
    // Optimistically update UI
    setAnswers(prev => ({ ...prev, [questionId]: optionIndex }));

    const attemptId = attemptIdRef.current;
    if (!attemptId) return;

    setSavingAnswer(true);
    try {
      await lmsService.saveAnswer(attemptId, questionId, optionIndex);
    } catch (err) {
      // Non-blocking — answer is still tracked locally
      console.warn('Failed to save answer remotely:', err);
    } finally {
      setSavingAnswer(false);
    }
  }

  function handleSubmit() {
    const unanswered = questions.filter(q => answers[q._id] === undefined);

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
    const attemptId = attemptIdRef.current;

    if (!attemptId) {
      Alert.alert(
        "Error",
        "Attempt session missing. Please restart the assessment."
      );
      return;
    }

    setSubmitting(true);

    try {
      const response = await lmsService.submitAttempt(
        attemptId
      );

      const result =
        response?.data || response;

      Alert.alert(
        "Success",
        "Assessment Submitted Successfully"
      );

      router.replace({
        pathname: "/staff/course-result",
        params: {
          courseId,
          percentage: String(
            result?.percentage || 0
          ),
          passed: String(
            result?.passed || false
          ),
          obtainedMarks: String(
            result?.obtainedMarks || 0
          ),
          totalMarks: String(
            result?.totalMarks || 0
          ),
        },
      });
    } catch (err) {
      Alert.alert(
        "Error",
        err instanceof Error
          ? err.message
          : "Submission failed"
      );
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Loading state ────────────────────────────────────────────────────────
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

  // ─── No questions ─────────────────────────────────────────────────────────
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
  const selected = answers[question?._id];
  if (!question) return null;

  // ─── Main UI ──────────────────────────────────────────────────────────────
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
        {/* Subtle saving indicator */}
        {savingAnswer && (
          <ActivityIndicator size="small" color="rgba(255,255,255,0.7)" style={{ marginRight: 4 }} />
        )}
      </View>

      {/* Question dots */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.dotsRow}
        contentContainerStyle={styles.dotsContent}
      >
        {questions.map((q, i) => (
          <TouchableOpacity
            key={q._id}
            onPress={() => setCurrentIdx(i)}
            style={[
              styles.dot,
              answers[q._id] !== undefined ? styles.dotAnswered : styles.dotUnanswered,
              i === currentIdx && styles.dotActive,
            ]}
          >
            <Text style={[styles.dotText, i === currentIdx && { color: COLORS.white }]}>
              {i + 1}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Question card */}
        <View style={[styles.questionCard, Shadow.card]}>
          <View style={styles.questionMeta}>
            <Text style={styles.questionNum}>Q{currentIdx + 1}</Text>
            {question.marks && (
              <Text style={styles.marksText}>
                {question.marks} mark{question.marks > 1 ? 's' : ''}
              </Text>
            )}
          </View>
          <Text style={styles.questionText}>{question.question}</Text>
        </View>

        {/* Options */}
        {(question.options ?? []).map((option, oi) => {
          const isSelected = selected === oi;
          return (
            <TouchableOpacity
              key={oi}
              style={[styles.optionRow, isSelected && styles.optionSelected]}
              onPress={() => selectOption(question._id, oi)}
              disabled={savingAnswer}
            >
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
          onPress={() => setCurrentIdx(i => Math.max(0, i - 1))}
          disabled={currentIdx === 0}
        >
          <ChevronLeft size={18} color={currentIdx === 0 ? COLORS.border : COLORS.orange} />
          <Text style={[styles.navText, currentIdx === 0 && { color: COLORS.border }]}>Prev</Text>
        </TouchableOpacity>

        {currentIdx < total - 1 ? (
          <TouchableOpacity
            style={styles.navBtnNext}
            onPress={() => setCurrentIdx(i => Math.min(total - 1, i + 1))}
          >
            <Text style={styles.navBtnNextText}>Next</Text>
            <ChevronRight size={18} color={COLORS.white} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.navBtnNext, { backgroundColor: COLORS.success }]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Send size={16} color={COLORS.white} />
                <Text style={styles.navBtnNextText}>Submit</Text>
              </>
            )}
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

  dotsRow: {
    maxHeight: 56,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  dotsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.two,
    paddingVertical: 10,
    gap: 6,
  },
  dot: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1.5,
  },
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
  questionNum: {
    fontSize: 12, fontWeight: '900', color: COLORS.orange,
    textTransform: 'uppercase', letterSpacing: 1,
  },
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