import { Tabs } from 'expo-router/tabs';
import { Building2, LayoutDashboard, ShieldCheck, UserRound, UsersRound } from 'lucide-react-native';

import { TabBar } from '@/shared/ui';

/** Thanh tab dưới đáy — Admin. */
export default function AdminTabsLayout() {
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{ title: 'Tổng quan', tabBarIcon: ({ color }) => <LayoutDashboard color={color} size={24} /> }}
      />
      <Tabs.Screen
        name="users"
        options={{ title: 'Người dùng', tabBarIcon: ({ color }) => <UsersRound color={color} size={24} /> }}
      />
      <Tabs.Screen
        name="rbac"
        options={{ title: 'Phân quyền', tabBarIcon: ({ color }) => <ShieldCheck color={color} size={24} /> }}
      />
      <Tabs.Screen
        name="facilities"
        options={{ title: 'Cơ sở', tabBarIcon: ({ color }) => <Building2 color={color} size={24} /> }}
      />
      <Tabs.Screen
        name="account"
        options={{ title: 'Tài khoản', tabBarIcon: ({ color }) => <UserRound color={color} size={24} /> }}
      />
    </Tabs>
  );
}
