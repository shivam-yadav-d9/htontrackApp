import { useState } from "react";
import { View } from "react-native";

import AppHeader from "./AppHeader";
import AppDrawer from "./AppDrawer";

export default function ScreenLayout({
  title,
  children,
}: any) {
  const [drawerVisible, setDrawerVisible] = useState(false);

  return (
    <View style={{ flex: 1 }}>
      <AppHeader
        title={title}
        onMenuPress={() => setDrawerVisible(true)}
      />

      <AppDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />

      <View style={{ flex: 1 }}>
        {children}
      </View>
    </View>
  );
}