import { Module } from '@nestjs/common';

import { {{PascalPlural}}Controller } from './{{kebabPlural}}.controller';
import { {{PascalPlural}}Service } from './{{kebabPlural}}.service';

@Module({
  controllers: [{{PascalPlural}}Controller],
  providers: [{{PascalPlural}}Service],
  exports: [{{PascalPlural}}Service],
})
export class {{PascalPlural}}Module {}
