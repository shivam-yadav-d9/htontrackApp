import { router } from 'expo-router';
import { AlertTriangle, Bug, CheckCircle, ChevronDown, MessageSquare, Send, Star } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { productionService } from '@/services/production.service';

const MODULES = [
  'auth', 'attendance', 'assignments', 'courses', 'quizzes', 'certificates',
  'targets', 'documents', 'notifications', 'reports', 'festivals', 'insights',
  'rewards', 'skills', 'profile', 'general',
];

const FEEDBACK_TYPES = [
  { key: 'bug', label: 'Bug Report', icon: Bug, color: '#DC2626' },
  { key: 'suggestion', label: 'Suggestion', icon: Star, color: '#D97706' },
  { key: 'question', label: 'Question', icon: MessageSquare, color: '#2563EB' },
  { key: 'praise', label: 'Praise', icon: CheckCircle, color: '#16A34A' },
];

const SEVERITIES = [
  { key: 'low', label: 'Low', color: '#6B7280' },
  { key: 'medium', label: 'Medium', color: '#D97706' },
  { key: 'high', label: 'High', color: '#DC2626' },
  { key: 'critical', label: 'Critical', color: '#7C3AED' },
];

export default function FeedbackScreen() {
  const [feedbackType, setFeedbackType] = useState('bug');
  const [module, setModule] = useState('general');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [screenName, setScreenName] = useState('');
  const [stepsToReproduce, setStepsToReproduce] = useState('');
  const [showModulePicker, setShowModulePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit() {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Required Fields', 'Please fill in the title and description.');
      return;
    }
    setLoading(true);
    try {
      await productionService.submitFeedback({
        module,
        feedback_type: feedbackType,
        title: title.trim(),
        description: description.trim(),
        severity,
        screen_name: screenName.trim() || undefined,
        steps_to_reproduce: stepsToReproduce.trim() || undefined,
      });
      setSubmitted(true);
    } catch {
      Alert.alert('Error', 'Failed to submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <CheckCircle size={64} color="#16A34A" />
          <Text style={styles.successTitle}>Thank You!</Text>
          <Text style={styles.successSubtitle}>Your feedback has been submitted successfully.</Text>
          <TouchableOpacity style={styles.doneButton} onPress={() => router.back()}>
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Submit Feedback</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Feedback Type */}
        <View style={styles.section}>
          <Text style={styles.label}>Feedback Type</Text>
          <View style={styles.typeRow}>
            {FEEDBACK_TYPES.map((ft) => {
              const Icon = ft.icon;
              const selected = feedbackType === ft.key;
              return (
                <TouchableOpacity
                  key={ft.key}
                  style={[styles.typeChip, selected && { backgroundColor: ft.color, borderColor: ft.color }]}
                  onPress={() => setFeedbackType(ft.key)}
                >
                  <Icon size={14} color={selected ? '#fff' : ft.color} />
                  <Text style={[styles.typeChipText, selected && { color: '#fff' }]}>{ft.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Module */}
        <View style={styles.section}>
          <Text style={styles.label}>Module</Text>
          <TouchableOpacity style={styles.picker} onPress={() => setShowModulePicker(!showModulePicker)}>
            <Text style={styles.pickerText}>{module}</Text>
            <ChevronDown size={18} color="#6B7280" />
          </TouchableOpacity>
          {showModulePicker && (
            <View style={styles.dropdown}>
              {MODULES.map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.dropdownItem, module === m && styles.dropdownItemSelected]}
                  onPress={() => { setModule(m); setShowModulePicker(false); }}
                >
                  <Text style={[styles.dropdownItemText, module === m && styles.dropdownItemTextSelected]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Title */}
        <View style={styles.section}>
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="Brief title describing the issue or feedback"
            value={title}
            onChangeText={setTitle}
            maxLength={200}
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe the issue or feedback in detail"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={5}
            maxLength={2000}
          />
        </View>

        {/* Severity */}
        {(feedbackType === 'bug') && (
          <View style={styles.section}>
            <Text style={styles.label}>Severity</Text>
            <View style={styles.severityRow}>
              {SEVERITIES.map((s) => {
                const selected = severity === s.key;
                return (
                  <TouchableOpacity
                    key={s.key}
                    style={[styles.severityChip, selected && { backgroundColor: s.color, borderColor: s.color }]}
                    onPress={() => setSeverity(s.key)}
                  >
                    <Text style={[styles.severityText, selected && { color: '#fff' }]}>{s.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Screen Name */}
        <View style={styles.section}>
          <Text style={styles.label}>Screen Name (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Attendance, Quiz, Dashboard"
            value={screenName}
            onChangeText={setScreenName}
          />
        </View>

        {/* Steps to Reproduce */}
        {feedbackType === 'bug' && (
          <View style={styles.section}>
            <Text style={styles.label}>Steps to Reproduce (optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="1. Open app&#10;2. Go to ...&#10;3. Tap on ..."
              value={stepsToReproduce}
              onChangeText={setStepsToReproduce}
              multiline
              numberOfLines={4}
            />
          </View>
        )}

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Send size={18} color="#fff" />
              <Text style={styles.submitButtonText}>Submit Feedback</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Your feedback helps improve the app. All submissions are reviewed by the product team.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  backButton: { padding: 4 },
  backText: { color: '#6F4E37', fontSize: 14, fontWeight: '600' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  scroll: { flex: 1, paddingHorizontal: 16 },
  section: { marginTop: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5, borderColor: '#D1D5DB',
    backgroundColor: '#fff',
  },
  typeChipText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  picker: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#D1D5DB',
    paddingHorizontal: 14, paddingVertical: 12,
  },
  pickerText: { fontSize: 14, color: '#1F2937', textTransform: 'capitalize' },
  dropdown: {
    backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB',
    marginTop: 4, maxHeight: 200, overflow: 'hidden',
  },
  dropdownItem: { paddingHorizontal: 14, paddingVertical: 10 },
  dropdownItemSelected: { backgroundColor: '#FEF3C7' },
  dropdownItemText: { fontSize: 14, color: '#374151', textTransform: 'capitalize' },
  dropdownItemTextSelected: { fontWeight: '700', color: '#92400E' },
  input: {
    backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#D1D5DB',
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#1F2937',
  },
  textArea: { height: 100, textAlignVertical: 'top', paddingTop: 12 },
  severityRow: { flexDirection: 'row', gap: 8 },
  severityChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: '#D1D5DB', backgroundColor: '#fff',
  },
  severityText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  submitButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#6F4E37', borderRadius: 12, paddingVertical: 16, marginTop: 28,
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  disclaimer: { fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginTop: 12 },
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  successTitle: { fontSize: 28, fontWeight: '800', color: '#1F2937', marginTop: 20 },
  successSubtitle: { fontSize: 15, color: '#6B7280', textAlign: 'center', marginTop: 8 },
  doneButton: {
    backgroundColor: '#6F4E37', borderRadius: 12, paddingHorizontal: 40,
    paddingVertical: 14, marginTop: 32,
  },
  doneButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
