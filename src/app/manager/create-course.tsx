import { router } from 'expo-router';
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Plus,
  Save,
  Trash2,
} from 'lucide-react-native';
import React, { useState } from 'react';
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
import { courseService } from '@/services/course.service';
import type {
  CourseAssignScope,
  CourseContentType,
  CourseLesson,
  CourseLevel,
  CoursePriority,
} from '@/types/course.types';
import { BorderRadius, COLORS, Shadow, Spacing } from '@/constants/theme';

const PRIORITIES: CoursePriority[] = ['low', 'medium', 'high', 'urgent'];
const LEVELS: CourseLevel[] = ['beginner', 'intermediate', 'advanced'];
const CONTENT_TYPES: CourseContentType[] = ['text', 'video', 'pdf', 'image', 'link'];

const PRIORITY_COLORS: Record<CoursePriority, { bg: string; text: string }> = {
  urgent: { bg: '#FEE2E2', text: '#B91C1C' },
  high: { bg: '#FEF3C7', text: '#92400E' },
  medium: { bg: '#DBEAFE', text: '#1D4ED8' },
  low: { bg: '#F3F4F6', text: '#6B7280' },
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function makeLesson(): CourseLesson & { expanded: boolean } {
  return {
    id: uid(),
    title: '',
    description: '',
    content_type: 'text',
    content: '',
    duration_minutes: 5,
    sort_order: 1,
    expanded: true,
  };
}

export default function CreateCourseScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [level, setLevel] = useState<CourseLevel>('beginner');
  const [priority, setPriority] = useState<CoursePriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [assignScope, setAssignScope] = useState<CourseAssignScope>('store');
  const [lessons, setLessons] = useState<(CourseLesson & { expanded: boolean })[]>([
    { ...makeLesson(), title: 'Introduction', content: 'Welcome to this course. In this lesson you will learn the basics.', sort_order: 1 },
    { ...makeLesson(), title: 'Core Concepts', content: 'This lesson covers the core concepts you need to know for your role.', sort_order: 2 },
  ]);
  const [submitting, setSubmitting] = useState(false);

  function updateLesson(idx: number, patch: Partial<CourseLesson & { expanded: boolean }>) {
    setLessons((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }

  function addLesson() {
    setLessons((prev) => [...prev, { ...makeLesson(), sort_order: prev.length + 1 }]);
  }

  function removeLesson(idx: number) {
    if (lessons.length <= 1) return;
    setLessons((prev) => prev.filter((_, i) => i !== idx).map((l, i) => ({ ...l, sort_order: i + 1 })));
  }

  async function handleSubmit() {
    if (!title.trim()) return Alert.alert('Error', 'Course title is required');
    if (!description.trim()) return Alert.alert('Error', 'Description is required');
    if (dueDate.trim() && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate.trim()))
      return Alert.alert('Error', 'Due date must be YYYY-MM-DD');
    for (const l of lessons) {
      if (!l.title.trim()) return Alert.alert('Error', 'All lessons need a title');
      if (!l.content.trim()) return Alert.alert('Error', 'All lessons need content');
    }
    setSubmitting(true);
    try {
      await courseService.createCourse({
        title: title.trim(),
        description: description.trim(),
        category: category.trim() || undefined,
        level,
        priority,
        due_date: dueDate.trim() || null,
        assign_scope: assignScope,
        assigned_to: [],
        lessons: lessons.map(({ expanded, ...l }) => l),
      });
      Alert.alert('Course Created', 'Course is now available to store staff.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create course');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ManagerPageHeader title="Create Course" showBack onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Course Info */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <BookOpen size={16} color={COLORS.orange} />
            <Text style={styles.sectionTitle}>Course Details</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Course title *"
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
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="Category (e.g. Sofas)"
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
        </View>

        {/* Level */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Level</Text>
          <View style={styles.chipRow}>
            {LEVELS.map((lv) => (
              <TouchableOpacity
                key={lv}
                style={[styles.chip, level === lv && styles.chipActive]}
                onPress={() => setLevel(lv)}
                activeOpacity={0.8}>
                <Text style={[styles.chipText, level === lv && styles.chipTextActive]}>
                  {lv.charAt(0).toUpperCase() + lv.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
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
            {(['store', 'individual'] as CourseAssignScope[]).map((s) => (
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

        {/* Lessons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lessons ({lessons.length})</Text>

          {lessons.map((lesson, idx) => (
            <View key={lesson.id} style={styles.lessonCard}>
              <TouchableOpacity
                style={styles.lessonHeader}
                onPress={() => updateLesson(idx, { expanded: !lesson.expanded })}
                activeOpacity={0.8}>
                <View style={styles.lessonHeaderLeft}>
                  <View style={styles.lessonNum}>
                    <Text style={styles.lessonNumText}>{idx + 1}</Text>
                  </View>
                  <Text style={styles.lessonPreview} numberOfLines={1}>
                    {lesson.title.trim() || 'New lesson'}
                  </Text>
                </View>
                <View style={styles.lessonHeaderRight}>
                  {lessons.length > 1 && (
                    <TouchableOpacity onPress={() => removeLesson(idx)} style={styles.deleteBtn}>
                      <Trash2 size={14} color={COLORS.error} />
                    </TouchableOpacity>
                  )}
                  {lesson.expanded ? (
                    <ChevronUp size={18} color={COLORS.gray} />
                  ) : (
                    <ChevronDown size={18} color={COLORS.gray} />
                  )}
                </View>
              </TouchableOpacity>

              {lesson.expanded && (
                <View style={styles.lessonBody}>
                  <TextInput
                    style={styles.input}
                    placeholder="Lesson title *"
                    placeholderTextColor={COLORS.gray}
                    value={lesson.title}
                    onChangeText={(t) => updateLesson(idx, { title: t })}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Short description (optional)"
                    placeholderTextColor={COLORS.gray}
                    value={lesson.description ?? ''}
                    onChangeText={(t) => updateLesson(idx, { description: t })}
                  />

                  <View style={styles.row}>
                    <View style={styles.halfInput}>
                      <Text style={styles.fieldLabel}>Content Type</Text>
                      <View style={styles.chipRowSmall}>
                        {CONTENT_TYPES.map((ct) => (
                          <TouchableOpacity
                            key={ct}
                            style={[styles.chipSm, lesson.content_type === ct && styles.chipSmActive]}
                            onPress={() => updateLesson(idx, { content_type: ct })}
                            activeOpacity={0.8}>
                            <Text style={[styles.chipSmText, lesson.content_type === ct && styles.chipSmTextActive]}>
                              {ct}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                    <View style={styles.halfInput}>
                      <Text style={styles.fieldLabel}>Duration (min)</Text>
                      <TextInput
                        style={styles.input}
                        value={String(lesson.duration_minutes)}
                        onChangeText={(t) => updateLesson(idx, { duration_minutes: parseInt(t) || 5 })}
                        keyboardType="number-pad"
                      />
                    </View>
                  </View>

                  <Text style={styles.fieldLabel}>Content *</Text>
                  <TextInput
                    style={[styles.input, styles.textarea]}
                    placeholder="Lesson content, instructions, or URL"
                    placeholderTextColor={COLORS.gray}
                    value={lesson.content}
                    onChangeText={(t) => updateLesson(idx, { content: t })}
                    multiline
                    numberOfLines={4}
                  />
                </View>
              )}
            </View>
          ))}

          <TouchableOpacity style={styles.addLessonBtn} onPress={addLesson}>
            <Plus size={16} color={COLORS.orange} />
            <Text style={styles.addLessonText}>Add Lesson</Text>
          </TouchableOpacity>
        </View>

        <AppButton
          label="Publish Course"
          onPress={handleSubmit}
          loading={submitting}
          icon={<Save size={16} color={COLORS.white} />}
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
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.grayDark },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BorderRadius.medium,
    padding: Spacing.two,
    fontSize: 14,
    color: COLORS.grayDark,
    backgroundColor: COLORS.white,
  },
  textarea: { minHeight: 70, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: Spacing.two },
  halfInput: { flex: 1 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.grayLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: { backgroundColor: COLORS.orangeLight, borderColor: COLORS.orange },
  chipText: { fontSize: 12, fontWeight: '600', color: COLORS.gray },
  chipTextActive: { color: COLORS.orange },
  fieldLabel: { fontSize: 12, color: COLORS.gray, fontWeight: '600', marginBottom: 4 },
  chipRowSmall: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  chipSm: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: COLORS.grayLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipSmActive: { backgroundColor: COLORS.blueLight, borderColor: COLORS.blue },
  chipSmText: { fontSize: 10, color: COLORS.gray, fontWeight: '600' },
  chipSmTextActive: { color: COLORS.blue },
  lessonCard: {
    backgroundColor: COLORS.beigeLight,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  lessonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.two,
    backgroundColor: COLORS.white,
  },
  lessonHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one, flex: 1 },
  lessonHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  lessonNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lessonNumText: { fontSize: 11, fontWeight: '800', color: COLORS.white },
  lessonPreview: { fontSize: 13, color: COLORS.grayDark, flex: 1 },
  deleteBtn: { padding: 4 },
  lessonBody: { padding: Spacing.two, gap: Spacing.two },
  addLessonBtn: {
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
  addLessonText: { fontSize: 14, fontWeight: '700', color: COLORS.orange },
});
