import { Award, CheckCircle, Clock, XCircle } from 'lucide-react-native';
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
import { AppBadge } from '@/components/ui/AppBadge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { quizService, type QuizResult } from '@/services/quiz.service';
import { useApi } from '@/hooks/useApi';
import type { Quiz } from '@/types/quiz.types';
import { COLORS, BorderRadius, Shadow, Spacing } from '@/constants/theme';

type Phase = 'list' | 'intro' | 'attempt' | 'result';

function QuizList({ quizzes, onSelect }: { quizzes: Quiz[]; onSelect: (q: Quiz) => void }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StaffPageHeader title="Quizzes" subtitle={`${quizzes.length} available`} />
      <ScrollView contentContainerStyle={styles.content}>
        {quizzes.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No Quizzes Available</Text>
            <Text style={styles.emptySubtitle}>Complete your assigned courses to unlock quizzes.</Text>
          </View>
        )}
        {quizzes.map((quiz) => (
          <AppCard key={quiz.id} style={styles.quizCard} onPress={() => onSelect(quiz)}>
            <View style={styles.quizCardTop}>
              <Text style={styles.quizTitle}>{quiz.title}</Text>
              <AppBadge label={quiz.attempts_used > 0 ? `${quiz.attempts_used} attempt` : 'NEW'} variant={quiz.attempts_used > 0 ? 'warning' : 'success'} size="sm" />
            </View>
            <Text style={styles.quizDesc}>{quiz.description}</Text>
            <View style={styles.quizMeta}>
              <View style={styles.metaItem}>
                <Clock size={13} color={COLORS.gray} />
                <Text style={styles.metaText}>{quiz.time_limit_minutes} min</Text>
              </View>
              <Text style={styles.dot}>•</Text>
              <Text style={styles.metaText}>{quiz.questions.length} questions</Text>
              <Text style={styles.dot}>•</Text>
              <Text style={styles.metaText}>Pass at {quiz.passing_score}%</Text>
            </View>
          </AppCard>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

export default function QuizScreen() {
  const { data: quizData, loading, error, refresh } = useApi(quizService.getMyQuizzes);
  const quizzes = quizData ?? [];

  const [phase, setPhase] = useState<Phase>('list');
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [showIncompleteModal, setShowIncompleteModal] = useState(false);
  const submittingRef = useRef(false);
  const startTimeRef = useRef<number>(0);

  async function handleSubmit() {
    if (!activeQuiz || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      const timeTaken = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const result = await quizService.submitQuiz(activeQuiz.id, {
        answers,
        time_taken_seconds: timeTaken,
      });
      setQuizResult(result);
      setPhase('result');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not submit quiz. Please try again.');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  useEffect(() => {
    if (phase !== 'attempt' || !activeQuiz) return;
    if (timeLeft <= 0) {
      if (!submittingRef.current) handleSubmit();
      return;
    }
    const t = setInterval(() => setTimeLeft((n) => n - 1), 1000);
    return () => clearInterval(t);
  }, [phase, timeLeft, activeQuiz]);

  function startQuiz(quiz: Quiz) {
    setActiveQuiz(quiz);
    setPhase('intro');
  }

  function beginAttempt() {
    setCurrentQ(0);
    setAnswers({});
    setTimeLeft((activeQuiz?.time_limit_minutes ?? 10) * 60);
    startTimeRef.current = Date.now();
    submittingRef.current = false;
    setPhase('attempt');
  }

  async function confirmSubmit() {
    const answered = Object.keys(answers).length;
    const total = activeQuiz?.questions.length ?? 0;
    if (answered < total) {
      setShowIncompleteModal(true);
    } else {
      await handleSubmit();
    }
  }

  function formatTime(s: number) {
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  }

  if (phase === 'list') {
    if (loading) return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <StaffPageHeader title="Quizzes" />
        <LoadingState message="Loading quizzes..." />
      </SafeAreaView>
    );
    if (error) return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <StaffPageHeader title="Quizzes" />
        <ErrorState message={error} onRetry={refresh} />
      </SafeAreaView>
    );
    return <QuizList quizzes={quizzes} onSelect={startQuiz} />;
  }

  if (!activeQuiz) return <QuizList quizzes={quizzes} onSelect={startQuiz} />;

  if (phase === 'intro') {
    const attemptsLeft = activeQuiz.max_attempts - activeQuiz.attempts_used;
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <StaffPageHeader title={activeQuiz.title} showBack onBack={() => setPhase('list')} />
        <ScrollView contentContainerStyle={styles.content}>
          <AppCard style={styles.introCard}>
            <Text style={styles.introBig}>{activeQuiz.description}</Text>
            <View style={styles.introStats}>
              <View style={styles.statBox}>
                <Text style={styles.statVal}>{activeQuiz.time_limit_minutes}</Text>
                <Text style={styles.statLbl}>Minutes</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statVal}>{activeQuiz.questions.length}</Text>
                <Text style={styles.statLbl}>Questions</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statVal}>{activeQuiz.passing_score}%</Text>
                <Text style={styles.statLbl}>Pass Mark</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statVal, { color: attemptsLeft <= 0 ? COLORS.error : COLORS.orange }]}>
                  {attemptsLeft}
                </Text>
                <Text style={styles.statLbl}>Attempts Left</Text>
              </View>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>• Questions cannot be skipped after answering</Text>
              <Text style={styles.infoText}>• Timer starts when you begin</Text>
              <Text style={styles.infoText}>• You can navigate between questions</Text>
            </View>
            {attemptsLeft <= 0 ? (
              <Text style={styles.noAttemptsText}>No attempts remaining for this quiz.</Text>
            ) : (
              <AppButton label="Start Quiz" onPress={beginAttempt} />
            )}
          </AppCard>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (phase === 'attempt') {
    const question = activeQuiz.questions[currentQ];
    const progress = ((currentQ + 1) / activeQuiz.questions.length) * 100;

    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.quizNav}>
          <Text style={styles.qProgress}>{currentQ + 1} / {activeQuiz.questions.length}</Text>
          <Text style={[styles.timer, timeLeft < 60 && { color: COLORS.error }]}>
            <Clock size={14} color={timeLeft < 60 ? COLORS.error : COLORS.white} /> {formatTime(timeLeft)}
          </Text>
        </View>
        <ProgressBar value={progress} height={4} color={COLORS.orange} />
        <ScrollView contentContainerStyle={styles.content}>
          <AppCard style={styles.questionCard}>
            <AppBadge label={`${question.marks} marks`} variant="blue" size="sm" />
            <Text style={styles.questionText}>{question.question_text}</Text>
          </AppCard>
          <View style={styles.optionsContainer}>
            {question.options.map((opt) => {
              const isSelected = answers[question.id] === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[styles.optionBtn, isSelected && styles.optionBtnSelected]}
                  onPress={() => setAnswers((prev) => ({ ...prev, [question.id]: opt.id }))}
                  activeOpacity={0.8}>
                  <View style={[styles.optionDot, isSelected && styles.optionDotSelected]} />
                  <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{opt.option_text}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.navBtns}>
            {currentQ > 0 && (
              <AppButton label="← Previous" onPress={() => setCurrentQ((n) => n - 1)} variant="outline" fullWidth={false} size="sm" />
            )}
            {currentQ < activeQuiz.questions.length - 1 ? (
              <AppButton label="Next →" onPress={() => setCurrentQ((n) => n + 1)} variant="secondary" fullWidth={false} size="sm" />
            ) : (
              <AppButton label="Submit Quiz" onPress={confirmSubmit} loading={submitting} fullWidth={false} size="sm" />
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
          message={`You've answered ${Object.keys(answers).length} of ${activeQuiz.questions.length} questions. Unanswered questions will be marked wrong.`}
          confirmLabel="Submit Anyway"
          cancelLabel="Keep Answering"
          variant="warning"
          onConfirm={() => { setShowIncompleteModal(false); handleSubmit(); }}
          onCancel={() => setShowIncompleteModal(false)}
        />
      </SafeAreaView>
    );
  }

  const passed = quizResult?.passed ?? false;
  const pct = quizResult?.percentage ?? 0;
  const score = quizResult?.score ?? 0;
  const totalMarks = quizResult?.total_marks ?? 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StaffPageHeader title="Quiz Result" />
      <ScrollView contentContainerStyle={styles.content}>
        <AppCard style={styles.resultCard}>
          {passed ? <CheckCircle size={56} color={COLORS.success} /> : <XCircle size={56} color={COLORS.error} />}
          <Text style={[styles.resultTitle, { color: passed ? COLORS.success : COLORS.error }]}>
            {passed ? 'Congratulations!' : 'Not Passed'}
          </Text>
          <Text style={styles.resultSubtitle}>{activeQuiz.title}</Text>

          <View style={styles.scoreCircle}>
            <Text style={[styles.scorePct, { color: passed ? COLORS.success : COLORS.error }]}>{pct}%</Text>
            <Text style={styles.scoreDetail}>{score} / {totalMarks} marks</Text>
          </View>

          <Text style={styles.passNote}>Passing score: {activeQuiz.passing_score}%</Text>

          {passed && (
            <View style={styles.certNotice}>
              <Award size={20} color={COLORS.warning} />
              <Text style={styles.certText}>Certificate available in Certificates tab</Text>
            </View>
          )}

          <View style={styles.resultBtns}>
            <AppButton label="View Quizzes" onPress={() => { setPhase('list'); setActiveQuiz(null); setQuizResult(null); }} variant="outline" />
            {!passed && activeQuiz.max_attempts - activeQuiz.attempts_used > 1 && (
              <AppButton label="Retry Quiz" onPress={beginAttempt} />
            )}
          </View>
        </AppCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.beige },
  content: { padding: Spacing.three, gap: Spacing.two, paddingBottom: 40 },
  quizCard: { gap: 8 },
  quizCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  quizTitle: { fontSize: 15, fontWeight: '800', color: COLORS.grayDark, flex: 1 },
  quizDesc: { fontSize: 13, color: COLORS.gray, lineHeight: 18 },
  quizMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: COLORS.gray },
  dot: { color: COLORS.gray, fontSize: 12 },
  introCard: { gap: Spacing.three, alignItems: 'center' },
  introBig: { fontSize: 14, color: COLORS.grayDark, textAlign: 'center', lineHeight: 22 },
  introStats: { flexDirection: 'row', gap: Spacing.two, flexWrap: 'wrap', justifyContent: 'center' },
  statBox: { alignItems: 'center', minWidth: 70, backgroundColor: COLORS.beigeLight, borderRadius: BorderRadius.medium, padding: Spacing.two },
  statVal: { fontSize: 22, fontWeight: '900', color: COLORS.orange },
  statLbl: { fontSize: 11, color: COLORS.gray },
  infoBox: { backgroundColor: COLORS.blueLight, borderRadius: BorderRadius.medium, padding: Spacing.two, gap: 4, alignSelf: 'stretch' },
  infoText: { fontSize: 12, color: COLORS.blue },
  noAttemptsText: { fontSize: 13, color: COLORS.error, fontWeight: '600', textAlign: 'center' },
  quizNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.blue, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  qProgress: { fontSize: 14, color: COLORS.white, fontWeight: '700' },
  timer: { fontSize: 16, color: COLORS.orange, fontWeight: '800' },
  questionCard: { gap: Spacing.two },
  questionText: { fontSize: 16, fontWeight: '700', color: COLORS.grayDark, lineHeight: 24 },
  optionsContainer: { gap: Spacing.two },
  optionBtn: { backgroundColor: COLORS.white, borderRadius: BorderRadius.medium, padding: Spacing.three, flexDirection: 'row', alignItems: 'center', gap: Spacing.two, borderWidth: 2, borderColor: COLORS.border, ...Shadow.card },
  optionBtnSelected: { borderColor: COLORS.orange, backgroundColor: COLORS.orangeLight },
  optionDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: COLORS.gray },
  optionDotSelected: { borderColor: COLORS.orange, backgroundColor: COLORS.orange },
  optionText: { fontSize: 14, color: COLORS.grayDark, flex: 1 },
  optionTextSelected: { fontWeight: '700', color: COLORS.orange },
  navBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.two },
  resultCard: { gap: Spacing.three, alignItems: 'center', padding: Spacing.four },
  resultTitle: { fontSize: 24, fontWeight: '900' },
  resultSubtitle: { fontSize: 14, color: COLORS.gray },
  scoreCircle: { width: 130, height: 130, borderRadius: 65, backgroundColor: COLORS.grayLight, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: COLORS.orange },
  scorePct: { fontSize: 32, fontWeight: '900' },
  scoreDetail: { fontSize: 13, color: COLORS.gray },
  passNote: { fontSize: 14, color: COLORS.gray },
  certNotice: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, backgroundColor: COLORS.warning + '20', borderRadius: BorderRadius.medium, padding: Spacing.two, alignSelf: 'stretch' },
  certText: { fontSize: 13, color: COLORS.brown, fontWeight: '600', flex: 1 },
  resultBtns: { alignSelf: 'stretch', gap: Spacing.two },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: Spacing.two },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.grayDark },
  emptySubtitle: { fontSize: 14, color: COLORS.gray, textAlign: 'center' },
  submitErrorBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    marginTop: 4,
  },
  submitErrorText: { fontSize: 13, color: '#DC2626', fontWeight: '600', textAlign: 'center' },
});
