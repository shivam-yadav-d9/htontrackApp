import { Tabs, router } from "expo-router";
import {
  BookOpenCheck,
  BriefcaseBusiness,
  CalendarCheck,
  ClipboardList,
  Home,
  Target,
  UserRound,
} from "lucide-react-native";
import React, { useEffect } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";

import { COLORS, Spacing } from "@/constants/theme";
import { useAuthStore } from "@/store/auth.store";

function TabIcon({
  focused,
  label,
  icon,
}: {
  focused: boolean;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
      <View style={[styles.iconBubble, focused && styles.iconBubbleActive]}>
        {icon}
      </View>

      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export default function StaffLayout() {
  const { is_authenticated, user } = useAuthStore();

  const activeColor = COLORS.orange;
  const inactiveColor = COLORS.gray;

  useEffect(() => {
    if (!is_authenticated) {
      router.replace("/auth/login");
      return;
    }

    if (user && user.role.toUpperCase().includes("MANAGER")) {
      router.replace("/manager/dashboard");
    }
  }, [is_authenticated, user]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              label="Home"
              icon={
                <Home
                  size={20}
                  color={focused ? activeColor : inactiveColor}
                  strokeWidth={focused ? 2.7 : 2.2}
                />
              }
            />
          ),
        }}
      />

      <Tabs.Screen
        name="attendance"
        options={{
          title: "Attendance",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              label="Attend"
              icon={
                <CalendarCheck
                  size={20}
                  color={focused ? activeColor : inactiveColor}
                  strokeWidth={focused ? 2.7 : 2.2}
                />
              }
            />
          ),
        }}
      />

      <Tabs.Screen
        name="assignments"
        options={{
          title: "LMS",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              label="LMS"
              icon={
                <BookOpenCheck
                  size={20}
                  color={focused ? activeColor : inactiveColor}
                  strokeWidth={focused ? 2.7 : 2.2}
                />
              }
            />
          ),
        }}
      />

      <Tabs.Screen
        name="targets"
        options={{
          title: "Targets",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              label="Targets"
              icon={
                <Target
                  size={20}
                  color={focused ? activeColor : inactiveColor}
                  strokeWidth={focused ? 2.7 : 2.2}
                />
              }
            />
          ),
        }}
      />

      {/* <Tabs.Screen
        name="learning"
        options={{
          title: "Learning",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              label="Learn"
              icon={
                <BookOpenCheck
                  size={20}
                  color={focused ? activeColor : inactiveColor}
                  strokeWidth={focused ? 2.7 : 2.2}
                />
              }
            />
          ),
        }}
      /> */}
{/* 
      <Tabs.Screen
        name="work"
        options={{
          title: "Work",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              label="Work"
              icon={
                <BriefcaseBusiness
                  size={20}
                  color={focused ? activeColor : inactiveColor}
                  strokeWidth={focused ? 2.7 : 2.2}
                />
              }
            />
          ),
        }}
      /> */}

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              label="Profile"
              icon={
                <UserRound
                  size={20}
                  color={focused ? activeColor : inactiveColor}
                  strokeWidth={focused ? 2.7 : 2.2}
                />
              }
            />
          ),
        }}
      />

      {/* Hidden staff detail/action screens used by dashboard cards */}

      {/* Attendance Center */}
      <Tabs.Screen name="leave-requests" options={{ href: null }} />
      <Tabs.Screen name="attendance-corrections" options={{ href: null }} />
      <Tabs.Screen name="attendance-correction" options={{ href: null }} />

      {/* Learning Hub */}
      <Tabs.Screen name="courses" options={{ href: null }} />
      <Tabs.Screen name="course-detail" options={{ href: null }} />
      <Tabs.Screen name="course-reading" options={{ href: null }} />
      <Tabs.Screen name="course-assessment" options={{ href: null }} />
      <Tabs.Screen name="course-result" options={{ href: null }} />
      <Tabs.Screen name="course-certificate" options={{ href: null }} />
      <Tabs.Screen name="assignment-detail" options={{ href: null }} />
      <Tabs.Screen name="assignment-submit" options={{ href: null }} />
      <Tabs.Screen name="quizzes" options={{ href: null }} />
      <Tabs.Screen name="quiz" options={{ href: null }} />
      <Tabs.Screen name="quiz-attempt" options={{ href: null }} />
      <Tabs.Screen name="learning-paths" options={{ href: null }} />
      <Tabs.Screen name="learning-path-detail" options={{ href: null }} />
      <Tabs.Screen name="coaching-plans" options={{ href: null }} />

      {/* Daily Work */}
      <Tabs.Screen name="tasks" options={{ href: null }} />
      <Tabs.Screen name="task-detail" options={{ href: null }} />
      <Tabs.Screen name="tickets" options={{ href: null }} />
      <Tabs.Screen name="checklists" options={{ href: null }} />
      <Tabs.Screen name="checklist-detail" options={{ href: null }} />
      <Tabs.Screen name="checklist-submit" options={{ href: null }} />
      <Tabs.Screen name="todos" options={{ href: null }} />
      <Tabs.Screen name="todo-create" options={{ href: null }} />
      <Tabs.Screen name="duties" options={{ href: null }} />

      {/* Leaderboard & Growth */}
      <Tabs.Screen name="awards" options={{ href: null }} />
      <Tabs.Screen name="insights" options={{ href: null }} />
      <Tabs.Screen name="leaderboard" options={{ href: null }} />
      <Tabs.Screen name="reports" options={{ href: null }} />
      <Tabs.Screen name="activity-timeline" options={{ href: null }} />
      <Tabs.Screen name="skill-matrix" options={{ href: null }} />
      <Tabs.Screen name="performance-alerts" options={{ href: null }} />
      <Tabs.Screen name="rewards" options={{ href: null }} />
      <Tabs.Screen name="certificates" options={{ href: null }} />

      {/* Updates & Alerts */}
      <Tabs.Screen name="announcements" options={{ href: null }} />
      <Tabs.Screen name="reminders" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="alerts" options={{ href: null }} />

      {/* Profile Essentials */}
      <Tabs.Screen name="documents" options={{ href: null }} />
      <Tabs.Screen name="edit-profile" options={{ href: null }} />



      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="about" options={{ href: null }} />
      <Tabs.Screen name="help" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.white,
    borderTopColor: COLORS.border,
    borderTopWidth: 1,
    height: Platform.OS === "ios" ? 82 : 68,
    paddingTop: Spacing.one,
    paddingBottom: Platform.OS === "ios" ? 18 : 8,
    paddingHorizontal: 2,
    shadowColor: "#102B45",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 12,
  },

  tabIcon: {
    minWidth: 46,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },

  tabIconActive: {
    transform: [{ translateY: -1 }],
  },

  iconBubble: {
    width: 30,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  iconBubbleActive: {
    backgroundColor: "#FFF3E8",
  },

  tabLabel: {
    fontSize: 8.5,
    color: COLORS.gray,
    fontWeight: "700",
    maxWidth: 52,
  },

  tabLabelActive: {
    color: COLORS.orange,
    fontWeight: "900",
  },
});