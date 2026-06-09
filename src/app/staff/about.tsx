import { View, Text } from "react-native";

export default function About() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text style={{ fontSize: 22, fontWeight: "bold" }}>
        About
      </Text>

      <Text>Samadhan Staff App v1.0</Text>
    </View>
  );
}