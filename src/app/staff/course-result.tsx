import { router, useLocalSearchParams } from "expo-router";
import {
  Award,
  RotateCcw,
  Trophy,
  XCircle,
} from "lucide-react-native";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  COLORS,
  BorderRadius,
  Spacing,
  Shadow,
} from "@/constants/theme";

export default function CourseResultScreen() {
  const {
    courseId,
    percentage,
    passed,
    obtainedMarks,
    totalMarks,
  } = useLocalSearchParams<{
    courseId: string;
    percentage: string;
    passed: string;
    obtainedMarks: string;
    totalMarks: string;
  }>();

  const isPassed = passed === "true";

  const pct = Number(percentage || 0);
  const marksObtained = Number(obtainedMarks || 0);
  const marksTotal = Number(totalMarks || 0);

  return (
    <SafeAreaView
      style={styles.safe}
      edges={["top"]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
      >
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: isPassed
                ? COLORS.success
                : COLORS.error,
            },
            Shadow.card,
          ]}
        >
          <View style={styles.heroIcon}>
            {isPassed ? (
              <Trophy
                size={40}
                color={COLORS.white}
              />
            ) : (
              <XCircle
                size={40}
                color={COLORS.white}
              />
            )}
          </View>

          <Text style={styles.heroTitle}>
            {isPassed
              ? "Congratulations!"
              : "Better Luck Next Time"}
          </Text>

          <Text style={styles.heroSub}>
            {isPassed
              ? "You have passed the assessment."
              : "You did not meet the passing score."}
          </Text>
        </View>

        <View
          style={[
            styles.statsCard,
            Shadow.card,
          ]}
        >
          <View style={styles.statRow}>
            <StatItem
              label="Score"
              value={`${marksObtained} / ${marksTotal}`}
            />

            <View
              style={styles.statDivider}
            />

            <StatItem
              label="Result"
              value={
                isPassed
                  ? "PASS"
                  : "FAIL"
              }
            />

            <View
              style={styles.statDivider}
            />

            <StatItem
              label="Percentage"
              value={`${pct}%`}
            />
          </View>
        </View>

        <View style={styles.actionsCard}>
          {isPassed && (
            <TouchableOpacity
              style={styles.certBtn}
              onPress={() =>
                router.push({
                  pathname:
                    "/staff/course-certificate",
                  params: { courseId },
                })
              }
            >
              <Award
                size={18}
                color={COLORS.white}
              />
              <Text
                style={styles.certBtnText}
              >
                View Certificate
              </Text>
            </TouchableOpacity>
          )}

          {!isPassed && (
            <TouchableOpacity
              style={styles.retakeBtn}
              onPress={() =>
                router.replace({
                  pathname:
                    "/staff/course-assessment",
                  params: { courseId },
                })
              }
            >
              <RotateCcw
                size={16}
                color={COLORS.orange}
              />
              <Text
                style={
                  styles.retakeBtnText
                }
              >
                Retake Assessment
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.backBtn}
            onPress={() =>
              router.push({
                pathname:
                  "/staff/course-detail",
                params: {
                  id: courseId,
                },
              })
            }
          >
            <Text
              style={styles.backBtnText}
            >
              Back to Course
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        gap: 4,
      }}
    >
      <Text
        style={{
          fontSize: 18,
          fontWeight: "900",
          color: COLORS.grayDark,
        }}
      >
        {value}
      </Text>

      <Text
        style={{
          fontSize: 11,
          color: COLORS.gray,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.beige,
  },

  content: {
    padding: Spacing.three,
    gap: Spacing.two,
    paddingTop: 40,
  },

  heroCard: {
    borderRadius:
      BorderRadius.xlarge,
    padding: Spacing.four,
    alignItems: "center",
    gap: Spacing.two,
  },

  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor:
      "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },

  heroTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.white,
  },

  heroSub: {
    fontSize: 14,
    color:
      "rgba(255,255,255,0.85)",
    textAlign: "center",
  },

  statsCard: {
    backgroundColor: COLORS.white,
    borderRadius:
      BorderRadius.large,
    padding: Spacing.three,
  },

  statRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  statDivider: {
    width: 1,
    height: 32,
    backgroundColor:
      COLORS.border,
  },

  actionsCard: {
    gap: Spacing.two,
  },

  certBtn: {
    backgroundColor:
      COLORS.orange,
    borderRadius:
      BorderRadius.medium,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  certBtnText: {
    color: COLORS.white,
    fontWeight: "800",
    fontSize: 15,
  },

  retakeBtn: {
    borderWidth: 1.5,
    borderColor:
      COLORS.orange,
    borderRadius:
      BorderRadius.medium,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  retakeBtnText: {
    color: COLORS.orange,
    fontWeight: "700",
    fontSize: 14,
  },

  backBtn: {
    borderRadius:
      BorderRadius.medium,
    paddingVertical: 12,
    alignItems: "center",
  },

  backBtnText: {
    color: COLORS.gray,
    fontWeight: "600",
    fontSize: 14,
  },
});