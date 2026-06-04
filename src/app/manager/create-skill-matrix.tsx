import { router } from 'expo-router';
import { Brain, ChevronDown, ChevronUp, PlusCircle, Trash2 } from 'lucide-react-native';
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

import { skillService } from '@/services/skill.service';
import type { SkillCategory, SkillPriority } from '@/types/skill.types';

const CATEGORIES: SkillCategory[] = [
  'Product Knowledge',
  'Sales',
  'Customer Service',
  'Store Operations',
  'POS',
  'Visual Merchandising',
  'Compliance',
  'Leadership',
  'General',
];

const PRIORITIES: { label: string; value: SkillPriority; color: string }[] = [
  { label: 'Low', value: 'low', color: '#6B7280' },
  { label: 'Medium', value: 'medium', color: '#D97706' },
  { label: 'High', value: 'high', color: '#C95F18' },
  { label: 'Urgent', value: 'urgent', color: '#B91C1C' },
];

interface SkillEntry {
  title: string;
  description: string;
  category: SkillCategory;
  expected_level: number;
  priority: SkillPriority;
  expanded: boolean;
}

function defaultSkill(): SkillEntry {
  return {
    title: '',
    description: '',
    category: 'General',
    expected_level: 3,
    priority: 'medium',
    expanded: true,
  };
}

