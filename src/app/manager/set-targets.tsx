import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { managerService, type StaffMember } from '@/services/manager.service';
import { targetService } from '@/services/target.service';
import { COLORS, BorderRadius, Shadow, Spacing } from '@/constants/theme';
import {
  FormField,
  FormDatePicker,
  FormSelect,
  FormErrorText,
  FormSubmitButton,
  ConfirmationModal,
  StatusChip,
} from '@/components/forms';
import { validators } from '@/utils/validators';

type Period = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

const TARGET_TYPES = [
  { value: 'sales_performance', label: 'Sales' },
  { value: 'training', label: 'Training' },
  { value: 'customer_service', label: 'Customer Service' },
  { value: 'attendance', label: 'Attendance' },
  { value: 'compliance', label: 'Compliance' },
];

const METRIC_TYPES = [
  { value: 'sales_amount', label: 'Sales Amount (₹)' },
  { value: 'units_sold', label: 'Units Sold' },
  { value: 'score', label: 'Score (%)' },
  { value: 'percentage', label: 'Percentage (%)' },
  { value: 'count', label: 'Count' },
];

const CATEGORIES = [
  { value: 'sofa', label: 'Sofa' },
  { value: 'mattress', label: 'Mattress' },
  { value: 'modular_kitchen', label: 'Modular Kitchen' },
  { value: 'home_decor', label: 'Home Decor' },
  { value: 'all', label: 'All Categories' },
];

const PERIODS: { value: Period; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];

interface Errors {
  staffId?: string;
  targetType?: string;
  metricType?: string;
  category?: string;
  targetValue?: string;
  periodStart?: string;
  periodEnd?: string;
}

