import { router, useLocalSearchParams } from 'expo-router';
import {
  Award,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ConfirmationModal } from '@/components/forms';

import { StaffPageHeader } from '@/components/StaffPageHeader';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { quizService } from '@/services/quiz.service';
import type { Quiz, QuizAttempt, QuizQuestion } from '@/types/quiz.types';
import { BorderRadius, COLORS, Shadow, Spacing } from '@/constants/theme';

type Phase = 'intro' | 'attempt' | 'result';

function getLabel(opt: { text?: string; option_text?: string }) {
  return opt.text ?? opt.option_text ?? '';
}

function getQuestion(q: QuizQuestion) {
  return q.question ?? q.question_text ?? '';
}

function getPoints(q: QuizQuestion) {
  return q.points ?? q.marks ?? 1;
}

function formatTime(s: number) {
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
}

export default function QuizAttemptScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loadingQuiz, setLoadingQuiz] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [quiz, setQuiz] = useState<Quiz | null>(null);

  const [phase, setPhase] = useState<Phase>('intro');
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [showIncompleteModal, setShowIncompleteModal] = useState(false);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoadingQuiz(true);
      try {
        const data = await quizService.getStaffQuiz(id);
        setQuiz(data);
        if (data.attempt) {
          setAttempt(data.attempt);
          setPhase('result');
        }
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'Failed to load quiz');
      } finally {
        setLoadingQuiz(false);
      }
    })();
  }, [id]);

  async function handleSubmit() {
    if (!quiz || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setSubmitError('');
    try {
      const result = await quizService.submitAttempt(quiz.id, { answers });
      setAttempt(result);
      setPhase('result');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not submit quiz. Please try again.');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  useEffect(() => {
    if (phase !== 'attempt' || !quiz) return;
    if (timeLeft <= 0) {
      if (!submittingRef.current) handleSubmit();
      return;
    }
    const t = setInterval(() => setTimeLeft((n) => n - 1), 1000);
    return () => clearInterval(t);
  }, [phase, timeLeft, quiz]);

  function beginAttempt() {
    if (!quiz) return;
    setCurrentQ(0);
    setAnswers({});
    const dur = quiz.duration_minutes ?? quiz.time_limit_minutes ?? 15;
    setTimeLeft(dur * 60);
    submittingRef.current = false;
    setPhase('attempt');
  }

  function toggleAnswer(qId: string, optId: string, isSingle: boolean) {
    setAnswers((prev) => {
      const current = prev[qId] ?? [];
      if (isSingle) {
        return { ...prev, [qId]: [optId] };
      }
      const has = current.includes(optId);
      return { ...prev, [qId]: has ? current.filter((x) => x !== optId) : [...current, optId] };
    });
  }

  async function confirmSubmit() {
    const answered = Object.keys(answers).length;
    const total = quiz?.questions.length ?? 0;
    if (answered < total) {
      setShowIncompleteModal(true);
    } else {
      await handleSubmit();
    }
  }

  if (loadingQuiz) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <StaffPageHeader title="Quiz" showBack onBack={() => router.back()} />
        <LoadingState message="Loading quiz..." />
      </SafeAreaView>
    );
  }

  if (loadError || !quiz) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <StaffPageHeader title="Quiz" showBack onBack={() => router.back()} />
        <ErrorState message={loadError || 'Quiz not found'} onRetry={() => router.back()} />
      </SafeAreaView>
    );
  }

  // INTRO
  if (phase === 'intro') {
    const dur = quiz.duration_minutes ?? quiz.time_limit_minutes ?? 15;
    const pass = quiz.pass_percentage ?? quiz.passing_score ?? 60;
    const total = quiz.total_questions ?? quiz.questions.length;
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <StaffPageHeader title={quiz.title} showBack onBack={() => router.back()} />
        <ScrollView contentContainerStyle={styles.content}>
          {quiz.instructions ? (
            <AppCard style={styles.instructionsCard}>
              <Text style={styles.instructionsLabel}>Instructions</Text>
              <Text style={styles.instructionsText}>{quiz.instructions}</Text>
            </AppCard>
          ) : null}
          <AppCard style={styles.introCard}>
            <Text style={styles.introDesc}>{quiz.description}</Text>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statVal}>{dur}</Text>
                <Text style={styles.statLbl}>Minutes</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statVal}>{total}</Text>
                <Text style={styles.statLbl}>Questions</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statVal}>{pass}%</Text>
                <Text style={styles.statLbl}>Pass Mark</Text>
              </View>
              {quiz.total_points ? (
                <View style={styles.statBox}>
                  <Text style={styles.statVal}>{quiz.total_points}</Text>
                  <Text style={styles.statLbl}>Total Points</Text>
                </View>
              ) : null}
            </View>
            <View style={styles.rulesBox}>
              <Text style={styles.ruleText}>• Timer starts when you begin</Text>
              <Text style={styles.ruleText}>• You can navigate between questions</Text>
              <Text style={styles.ruleText}>• Submit before time runs out</Text>
              <Text style={styles.ruleText}>• Only one attempt allowed</Text>
            </View>
            {quiz.due_date ? (
              <Text style={styles.dueText}>Due: {quiz.due_date}</Text>
            ) : null}
            <AppButton label="Start Quiz" onPress={beginAttempt} />
          </AppCard>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ATTEMPT
  if (phase === 'attempt') {
    const question = quiz.questions[currentQ];
    const qId = question.id;
    const qText = getQuestion(question);
    const pts = getPoints(question);
    const isSingle =
      question.question_type === 'single_choice' ||
      question.question_type === 'true_false';
    const selectedIds = answers[qId] ?? [];
    const progress = ((currentQ + 1) / quiz.questions.length) * 100;

    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.quizNav}>
          <Text style={styles.qProgress}>
            {currentQ + 1} / {quiz.questions.length}
          </Text>
          <Text style={[styles.timerText, timeLeft < 60 && { color: COLORS.error }]}>
            <Clock size={13} color={timeLeft < 60 ? COLORS.error : COLORS.white} />
            {' '}{formatTime(timeLeft)}
          </Text>
        </View>
        <ProgressBar value={progress} height={4} color={COLORS.orange} />
        <ScrollView contentContainerStyle={styles.content}>
          <AppCard style={styles.questionCard}>
            <View style={styles.questionTopRow}>
              <View style={styles.ptsBadge}>
                <Text style={styles.ptsBadgeText}>{pts} pt{pts !== 1 ? 's' : ''}</Text>
              </View>
              {!isSingle && (
                <Text style={styles.multiHint}>Select all that apply</Text>
              )}
            </View>
            <Text style={styles.questionText}>{qText}</Text>
          </AppCard>

          <View style={styles.optionsList}>
            {question.options.map((opt) => {
              const isSelected = selectedIds.includes(opt.id);
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[styles.optionBtn, isSelected && styles.optionBtnSelected]}
                  onPress={() => toggleAnswer(qId, opt.id, isSingle)}
                  activeOpacity={0.8}>
                  <View style={[styles.optionIndicator, isSelected && styles.optionIndicatorSelected]}>
                    {isSelected && <CheckCircle2 size={14} color={COLORS.white} />}
                  </View>
                  <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                    {getLabel(opt)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.navBtns}>
            {currentQ > 0 && (
              <AppButton
                label="← Prev"
                onPress={() => setCurrentQ((n) => n - 1)}
                variant="outline"
                fullWidth={false}
                size="sm"
              />
            )}
            {currentQ < quiz.questions.length - 1 ? (
              <AppButton
                label="Next →"
                onPress={() => setCurrentQ((n) => n + 1)}
                variant="secondary"
                fullWidth={false}
                size="sm"
              />
            ) : (
              <AppButton
                label="Submit Quiz"
                onPress={confirmSubmit}
                loading={submitting}
                fullWidth={false}
                size="sm"
              />
            )}
          </View>

          {submitError ? (
            <View style={styles.submitErrorBox}>
              <Text style={styles.submitErrorText}>{submitError}</Text>
            </View>
          ) : null}
        </ScrollView>

        <ConfirmationModal
          visible={showIncompleteModal}
          title="Submit Incomplete Quiz?"
          message={`You've answered ${Object.keys(answers).length} of ${quiz.questions.length} questions. Unanswered questions will score 0.`}
          confirmLabel="Submit Anyway"
          cancelLabel="Keep Answering"
          variant="warning"
          onConfirm={() => { setShowIncompleteModal(false); handleSubmit(); }}
          onCancel={() => setShowIncompleteModal(false)}
        />
      </SafeAreaView>
    );
  }

  // RESULT
  const passed = attempt?.passed ?? false;
  const pct = attempt?.percentage ?? 0;
  const earnedPts = attempt?.earned_points;
  const totalPts = attempt?.total_points;
  const pass = quiz.pass_percentage ?? quiz.passing_score ?? 60;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StaffPageHeader title="Quiz Result" showBack onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        <AppCard style={styles.resultCard}>
          {passed ? (
            <CheckCircle2 size={56} color={COLORS.success} />
          ) : (
            <XCircle size={56} color={COLORS.error} />
          )}
          <Text style={[styles.resultTitle, { color: passed ? COLORS.success : COLORS.error }]}>
            {passed ? 'Congratulations!' : 'Not Passed'}
          </Text>
          <Text style={styles.resultQuizTitle}>{quiz.title}</Text>

          <View style={[styles.scoreCircle, { borderColor: passed ? COLORS.success : COLORS.error }]}>
            <Text style={[styles.scorePct, { color: passed ? COLORS.success : COLORS.error }]}>{pct}%</Text>
            {earnedPts != null && totalPts != null && (
              <Text style={styles.scoreDetail}>{earnedPts} / {totalPts} pts</Text>
            )}
          </View>

          <Text style={styles.passNote}>Passing mark: {pass}%</Text>

          {passed && (
            <View style={styles.certBanner}>
              <Award size={18} color={COLORS.warning} />
              <Text style={styles.certBannerText}>Certificate available in Certificates tab</Text>
            </View>
          )}

          {attempt?.breakdown && attempt.breakdown.length > 0 && (
            <View style={styles.breakdownSection}>
              <Text style={styles.breakdownTitle}>Answer Review</Text>
              {attempt.breakdown.map((b, i) => (
                <View key={b.question_id} style={[styles.breakdownRow, b.is_correct ? styles.breakdownCorrect : styles.breakdownWrong]}>
                  <View style={styles.breakdownHeader}>
                    <Text style={styles.breakdownQNum}>Q{i + 1}</Text>
                    {b.is_correct ? (
                      <CheckCircle2 size={14} color={COLORS.success} />
                    ) : (
                      <XCircle size={14} color={COLORS.error} />
                    )}
                    <Text style={[styles.breakdownPts, { color: b.is_correct ? COLORS.success : COLORS.error }]}>
                      {b.earned_points}/{b.points} pts
                    </Text>
                  </View>
                  {b.question ? (
                    <Text style={styles.breakdownQ}>{b.question}</Text>
                  ) : null}
                  {b.explanation ? (
                    <Text style={styles.breakdownExplanation}>{b.explanation}</Text>
                  ) : null}
                </View>
              ))}
            </View>
          )}

          <AppButton
            label="Back to Quizzes"
            onPress={() => router.back()}
            variant="outline"
          />
        </AppCard>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.beige },
  content: { padding: Spacing.three, gap: Spacing.two, paddingBottom: 40 },
  instructionsCard: { gap: Spacing.one, backgroundColor: COLORS.blueLight },
  instructionsLabel: { fontSize: 12, fontWeight: '700', color: COLORS.blue },
  instructionsText: { fontSize: 13, color: COLORS.grayDark, lineHeight: 20 },
  introCard: { gap: Spacing.three, alignItems: 'center' },
  introDesc: { fontSize: 14, color: COLORS.grayDark, textAlign: 'center', lineHeight: 22 },
  statsRow: { flexDirection: 'row', gap: Spacing.two, flexWrap: 'wrap', justifyContent: 'center' },
  statBox: {
    alignItems: 'center',
    minWidth: 72,
    backgroundColor: COLORS.beigeLight,
    borderRadius: BorderRadius.medium,
    padding: Spacing.two,
  },
  statVal: { fontSize: 22, fontWeight: '900', color: COLORS.orange },
  statLbl: { fontSize: 11, color: COLORS.gray },
  rulesBox: {
    backgroundColor: COLORS.blueLight,
    borderRadius: BorderRadius.medium,
    padding: Spacing.two,
    gap: 4,
    alignSelf: 'stretch',
  },
  ruleText: { fontSize: 12, color: COLORS.blue },
  dueText: { fontSize: 13, color: COLORS.warning, fontWeight: '600' },
  quizNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.blue,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  qProgress: { fontSize: 14, color: COLORS.white, fontWeight: '700' },
  timerText: { fontSize: 16, color: COLORS.orange, fontWeight: '800' },
  questionCard: { gap: Spacing.two },
  questionTopRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  ptsBadge: {
    backgroundColor: COLORS.orangeLight,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  ptsBadgeText: { fontSize: 11, color: COLORS.orange, fontWeight: '700' },
  multiHint: { fontSize: 11, color: COLORS.blue, fontWeight: '600' },
  questionText: { fontSize: 16, fontWeight: '700', color: COLORS.grayDark, lineHeight: 24 },
  optionsList: { gap: Spacing.two },
  optionBtn: {
    backgroundColor: COLORS.white,
    borderRadius: BorderRadius.medium,
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 2,
    borderColor: COLORS.border,
    ...Shadow.card,
  },
  optionBtnSelected: { borderColor: COLORS.orange, backgroundColor: COLORS.orangeLight },
  optionIndicator: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.gray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIndicatorSelected: { borderColor: COLORS.orange, backgroundColor: COLORS.orange },
  optionText: { fontSize: 14, color: COLORS.grayDark, flex: 1 },
  optionTextSelected: { fontWeight: '700', color: COLORS.orangeDark },
  navBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.two },
  submitErrorBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  submitErrorText: { fontSize: 13, color: COLORS.error, fontWeight: '600', textAlign: 'center' },
  resultCard: { gap: Spacing.three, alignItems: 'center', padding: Spacing.four },
  resultTitle: { fontSize: 24, fontWeight: '900' },
  resultQuizTitle: { fontSize: 14, color: COLORS.gray, textAlign: 'center' },
  scoreCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: COLORS.grayLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: COLORS.orange,
  },
  scorePct: { fontSize: 32, fontWeight: '900' },
  scoreDetail: { fontSize: 13, color: COLORS.gray },
  passNote: { fontSize: 13, color: COLORS.gray },
  certBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: COLORS.warning + '20',
    borderRadius: BorderRadius.medium,
    padding: Spacing.two,
    alignSelf: 'stretch',
  },
  certBannerText: { fontSize: 13, color: COLORS.brown, fontWeight: '600', flex: 1 },
  breakdownSection: { alignSelf: 'stretch', gap: Spacing.one },
  breakdownTitle: { fontSize: 13, fontWeight: '700', color: COLORS.grayDark, marginBottom: 4 },
  breakdownRow: {
    borderRadius: BorderRadius.small,
    padding: Spacing.two,
    gap: 4,
    borderLeftWidth: 3,
  },
  breakdownCorrect: { backgroundColor: '#DCFCE7', borderLeftColor: COLORS.success },
  breakdownWrong: { backgroundColor: '#FEE2E2', borderLeftColor: COLORS.error },
  breakdownHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  breakdownQNum: { fontSize: 11, fontWeight: '800', color: COLORS.gray, minWidth: 20 },
  breakdownPts: { fontSize: 11, fontWeight: '700', marginLeft: 'auto' },
  breakdownQ: { fontSize: 12, color: COLORS.grayDark, lineHeight: 16 },
  breakdownExplanation: { fontSize: 11, color: COLORS.blue, fontStyle: 'italic', lineHeight: 15 },
});
