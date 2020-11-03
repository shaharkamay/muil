import {
  Controller,
  UseGuards,
  UseInterceptors,
  Req,
  Param,
  Body,
  Get,
  Post,
  Put,
  Delete,
  UploadedFiles,
  Query,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AuthGuard, RenderLimitGuard, AllowApiKey } from 'shared/guards';
import { EmailOptionsDto } from './templates.dto';
import { TemplatesService } from './templates.service';
import { File } from './types';

@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  @UseGuards(AuthGuard)
  async get(@Req() { user: { projectId } }) {
    return this.templatesService.findAll(projectId);
  }

  @Put('/:branch?')
  @AllowApiKey()
  @UseGuards(AuthGuard)
  @UseInterceptors(FilesInterceptor('file'))
  async upload(
    @UploadedFiles() files: File[],
    @Req() { user: { projectId } },
    @Param('branch') branch: string,
  ) {
    await this.templatesService.upload(projectId, branch, files);
  }

  @Delete('/:branch?')
  @UseGuards(AuthGuard)
  async delete(@Req() { user: { projectId } }, @Param('branch') branch: string) {
    await this.templatesService.delete(projectId, branch);
  }

  @Post('/:branch?/:templateId/email')
  @AllowApiKey()
  @UseGuards(AuthGuard, RenderLimitGuard)
  async emailTemplate(
    @Req() { user: { projectId } },
    @Param('branch') branch: string,
    @Param('templateId') templateId: string,
    @Query() { inlineCss, minifyHtml },
    @Body('props') props: any,
    @Body('attachments') attachments: any[],
    @Body() emailOptionsDto: EmailOptionsDto,
  ) {
    return this.templatesService.email(
      projectId,
      branch,
      templateId,
      props,
      attachments,
      {
        inlineCss: inlineCss !== 'false',
        minifyHtml: minifyHtml !== 'false',
      },
      emailOptionsDto,
    );
  }

  @Post('/:branch?/:templateId')
  @AllowApiKey()
  @UseGuards(AuthGuard, RenderLimitGuard)
  async renderTemplate(
    @Req() { user: { projectId } },
    @Param('branch') branch: string,
    @Param('templateId') templateId: string,
    @Query() { type, inlineCss, minifyHtml, pdfFormat },
    @Body() { props },
  ) {
    return this.templatesService.render(projectId, branch, templateId, props, {
      type,
      inlineCss: inlineCss !== 'false',
      minifyHtml: minifyHtml !== 'false',
      pdfFormat,
    });
  }

  @Get('/:branch?/:templateId')
  @AllowApiKey()
  @UseGuards(AuthGuard, RenderLimitGuard)
  async renderTemplateGet(
    @Req() { user: { projectId } },
    @Param('branch') branch: string,
    @Param('templateId') templateId: string,
    @Query() { type, inlineCss, minifyHtml, ...props },
  ) {
    return this.templatesService.render(projectId, branch, templateId, props, {
      type,
      inlineCss: inlineCss !== 'false',
      minifyHtml: minifyHtml !== 'false',
    });
  }
}
