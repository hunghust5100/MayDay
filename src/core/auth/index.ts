// Public API: phiên đăng nhập, lưu token, nhóm vai trò, chặn route
export { RoleStack, SignedInStack, SignedOutStack } from './guards';
export {
  canCreatePatient,
  canEditClinicalRecord,
  canUploadMedia,
  getRoleGroup,
  ROLE_GROUP_LABELS,
  ROLE_HOME,
  ROLE_IDS,
  type RoleGroup,
} from './roles';
export { session, useSession, type SessionState, type SessionUser } from './session';
