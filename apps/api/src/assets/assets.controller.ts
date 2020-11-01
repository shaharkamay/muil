import {
  Controller,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
  Post,
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuardWithApiKey } from 'shared/guards';
import { AssetsService } from './assets.service';

@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Post('/:branch?')
  @UseGuards(AuthGuardWithApiKey)
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file,
    @Req() { user: { projectId } },
    @Param('branch') branch: string,
  ) {
    return this.assetsService.upload(projectId, branch, file);
  }
}
