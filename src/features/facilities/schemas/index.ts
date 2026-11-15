import { z } from 'zod';
import { rules } from '@/shared/form';
import { isValidFacilityPhone } from '@/shared/utils';
import type { FacilityKind } from '../api/management-api';
export const facilitySchema = (kind: FacilityKind) =>
  z
    .object({
      name: rules.required('tên'),
      address: z.string().trim(),
      phone: z.string().trim(),
      description: z.string().trim(),
      parentId: z.number().nullable(),
    })
    .superRefine((data, ctx) => {
      if (kind === 'branches') {
        if (!data.address) ctx.addIssue({ code: 'custom', path: ['address'], message: 'Vui lòng nhập địa chỉ' });
        if (!isValidFacilityPhone(data.phone))
          ctx.addIssue({ code: 'custom', path: ['phone'], message: 'Số điện thoại liên hệ không hợp lệ' });
      } else if (!data.parentId)
        ctx.addIssue({ code: 'custom', path: ['parentId'], message: 'Vui lòng chọn đơn vị trực thuộc' });
    });
