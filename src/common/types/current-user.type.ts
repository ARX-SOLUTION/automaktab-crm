import { Role } from '@prisma/client';

export interface CurrentUserPayload {
  id: string;
  email: string;
  fullName: string;
  role: Role;
}
