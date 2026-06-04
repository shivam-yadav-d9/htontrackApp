import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Award, Download, QrCode, Share2 } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StaffPageHeader } from '@/components/StaffPageHeader';
import { AppCard } from '@/components/ui/AppCard';
import { AppButton } from '@/components/ui/AppButton';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { certificateService } from '@/services/certificate.service';
import { useApi } from '@/hooks/useApi';
import type { Certificate } from '@/types/certificate.types';
import { COLORS, BorderRadius, Shadow, Spacing } from '@/constants/theme';

function buildCertHtml(cert: Certificate): string {
  return `<!DOCTYPE html><html>
<head><meta charset="UTF-8">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Georgia,serif;background:#F7EFE5;display:flex;justify-content:center;align-items:center;min-height:100vh;padding:20px}
.cert{background:#fff;border:8px solid #E87525;border-radius:12px;padding:48px;text-align:center;max-width:720px;position:relative}
.cert::before{content:'';position:absolute;inset:12px;border:2px solid #E6D4BF;border-radius:4px;pointer-events:none}
.logo-row{margin-bottom:24px}
.logo{width:70px;height:70px;background:#123C69;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;color:white;font-size:24px;font-weight:900}
.brand{font-size:22px;font-weight:900;color:#123C69;margin-top:8px;letter-spacing:1px}
.sub-brand{font-size:12px;color:#6B7280;letter-spacing:2px;margin-top:2px}
.divider{width:60px;height:3px;background:#E87525;margin:20px auto}
.cert-title{font-size:12px;color:#6B7280;letter-spacing:3px;text-transform:uppercase;margin-bottom:8px}
.cert-heading{font-size:28px;font-weight:700;color:#123C69;margin-bottom:16px}
.name{font-size:32px;font-weight:900;color:#5A3825;margin-bottom:4px}
.emp-id{font-size:13px;color:#6B7280}
.for-text{font-size:14px;color:#6B7280;margin:20px 0 8px}
.course{font-size:22px;font-weight:800;color:#123C69;margin-bottom:8px}
.score{display:inline-block;background:#1F8A5B;color:white;padding:4px 16px;border-radius:20px;font-size:14px;font-weight:700;margin-bottom:16px}
.date{font-size:13px;color:#6B7280;margin-bottom:20px}
.code{font-size:11px;color:#6B7280;font-family:monospace;margin-bottom:24px}
.footer{display:flex;justify-content:space-between;border-top:1px solid #EFE1D1;padding-top:20px}
.sig{text-align:center;font-size:12px;color:#6B7280}
.sig-name{font-weight:700;color:#5A3825;font-size:13px;margin-bottom:2px}
</style></head>
<body><div class="cert">
<div class="logo-row"><div class="logo">HT</div></div>
<div class="brand">HomeTown India</div>
<div class="sub-brand">KARMYOGI WORKFORCE APP</div>
<div class="divider"></div>
<div class="cert-title">Certificate of Achievement</div>
<div class="cert-heading">This is to certify that</div>
<div class="name">${cert.employee_name}</div>
<div class="emp-id">Employee ID: ${cert.employee_id} | ${cert.store_name}</div>
<div class="for-text">has successfully completed</div>
<div class="course">${cert.course_title}</div>
<div class="score">Score: ${cert.score}%</div>
<div class="date">Issued on: ${new Date(cert.issued_at).toDateString()}</div>
<div class="code">Certificate Code: ${cert.certificate_code}</div>
<div class="footer">
<div class="sig"><div class="sig-name">HomeTown India Pvt. Ltd.</div>Authorized Signatory</div>
<div class="sig"><div class="sig-name">L&D Department</div>Karmyogi Workforce App</div>
</div></div></body></html>`;
}