export default function CreateSkillMatrixScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [roleName, setRoleName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assignScope, setAssignScope] = useState<'store' | 'individual'>('store');
  const [skills, setSkills] = useState<SkillEntry[]>([defaultSkill(), defaultSkill(), defaultSkill()]);
  const [submitting, setSubmitting] = useState(false);

  function updateSkill(index: number, patch: Partial<SkillEntry>) {
    setSkills((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function addSkill() {
    setSkills((prev) => [...prev, defaultSkill()]);
  }

  function removeSkill(index: number) {
    if (skills.length <= 1) return;
    setSkills((prev) => prev.filter((_, i) => i !== index));
  }

  async function submit() {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter a matrix title.');
      return;
    }
    const invalid = skills.findIndex((s) => !s.title.trim());
    if (invalid >= 0) {
      Alert.alert('Required', `Skill ${invalid + 1} title is required.`);
      return;
    }

    try {
      setSubmitting(true);
      await skillService.createSkillMatrix({
        title: title.trim(),
        description: description.trim() || undefined,
        role_name: roleName.trim() || undefined,
        due_date: dueDate.trim() || undefined,
        assign_scope: assignScope,
        assigned_to: [],
        skills: skills.map((s, i) => ({
          title: s.title.trim(),
          description: s.description.trim() || undefined,
          category: s.category,
          expected_level: s.expected_level,
          priority: s.priority,
          sort_order: i + 1,
        })),
      });
      Alert.alert('Created', 'Skill matrix created successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create skill matrix.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backPill} onPress={() => router.back()}>
          <Text style={styles.backPillText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Skill Matrix</Text>
        <Text style={styles.headerSub}>Define skills and competency expectations</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

        {/* Matrix Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Matrix Details</Text>

          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Sales Floor Competency"
            placeholderTextColor="#8A8178"
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Optional description..."
            placeholderTextColor="#8A8178"
            multiline
          />

          <Text style={styles.label}>Role / Designation</Text>
          <TextInput
            style={styles.input}
            value={roleName}
            onChangeText={setRoleName}
            placeholder="e.g. Sales Associate"
            placeholderTextColor="#8A8178"
          />

          <Text style={styles.label}>Due Date (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            value={dueDate}
            onChangeText={setDueDate}
            placeholder="2025-06-30"
            placeholderTextColor="#8A8178"
          />

          <Text style={styles.label}>Assign Scope</Text>
          <View style={styles.chipRow}>
            {(['store', 'individual'] as const).map((scope) => (
              <TouchableOpacity
                key={scope}
                style={[styles.chip, assignScope === scope && styles.chipActive]}
                onPress={() => setAssignScope(scope)}
              >
                <Text style={[styles.chipText, assignScope === scope && styles.chipTextActive]}>
                  {scope === 'store' ? 'Entire Store' : 'Individual'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Skills */}
        <View style={styles.sectionRow}>
          <Brain size={18} color="#C95F18" />
          <Text style={styles.sectionTitle}>Skills ({skills.length})</Text>
        </View>

        {skills.map((skill, index) => (
          <View key={index} style={styles.skillCard}>
            <TouchableOpacity
              style={styles.skillHeader}
              onPress={() => updateSkill(index, { expanded: !skill.expanded })}
              activeOpacity={0.75}
            >
              <View style={styles.skillNum}>
                <Text style={styles.skillNumText}>{index + 1}</Text>
              </View>
              <Text style={styles.skillHeaderTitle} numberOfLines={1}>
                {skill.title || `Skill ${index + 1}`}
              </Text>
              <View style={styles.skillHeaderActions}>
                {skills.length > 1 && (
                  <TouchableOpacity onPress={() => removeSkill(index)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Trash2 size={15} color="#B91C1C" />
                  </TouchableOpacity>
                )}
                {skill.expanded ? (
                  <ChevronUp size={16} color="#8A8178" />
                ) : (
                  <ChevronDown size={16} color="#8A8178" />
                )}
              </View>
            </TouchableOpacity>

            {skill.expanded && (
              <View style={styles.skillBody}>
                <Text style={styles.label}>Skill Title *</Text>
                <TextInput
                  style={styles.input}
                  value={skill.title}
                  onChangeText={(v) => updateSkill(index, { title: v })}
                  placeholder="e.g. Product Knowledge"
                  placeholderTextColor="#8A8178"
                />

                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={skill.description}
                  onChangeText={(v) => updateSkill(index, { description: v })}
                  placeholder="Optional..."
                  placeholderTextColor="#8A8178"
                  multiline
                />

                <Text style={styles.label}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                  <View style={styles.chipRow}>
                    {CATEGORIES.map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={[styles.chip, skill.category === cat && styles.chipActive]}
                        onPress={() => updateSkill(index, { category: cat })}
                      >
                        <Text style={[styles.chipText, skill.category === cat && styles.chipTextActive]}>
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>

                <Text style={styles.label}>Expected Level (1–5): {skill.expected_level}</Text>
                <View style={styles.levelRow}>
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <TouchableOpacity
                      key={lvl}
                      style={[styles.levelBtn, skill.expected_level === lvl && styles.levelBtnActive]}
                      onPress={() => updateSkill(index, { expected_level: lvl })}
                    >
                      <Text style={[styles.levelBtnText, skill.expected_level === lvl && styles.levelBtnTextActive]}>
                        {lvl}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.label}>Priority</Text>
                <View style={styles.chipRow}>
                  {PRIORITIES.map((p) => (
                    <TouchableOpacity
                      key={p.value}
                      style={[styles.chip, skill.priority === p.value && { backgroundColor: p.color, borderColor: p.color }]}
                      onPress={() => updateSkill(index, { priority: p.value })}
                    >
                      <Text style={[styles.chipText, skill.priority === p.value && { color: '#FFFFFF' }]}>
                        {p.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>
        ))}

        <TouchableOpacity style={styles.addSkillBtn} onPress={addSkill}>
          <PlusCircle size={16} color="#C95F18" />
          <Text style={styles.addSkillText}>Add Skill</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
          onPress={submit}
          disabled={submitting}
        >
          <Text style={styles.submitText}>{submitting ? 'Creating...' : 'Create Skill Matrix'}</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6EBDC' },
  header: {
    backgroundColor: '#102B45',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  backPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 14,
  },
  backPillText: { color: '#FFEAC7', fontSize: 12, fontWeight: '900' },
  headerTitle: { color: '#FFFFFF', fontSize: 26, fontWeight: '900' },
  headerSub: { color: 'rgba(255,255,255,0.72)', marginTop: 4, fontSize: 13, fontWeight: '700' },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 36 },
  card: {
    backgroundColor: '#FFFDF8',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EAD7C2',
    gap: 6,
  },
  cardTitle: { color: '#102B45', fontSize: 15, fontWeight: '900', marginBottom: 6 },
  label: { color: '#6B3F20', fontSize: 12, fontWeight: '800', marginTop: 4 },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EAD7C2',
    paddingHorizontal: 13,
    paddingVertical: 11,
    color: '#102B45',
    fontWeight: '700',
    fontSize: 14,
  },
  textArea: { minHeight: 64, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: '#F3F4F6',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipActive: { backgroundColor: '#102B45', borderColor: '#102B45' },
  chipText: { color: '#4B5563', fontSize: 12, fontWeight: '700' },
  chipTextActive: { color: '#FFFFFF' },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 4 },
  sectionTitle: { color: '#102B45', fontSize: 16, fontWeight: '900' },
  skillCard: {
    backgroundColor: '#FFFDF8',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EAD7C2',
    overflow: 'hidden',
  },
  skillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
  },
  skillNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#102B45',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skillNumText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  skillHeaderTitle: { flex: 1, color: '#102B45', fontSize: 14, fontWeight: '800' },
  skillHeaderActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  skillBody: { padding: 14, paddingTop: 0, gap: 6 },
  levelRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  levelBtn: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  levelBtnActive: { backgroundColor: '#102B45', borderColor: '#102B45' },
  levelBtnText: { color: '#4B5563', fontWeight: '800', fontSize: 14 },
  levelBtnTextActive: { color: '#FFFFFF' },
  addSkillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFF3E8',
    borderRadius: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  addSkillText: { color: '#C95F18', fontWeight: '800', fontSize: 14 },
  submitBtn: {
    backgroundColor: '#102B45',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
});
