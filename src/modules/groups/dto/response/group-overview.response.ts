import { ApiProperty } from '@nestjs/swagger';

class GroupOverviewItem {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  totalStudents: number;

  @ApiProperty()
  activeStudents: number;
}

class GroupOverviewBranch {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;
}

export class GroupOverviewResponse {
  @ApiProperty({ type: GroupOverviewBranch })
  branch: GroupOverviewBranch;

  @ApiProperty({ type: [GroupOverviewItem] })
  groups: GroupOverviewItem[];
}
