import { Tabs } from 'expo-router/tabs';
import { Activity, Bell, ClipboardList, House, UserRound } from 'lucide-react-native';

import { TabBar, TabScene } from '@/shared/ui';

/** Thanh tab dưới đáy — Bệnh nhân. */
export default function PatientTabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenLayout={({ children }) => <TabScene>{children}</TabScene>}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Trang chủ', tabBarIcon: ({ color }) => <House color={color} size={24} /> }}
      />
      <Tabs.Screen
        name="records"
        options={{ title: 'Bệnh án', tabBarIcon: ({ color }) => <ClipboardList color={color} size={24} /> }}
      />
      <Tabs.Screen
        name="tracking"
        options={{ title: 'Theo dõi', tabBarIcon: ({ color }) => <Activity color={color} size={24} /> }}
      />
      <Tabs.Screen
        name="notifications"
        options={{ title: 'Thông báo', tabBarIcon: ({ color }) => <Bell color={color} size={24} /> }}
      />
      <Tabs.Screen
        name="account"
        options={{ title: 'Tài khoản', tabBarIcon: ({ color }) => <UserRound color={color} size={24} /> }}
      />
    </Tabs>
  );
}
