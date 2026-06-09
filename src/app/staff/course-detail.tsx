import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  BorderRadius,
  COLORS,
  Shadow,
  Spacing,
} from "@/constants/theme";
import { lmsService } from "@/services/lms.service";

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadCourse = useCallback(async () => {
    try {
      setLoading(true);

  const data = await lmsService.getCourseById(id!);

setCourse(data?.data || data);
      setError("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load course"
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      loadCourse();
    }
  }, [id, loadCourse]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator
            size="large"
            color={COLORS.orange}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !course) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.errorText}>
            {error || "Course not found"}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <ArrowLeft
            size={20}
            color={COLORS.white}
          />
        </TouchableOpacity>

        <Text
          numberOfLines={2}
          style={styles.headerTitle}
        >
          {course.title}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, Shadow.card]}>
          <Text style={styles.courseTitle}>
            {course.title}
          </Text>

          <Text style={styles.description}>
            {course.description}
          </Text>

          <Text style={styles.contentText}>
            {course.contentText}
          </Text>

          <Text style={styles.passText}>
            Passing Percentage: {course.passingPercentage}%
          </Text>

          {course.pdfUrl ? (
            <Text style={styles.linkText}>
              PDF Available
            </Text>
          ) : null}

          {course.videoUrl ? (
            <Text style={styles.linkText}>
              Video Available
            </Text>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() =>
            router.push({
              pathname: "/staff/course-assessment",
              params: {
                courseId: course._id,
              },
            })
          }
        >
          <Text style={styles.primaryBtnText}>
            Start Assessment
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.beige,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  header: {
    backgroundColor: COLORS.blue,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    gap: Spacing.two,
  },

  backBtn: {
    padding: 4,
  },

  headerTitle: {
    flex: 1,
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "800",
  },

  content: {
    padding: Spacing.three,
    gap: Spacing.two,
  },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.three,
  },

  courseTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.grayDark,
    marginBottom: 12,
  },

  description: {
    fontSize: 14,
    color: COLORS.grayDark,
    lineHeight: 22,
    marginBottom: 12,
  },

  contentText: {
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 22,
    marginBottom: 16,
  },

  passText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.orange,
    marginBottom: 10,
  },

  linkText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.blue,
    marginBottom: 6,
  },

  primaryBtn: {
    backgroundColor: COLORS.orange,
    borderRadius: BorderRadius.medium,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  primaryBtnText: {
    color: COLORS.white,
    fontWeight: "800",
    fontSize: 15,
  },

  errorText: {
    color: COLORS.error,
    fontSize: 15,
  },
});