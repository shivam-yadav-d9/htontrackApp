import { router, useLocalSearchParams } from 'expo-router';
import { Award, Calendar, ChevronLeft, Hash, Share2, Star, User } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, ScrollView, Share, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS, BorderRadius, Spacing, Shadow } from '@/constants/theme';
import { courseService } from '@/services/course.service';

type CertData = {
  certificate_id?: string;
  certificate_number?: string;
  employee_name?: string;
  employee_code?: string;
  course_title?: string;
  course_id?: string;
  score?: number;
  percentage?: number;
  grade?: string;
  issued_at?: string;
  completed_at?: string;
  store_name?: string;
  manager_name?: string;
  pass_percentage?: number;
  certificate_template?: string;
  badge_type?: string;
  badge_level?: string;
  qr_verification_code?: string;
};

const GRADE_COLOR: Record<string, string> = {
  'A+': '#C8A24A',
  A: '#E87525',
  B: COLORS.success,
  C: COLORS.blue,
  D: COLORS.gray,
};

const BADGE_COLOR: Record<string, string> = {
  platinum: '#8B5CF6',
  gold: '#C8A24A',
  silver: '#6B7280',
  bronze: '#B85C1E',
};

export default function CourseCertificateScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const [cert, setCert] = useState<CertData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!courseId || courseId === 'undefined') return;
    setLoading(true);
    setError(null);
    try {
      const data = await courseService.getCourseCertificate(courseId);
      setCert(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Certificate not found');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => { load(); }, [load]);

  async function handleShare() {
    if (!cert) return;
    try {
      await Share.share({
        message: `I earned a certificate for "${cert.course_title}" on HomeTown Karmyogi!\nScore: ${cert.percentage ?? cert.score}%${cert.grade ? ` (${cert.grade})` : ''}\nCertificate #${cert.certificate_number ?? cert.certificate_id}`,
        title: 'My Course Certificate',
      });
    } catch {
      // share cancelled
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.orange} size="large" />
          <Text style={styles.loadingText}>Loading certificate...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !cert) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.center}>
          <Award size={48} color={COLORS.gray} />
          <Text style={styles.errorTitle}>Certificate Not Available</Text>
          <Text style={styles.errorText}>{error ?? 'No certificate found for this course.'}</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const grade = cert.grade ?? '';
  const badgeLevel = cert.badge_level ?? 'bronze';
  const badgeType = cert.badge_type ?? 'certified_learner';
  const issueDate = cert.issued_at ?? cert.completed_at ?? '';
  const formattedDate = issueDate ? new Date(issueDate).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  }) : '';
  const gradeColor = GRADE_COLOR[grade] ?? COLORS.orange;
  const badgeColor = BADGE_COLOR[badgeLevel] ?? COLORS.orange;
  const isPremium = cert.certificate_template === 'premium_gold';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.topBackBtn}>
          <ChevronLeft size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Certificate</Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
          <Share2 size={18} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Certificate card */}
        <View style={[styles.certCard, isPremium && styles.certCardPremium, Shadow.card]}>
          {/* Gold border strip */}
          <View style={[styles.topStrip, { backgroundColor: isPremium ? '#C8A24A' : COLORS.orange }]} />

          {/* Header */}
          <View style={styles.certHeader}>
            <View style={[styles.logoCircle, { backgroundColor: isPremium ? '#C8A24A22' : COLORS.orangeLight }]}>
              <Award size={28} color={isPremium ? '#C8A24A' : COLORS.orange} />
            </View>
            <Text style={[styles.brandName, { color: isPremium ? '#C8A24A' : COLORS.orange }]}>
              HOMETOWN KARMYOGI
            </Text>
            <Text style={styles.certLabel}>CERTIFICATE OF ACHIEVEMENT</Text>
          </View>

          <View style={styles.divider} />

          {/* Recipient */}
          <View style={styles.recipientSection}>
            <Text style={styles.presentedTo}>This is to certify that</Text>
            <Text style={styles.employeeName}>{cert.employee_name ?? 'Employee'}</Text>
            {cert.employee_code && (
              <Text style={styles.employeeCode}>{cert.employee_code}</Text>
            )}
          </View>

          {/* Course */}
          <View style={styles.courseSection}>
            <Text style={styles.hasCompleted}>has successfully completed</Text>
            <Text style={styles.courseTitle}>{cert.course_title ?? 'Training Course'}</Text>
          </View>

          {/* Score & Grade */}
          <View style={styles.scoreRow}>
            <View style={[styles.scoreBubble, { backgroundColor: gradeColor + '15', borderColor: gradeColor + '44' }]}>
              <Text style={[styles.scoreNum, { color: gradeColor }]}>
                {cert.percentage ?? cert.score ?? 0}%
              </Text>
              {grade && <Text style={[styles.gradeLabel, { color: gradeColor }]}>Grade {grade}</Text>}
            </View>
            <View style={[styles.badgeBubble, { backgroundColor: badgeColor + '15', borderColor: badgeColor + '44' }]}>
              <Star size={16} color={badgeColor} fill={badgeColor} />
              <Text style={[styles.badgeText, { color: badgeColor }]}>
                {badgeType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Metadata */}
          <View style={styles.metaGrid}>
            {formattedDate ? (
              <MetaItem icon={<Calendar size={13} color={COLORS.gray} />} label="Issued On" value={formattedDate} />
            ) : null}
            {cert.store_name ? (
              <MetaItem icon={<User size={13} color={COLORS.gray} />} label="Store" value={cert.store_name} />
            ) : null}
            {cert.certificate_number || cert.certificate_id ? (
              <MetaItem
                icon={<Hash size={13} color={COLORS.gray} />}
                label="Certificate No."
                value={`#${cert.certificate_number ?? cert.certificate_id}`}
              />
            ) : null}
          </View>

          {/* QR placeholder */}
          {cert.qr_verification_code && (
            <View style={styles.qrSection}>
              <View style={styles.qrBox}>
                <Text style={styles.qrCode}>{cert.qr_verification_code.slice(0, 8).toUpperCase()}</Text>
              </View>
              <Text style={styles.qrLabel}>Scan to verify</Text>
            </View>
          )}

          {/* Bottom strip */}
          <View style={[styles.bottomStrip, { backgroundColor: isPremium ? '#C8A24A' : COLORS.orange }]} />
        </View>

        {/* Share button */}
        <TouchableOpacity style={styles.shareFullBtn} onPress={handleShare}>
          <Share2 size={16} color={COLORS.white} />
          <Text style={styles.shareFullBtnText}>Share Certificate</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.courseLinkBtn} onPress={() => router.back()}>
          <Text style={styles.courseLinkText}>Back to Course</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function MetaItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 3 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        {icon}
        <Text style={{ fontSize: 10, color: COLORS.gray, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Text>
      </View>
      <Text style={{ fontSize: 12, color: COLORS.grayDark, fontWeight: '700', textAlign: 'center' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.beige },
  topBar: {
    backgroundColor: COLORS.blue,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
  },
  topBackBtn: { padding: Spacing.one },
  topTitle: { flex: 1, fontSize: 16, fontWeight: '800', color: COLORS.white, textAlign: 'center' },
  shareBtn: { padding: Spacing.one },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: Spacing.three },
  loadingText: { fontSize: 14, color: COLORS.gray },
  errorTitle: { fontSize: 18, fontWeight: '700', color: COLORS.grayDark },
  errorText: { fontSize: 14, color: COLORS.gray, textAlign: 'center' },
  backBtn: { backgroundColor: COLORS.orange, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  backBtnText: { color: COLORS.white, fontWeight: '700' },

  content: { padding: Spacing.three, gap: Spacing.two, paddingTop: 20 },

  certCard: {
    backgroundColor: COLORS.white,
    borderRadius: BorderRadius.xlarge,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  certCardPremium: {
    borderColor: '#C8A24A44',
    borderWidth: 2,
  },
  topStrip: { height: 6 },
  bottomStrip: { height: 6 },

  certHeader: { alignItems: 'center', paddingTop: Spacing.three, paddingBottom: Spacing.two, gap: 8 },
  logoCircle: {
    width: 60, height: 60, borderRadius: 30,
    alignItems: 'center', justifyContent: 'center',
  },
  brandName: { fontSize: 12, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },
  certLabel: {
    fontSize: 10, fontWeight: '700', color: COLORS.gray,
    letterSpacing: 2.5, textTransform: 'uppercase',
  },

  divider: { height: 1, backgroundColor: COLORS.border, marginHorizontal: Spacing.three },

  recipientSection: { alignItems: 'center', paddingVertical: Spacing.three, gap: 6 },
  presentedTo: { fontSize: 12, color: COLORS.gray, fontStyle: 'italic' },
  employeeName: { fontSize: 22, fontWeight: '900', color: COLORS.grayDark, textAlign: 'center' },
  employeeCode: { fontSize: 12, color: COLORS.gray },

  courseSection: { alignItems: 'center', paddingHorizontal: Spacing.three, paddingBottom: Spacing.two, gap: 6 },
  hasCompleted: { fontSize: 12, color: COLORS.gray, fontStyle: 'italic' },
  courseTitle: { fontSize: 16, fontWeight: '800', color: COLORS.blue, textAlign: 'center', lineHeight: 22 },

  scoreRow: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.two, paddingHorizontal: Spacing.three, paddingBottom: Spacing.two },
  scoreBubble: {
    flex: 1, alignItems: 'center', gap: 2,
    borderRadius: BorderRadius.large, borderWidth: 1,
    paddingVertical: Spacing.two,
  },
  scoreNum: { fontSize: 22, fontWeight: '900' },
  gradeLabel: { fontSize: 12, fontWeight: '700' },
  badgeBubble: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderRadius: BorderRadius.large, borderWidth: 1,
    paddingVertical: Spacing.two,
  },
  badgeText: { fontSize: 12, fontWeight: '700', textAlign: 'center', flexShrink: 1 },

  metaGrid: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    gap: Spacing.one,
  },

  qrSection: { alignItems: 'center', paddingBottom: Spacing.two, gap: 6 },
  qrBox: {
    width: 60, height: 60, borderRadius: 8,
    borderWidth: 2, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.beigeLight,
  },
  qrCode: { fontSize: 10, fontWeight: '900', color: COLORS.grayDark, letterSpacing: 1 },
  qrLabel: { fontSize: 10, color: COLORS.gray },

  shareFullBtn: {
    backgroundColor: COLORS.orange,
    borderRadius: BorderRadius.medium,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  shareFullBtnText: { color: COLORS.white, fontWeight: '800', fontSize: 15 },
  courseLinkBtn: { alignItems: 'center', paddingVertical: 12 },
  courseLinkText: { color: COLORS.gray, fontWeight: '600', fontSize: 14 },
});
