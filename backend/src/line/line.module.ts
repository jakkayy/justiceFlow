import { Module } from '@nestjs/common';
import { LineService } from './line.service';
import { LineController } from './line.controller';
import { CasesModule } from '../cases/cases.module';

@Module({
  imports: [CasesModule],
  providers: [LineService],
  controllers: [LineController],
})
export class LineModule {}
