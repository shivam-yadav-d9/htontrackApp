import { View, Text } from "react-native";

export default function Help() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text style={{ fontSize: 22, fontWeight: "bold" }}>
        Help & Support
      </Text>

      <Text>support@samadhan.com</Text>
    </View>
  );
}