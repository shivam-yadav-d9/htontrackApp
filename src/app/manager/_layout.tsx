import { Tabs, router } from "expo-router";
import { Home, UserRound, UsersRound } from "lucide-react-native";
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

      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
        {label}
      </Text>
    </View>
  );
}

export default function ManagerLayout() {
  const { is_authenticated, user } = useAuthStore();

  const activeColor = COLORS.orange;
  const inactiveColor = COLORS.gray;

  useEffect(() => {
    if (!is_authenticated) {
      router.replace("/auth/login");
      return;
    }

    if (user && !user.role.toUpperCase().includes("MANAGER")) {
      router.replace("/staff/dashboard");
    }
  }, [is_authenticated, user]);

  const hiddenOptions = {
    href: null,
  };

  return (
    <Tabs
      initialRouteName="dashboard"
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      {/* ===================== ONLY 3 VISIBLE BOTTOM NAV ICONS ===================== */}

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
                  size={22}
                  color={focused ? activeColor : inactiveColor}
                  strokeWidth={focused ? 2.8 : 2.2}
                />
              }
            />
          ),
        }}
      />

      <Tabs.Screen
        name="team"
        options={{
          title: "Team",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              label="Team"
              icon={
                <UsersRound
                  size={22}
                  color={focused ? activeColor : inactiveColor}
                  strokeWidth={focused ? 2.8 : 2.2}
                />
              }
            />
          ),
        }}
      />

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
                  size={22}
                  color={focused ? activeColor : inactiveColor}
                  strokeWidth={focused ? 2.8 : 2.2}
                />
              }
            />
          ),
        }}
      />

      {/* ===================== IMPORTANT: HIDE NESTED TEAM ROUTES ===================== */}
      <Tabs.Screen name="team/add" options={hiddenOptions} />
      <Tabs.Screen name="team/[staffId]" options={hiddenOptions} />
      <Tabs.Screen name="team/[id]" options={hiddenOptions} />
      <Tabs.Screen name="team/edit" options={hiddenOptions} />
      <Tabs.Screen name="team/edit/[staffId]" options={hiddenOptions} />
      <Tabs.Screen name="team/edit/[id]" options={hiddenOptions} />
      <Tabs.Screen name="team/member" options={hiddenOptions} />
      <Tabs.Screen name="team/member/[staffId]" options={hiddenOptions} />
      <Tabs.Screen name="team/member/[id]" options={hiddenOptions} />
      <Tabs.Screen name="team/details" options={hiddenOptions} />
      <Tabs.Screen name="team/details/[staffId]" options={hiddenOptions} />
      <Tabs.Screen name="team/details/[id]" options={hiddenOptions} />

      {/* ===================== IMPORTANT: HIDE NESTED ASSIGNMENT ROUTES ===================== */}
      <Tabs.Screen name="assignment-submission" options={hiddenOptions} />
      <Tabs.Screen name="assignment-submission/[id]" options={hiddenOptions} />
      <Tabs.Screen name="assignment-submission/[submissionId]" options={hiddenOptions} />
      <Tabs.Screen name="assignment-submissions/[id]" options={hiddenOptions} />
      <Tabs.Screen name="assignment-submissions/[submissionId]" options={hiddenOptions} />
      <Tabs.Screen name="assignment-submissions/detail" options={hiddenOptions} />
      <Tabs.Screen name="assignment-submissions/detail/[id]" options={hiddenOptions} />

      {/* ===================== HIDDEN HUBS ===================== */}
      <Tabs.Screen name="tasks" options={hiddenOptions} />
      <Tabs.Screen name="learning" options={hiddenOptions} />
      <Tabs.Screen name="more" options={hiddenOptions} />

      {/* ===================== GENERAL HIDDEN SCREENS ===================== */}
      <Tabs.Screen name="approvals" options={hiddenOptions} />
      <Tabs.Screen name="notifications" options={hiddenOptions} />
      <Tabs.Screen name="create-hub" options={hiddenOptions} />
      <Tabs.Screen name="reports" options={hiddenOptions} />
      <Tabs.Screen name="audit-logs" options={hiddenOptions} />
      <Tabs.Screen name="settings" options={hiddenOptions} />

      {/* ===================== TEAM OPERATIONS ===================== */}
      <Tabs.Screen name="staff-detail" options={hiddenOptions} />
      <Tabs.Screen name="staff-detail/[id]" options={hiddenOptions} />
      <Tabs.Screen name="staff-detail/[staffId]" options={hiddenOptions} />
      <Tabs.Screen name="staff-details" options={hiddenOptions} />
      <Tabs.Screen name="staff-details/[id]" options={hiddenOptions} />
      <Tabs.Screen name="staff-details/[staffId]" options={hiddenOptions} />
      <Tabs.Screen name="staff-profile" options={hiddenOptions} />
      <Tabs.Screen name="staff-profile/[id]" options={hiddenOptions} />
      <Tabs.Screen name="staff-profile/[staffId]" options={hiddenOptions} />
      <Tabs.Screen name="attendance" options={hiddenOptions} />
      <Tabs.Screen name="attendance-team" options={hiddenOptions} />
      <Tabs.Screen name="leave-requests" options={hiddenOptions} />
      <Tabs.Screen name="leave-approvals" options={hiddenOptions} />
      <Tabs.Screen name="attendance-corrections" options={hiddenOptions} />
      <Tabs.Screen name="attendance-correction" options={hiddenOptions} />
      <Tabs.Screen name="assign-duty" options={hiddenOptions} />

      {/* ===================== TASKS & APPROVALS ===================== */}
      <Tabs.Screen name="create-assignment" options={hiddenOptions} />
      <Tabs.Screen name="assignments" options={hiddenOptions} />
      <Tabs.Screen name="assignments/[id]" options={hiddenOptions} />
      <Tabs.Screen name="assignment-submissions" options={hiddenOptions} />
      <Tabs.Screen name="submissions" options={hiddenOptions} />
      <Tabs.Screen name="submissions/[id]" options={hiddenOptions} />
      <Tabs.Screen name="document-approvals" options={hiddenOptions} />
      <Tabs.Screen name="documents" options={hiddenOptions} />
      <Tabs.Screen name="tickets" options={hiddenOptions} />
      <Tabs.Screen name="ticket-detail" options={hiddenOptions} />
      <Tabs.Screen name="ticket-detail/[id]" options={hiddenOptions} />
      <Tabs.Screen name="tickets/[id]" options={hiddenOptions} />

      {/* ===================== TARGETS ===================== */}
      <Tabs.Screen name="set-targets" options={hiddenOptions} />
      <Tabs.Screen name="targets" options={hiddenOptions} />
      <Tabs.Screen name="targets/[id]" options={hiddenOptions} />
      <Tabs.Screen name="target-progress" options={hiddenOptions} />

      {/* ===================== LEARNING & GROWTH ===================== */}
      <Tabs.Screen name="create-course" options={hiddenOptions} />
      <Tabs.Screen name="courses" options={hiddenOptions} />
      <Tabs.Screen name="courses/[id]" options={hiddenOptions} />
      <Tabs.Screen name="course-progress" options={hiddenOptions} />
      <Tabs.Screen name="create-quiz" options={hiddenOptions} />
      <Tabs.Screen name="quizzes" options={hiddenOptions} />
      <Tabs.Screen name="quizzes/[id]" options={hiddenOptions} />
      <Tabs.Screen name="quiz-attempts" options={hiddenOptions} />
      <Tabs.Screen name="skill-matrix" options={hiddenOptions} />
      <Tabs.Screen name="create-skill-matrix" options={hiddenOptions} />
      <Tabs.Screen name="skill-progress" options={hiddenOptions} />
      <Tabs.Screen name="performance-alerts" options={hiddenOptions} />
      <Tabs.Screen name="coaching-plans" options={hiddenOptions} />
      <Tabs.Screen name="create-coaching-plan" options={hiddenOptions} />
      <Tabs.Screen name="rewards" options={hiddenOptions} />
      <Tabs.Screen name="leaderboard" options={hiddenOptions} />
      <Tabs.Screen name="staff-report" options={hiddenOptions} />

      {/* ===================== STORE COMMUNICATION ===================== */}
      <Tabs.Screen name="announcements" options={hiddenOptions} />
      <Tabs.Screen name="announcements/[id]" options={hiddenOptions} />
      <Tabs.Screen name="create-announcement" options={hiddenOptions} />
      <Tabs.Screen name="reminders" options={hiddenOptions} />
      <Tabs.Screen name="reminders/[id]" options={hiddenOptions} />
      <Tabs.Screen name="create-reminder" options={hiddenOptions} />
      <Tabs.Screen name="checklists" options={hiddenOptions} />
      <Tabs.Screen name="checklists/[id]" options={hiddenOptions} />
      <Tabs.Screen name="create-checklist" options={hiddenOptions} />
      <Tabs.Screen name="checklist-responses" options={hiddenOptions} />

      {/* ===================== EXTRA COMMON ROUTES ===================== */}
      <Tabs.Screen name="dashboard-old" options={hiddenOptions} />
      <Tabs.Screen name="home" options={hiddenOptions} />
      <Tabs.Screen name="index" options={hiddenOptions} />
      <Tabs.Screen name="create-task" options={hiddenOptions} />
      <Tabs.Screen name="task-detail" options={hiddenOptions} />
      <Tabs.Screen name="task-detail/[id]" options={hiddenOptions} />
      <Tabs.Screen name="staff" options={hiddenOptions} />
      <Tabs.Screen name="staff/[id]" options={hiddenOptions} />
      <Tabs.Screen name="staff/[staffId]" options={hiddenOptions} />
      <Tabs.Screen name="team-member" options={hiddenOptions} />
      <Tabs.Screen name="team-member/[id]" options={hiddenOptions} />
      <Tabs.Screen name="team-members" options={hiddenOptions} />
      <Tabs.Screen name="team-members/[id]" options={hiddenOptions} />
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
    paddingHorizontal: 30,
    shadowColor: "#102B45",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 12,
  },

  tabIcon: {
    minWidth: 86,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },

  tabIconActive: {
    transform: [{ translateY: -1 }],
  },

  iconBubble: {
    width: 40,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  iconBubbleActive: {
    backgroundColor: "#FFF3E8",
  },

  tabLabel: {
    fontSize: 10,
    color: COLORS.gray,
    fontWeight: "600",
  },

  tabLabelActive: {
    color: COLORS.orange,
    fontWeight: "900",
  },
});