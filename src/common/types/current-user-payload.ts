import { Role } from '@prisma/client';

export interface CurrentUserPayload {
  id: string;
  role: Role;
  branchId: string | null;
}
