import { AdminBottomNav } from "@/components/admin/AdminBottomNav";
import { adminDataService } from "@/services/team.service";
import {
  AlertTriangle, Archive, CheckCircle2, ChevronDown,
  ChevronUp, Eye, FileText, Plus, Search, Send, Shield, X,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator, Alert, Image, Modal, RefreshControl, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const htLogo = require("../../../../assets/images/hometown-logo.png");

const C = {
  navy: "#102B45", orange: "#C95F18", gold: "#B7791F", beige: "#F6EBDC",
  cream: "#FFFDF8", muted: "#8A8178", brown: "#6B3F20", green: "#166534",
  red: "#B91C1C", white: "#FFFFFF",
};

type NoticeStatus = "Draft" | "Generated" | "Published" | "Archived";

type Notice = {
  id: string;
  noticeNumber: string;
  title: string;
  date: string;
  effectiveDate: string;
  issuedBy: string;
  targetAudience: string;
  targetScope: string;
  description: string;
  paragraph1: string;
  paragraph2: string;
  instructions: string[];
  signatoryName: string;
  signatoryDesignation: string;
  status: NoticeStatus;
  ackRequired: boolean;
  ackCount: number;
  totalRecipients: number;
};

// ── API → Notice mapper ────────────────────────────────────────────────────────

function apiStatusToUI(status: string): NoticeStatus {
  switch ((status ?? "").toLowerCase()) {
    case "published": return "Published";
    case "archived":  return "Archived";
    case "generated": return "Generated";
    default:          return "Draft";
  }
}

function mapApiNotice(r: any): Notice {
  const body: string = r.body ?? r.description ?? "";
  const paragraphs = body.split(/\n\n+/).filter(Boolean);
  const instructions: string[] = r.instructions ?? [];

  return {
    id: String(r.id ?? ""),
    noticeNumber: r.notice_number ?? r.noticeNumber ?? "",
    title: r.title ?? "",
    date: (r.published_at ?? r.created_at ?? "").slice(0, 10),
    effectiveDate: r.valid_from ? r.valid_from.slice(0, 10) : (r.effective_date ?? ""),
    issuedBy: r.created_by_name ?? r.issued_by ?? "Head Office",
    targetAudience: r.audience ?? r.target_audience ?? "All Staff",
    targetScope: r.target_scope ?? r.audience ?? "All Stores",
    description: paragraphs[0] ?? body,
    paragraph1: paragraphs[1] ?? paragraphs[0] ?? body,
    paragraph2: paragraphs[2] ?? "",
    instructions: instructions.length ? instructions : paragraphs.slice(1).filter(Boolean),
    signatoryName: r.signatory_name ?? "Head Office",
    signatoryDesignation: r.signatory_designation ?? "",
    status: apiStatusToUI(r.status ?? "draft"),
    ackRequired: r.requires_acknowledgement ?? r.ack_required ?? false,
    ackCount: r.acknowledgements ?? r.ack_count ?? 0,
    totalRecipients: r.total_recipients ?? r.views ?? 0,
  };
}

const STATUS_COLORS: Record<NoticeStatus, { bg: string; text: string; border: string }> = {
  Draft:     { bg: "#F8FAFC", text: "#475569", border: "#E2E8F0" },
  Generated: { bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE" },
  Published: { bg: "#F0FDF4", text: "#166534", border: "#BBF7D0" },
  Archived:  { bg: "#FFFBEB", text: "#B45309", border: "#FDE68A" },
};

function NoticeCard({ notice, onPreview, onPublish, onArchive }: {
  notice: Notice;
  onPreview: () => void;
  onPublish: () => void;
  onArchive: () => void;
}) {
  const sc = STATUS_COLORS[notice.status];
  const ackPct = notice.totalRecipients > 0 ? Math.round((notice.ackCount / notice.totalRecipients) * 100) : 0;

  return (
    <View style={ss.noticeCard}>
      <View style={ss.noticeCardTop}>
        <View style={{ flex: 1 }}>
          <Text style={ss.noticeTitle} numberOfLines={2}>{notice.title}</Text>
          <Text style={ss.noticeNumber}>{notice.noticeNumber}</Text>
        </View>
        <View style={[ss.statusBadge, { backgroundColor: sc.bg, borderColor: sc.border }]}>
          <Text style={[ss.statusBadgeText, { color: sc.text }]}>{notice.status}</Text>
        </View>
      </View>

      <View style={ss.noticeMeta}>
        <Text style={ss.noticeMetaItem}>{notice.targetAudience}</Text>
        <Text style={ss.noticeDot}>·</Text>
        <Text style={ss.noticeMetaItem}>{notice.targetScope}</Text>
      </View>

      <View style={ss.noticeDates}>
        <Text style={ss.noticeDateLabel}>Issued: <Text style={ss.noticeDateValue}>{notice.date}</Text></Text>
        <Text style={ss.noticeDateLabel}>Effective: <Text style={ss.noticeDateValue}>{notice.effectiveDate}</Text></Text>
      </View>

      {notice.ackRequired && notice.status === "Published" && (
        <View style={ss.ackRow}>
          <View style={ss.ackBar}>
            <View style={[ss.ackFill, {
              width: `${ackPct}%` as any,
              backgroundColor: ackPct >= 80 ? "#16A34A" : ackPct >= 50 ? "#D97706" : "#DC2626",
            }]} />
          </View>
          <Text style={ss.ackText}>{notice.ackCount}/{notice.totalRecipients} acknowledged</Text>
        </View>
      )}

      <View style={ss.noticeActions}>
        <TouchableOpacity style={ss.actionBtn} onPress={onPreview}>
          <Eye size={13} color={C.navy} />
          <Text style={ss.actionBtnText}>Preview</Text>
        </TouchableOpacity>
        {(notice.status === "Draft" || notice.status === "Generated") && (
          <TouchableOpacity style={[ss.actionBtn, { backgroundColor: "#F0FDF4", borderColor: "#BBF7D0" }]} onPress={onPublish}>
            <Send size={13} color={C.green} />
            <Text style={[ss.actionBtnText, { color: C.green }]}>Publish</Text>
          </TouchableOpacity>
        )}
        {notice.status === "Published" && (
          <TouchableOpacity style={[ss.actionBtn, { backgroundColor: "#FFFBEB", borderColor: "#FDE68A" }]} onPress={onArchive}>
            <Archive size={13} color="#B45309" />
            <Text style={[ss.actionBtnText, { color: "#B45309" }]}>Archive</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function NoticePreviewModal({ notice, onClose }: { notice: Notice | null; onClose: () => void }) {
  if (!notice) return null;
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={ss.modalOverlay}>
        <View style={ss.modalSheet}>
          <View style={ss.modalHeader}>
            <Text style={ss.modalTitle}>Notice Preview</Text>
            <TouchableOpacity onPress={onClose} style={ss.modalCloseBtn}>
              <X size={18} color={C.muted} />
            </TouchableOpacity>
          </View>
          <ScrollView style={ss.modalBody} showsVerticalScrollIndicator={false}>
            <View style={ss.previewHeader}>
              <View style={ss.previewLogoRow}>
                <Image source={htLogo} style={ss.previewLogo} />
                <View style={ss.previewLogoMeta}>
                  <Text style={ss.previewEyebrow}>HomeTown India Ltd.</Text>
                  <Text style={ss.previewEyebrowSub}>Karmyogi — Staff Management</Text>
                </View>
                <View style={ss.previewOfficialStamp}>
                  <Shield size={14} color="#9CA3AF" />
                  <Text style={ss.previewOfficialText}>Official</Text>
                </View>
              </View>
              <Text style={ss.previewMainTitle}>Official Notice / Circular</Text>
              <View style={ss.previewDivider} />
            </View>

            <View style={ss.previewMeta}>
              <View>
                <Text style={ss.previewMetaLabel}>Issued By</Text>
                <Text style={ss.previewMetaValue}>{notice.issuedBy}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={ss.previewMetaLabel}>Notice No.</Text>
                <Text style={[ss.previewMetaValue, { fontFamily: "monospace" }]}>{notice.noticeNumber}</Text>
                <Text style={ss.previewMetaLabel}>Date: {notice.date}</Text>
              </View>
            </View>

            <Text style={ss.previewSectionLabel}>TITLE</Text>
            <Text style={ss.previewNoticeTitle}>{notice.title}</Text>

            <Text style={ss.previewSectionLabel}>TO</Text>
            <Text style={ss.previewBodyText}>{notice.targetAudience} · {notice.targetScope}</Text>

            <Text style={ss.previewSectionLabel}>DESCRIPTION</Text>
            <Text style={ss.previewBodyText}>{notice.description}</Text>

            <Text style={ss.previewBodyText}>{notice.paragraph1}</Text>
            <Text style={ss.previewBodyText}>{notice.paragraph2}</Text>

            <View style={ss.instructionBox}>
              <Text style={ss.instructionHeader}>IMPORTANT INSTRUCTIONS</Text>
              {notice.instructions.map((ins, i) => (
                <Text key={i} style={ss.instructionItem}>{i + 1}. {ins}</Text>
              ))}
            </View>

            <Text style={ss.previewSectionLabel}>EFFECTIVE DATE</Text>
            <Text style={ss.previewBodyText}>{notice.effectiveDate}</Text>

            <View style={ss.previewSignatoryRow}>
              {/* Primary signatory */}
              <View style={ss.previewSignBlock}>
                <Text style={ss.previewSignScribble}>{notice.signatoryName.split(" ").slice(0, 2).join(" ")}</Text>
                <View style={ss.previewSignLine} />
                <Text style={ss.previewSignName}>{notice.signatoryName}</Text>
                <Text style={ss.previewSignDesig}>{notice.signatoryDesignation}</Text>
                <Text style={ss.previewSignDesig}>HomeTown India Ltd.</Text>
              </View>

              {/* Centre stamp */}
              <View style={ss.previewStampCircle}>
                <Image source={htLogo} style={ss.previewStampLogo} />
              </View>

              {/* Countersignature */}
              <View style={ss.previewSignBlock}>
                <Text style={ss.previewSignScribble}>Authorized</Text>
                <View style={ss.previewSignLine} />
                <Text style={ss.previewSignName}>Authorized Signatory</Text>
                <Text style={ss.previewSignDesig}>Head Office Admin</Text>
                <Text style={ss.previewSignDesig}>HomeTown India Ltd.</Text>
              </View>
            </View>

            <View style={ss.previewFooter}>
              <Text style={ss.previewFooterText}>Digitally issued via HomeTown OnTrack · {notice.noticeNumber}</Text>
            </View>
            <View style={{ height: 24 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

type AudienceFilter = "All Staff" | "Store Managers" | "Sales Staff" | "All" | string;

export default function NoticesScreen() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<"all" | NoticeStatus>("all");
  const [audienceFilter, setAudienceFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [previewNotice, setPreviewNotice] = useState<Notice | null>(null);
  const [tab, setTab] = useState<"notices" | "acknowledgements">("notices");
  const [refreshing, setRefreshing] = useState(false);
  const [expandedAck, setExpandedAck] = useState<string | null>(null);

  const loadNotices = useCallback(async () => {
    try {
      const data = await adminDataService.getAdminNotices();
      const items: any[] = Array.isArray(data) ? data : ((data as any)?.data ?? (data as any)?.items ?? []);
      setNotices(items.map(mapApiNotice));
    } catch {
      setNotices([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadNotices(); }, [loadNotices]);

  const stats = {
    total: notices.length,
    published: notices.filter((n) => n.status === "Published").length,
    drafts: notices.filter((n) => n.status === "Draft" || n.status === "Generated").length,
    pendingAck: notices
      .filter((n) => n.ackRequired && n.status === "Published")
      .reduce((sum, n) => sum + (n.totalRecipients - n.ackCount), 0),
  };

  const audiences = ["all", ...Array.from(new Set(notices.map((n) => n.targetAudience).filter(Boolean)))];

  const filtered = notices.filter((n) => {
    const matchStatus = filterStatus === "all" || n.status === filterStatus;
    const matchAudience = audienceFilter === "all" || n.targetAudience === audienceFilter;
    const matchSearch = !search || n.title.toLowerCase().includes(search.toLowerCase()) || n.targetAudience.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchAudience && matchSearch;
  });

  async function handlePublish(id: string) {
    try {
      await adminDataService.publishAdminNotice(id);
      setNotices((prev) => prev.map((n) => n.id === id ? { ...n, status: "Published" } : n));
    } catch {
      Alert.alert("Error", "Could not publish notice. Check API connection.");
    }
  }

  function handleArchive(id: string) {
    Alert.alert("Archive Notice", "Archive this notice?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Archive",
        onPress: async () => {
          try {
            await adminDataService.archiveAdminNotice(id);
            setNotices((prev) => prev.map((n) => n.id === id ? { ...n, status: "Archived" } : n));
          } catch {
            Alert.alert("Error", "Could not archive notice. Check API connection.");
          }
        },
      },
    ]);
  }

  async function handleRefresh() {
    setRefreshing(true);
    loadNotices();
  }

  const FILTER_CHIPS: { key: "all" | NoticeStatus; label: string }[] = [
    { key: "all", label: "All" },
    { key: "Draft", label: "Draft" },
    { key: "Generated", label: "Generated" },
    { key: "Published", label: "Published" },
    { key: "Archived", label: "Archived" },
  ];

  return (
    <SafeAreaView style={ss.safe} edges={["top"]}>
      <NoticePreviewModal notice={previewNotice} onClose={() => setPreviewNotice(null)} />

      <View style={ss.root}>
        {/* Header */}
        <View style={ss.header}>
          <View style={ss.headerRow}>
            <View>
              <Text style={ss.eyebrow}>DOCUMENTS</Text>
              <Text style={ss.headerTitle}>Official Notice Center</Text>
            </View>
            <TouchableOpacity
              style={ss.newBtn}
              onPress={() => Alert.alert("Create Notice", "Use the Admin Web Dashboard to create and publish official notices.")}
            >
              <Plus size={15} color={C.white} />
              <Text style={ss.newBtnText}>New</Text>
            </TouchableOpacity>
          </View>

          {/* Stats */}
          <View style={ss.statsRow}>
            <View style={ss.statPill}>
              <Text style={ss.statValue}>{stats.total}</Text>
              <Text style={ss.statLabel}>Total</Text>
            </View>
            <View style={ss.statDivider} />
            <View style={ss.statPill}>
              <Text style={[ss.statValue, { color: "#86EFAC" }]}>{stats.published}</Text>
              <Text style={ss.statLabel}>Published</Text>
            </View>
            <View style={ss.statDivider} />
            <View style={ss.statPill}>
              <Text style={[ss.statValue, { color: "#FCD34D" }]}>{stats.drafts}</Text>
              <Text style={ss.statLabel}>Drafts</Text>
            </View>
            <View style={ss.statDivider} />
            <View style={ss.statPill}>
              <Text style={[ss.statValue, { color: "#FCA5A5" }]}>{stats.pendingAck}</Text>
              <Text style={ss.statLabel}>Pending Ack</Text>
            </View>
          </View>

          {/* Tabs */}
          <View style={ss.tabRow}>
            {[
              { key: "notices" as const, label: "All Notices" },
              { key: "acknowledgements" as const, label: "Acknowledgements" },
            ].map((t) => (
              <TouchableOpacity
                key={t.key}
                style={[ss.tab, tab === t.key && ss.tabActive]}
                onPress={() => setTab(t.key)}
              >
                <Text style={[ss.tabText, tab === t.key && ss.tabTextActive]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {tab === "notices" && (
          <>
            {/* Search */}
            <View style={ss.searchWrap}>
              <Search size={14} color={C.muted} style={{ position: "absolute", left: 28, top: 22 }} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search notices…"
                placeholderTextColor={C.muted}
                style={ss.searchInput}
              />
            </View>

            {/* Status filter chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={ss.filterRow}>
              {FILTER_CHIPS.map((chip) => (
                <TouchableOpacity
                  key={chip.key}
                  style={[ss.filterChip, filterStatus === chip.key && ss.filterChipActive]}
                  onPress={() => setFilterStatus(chip.key)}
                >
                  <Text style={[ss.filterChipText, filterStatus === chip.key && ss.filterChipTextActive]}>
                    {chip.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Audience filter chips */}
            {audiences.length > 2 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[ss.filterRow, { paddingTop: 0 }]}>
                {audiences.map((aud) => (
                  <TouchableOpacity
                    key={aud}
                    style={[ss.filterChip, audienceFilter === aud && ss.filterChipActive]}
                    onPress={() => setAudienceFilter(aud)}
                  >
                    <Text style={[ss.filterChipText, audienceFilter === aud && ss.filterChipTextActive]}>
                      {aud === "all" ? "All Audiences" : aud}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={ss.scroll}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[C.orange]} tintColor={C.orange} />}
            >
              {loading ? (
                <ActivityIndicator color={C.orange} style={{ marginTop: 40 }} />
              ) : filtered.length === 0 ? (
                <View style={ss.empty}>
                  <FileText size={32} color={C.muted} />
                  <Text style={ss.emptyText}>No notices found</Text>
                </View>
              ) : (
                filtered.map((notice) => (
                  <NoticeCard
                    key={notice.id}
                    notice={notice}
                    onPreview={() => setPreviewNotice(notice)}
                    onPublish={() => handlePublish(notice.id)}
                    onArchive={() => handleArchive(notice.id)}
                  />
                ))
              )}
              <View style={{ height: 24 }} />
            </ScrollView>
          </>
        )}

        {tab === "acknowledgements" && (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={ss.scroll}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[C.orange]} tintColor={C.orange} />}
          >
            {notices.filter((n) => n.ackRequired && n.status === "Published").map((n) => {
              const pct = n.totalRecipients > 0 ? Math.round((n.ackCount / n.totalRecipients) * 100) : 0;
              const isOpen = expandedAck === n.id;
              return (
                <View key={n.id} style={ss.ackCard}>
                  <TouchableOpacity
                    style={ss.ackCardHeader}
                    onPress={() => setExpandedAck(isOpen ? null : n.id)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={ss.ackCardTitle} numberOfLines={2}>{n.title}</Text>
                      <Text style={ss.ackCardSub}>{n.noticeNumber} · Published {n.date}</Text>
                    </View>
                    <View style={{ alignItems: "flex-end", gap: 4 }}>
                      <Text style={[ss.ackPct, { color: pct >= 80 ? C.green : pct >= 50 ? C.gold : C.red }]}>{pct}%</Text>
                      <Text style={ss.ackCardSub}>{n.ackCount}/{n.totalRecipients}</Text>
                    </View>
                    {isOpen ? <ChevronUp size={16} color={C.muted} /> : <ChevronDown size={16} color={C.muted} />}
                  </TouchableOpacity>

                  <View style={[ss.ackBar, { marginHorizontal: 14, marginBottom: 8 }]}>
                    <View style={[ss.ackFill, {
                      width: `${pct}%` as any,
                      backgroundColor: pct >= 80 ? "#16A34A" : pct >= 50 ? "#D97706" : "#DC2626",
                    }]} />
                  </View>

                  {isOpen && (
                    <View style={ss.ackStoreGrid}>
                      <View style={[ss.ackStorePill, { backgroundColor: pct >= 80 ? "#F0FDF4" : "#FEF3C7", borderColor: pct >= 80 ? "#BBF7D0" : "#FDE68A" }]}>
                        {pct >= 80
                          ? <CheckCircle2 size={12} color={C.green} />
                          : <AlertTriangle size={12} color={C.amber} />
                        }
                        <Text style={[ss.ackStoreText, { color: pct >= 80 ? C.green : C.amber }]} numberOfLines={1}>
                          {n.ackCount} of {n.totalRecipients} acknowledged ({pct}%)
                        </Text>
                      </View>
                      <TouchableOpacity style={ss.reminderBtn} onPress={() => Alert.alert("Reminder Sent", "Reminder sent to staff with pending acknowledgements.")}>
                        <Send size={13} color={C.white} />
                        <Text style={ss.reminderBtnText}>Send Reminder</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
            {notices.filter((n) => n.ackRequired && n.status === "Published").length === 0 && (
              <View style={ss.empty}>
                <CheckCircle2 size={32} color={C.green} />
                <Text style={ss.emptyText}>No acknowledgements pending</Text>
              </View>
            )}
            <View style={{ height: 24 }} />
          </ScrollView>
        )}

        <AdminBottomNav />
      </View>
    </SafeAreaView>
  );
}

const ss = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.navy },
  root: { flex: 1, backgroundColor: C.beige },
  header: { backgroundColor: C.navy, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 16, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  headerRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 },
  eyebrow: { fontSize: 10, fontWeight: "800", color: C.orange, letterSpacing: 2, marginBottom: 2 },
  headerTitle: { fontSize: 22, fontWeight: "900", color: C.white },
  newBtn: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: C.orange, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 7 },
  newBtnText: { fontSize: 12, fontWeight: "800", color: C.white },
  statsRow: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.10)", borderRadius: 16, paddingVertical: 10, paddingHorizontal: 14, marginBottom: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.14)" },
  statPill: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 16, fontWeight: "900", color: C.white },
  statLabel: { fontSize: 9, fontWeight: "700", color: "rgba(255,255,255,0.55)", marginTop: 2 },
  statDivider: { width: 1, height: 26, backgroundColor: "rgba(255,255,255,0.16)" },
  tabRow: { flexDirection: "row", gap: 6 },
  tab: { flex: 1, alignItems: "center", paddingVertical: 7, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.10)" },
  tabActive: { backgroundColor: "rgba(255,255,255,0.22)" },
  tabText: { fontSize: 11, fontWeight: "700", color: "rgba(255,255,255,0.55)" },
  tabTextActive: { color: C.white },
  searchWrap: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 },
  searchInput: { backgroundColor: C.white, borderRadius: 14, paddingLeft: 38, paddingRight: 14, paddingVertical: 10, fontSize: 13, color: C.navy, borderWidth: 1, borderColor: "#EAD7C2" },
  filterRow: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, backgroundColor: C.white, borderWidth: 1, borderColor: "#EAD7C2" },
  filterChipActive: { backgroundColor: C.navy, borderColor: C.navy },
  filterChipText: { fontSize: 11, fontWeight: "700", color: C.muted },
  filterChipTextActive: { color: C.white },
  scroll: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 100 },
  noticeCard: { backgroundColor: C.white, borderRadius: 18, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: "#EAD7C2", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  noticeCardTop: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 8 },
  noticeTitle: { fontSize: 14, fontWeight: "900", color: C.navy, flex: 1 },
  noticeNumber: { fontSize: 10, color: C.muted, fontFamily: "monospace", marginTop: 2 },
  statusBadge: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  statusBadgeText: { fontSize: 10, fontWeight: "700" },
  noticeMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 6 },
  noticeMetaItem: { fontSize: 11, color: C.muted, fontWeight: "600" },
  noticeDot: { fontSize: 11, color: C.muted },
  noticeDates: { flexDirection: "row", gap: 12, marginBottom: 8 },
  noticeDateLabel: { fontSize: 10, color: C.muted, fontWeight: "600" },
  noticeDateValue: { color: C.navy, fontWeight: "700" },
  ackRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  ackBar: { flex: 1, height: 5, borderRadius: 999, backgroundColor: "#F1E4D6", overflow: "hidden" },
  ackFill: { height: 5, borderRadius: 999 },
  ackText: { fontSize: 10, color: C.muted, fontWeight: "700" },
  noticeActions: { flexDirection: "row", gap: 8, marginTop: 4 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#F8FAFC", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1, borderColor: "#E2E8F0" },
  actionBtnText: { fontSize: 11, fontWeight: "700", color: C.navy },
  empty: { alignItems: "center", paddingVertical: 60, gap: 10 },
  emptyText: { fontSize: 14, color: C.muted, fontWeight: "700" },
  // Preview Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "90%", flex: 1 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#F1E4D6" },
  modalTitle: { fontSize: 15, fontWeight: "800", color: C.navy },
  modalCloseBtn: { padding: 4 },
  modalBody: { flex: 1, paddingHorizontal: 20, paddingTop: 12 },
  previewHeader: { alignItems: "center", marginBottom: 16 },
  previewLogoRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  previewLogo: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: "#FDE68A" },
  previewLogoMeta: { flex: 1 },
  previewOfficialStamp: { alignItems: "center", width: 40 },
  previewOfficialText: { fontSize: 7, color: "#D1D5DB", letterSpacing: 0.5, marginTop: 2 },
  previewEyebrow: { fontSize: 9, color: C.muted, letterSpacing: 1.5 },
  previewEyebrowSub: { fontSize: 8, color: C.muted },
  previewMainTitle: { fontSize: 16, fontWeight: "900", color: C.navy, letterSpacing: 0.5 },
  previewDivider: { height: 2, width: 60, backgroundColor: C.navy, borderRadius: 1, marginTop: 8 },
  previewMeta: { flexDirection: "row", justifyContent: "space-between", marginBottom: 14, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: "#F1E4D6" },
  previewMetaLabel: { fontSize: 9, color: C.muted, fontWeight: "700", marginBottom: 2 },
  previewMetaValue: { fontSize: 12, fontWeight: "700", color: C.navy },
  previewSectionLabel: { fontSize: 9, fontWeight: "900", color: C.muted, letterSpacing: 1.5, marginTop: 10, marginBottom: 3 },
  previewNoticeTitle: { fontSize: 14, fontWeight: "900", color: C.navy, marginBottom: 8 },
  previewBodyText: { fontSize: 12, color: "#374151", lineHeight: 18, marginBottom: 8 },
  instructionBox: { backgroundColor: "#F8FAFC", borderLeftWidth: 3, borderLeftColor: C.navy, borderRadius: 8, padding: 12, marginVertical: 8 },
  instructionHeader: { fontSize: 9, fontWeight: "900", color: C.navy, letterSpacing: 1.2, marginBottom: 6 },
  instructionItem: { fontSize: 11, color: "#374151", lineHeight: 18 },
  previewSignatoryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 20, paddingTop: 14, borderTopWidth: 2, borderTopColor: C.navy },
  previewSignBlock: { alignItems: "center", flex: 1 },
  previewSignScribble: { fontSize: 14, color: C.navy, fontStyle: "italic", opacity: 0.65, letterSpacing: -0.5, marginBottom: 2 },
  previewSignLine: { height: 1, width: 80, backgroundColor: "#9CA3AF", marginBottom: 5 },
  previewSignName: { fontSize: 10, fontWeight: "800", color: C.navy, textAlign: "center" },
  previewSignDesig: { fontSize: 9, color: C.muted, textAlign: "center" },
  previewStampCircle: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: "#D1D5DB", backgroundColor: "#F9FAFB", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  previewStampLogo: { width: 32, height: 32, borderRadius: 16, opacity: 0.55 },
  previewFooter: { alignItems: "center", marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#F1E4D6", borderStyle: "dashed" },
  previewFooterText: { fontSize: 9, color: C.muted, textAlign: "center" },
  // Acknowledgements
  ackCard: { backgroundColor: C.white, borderRadius: 18, marginBottom: 12, borderWidth: 1, borderColor: "#EAD7C2", overflow: "hidden" },
  ackCardHeader: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14 },
  ackCardTitle: { fontSize: 13, fontWeight: "800", color: C.navy },
  ackCardSub: { fontSize: 10, color: C.muted, marginTop: 2 },
  ackPct: { fontSize: 16, fontWeight: "900" },
  ackStoreGrid: { paddingHorizontal: 14, paddingBottom: 14, gap: 8 },
  ackStorePill: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 7 },
  ackStoreText: { fontSize: 11, fontWeight: "700" },
  reminderBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: C.navy, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8, alignSelf: "flex-end", marginTop: 4 },
  reminderBtnText: { fontSize: 11, fontWeight: "800", color: C.white },
});
