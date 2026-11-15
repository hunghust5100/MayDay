// Public API: feature chi nhánh, khoa, phòng khám
export { useBranches, useDepartments, useRooms } from './hooks/useFacilities';
export { FacilitiesScreen } from './screens/FacilitiesScreen';
export { FacilityDetailScreen } from './screens/FacilityDetailScreen';
export type { Branch, Department, Room } from './types';
