import { reject, type MockRequest } from './http';

/** Strict contract for new modules; do not change legacy clamp-based readPaging. */
export function strictInteger(raw: string) {
  if (!/^-?\d+$/.test(raw) || !Number.isSafeInteger(Number(raw))) reject('2002');
  return Number(raw);
}
export function positiveId(req: MockRequest, key = 'id') {
  const value = strictInteger(req.params[key] ?? '');
  if (value < 1) reject('2003');
  return value;
}
export function strictPaging(req: MockRequest, maxLimit?: number) {
  const page = req.query.page === undefined ? 1 : strictInteger(req.query.page);
  const limit = req.query.limit === undefined ? 20 : strictInteger(req.query.limit);
  if (page < 1 || limit < 1 || (maxLimit !== undefined && limit > maxLimit)) reject('2003');
  return { page, limit, offset: (page - 1) * limit };
}