export default function SetTargetsScreen() {
  const { prefill_id } = useLocalSearchParams<{ prefill_id?: string }>();

  const [team, setTeam] = useState<StaffMember[]>([]);
  const [teamLoading, setTeamLoading] = useState(true);
  const [selectedStaffId, setSelectedStaffId] = useState(prefill_id ?? '');
  const [targetType, setTargetType] = useState('sales_performance');
  const [metricType, setMetricType] = useState('sales_amount');
  const [category, setCategory] = useState('all');
  const [period, setPeriod] = useState<Period>('monthly');
  const [targetValue, setTargetValue] = useState('');
  const [unit, setUnit] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');

  const [errors, setErrors] = useState<Errors>({});
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => { loadTeam(); }, []);

  async function loadTeam() {
    try {
      const data = await managerService.getTeam();
      setTeam(data);
    } catch {
      // ignore
    } finally {
      setTeamLoading(false);
    }
  }

  const staffOptions = team.map((m) => ({
    value: m.id,
    label: `${m.full_name} · ${m.designation}`,
  }));

  const selectedStaff = team.find((m) => m.id === selectedStaffId);

  function validate(): boolean {
    const e: Errors = {};
    if (!selectedStaffId) e.staffId = 'Please select a staff member.';
    if (!targetType) e.targetType = 'Target type is required.';
    if (!metricType) e.metricType = 'Metric type is required.';
    if (!category) e.category = 'Category is required.';
    if (!targetValue.trim() || isNaN(Number(targetValue)) || Number(targetValue) <= 0) {
      e.targetValue = 'Please enter a valid target value greater than zero.';
    }
    if (!periodStart) {
      e.periodStart = 'Start date is required.';
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(periodStart)) {
      e.periodStart = 'Start date must be YYYY-MM-DD format.';
    }
    if (!periodEnd) {
      e.periodEnd = 'End date is required.';
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(periodEnd)) {
      e.periodEnd = 'End date must be YYYY-MM-DD format.';
    } else if (periodStart && periodEnd <= periodStart) {
      e.periodEnd = 'End date must be after start date.';
    }
    const cleaned: Errors = Object.fromEntries(
      Object.entries(e).filter(([, v]) => !!v)
    ) as Errors;
    setErrors(cleaned);
    return Object.keys(cleaned).length === 0;
  }

  function handlePressSubmit() {
    setSubmitError('');
    if (!validate()) return;
    setShowConfirm(true);
  }

  async function handleConfirmedSubmit() {
    setShowConfirm(false);
    setLoading(true);
    setSubmitError('');
    try {
      await targetService.createTarget({
        staff_id: selectedStaffId,
        target_type: targetType,
        metric_type: metricType,
        category,
        period,
        period_start: periodStart.trim(),
        period_end: periodEnd.trim(),
        target_value: Number(targetValue),
        achieved_value: 0,
        unit: unit.trim() || '₹',
      });
      showToast('Target set successfully.');
      setTimeout(() => router.back(), 1400);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to set target. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2500);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Set Target</Text>
      </View>

      {toastMsg ? (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toastMsg}</Text>
        </View>
      ) : null}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Staff Selector */}
          <FormSelect
            label="Select Staff"
            value={selectedStaffId}
            options={teamLoading ? [] : staffOptions}
            onSelect={(v) => { setSelectedStaffId(v); setErrors((e) => ({ ...e, staffId: '' })); }}
            placeholder={teamLoading ? 'Loading team…' : 'Tap to select staff member…'}
            error={errors.staffId}
            required
            helper="Choose which staff member this target is for"
          />

          {/* Target Type chips */}
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Target Type *</Text>
            <Text style={styles.fieldHint}>The broad performance area</Text>
            <View style={styles.chipRow}>
              {TARGET_TYPES.map((t) => (
                <TouchableOpacity
                  key={t.value}
                  onPress={() => { setTargetType(t.value); setErrors((e) => ({ ...e, targetType: '' })); }}
                  activeOpacity={0.8}
                >
                  <StatusChip label={t.label} variant="primary" selected={targetType === t.value} />
                </TouchableOpacity>
              ))}
            </View>
            <FormErrorText error={errors.targetType} />
          </View>

          {/* Metric Type chips */}
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Metric Type *</Text>
            <Text style={styles.fieldHint}>What will be measured</Text>
            <View style={styles.chipRow}>
              {METRIC_TYPES.map((m) => (
                <TouchableOpacity
                  key={m.value}
                  onPress={() => { setMetricType(m.value); setErrors((e) => ({ ...e, metricType: '' })); }}
                  activeOpacity={0.8}
                >
                  <StatusChip label={m.label} variant="info" selected={metricType === m.value} />
                </TouchableOpacity>
              ))}
            </View>
            <FormErrorText error={errors.metricType} />
          </View>

          {/* Category chips */}
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Product Category *</Text>
            <View style={styles.chipRow}>
              {CATEGORIES.map((c) => (
                <TouchableOpacity
                  key={c.value}
                  onPress={() => { setCategory(c.value); setErrors((e) => ({ ...e, category: '' })); }}
                  activeOpacity={0.8}
                >
                  <StatusChip label={c.label} variant="success" selected={category === c.value} />
                </TouchableOpacity>
              ))}
            </View>
            <FormErrorText error={errors.category} />
          </View>

          {/* Period chips */}
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Period</Text>
            <View style={styles.chipRow}>
              {PERIODS.map((p) => (
                <TouchableOpacity key={p.value} onPress={() => setPeriod(p.value)} activeOpacity={0.8}>
                  <StatusChip label={p.label} variant="primary" selected={period === p.value} />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Target Value */}
          <FormField
            label="Target Value"
            value={targetValue}
            onChangeText={(v) => { setTargetValue(v); setErrors((e) => ({ ...e, targetValue: '' })); }}
            placeholder="e.g. 450000"
            error={errors.targetValue}
            required
            keyboardType="numeric"
            helper="Enter the numeric target (e.g. 450000 for ₹4,50,000)"
          />

          {/* Unit (optional) */}
          <FormField
            label="Unit"
            value={unit}
            onChangeText={setUnit}
            placeholder="e.g. ₹, units, % (optional)"
            helper="Leave blank if not applicable"
          />

          {/* Date Range */}
          <View style={styles.rowFields}>
            <View style={{ flex: 1 }}>
              <FormDatePicker
                label="Start Date"
                value={periodStart}
                onChangeText={(v) => { setPeriodStart(v); setErrors((e) => ({ ...e, periodStart: '' })); }}
                error={errors.periodStart}
                required
              />
            </View>
            <View style={{ flex: 1 }}>
              <FormDatePicker
                label="End Date"
                value={periodEnd}
                onChangeText={(v) => { setPeriodEnd(v); setErrors((e) => ({ ...e, periodEnd: '' })); }}
                error={errors.periodEnd}
                required
              />
            </View>
          </View>

          {/* Submit error */}
          {submitError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorBoxText}>{submitError}</Text>
            </View>
          ) : null}

          <FormSubmitButton
            label="Set Target"
            onPress={handlePressSubmit}
            loading={loading}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <ConfirmationModal
        visible={showConfirm}
        title="Set Target?"
        message={`Set a ${period} ${targetType.replace(/_/g, ' ')} target of ${targetValue} ${unit || ''} for ${selectedStaff?.full_name ?? 'this staff member'}.`}
        confirmLabel="Set Target"
        cancelLabel="Cancel"
        variant="confirm"
        onConfirm={handleConfirmedSubmit}
        onCancel={() => setShowConfirm(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.beige },
  header: {
    backgroundColor: COLORS.blue,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.white },
  toast: {
    backgroundColor: '#1F2937',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  toastText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  content: { padding: Spacing.three, gap: Spacing.three, paddingBottom: 60 },
  fieldBlock: { gap: 8 },
  fieldLabel: { fontSize: 13, fontWeight: '800', color: COLORS.blue },
  fieldHint: { fontSize: 11, color: '#6B7280', marginTop: -4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  rowFields: { flexDirection: 'row', gap: Spacing.two },
  errorBox: {
    backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA',
    borderRadius: 10, padding: 12,
  },
  errorBoxText: { color: '#DC2626', fontSize: 13, fontWeight: '600' },
});
