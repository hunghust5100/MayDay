import { useRouter } from 'expo-router';
import { KeyRound, Plus, ShieldCheck } from 'lucide-react-native';
import { Fragment, useState } from 'react';
import { View } from 'react-native';

import { getErrorMessage } from '@/core/api';
import {
  Card,
  Divider,
  EmptyState,
  ErrorState,
  Icon,
  IconButton,
  ListItem,
  Screen,
  ScreenTitle,
  SegmentedControl,
  Spinner,
} from '@/shared/ui';

import { roleTitle, usePermissions, useRoles } from '../hooks/useRbac';
import type { Role } from '../types';

type Tab = 'roles' | 'permissions';

/** Sắp vai trò theo cây (cha trước, con thụt vào) từ `parent_role_id`. */
function flattenTree(roles: Role[]) {
  const ids = new Set(roles.map((r) => r.id));
  const result: { role: Role; depth: number }[] = [];
  const visit = (parentId: number | null, depth: number) => {
    roles
      .filter((r) => (parentId === null ? r.parent_role_id === null || !ids.has(r.parent_role_id) : r.parent_role_id === parentId))
      .sort((a, b) => a.id - b.id)
      .forEach((role) => {
        result.push({ role, depth });
        if (depth < 10) visit(role.id, depth + 1);
      });
  };
  visit(null, 0);
  return result;
}

function Leading({ icon, tone }: { icon: typeof ShieldCheck; tone: 'primary' | 'info' }) {
  return (
    <View className={tone === 'primary' ? 'h-10 w-10 items-center justify-center rounded-full bg-primary-soft' : 'h-10 w-10 items-center justify-center rounded-full bg-info-soft'}>
      <Icon as={icon} size={20} color={tone === 'primary' ? 'primary-strong' : 'info'} />
    </View>
  );
}

function RolesList() {
  const router = useRouter();
  const { data: roles, isLoading, error, refetch } = useRoles();
  if (isLoading) return <Spinner className="mt-10" />;
  if (!roles) return <ErrorState description={getErrorMessage(error)} onRetry={() => refetch()} />;
  const byId = new Map(roles.map((r) => [r.id, r]));

  return (
    <Card padding="none" className="px-4">
      {flattenTree(roles).map(({ role, depth }, index) => {
        const parent = role.parent_role_id === null ? undefined : byId.get(role.parent_role_id);
        return (
          <Fragment key={role.id}>
            {index > 0 && <Divider />}
            <View style={{ paddingLeft: depth * 18 }}>
              <ListItem
                title={roleTitle(role)}
                description={parent ? `${role.name} · thuộc ${roleTitle(parent)}` : role.name}
                leading={<Leading icon={ShieldCheck} tone="primary" />}
                onPress={() => router.push(`/admin/roles/${role.id}`)}
              />
            </View>
          </Fragment>
        );
      })}
    </Card>
  );
}

function PermissionsList() {
  const router = useRouter();
  const { data: permissions, isLoading, error, refetch } = usePermissions();
  if (isLoading) return <Spinner className="mt-10" />;
  if (!permissions) return <ErrorState description={getErrorMessage(error)} onRetry={() => refetch()} />;
  if (permissions.length === 0) return <EmptyState icon={KeyRound} title="Chưa có quyền nào" />;

  return (
    <Card padding="none" className="px-4">
      {permissions.map((permission, index) => (
        <Fragment key={permission.id}>
          {index > 0 && <Divider />}
          <ListItem
            title={permission.description || permission.name}
            description={permission.name}
            leading={<Leading icon={KeyRound} tone="info" />}
            onPress={() => router.push(`/admin/permissions/${permission.id}`)}
          />
        </Fragment>
      ))}
    </Card>
  );
}

/** Tab "Phân quyền": vai trò (role01–02) và quyền hạn (perm01–04). */
export function RbacScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('roles');

  return (
    <Screen
      header={
        <ScreenTitle
          title="Phân quyền"
          eyebrow="Vai trò & quyền hạn (RBAC)"
          right={
            <IconButton
              icon={Plus}
              variant="soft"
              accessibilityLabel={tab === 'roles' ? 'Thêm vai trò' : 'Thêm quyền'}
              onPress={() => router.push(tab === 'roles' ? '/admin/roles/new' : '/admin/permissions/new')}
            />
          }
        />
      }>
      <SegmentedControl
        options={[
          { value: 'roles', label: 'Vai trò' },
          { value: 'permissions', label: 'Quyền hạn' },
        ]}
        value={tab}
        onChange={setTab}
        className="mb-4"
      />
      {tab === 'roles' ? <RolesList /> : <PermissionsList />}
    </Screen>
  );
}
