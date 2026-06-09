import { router } from "expo-router";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
} from "react-native";

export default function AppDrawer({
  visible,
  onClose,
}: any) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.4)",
        }}
      >
        <View
          style={{
            width: 280,
            height: "100%",
            backgroundColor: "#fff",
            paddingTop: 60,
            paddingHorizontal: 20,
          }}
        >
          <TouchableOpacity
            onPress={() => {
              router.push("/staff/notifications");
              onClose();
            }}
          >
            <Text style={{ marginBottom: 25 }}>
              Notifications
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              router.push("/staff/settings");
              onClose();
            }}
          >
            <Text style={{ marginBottom: 25 }}>
              Settings
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              router.push("/staff/about");
              onClose();
            }}
          >
            <Text style={{ marginBottom: 25 }}>
              About
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              router.push("/staff/help");
              onClose();
            }}
          >
            <Text style={{ marginBottom: 25 }}>
              Help
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}