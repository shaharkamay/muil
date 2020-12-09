import {
  Controller,
  UseGuards,
  UseInterceptors,
  Req,
  Res,
  Param,
  Body,
  Get,
  Post,
  Put,
  Delete,
  UploadedFiles,
  Query,
  HttpStatus,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { AuthGuard, AllowApiKey } from 'shared/guards';
import { EmailOptionsDto } from './templates.dto';
import { TemplatesService } from './templates.service';
import { File } from './types';

@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  @AllowApiKey()
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
  @AllowApiKey()
  @UseGuards(AuthGuard)
  async delete(@Req() { user: { projectId } }, @Param('branch') branch: string) {
    await this.templatesService.delete(projectId, branch);
  }

  @Post('/:branch?/:templateId/email')
  @AllowApiKey()
  @UseGuards(AuthGuard)
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
  @UseGuards(AuthGuard)
  async renderTemplate(
    @Req() { user: { projectId } },
    @Res() res: Response,
    @Param('branch') branch: string,
    @Param('templateId') templateId: string,
    @Query() { type, inlineCss, minifyHtml, pdfFormat },
    @Body() { props },
  ) {
    const output = await this.templatesService.render(projectId, branch, templateId, props, {
      type,
      inlineCss: inlineCss !== 'false',
      minifyHtml: minifyHtml !== 'false',
      pdfFormat,
    });

    switch (type) {
      case 'html':
        res.set('Content-Type', 'text/html');
        break;
      case 'png':
        res.set('Content-Type', 'image/png');
        break;
      case 'pdf':
        res.set('Content-Type', 'application/pdf');
        break;
      default:
        res.set('Content-Type', 'text/html');
        break;
    }

    return res.status(HttpStatus.OK).send(output);
  }

  @Get('/:branch?/:templateId')
  @AllowApiKey()
  @UseGuards(AuthGuard)
  async renderTemplateGet(
    @Req() { user: { projectId } },
    @Res() res: Response,
    @Param('branch') branch: string,
    @Param('templateId') templateId: string,
    @Query() { type, inlineCss, minifyHtml, ...props },
  ) {
    const output = await this.templatesService.render(projectId, branch, templateId, props, {
      type,
      inlineCss: inlineCss !== 'false',
      minifyHtml: minifyHtml !== 'false',
    });

    switch (type) {
      case 'html':
        res.set('Content-Type', 'text/html');
        break;
      case 'png':
        res.set('Content-Type', 'image/png');
        break;
      case 'pdf':
        res.set('Content-Type', 'application/pdf');
        break;
      default:
        res.set('Content-Type', 'text/html');
        break;
    }

    return res.status(HttpStatus.OK).send(output);
  }
}
