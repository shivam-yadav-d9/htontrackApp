import { Stack } from "expo-router";

export default function AdminLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="attendance" />
      <Stack.Screen name="teams" />
      <Stack.Screen name="targets" />
      <Stack.Screen name="incentives" />
      <Stack.Screen name="store-conversions" />
      <Stack.Screen name="courses" />
      <Stack.Screen name="insights" />
      <Stack.Screen name="more" />
      <Stack.Screen name="stores" />
      <Stack.Screen name="reports" />
      <Stack.Screen name="alerts" />
      <Stack.Screen name="notices" />
      <Stack.Screen name="certificates" />
      <Stack.Screen name="[...rest]" />
    </Stack>
  );
}
