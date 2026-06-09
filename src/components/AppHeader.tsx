import { Menu } from "lucide-react-native";
import { View, Text, TouchableOpacity } from "react-native";

export default function AppHeader({
  title,
  onMenuPress,
}: {
  title: string;
  onMenuPress: () => void;
}) {
  return (
    <View
      style={{
        height: 80,
        backgroundColor: "#fff",
        flexDirection: "row",
        alignItems: "center",

        paddingHorizontal: 20,
        justifyContent: "space-between",
        paddingTop: 20,
      }}
    >
      <TouchableOpacity onPress={onMenuPress}>
        <Menu size={24} />
      </TouchableOpacity>

      <Text
        style={{
          fontSize: 18,
          fontWeight: "700",
        }}
      >
        {title}
      </Text>

      <View style={{ width: 24 }} />
    </View>
  );
}