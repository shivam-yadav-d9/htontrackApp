import { AdminBottomNav } from "@/components/admin/AdminBottomNav";
import { certificateService } from "@/services";
import {
  Award, ChevronDown, ChevronRight, ChevronUp, Download,
  Eye, GraduationCap, Plus, QrCode, Search, Shield,
  Trophy, X, XCircle, CheckCircle2,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Alert, Image, Modal, RefreshControl, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const htLogo = require("../../../../assets/images/hometown-logo.png");

const C = {
  navy: "#102B45", orange: "#C95F18", gold: "#B7791F", beige: "#F6EBDC",
  cream: "#FFFDF8", muted: "#8A8178", brown: "#6B3F20", green: "#166534",
  red: "#B91C1C", white: "#FFFFFF",
};

type Badge = "Gold" | "Silver" | "Bronze" | "Participation" | "None";
type CertStatus = "Issued" | "Downloaded" | "Revoked" | "Reissued";

type Certificate = {
  id: string;
  certId: string;
  staffName: string;
  empCode: string;
  store: string;
  manager: string;
  course: string;
  courseSection: string;
  score: number;
  result: "Pass" | "Fail";
  badge: Badge;
  completedAt: string;
  issuedAt: string;
  status: CertStatus;
  downloads: number;
};


const BADGE_CFG: Record<Badge, { seal: string; bg: string; text: string; border: string; color: string }> = {
  Gold:          { seal: "🥇", bg: "#FEFCE8", text: "#A16207", border: "#FDE047", color: "#B7791F" },
  Silver:        { seal: "🥈", bg: "#F8FAFC", text: "#475569", border: "#CBD5E1", color: "#64748B" },
  Bronze:        { seal: "🥉", bg: "#FFF7ED", text: "#C2410C", border: "#FED7AA", color: "#C2623E" },
  Participation: { seal: "🎓", bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE", color: "#3B82F6" },
  None:          { seal: "—",  bg: "#F9FAFB", text: "#6B7280", border: "#E5E7EB", color: "#9CA3AF" },
};

const STATUS_CFG: Record<CertStatus, { bg: string; text: string; border: string }> = {
  Issued:     { bg: "#F0FDF4", text: "#166534", border: "#BBF7D0" },
  Downloaded: { bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE" },
  Revoked:    { bg: "#FEF2F2", text: "#B91C1C", border: "#FECACA" },
  Reissued:   { bg: "#FFFBEB", text: "#B45309", border: "#FDE68A" },
};

function mapApiCert(raw: any, idx: number): Certificate {
  const score = raw.score ?? 0;
  const badge: Badge = score >= 90 ? "Gold" : score >= 75 ? "Silver" : score >= 60 ? "Bronze" : "Participation";
  const isRevoked = raw.status === "revoked" || raw.is_revoked === true;
  const dlCount = raw.downloads_count ?? raw.downloads ?? 0;
  const status: CertStatus = isRevoked ? "Revoked" : raw.status === "reissued" ? "Reissued" : dlCount > 0 ? "Downloaded" : "Issued";
  return {
    id: raw.id ?? `api-${idx}`,
    certId: raw.certificate_code ?? raw.certificate_number ?? `HT-CERT-${String(idx + 1).padStart(4, "0")}`,
    staffName: raw.employee_name ?? raw.staff_name ?? "Unknown",
    empCode: raw.employee_id ?? raw.employee_number ?? raw.employee_code ?? "",
    store: raw.store_name ?? "",
    manager: raw.manager_name ?? "",
    course: raw.course_title ?? raw.course_name ?? "",
    courseSection: raw.course_section ?? raw.modules_completed ?? "",
    score,
    result: score >= 50 ? "Pass" : "Fail",
    badge,
    completedAt: (raw.completed_at ?? raw.issued_at ?? "").substring(0, 10),
    issuedAt: (raw.issued_at ?? "").substring(0, 10),
    status,
    downloads: dlCount,
  };
}

function CertCard({ cert, onPreview, onRevoke }: {
  cert: Certificate;
  onPreview: () => void;
  onRevoke: () => void;
}) {
  const b = BADGE_CFG[cert.badge];
  const s = STATUS_CFG[cert.status];

  return (
    <View style={cs.certCard}>
      <View style={cs.certCardTop}>
        <View style={[cs.badgeSeal, { backgroundColor: b.bg, borderColor: b.border }]}>
          <Text style={cs.badgeSealText}>{b.seal}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={cs.staffName}>{cert.staffName}</Text>
          <Text style={cs.empCode}>{cert.empCode} · {cert.store}</Text>
        </View>
        <View style={[cs.statusBadge, { backgroundColor: s.bg, borderColor: s.border }]}>
          <Text style={[cs.statusText, { color: s.text }]}>{cert.status}</Text>
        </View>
      </View>

      <Text style={cs.courseName} numberOfLines={1}>{cert.course}</Text>
      <Text style={cs.courseSection} numberOfLines={1}>{cert.courseSection}</Text>

      <View style={cs.certStats}>
        <View style={cs.certStat}>
          <Text style={[cs.certStatValue, { color: b.color }]}>{cert.score}%</Text>
          <Text style={cs.certStatLabel}>Score</Text>
        </View>
        <View style={cs.certStatDivider} />
        <View style={cs.certStat}>
          <Text style={[cs.certStatValue, { color: cert.result === "Pass" ? C.green : C.red }]}>{cert.result}</Text>
          <Text style={cs.certStatLabel}>Result</Text>
        </View>
        <View style={cs.certStatDivider} />
        <View style={cs.certStat}>
          <Text style={[cs.certStatValue, { color: b.color }]}>{b.seal} {cert.badge}</Text>
          <Text style={cs.certStatLabel}>Badge</Text>
        </View>
        <View style={cs.certStatDivider} />
        <View style={cs.certStat}>
          <Text style={cs.certStatValue}>{cert.completedAt}</Text>
          <Text style={cs.certStatLabel}>Completed</Text>
        </View>
      </View>

      <Text style={cs.certId}>{cert.certId}</Text>

      <View style={cs.certActions}>
        <TouchableOpacity style={cs.certActionBtn} onPress={onPreview}>
          <Eye size={13} color={C.navy} />
          <Text style={cs.certActionText}>View</Text>
        </TouchableOpacity>
        <TouchableOpacity style={cs.certActionBtn} onPress={() => Alert.alert("Download", `Downloading ${cert.certId} as PDF…`)}>
          <Download size={13} color={C.navy} />
          <Text style={cs.certActionText}>Download</Text>
        </TouchableOpacity>
        {cert.status !== "Revoked" && (
          <TouchableOpacity style={[cs.certActionBtn, { borderColor: "#FECACA" }]} onPress={onRevoke}>
            <XCircle size={13} color={C.red} />
            <Text style={[cs.certActionText, { color: C.red }]}>Revoke</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function CertPreviewModal({ cert, onClose }: { cert: Certificate | null; onClose: () => void }) {
  if (!cert) return null;
  const b = BADGE_CFG[cert.badge];

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={cs.modalOverlay}>
        <View style={cs.modalSheet}>
          <View style={cs.modalHeader}>
            <Text style={cs.modalTitle}>Certificate Preview</Text>
            <TouchableOpacity onPress={onClose} style={cs.modalClose}>
              <X size={18} color={C.muted} />
            </TouchableOpacity>
          </View>
          <ScrollView style={cs.modalBody} showsVerticalScrollIndicator={false}>
            {/* Certificate card */}
            <View style={[cs.certPreviewCard, { borderColor: b.border }]}>
              {/* Header with logo */}
              <View style={cs.previewLogoRow}>
                <Image source={htLogo} style={cs.previewLogo} />
                <View style={cs.previewLogoText}>
                  <Text style={cs.previewEyebrow}>HomeTown India Ltd.</Text>
                  <Text style={cs.previewEyebrowSub}>Karmyogi — Staff Development</Text>
                </View>
              </View>
              <Text style={cs.previewTitle}>Certificate of Achievement</Text>
              <View style={[cs.previewLine, { backgroundColor: b.color }]} />

              {/* Badge seal */}
              <View style={[cs.previewBadgeSeal, { backgroundColor: b.bg, borderColor: b.border }]}>
                <Text style={cs.previewBadgeSealText}>{b.seal}</Text>
                <Text style={[cs.previewBadgeLabel, { color: b.text }]}>{cert.badge.toUpperCase()}</Text>
              </View>

              <Text style={cs.previewPresentedTo}>This certificate is proudly presented to</Text>
              <Text style={cs.previewStaffName}>{cert.staffName.toUpperCase()}</Text>
              <Text style={cs.previewEmpInfo}>{cert.empCode} · {cert.store}</Text>

              <Text style={cs.previewForCompleting}>For successfully completing the course</Text>
              <Text style={cs.previewCourseName}>{cert.course}</Text>
              <Text style={cs.previewSection}>{cert.courseSection}</Text>

              <View style={cs.previewScoreRow}>
                <View style={cs.previewScoreItem}>
                  <Text style={[cs.previewScoreValue, { color: b.color }]}>{cert.score}%</Text>
                  <Text style={cs.previewScoreLabel}>Score</Text>
                </View>
                <View style={cs.previewScoreDivider} />
                <View style={cs.previewScoreItem}>
                  <Text style={[cs.previewScoreValue, { color: cert.result === "Pass" ? C.green : C.red }]}>{cert.result}</Text>
                  <Text style={cs.previewScoreLabel}>Result</Text>
                </View>
                <View style={cs.previewScoreDivider} />
                <View style={cs.previewScoreItem}>
                  <Text style={[cs.previewScoreValue, { color: b.color }]}>{b.seal} {cert.badge}</Text>
                  <Text style={cs.previewScoreLabel}>Badge</Text>
                </View>
              </View>

              <Text style={cs.previewDate}>Completion Date: {cert.completedAt}</Text>
              <Text style={cs.previewCertId}>{cert.certId}</Text>

              {/* Signatories */}
              <View style={cs.previewSignRow}>
                <View style={cs.previewSignBlock}>
                  <View style={cs.previewSignScribble}>
                    <Text style={cs.previewSignScribbleText}>Rajesh Sharma</Text>
                  </View>
                  <View style={cs.previewSignLine} />
                  <Text style={cs.previewSignName}>Rajesh Sharma</Text>
                  <Text style={cs.previewSignDesig}>Head — L&D</Text>
                  <Text style={cs.previewSignDesig}>HomeTown India Ltd.</Text>
                </View>
                <View style={cs.previewQR}>
                  <QrCode size={30} color={C.muted} />
                  <Text style={cs.previewQRText}>Verify</Text>
                </View>
                <View style={cs.previewSignBlock}>
                  <View style={cs.previewSignScribble}>
                    <Text style={cs.previewSignScribbleText}>{cert.manager}</Text>
                  </View>
                  <View style={cs.previewSignLine} />
                  <Text style={cs.previewSignName}>{cert.manager}</Text>
                  <Text style={cs.previewSignDesig}>Store Manager</Text>
                  <Text style={cs.previewSignDesig}>{cert.store}</Text>
                </View>
              </View>

              <Text style={cs.previewVerifyNote}>Verify at ontrack.hometown.co.in/verify · {cert.certId}</Text>
            </View>

            <TouchableOpacity
              style={cs.downloadBtn}
              onPress={() => Alert.alert("Download PDF", `Downloading ${cert.certId}…`)}
            >
              <Download size={15} color={C.white} />
              <Text style={cs.downloadBtnText}>Download PDF</Text>
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

type TabType = "all" | "byCourse" | "verify";
type BadgeFilter = "all" | Badge;

export default function CertificatesScreen() {
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [tab, setTab] = useState<TabType>("all");

  useEffect(() => {
    certificateService.getAdminCertificates({ period_key: "2026-05" })
      .then((res) => {
        const mapped = (res.certificates ?? []).map(mapApiCert);
        setCerts(mapped);
      })
      .catch(() => setCerts([]));
  }, []);
  const [badgeFilter, setBadgeFilter] = useState<BadgeFilter>("all");
  const [search, setSearch] = useState("");
  const [previewCert, setPreviewCert] = useState<Certificate | null>(null);
  const [verifyInput, setVerifyInput] = useState("");
  const [verifyResult, setVerifyResult] = useState<Certificate | null | "not-found">(null);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const stats = {
    total: certs.length,
    gold: certs.filter((c) => c.badge === "Gold").length,
    silver: certs.filter((c) => c.badge === "Silver").length,
    bronze: certs.filter((c) => c.badge === "Bronze").length,
    downloads: certs.reduce((s, c) => s + c.downloads, 0),
  };

  const filtered = certs.filter((c) => {
    const matchBadge = badgeFilter === "all" || c.badge === badgeFilter;
    const matchSearch = !search || c.staffName.toLowerCase().includes(search.toLowerCase()) || c.certId.toLowerCase().includes(search.toLowerCase());
    return matchBadge && matchSearch;
  });

  const courseGrouped = certs.reduce<Record<string, Certificate[]>>((map, c) => {
    if (!map[c.course]) map[c.course] = [];
    map[c.course].push(c);
    return map;
  }, {});

  function handleRevoke(id: string) {
    Alert.alert("Revoke Certificate", "Are you sure you want to revoke this certificate?", [
      { text: "Cancel", style: "cancel" },
      { text: "Revoke", style: "destructive", onPress: () => setCerts((prev) => prev.map((c) => c.id === id ? { ...c, status: "Revoked" } : c)) },
    ]);
  }

  function handleVerify() {
    const found = certs.find((c) => c.certId.toLowerCase() === verifyInput.trim().toLowerCase());
    setVerifyResult(found ?? "not-found");
  }

  async function handleRefresh() {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 600));
    setRefreshing(false);
  }

  const BADGE_FILTERS: { key: BadgeFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "Gold", label: "🥇 Gold" },
    { key: "Silver", label: "🥈 Silver" },
    { key: "Bronze", label: "🥉 Bronze" },
    { key: "Participation", label: "🎓 Part." },
  ];

  const TABS: { key: TabType; label: string }[] = [
    { key: "all", label: "All Certs" },
    { key: "byCourse", label: "By Course" },
    { key: "verify", label: "Verify" },
  ];

  return (
    <SafeAreaView style={cs.safe} edges={["top"]}>
      <CertPreviewModal cert={previewCert} onClose={() => setPreviewCert(null)} />

      <View style={cs.root}>
        {/* Header */}
        <View style={cs.header}>
          <View style={cs.headerRow}>
            <View>
              <Text style={cs.eyebrow}>DOCUMENTS</Text>
              <Text style={cs.headerTitle}>Certificate Center</Text>
            </View>
            <TouchableOpacity
              style={cs.genBtn}
              onPress={() => Alert.alert("Generate Certificate", "Use the Admin Web Dashboard to generate certificates from course completions.")}
            >
              <Plus size={15} color={C.white} />
              <Text style={cs.genBtnText}>Generate</Text>
            </TouchableOpacity>
          </View>

          {/* Stats */}
          <View style={cs.statsRow}>
            <View style={cs.statItem}>
              <Text style={cs.statValue}>{stats.total}</Text>
              <Text style={cs.statLabel}>Total</Text>
            </View>
            <View style={cs.statDivider} />
            <View style={cs.statItem}>
              <Text style={[cs.statValue, { color: "#FCD34D" }]}>{stats.gold}</Text>
              <Text style={cs.statLabel}>🥇 Gold</Text>
            </View>
            <View style={cs.statDivider} />
            <View style={cs.statItem}>
              <Text style={[cs.statValue, { color: "#CBD5E1" }]}>{stats.silver}</Text>
              <Text style={cs.statLabel}>🥈 Silver</Text>
            </View>
            <View style={cs.statDivider} />
            <View style={cs.statItem}>
              <Text style={[cs.statValue, { color: "#FED7AA" }]}>{stats.bronze}</Text>
              <Text style={cs.statLabel}>🥉 Bronze</Text>
            </View>
            <View style={cs.statDivider} />
            <View style={cs.statItem}>
              <Text style={[cs.statValue, { color: "#86EFAC" }]}>{stats.downloads}</Text>
              <Text style={cs.statLabel}>Downloads</Text>
            </View>
          </View>

          {/* Badge guide */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
            <View style={{ flexDirection: "row", gap: 6, paddingRight: 4 }}>
              {(["Gold", "Silver", "Bronze", "Participation"] as Badge[]).map((b) => {
                const cfg = BADGE_CFG[b];
                return (
                  <View key={b} style={[cs.badgeGuide, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
                    <Text style={cs.badgeGuideSeal}>{cfg.seal}</Text>
                    <Text style={[cs.badgeGuideText, { color: cfg.text }]}>{b}</Text>
                    <Text style={cs.badgeGuideScore}>
                      {b === "Gold" ? "≥90%" : b === "Silver" ? "75-89%" : b === "Bronze" ? "60-74%" : "50-59%"}
                    </Text>
                  </View>
                );
              })}
            </View>
          </ScrollView>

          {/* Tabs */}
          <View style={cs.tabRow}>
            {TABS.map((t) => (
              <TouchableOpacity key={t.key} style={[cs.tab, tab === t.key && cs.tabActive]} onPress={() => setTab(t.key)}>
                <Text style={[cs.tabText, tab === t.key && cs.tabTextActive]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* All Certs tab */}
        {tab === "all" && (
          <>
            <View style={cs.searchWrap}>
              <Search size={14} color={C.muted} style={{ position: "absolute", left: 28, top: 22 }} />
              <TextInput value={search} onChangeText={setSearch} placeholder="Search by name or cert ID…" placeholderTextColor={C.muted} style={cs.searchInput} />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={cs.filterRow}>
              {BADGE_FILTERS.map((chip) => (
                <TouchableOpacity
                  key={chip.key}
                  style={[cs.filterChip, badgeFilter === chip.key && cs.filterChipActive]}
                  onPress={() => setBadgeFilter(chip.key)}
                >
                  <Text style={[cs.filterChipText, badgeFilter === chip.key && cs.filterChipTextActive]}>{chip.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={cs.scroll}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[C.orange]} tintColor={C.orange} />}
            >
              {filtered.map((cert) => (
                <CertCard key={cert.id} cert={cert} onPreview={() => setPreviewCert(cert)} onRevoke={() => handleRevoke(cert.id)} />
              ))}
              {filtered.length === 0 && (
                <View style={cs.empty}>
                  <Award size={32} color={C.muted} />
                  <Text style={cs.emptyText}>No certificates found</Text>
                </View>
              )}
              <View style={{ height: 24 }} />
            </ScrollView>
          </>
        )}

        {/* By Course tab */}
        {tab === "byCourse" && (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={cs.scroll}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[C.orange]} tintColor={C.orange} />}
          >
            {Object.entries(courseGrouped).map(([course, cList]) => {
              const isOpen = expandedCourse === course;
              const goldCount = cList.filter((c) => c.badge === "Gold").length;
              const silverCount = cList.filter((c) => c.badge === "Silver").length;
              const bronzeCount = cList.filter((c) => c.badge === "Bronze").length;
              const avgScore = Math.round(cList.reduce((s, c) => s + c.score, 0) / cList.length);
              return (
                <View key={course} style={cs.courseGroup}>
                  <TouchableOpacity
                    style={cs.courseGroupHeader}
                    onPress={() => setExpandedCourse(isOpen ? null : course)}
                  >
                    <View style={cs.courseGroupIcon}>
                      <GraduationCap size={16} color={C.gold} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={cs.courseGroupTitle} numberOfLines={1}>{course}</Text>
                      <Text style={cs.courseGroupSub}>{cList.length} certs · Avg {avgScore}%</Text>
                    </View>
                    <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
                      {goldCount > 0 && <Text style={cs.badgeCount}>🥇 {goldCount}</Text>}
                      {silverCount > 0 && <Text style={cs.badgeCount}>🥈 {silverCount}</Text>}
                      {bronzeCount > 0 && <Text style={cs.badgeCount}>🥉 {bronzeCount}</Text>}
                      {isOpen ? <ChevronUp size={15} color={C.muted} /> : <ChevronDown size={15} color={C.muted} />}
                    </View>
                  </TouchableOpacity>
                  {isOpen && (
                    <View style={cs.courseGroupContent}>
                      {cList.map((c) => {
                        const b = BADGE_CFG[c.badge];
                        return (
                          <TouchableOpacity
                            key={c.id}
                            style={[cs.courseStaffCard, { backgroundColor: b.bg, borderColor: b.border }]}
                            onPress={() => setPreviewCert(c)}
                          >
                            <Text style={cs.courseStaffSeal}>{b.seal}</Text>
                            <View style={{ flex: 1 }}>
                              <Text style={cs.courseStaffName}>{c.staffName}</Text>
                              <Text style={cs.courseStaffSub}>{c.empCode} · {c.store}</Text>
                              <Text style={[cs.courseStaffScore, { color: b.color }]}>{c.score}% · {c.badge}</Text>
                            </View>
                            <Eye size={14} color={C.muted} />
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })}
            <View style={{ height: 24 }} />
          </ScrollView>
        )}

        {/* Verify tab */}
        {tab === "verify" && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={cs.scroll}>
            <View style={cs.verifyCard}>
              <View style={cs.verifyIcon}>
                <QrCode size={22} color={C.white} />
              </View>
              <Text style={cs.verifyTitle}>Certificate Verification</Text>
              <Text style={cs.verifySub}>Enter a Certificate ID to verify its authenticity</Text>

              <View style={cs.verifyInputRow}>
                <TextInput
                  value={verifyInput}
                  onChangeText={(t) => { setVerifyInput(t); setVerifyResult(null); }}
                  placeholder="e.g. HT-CERT-2026-0001"
                  placeholderTextColor={C.muted}
                  style={cs.verifyInput}
                  autoCapitalize="characters"
                />
                <TouchableOpacity
                  style={[cs.verifyBtn, !verifyInput.trim() && { opacity: 0.4 }]}
                  onPress={handleVerify}
                  disabled={!verifyInput.trim()}
                >
                  <Shield size={15} color={C.white} />
                  <Text style={cs.verifyBtnText}>Verify</Text>
                </TouchableOpacity>
              </View>

              {verifyResult === "not-found" && (
                <View style={cs.verifyError}>
                  <XCircle size={16} color={C.red} />
                  <Text style={cs.verifyErrorText}>No certificate found for: {verifyInput}</Text>
                </View>
              )}

              {verifyResult && verifyResult !== "not-found" && (
                <View style={cs.verifySuccess}>
                  <View style={cs.verifySuccessHeader}>
                    <CheckCircle2 size={16} color={C.green} />
                    <Text style={cs.verifySuccessTitle}>Valid Certificate</Text>
                  </View>
                  <View style={cs.verifyGrid}>
                    {[
                      ["Staff", verifyResult.staffName],
                      ["Employee Code", verifyResult.empCode],
                      ["Course", verifyResult.course],
                      ["Score", `${verifyResult.score}%`],
                      ["Badge", `${BADGE_CFG[verifyResult.badge].seal} ${verifyResult.badge}`],
                      ["Issued", verifyResult.issuedAt],
                    ].map(([label, value]) => (
                      <View key={label} style={cs.verifyGridItem}>
                        <Text style={cs.verifyGridLabel}>{label}</Text>
                        <Text style={cs.verifyGridValue}>{value}</Text>
                      </View>
                    ))}
                  </View>
                  <TouchableOpacity style={cs.viewCertBtn} onPress={() => { setPreviewCert(verifyResult as Certificate); }}>
                    <Eye size={13} color={C.navy} />
                    <Text style={cs.viewCertBtnText}>View Certificate</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={cs.quickIdsCard}>
              <Text style={cs.quickIdsTitle}>Quick Test IDs</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                {certs.slice(0, 5).map((c) => (
                  <TouchableOpacity
                    key={c.certId}
                    style={cs.quickIdPill}
                    onPress={() => { setVerifyInput(c.certId); setVerifyResult(null); }}
                  >
                    <Text style={cs.quickIdText}>{c.certId}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={{ height: 24 }} />
          </ScrollView>
        )}

        <AdminBottomNav />
      </View>
    </SafeAreaView>
  );
}

const cs = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.navy },
  root: { flex: 1, backgroundColor: C.beige },
  header: { backgroundColor: C.navy, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 16, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  headerRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 },
  eyebrow: { fontSize: 10, fontWeight: "800", color: C.orange, letterSpacing: 2, marginBottom: 2 },
  headerTitle: { fontSize: 22, fontWeight: "900", color: C.white },
  genBtn: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#EAB308", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 7 },
  genBtnText: { fontSize: 12, fontWeight: "800", color: C.white },
  statsRow: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.10)", borderRadius: 16, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.14)" },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 15, fontWeight: "900", color: C.white },
  statLabel: { fontSize: 8, fontWeight: "700", color: "rgba(255,255,255,0.55)", marginTop: 1 },
  statDivider: { width: 1, height: 22, backgroundColor: "rgba(255,255,255,0.14)" },
  badgeGuide: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 10, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 5 },
  badgeGuideSeal: { fontSize: 12 },
  badgeGuideText: { fontSize: 10, fontWeight: "700" },
  badgeGuideScore: { fontSize: 9, color: C.muted, fontWeight: "600" },
  tabRow: { flexDirection: "row", gap: 6, marginTop: 10 },
  tab: { flex: 1, alignItems: "center", paddingVertical: 7, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.10)" },
  tabActive: { backgroundColor: "rgba(255,255,255,0.22)" },
  tabText: { fontSize: 11, fontWeight: "700", color: "rgba(255,255,255,0.55)" },
  tabTextActive: { color: C.white },
  searchWrap: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 },
  searchInput: { backgroundColor: C.white, borderRadius: 14, paddingLeft: 38, paddingRight: 14, paddingVertical: 10, fontSize: 13, color: C.navy, borderWidth: 1, borderColor: "#EAD7C2" },
  filterRow: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: C.white, borderWidth: 1, borderColor: "#EAD7C2" },
  filterChipActive: { backgroundColor: C.navy, borderColor: C.navy },
  filterChipText: { fontSize: 11, fontWeight: "700", color: C.muted },
  filterChipTextActive: { color: C.white },
  scroll: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 100 },
  certCard: { backgroundColor: C.white, borderRadius: 18, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: "#EAD7C2", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  certCardTop: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  badgeSeal: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  badgeSealText: { fontSize: 20 },
  staffName: { fontSize: 14, fontWeight: "900", color: C.navy },
  empCode: { fontSize: 10, color: C.muted, marginTop: 1 },
  statusBadge: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 10, fontWeight: "700" },
  courseName: { fontSize: 12, fontWeight: "700", color: C.brown, marginBottom: 2 },
  courseSection: { fontSize: 10, color: C.muted, marginBottom: 8 },
  certStats: { flexDirection: "row", alignItems: "center", backgroundColor: C.beige, borderRadius: 12, padding: 8, marginBottom: 6 },
  certStat: { flex: 1, alignItems: "center" },
  certStatValue: { fontSize: 12, fontWeight: "800", color: C.navy },
  certStatLabel: { fontSize: 9, color: C.muted, fontWeight: "600", marginTop: 1 },
  certStatDivider: { width: 1, height: 20, backgroundColor: "#EAD7C2" },
  certId: { fontSize: 9, color: C.muted, fontFamily: "monospace", marginBottom: 8 },
  certActions: { flexDirection: "row", gap: 8 },
  certActionBtn: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 10, borderWidth: 1, borderColor: "#EAD7C2", paddingHorizontal: 10, paddingVertical: 7 },
  certActionText: { fontSize: 11, fontWeight: "700", color: C.navy },
  empty: { alignItems: "center", paddingVertical: 60, gap: 10 },
  emptyText: { fontSize: 14, color: C.muted, fontWeight: "700" },
  // By Course
  courseGroup: { backgroundColor: C.white, borderRadius: 18, marginBottom: 12, borderWidth: 1, borderColor: "#EAD7C2", overflow: "hidden" },
  courseGroupHeader: { flexDirection: "row", alignItems: "center", padding: 14, gap: 10 },
  courseGroupIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#FFF4D8", borderWidth: 1, borderColor: "#FDE047", alignItems: "center", justifyContent: "center" },
  courseGroupTitle: { fontSize: 13, fontWeight: "800", color: C.navy },
  courseGroupSub: { fontSize: 10, color: C.muted },
  badgeCount: { fontSize: 11, fontWeight: "700" },
  courseGroupContent: { borderTopWidth: 1, borderTopColor: "#EAD7C2", padding: 10, gap: 8 },
  courseStaffCard: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, borderWidth: 1, padding: 10 },
  courseStaffSeal: { fontSize: 20 },
  courseStaffName: { fontSize: 12, fontWeight: "800", color: C.navy },
  courseStaffSub: { fontSize: 10, color: C.muted },
  courseStaffScore: { fontSize: 11, fontWeight: "700", marginTop: 2 },
  // Verify
  verifyCard: { backgroundColor: C.white, borderRadius: 20, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: "#EAD7C2" },
  verifyIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.navy, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  verifyTitle: { fontSize: 16, fontWeight: "900", color: C.navy, marginBottom: 4 },
  verifySub: { fontSize: 12, color: C.muted, marginBottom: 14 },
  verifyInputRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  verifyInput: { flex: 1, backgroundColor: C.beige, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 12, color: C.navy, fontFamily: "monospace", borderWidth: 1, borderColor: "#EAD7C2" },
  verifyBtn: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: C.navy, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  verifyBtnText: { fontSize: 12, fontWeight: "800", color: C.white },
  verifyError: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FEF2F2", borderRadius: 12, padding: 10, borderWidth: 1, borderColor: "#FECACA" },
  verifyErrorText: { fontSize: 12, color: C.red, fontWeight: "600" },
  verifySuccess: { backgroundColor: "#F0FDF4", borderRadius: 14, padding: 12, borderWidth: 1, borderColor: "#BBF7D0" },
  verifySuccessHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  verifySuccessTitle: { fontSize: 13, fontWeight: "800", color: C.green },
  verifyGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  verifyGridItem: { width: "47%", backgroundColor: C.white, borderRadius: 10, padding: 8, borderWidth: 1, borderColor: "#D1FAE5" },
  verifyGridLabel: { fontSize: 9, color: C.muted, fontWeight: "700" },
  verifyGridValue: { fontSize: 11, fontWeight: "800", color: C.navy, marginTop: 2 },
  viewCertBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: C.white, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: "#BBF7D0", alignSelf: "flex-start" },
  viewCertBtnText: { fontSize: 11, fontWeight: "700", color: C.navy },
  quickIdsCard: { backgroundColor: C.white, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: "#EAD7C2" },
  quickIdsTitle: { fontSize: 11, fontWeight: "700", color: C.muted, letterSpacing: 0.5 },
  quickIdPill: { backgroundColor: C.beige, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: "#EAD7C2" },
  quickIdText: { fontSize: 10, fontFamily: "monospace", color: C.navy, fontWeight: "700" },
  // Preview modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "94%", flex: 1 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#F1E4D6" },
  modalTitle: { fontSize: 15, fontWeight: "800", color: C.navy },
  modalClose: { padding: 4 },
  modalBody: { flex: 1, padding: 16 },
  certPreviewCard: { borderRadius: 20, borderWidth: 3, padding: 20, backgroundColor: C.cream, position: "relative", marginBottom: 16 },
  previewLogoRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 10 },
  previewLogo: { width: 42, height: 42, borderRadius: 21, borderWidth: 2, borderColor: "#FDE68A" },
  previewLogoText: { alignItems: "flex-start" },
  previewEyebrow: { fontSize: 9, color: C.muted, letterSpacing: 2, textAlign: "center" },
  previewEyebrowSub: { fontSize: 8, color: C.muted, letterSpacing: 0.5 },
  previewTitle: { fontSize: 18, fontWeight: "900", color: C.navy, textAlign: "center", letterSpacing: 0.5 },
  previewLine: { height: 2, width: 50, borderRadius: 1, alignSelf: "center", marginTop: 6, marginBottom: 14 },
  previewBadgeSeal: { position: "absolute", top: 16, right: 16, borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 8, paddingVertical: 6, alignItems: "center" },
  previewBadgeSealText: { fontSize: 22 },
  previewBadgeLabel: { fontSize: 8, fontWeight: "900", letterSpacing: 0.5 },
  previewPresentedTo: { fontSize: 10, color: C.muted, textAlign: "center", marginBottom: 4 },
  previewStaffName: { fontSize: 22, fontWeight: "900", color: C.navy, textAlign: "center", letterSpacing: 1 },
  previewEmpInfo: { fontSize: 10, color: C.muted, textAlign: "center", marginBottom: 12 },
  previewForCompleting: { fontSize: 10, color: C.muted, textAlign: "center", marginBottom: 4 },
  previewCourseName: { fontSize: 16, fontWeight: "800", color: C.navy, textAlign: "center" },
  previewSection: { fontSize: 10, color: C.muted, textAlign: "center", marginBottom: 14 },
  previewScoreRow: { flexDirection: "row", alignItems: "center", backgroundColor: C.beige, borderRadius: 14, padding: 10, marginBottom: 12 },
  previewScoreItem: { flex: 1, alignItems: "center" },
  previewScoreValue: { fontSize: 14, fontWeight: "900" },
  previewScoreLabel: { fontSize: 9, color: C.muted, fontWeight: "700" },
  previewScoreDivider: { width: 1, height: 24, backgroundColor: "#EAD7C2" },
  previewDate: { fontSize: 11, color: C.muted, textAlign: "center" },
  previewCertId: { fontSize: 9, color: C.muted, textAlign: "center", fontFamily: "monospace", marginTop: 2, marginBottom: 12 },
  previewSignRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: 10, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#EAD7C2" },
  previewSignBlock: { alignItems: "center" },
  previewSignScribble: { height: 22, width: 90, justifyContent: "flex-end", paddingBottom: 2 },
  previewSignScribbleText: { fontSize: 13, color: C.navy, fontStyle: "italic", opacity: 0.7, letterSpacing: -0.5, textAlign: "center" },
  previewSignLine: { height: 1, width: 90, backgroundColor: "#9CA3AF", marginBottom: 5 },
  previewSignName: { fontSize: 10, fontWeight: "700", color: C.navy },
  previewSignDesig: { fontSize: 9, color: C.muted },
  previewQR: { alignItems: "center" },
  previewQRText: { fontSize: 8, color: C.muted, marginTop: 2 },
  previewVerifyNote: { fontSize: 8, color: C.muted, textAlign: "center", marginTop: 10 },
  downloadBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#EAB308", borderRadius: 16, paddingVertical: 14 },
  downloadBtnText: { fontSize: 14, fontWeight: "800", color: C.white },
});
