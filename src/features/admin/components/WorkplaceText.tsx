import { useBranches, useDepartments, useRooms } from '@/features/facilities';

/** Tên vị trí công tác từ ID: "Cơ sở Hà Nội · Khoa Da liễu · Phòng 101". */
export function useWorkplaceText(branchId: number | null, departmentId: number | null, roomId: number | null) {
  const { data: branches } = useBranches();
  const { data: departments } = useDepartments();
  const { data: rooms } = useRooms();
  if (branchId === null) return null;
  return {
    branch: branches?.find((b) => b.id === branchId)?.name ?? `Chi nhánh #${branchId}`,
    department: departmentId === null ? null : (departments?.find((d) => d.id === departmentId)?.name ?? `Khoa #${departmentId}`),
    room: roomId === null ? null : (rooms?.find((r) => r.id === roomId)?.name ?? `Phòng #${roomId}`),
  };
}
