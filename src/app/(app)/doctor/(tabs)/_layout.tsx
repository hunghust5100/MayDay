import { Tabs } from 'expo-router/tabs';
import { Bell, ClipboardList, LayoutDashboard, UserRound, UsersRound } from 'lucide-react-native';

import { TabBar } from '@/shared/ui';

/** Thanh tab dưới đáy — Nhân viên y tế. */
export default function DoctorTabsLayout() {
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{ title: 'Tổng quan', tabBarIcon: ({ color }) => <LayoutDashboard color={color} size={24} /> }}
      />
      <Tabs.Screen
        name="records"
        options={{ title: 'Bệnh án', tabBarIcon: ({ color }) => <ClipboardList color={color} size={24} /> }}
      />
      <Tabs.Screen
        name="patients"
        options={{ title: 'Bệnh nhân', tabBarIcon: ({ color }) => <UsersRound color={color} size={24} /> }}
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
