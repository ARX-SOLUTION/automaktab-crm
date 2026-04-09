import { ApiProperty } from '@nestjs/swagger';

import { CurrentUserPayload } from '@common/types';

export class AuthResponse {
  @ApiProperty()
  accessToken: string;
}

export class CurrentUserResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  role: CurrentUserPayload['role'];

  @ApiProperty({ nullable: true })
  branchId: string | null;

  static fromCurrentUser(user: CurrentUserPayload): CurrentUserResponse {
    return {
      id: user.id,
      role: user.role,
      branchId: user.branchId,
    };
  }
}
