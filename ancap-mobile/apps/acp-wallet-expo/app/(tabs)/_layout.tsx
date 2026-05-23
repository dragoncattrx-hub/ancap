import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: "#0a0f1a" },
        headerTintColor: "#f5f7ff",
        tabBarStyle: { backgroundColor: "#111827", borderTopColor: "#1e293b" },
        tabBarActiveTintColor: "#6ee7b7",
        tabBarInactiveTintColor: "#64748b",
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Wallet", headerTitle: "ACP Wallet" }} />
      <Tabs.Screen name="activity" options={{ title: "Activity" }} />
      <Tabs.Screen name="send" options={{ title: "Send" }} />
      <Tabs.Screen name="bridge" options={{ title: "Bridge" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
    </Tabs>
  );
}