export default function CertificatesScreen() {
  const { data, loading, error, refresh } = useApi(certificateService.getMyCertificates);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [detail, setDetail] = useState<Certificate | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const certs = data ?? [];

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  async function handleDownload(cert: Certificate) {
    setDownloading(cert.id);
    try {
      const html = buildCertHtml(cert);
      const { uri } = await Print.printToFileAsync({ html, width: 792, height: 612 });
      const dest = new File(Paths.document, `${cert.certificate_code}.pdf`);
      new File(uri).copy(dest);
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(dest.uri, { mimeType: 'application/pdf', dialogTitle: `${cert.course_title} Certificate` });
      } else {
        Alert.alert('Saved', 'Certificate saved to your documents.');
      }
    } catch {
      Alert.alert('Error', 'Failed to generate certificate PDF.');
    } finally {
      setDownloading(null);
    }
  }

  if (loading && !refreshing) return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StaffPageHeader title="My Certificates" />
      <LoadingState message="Loading certificates..." />
    </SafeAreaView>
  );

  if (error && certs.length === 0) return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StaffPageHeader title="My Certificates" />
      <ErrorState message={error} onRetry={refresh} />
    </SafeAreaView>
  );

  if (detail) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <StaffPageHeader title="Certificate Detail" showBack onBack={() => setDetail(null)} />
        <ScrollView contentContainerStyle={styles.content}>
          <View style={[styles.certPreview, Shadow.strong]}>
            <View style={styles.certTop}>
              <View style={styles.certLogo}><Text style={styles.certLogoText}>HT</Text></View>
              <Text style={styles.certBrand}>HomeTown India</Text>
              <Text style={styles.certSub}>KARMYOGI WORKFORCE APP</Text>
            </View>
            <View style={styles.certDivider} />
            <Text style={styles.certHeading}>Certificate of Achievement</Text>
            <Text style={styles.certPresented}>This is to certify that</Text>
            <Text style={styles.certName}>{detail.employee_name}</Text>
            <Text style={styles.certEmpId}>{detail.employee_id} | {detail.store_name}</Text>
            <Text style={styles.certForText}>has successfully completed</Text>
            <Text style={styles.certCourse}>{detail.course_title}</Text>
            <View style={styles.certScoreBadge}>
              <Text style={styles.certScoreText}>Score: {detail.score}%</Text>
            </View>
            <Text style={styles.certDate}>Issued: {new Date(detail.issued_at).toDateString()}</Text>
            <Text style={styles.certCode}>{detail.certificate_code}</Text>
          </View>

          <View style={styles.actionBtns}>
            <AppButton
              label="Download PDF"
              onPress={() => handleDownload(detail)}
              loading={downloading === detail.id}
              icon={<Download size={16} color={COLORS.white} />}
            />
            <AppButton
              label="Share"
              onPress={() => handleDownload(detail)}
              variant="outline"
              icon={<Share2 size={16} color={COLORS.orange} />}
            />
          </View>

          <AppCard style={styles.verifyCard}>
            <View style={styles.verifyRow}>
              <QrCode size={24} color={COLORS.blue} />
              <View>
                <Text style={styles.verifyTitle}>Verify Certificate</Text>
                <Text style={styles.verifyUrl}>{detail.verification_url}</Text>
              </View>
            </View>
          </AppCard>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StaffPageHeader title="My Certificates" subtitle={`${certs.length} earned`} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.orange]} />}>
        {certs.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Award size={48} color={COLORS.gray} />
            <Text style={styles.emptyTitle}>No Certificates Yet</Text>
            <Text style={styles.emptySubtitle}>Complete a course and pass the quiz to earn your first certificate.</Text>
          </View>
        )}
        {certs.map((cert) => (
          <TouchableOpacity key={cert.id} style={[styles.certCard, Shadow.card]} onPress={() => setDetail(cert)} activeOpacity={0.85}>
            <View style={styles.certCardLeft}>
              <View style={styles.certCardIcon}>
                <Award size={24} color={COLORS.warning} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.certCardTitle}>{cert.course_title}</Text>
                <Text style={styles.certCardCode}>{cert.certificate_code}</Text>
                <Text style={styles.certCardMeta}>
                  Score: <Text style={{ color: COLORS.success, fontWeight: '700' }}>{cert.score}%</Text>  •  {new Date(cert.issued_at).toDateString()}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.downloadBtnSmall, downloading === cert.id && { opacity: 0.6 }]}
              onPress={(e) => { e.stopPropagation?.(); handleDownload(cert); }}
              disabled={downloading === cert.id}>
              {downloading === cert.id ? <ActivityIndicator size="small" color={COLORS.white} /> : <Download size={16} color={COLORS.white} />}
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.beige },
  content: { padding: Spacing.three, gap: Spacing.two, paddingBottom: 40 },
  certCard: {
    backgroundColor: COLORS.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  certCardLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  certCardIcon: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.medium,
    backgroundColor: COLORS.warning + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  certCardTitle: { fontSize: 14, fontWeight: '800', color: COLORS.grayDark },
  certCardCode: { fontSize: 11, color: COLORS.gray, fontFamily: 'monospace' },
  certCardMeta: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  downloadBtnSmall: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  certPreview: {
    backgroundColor: COLORS.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.four,
    borderWidth: 4,
    borderColor: COLORS.orange,
    alignItems: 'center',
    gap: Spacing.two,
  },
  certTop: { alignItems: 'center', gap: 4 },
  certLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  certLogoText: { fontSize: 20, fontWeight: '900', color: COLORS.white },
  certBrand: { fontSize: 16, fontWeight: '900', color: COLORS.blue },
  certSub: { fontSize: 10, color: COLORS.gray, letterSpacing: 1.5 },
  certDivider: { width: 48, height: 3, backgroundColor: COLORS.orange },
  certHeading: { fontSize: 18, fontWeight: '700', color: COLORS.blue },
  certPresented: { fontSize: 13, color: COLORS.gray },
  certName: { fontSize: 24, fontWeight: '900', color: COLORS.brown },
  certEmpId: { fontSize: 12, color: COLORS.gray },
  certForText: { fontSize: 13, color: COLORS.gray },
  certCourse: { fontSize: 18, fontWeight: '800', color: COLORS.blue, textAlign: 'center' },
  certScoreBadge: { backgroundColor: COLORS.success, borderRadius: BorderRadius.pill, paddingHorizontal: Spacing.three, paddingVertical: 4 },
  certScoreText: { color: COLORS.white, fontWeight: '700', fontSize: 13 },
  certDate: { fontSize: 13, color: COLORS.gray },
  certCode: { fontSize: 11, color: COLORS.gray, fontFamily: 'monospace' },
  actionBtns: { gap: Spacing.two },
  verifyCard: { gap: Spacing.one },
  verifyRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  verifyTitle: { fontSize: 13, fontWeight: '700', color: COLORS.blue },
  verifyUrl: { fontSize: 11, color: COLORS.orange },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: Spacing.two },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.grayDark },
  emptySubtitle: { fontSize: 14, color: COLORS.gray, textAlign: 'center' },
});
