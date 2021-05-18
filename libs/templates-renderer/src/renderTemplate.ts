import { ReactNode } from 'react';
import * as fs from 'fs';
import { minify } from 'html-minifier';
import juice from 'juice';
import { v4 as uuid } from 'uuid';
import { NodeVM } from 'vm2';
import emailTemplate from './emailTemplate';
import { generatePdf, generatePng } from './puppeteer';
import { styledComponentsStyleCollector } from './styleCollectors';
import { RenderOptions } from './types';

const createReactElement = async (templatePath: string, props): Promise<ReactNode> => {
  const reactElementVm = new NodeVM({
    timeout: 5000,
    sandbox: {
      props,
    },
    require: {
      external: ['react', 'react-dom/server'],
    },
  });

  const tempFileName = `./.muil/temp/${uuid()}.js`;
  await fs.promises.mkdir('./.muil/temp', { recursive: true });
  await fs.promises.copyFile(templatePath, tempFileName);

  const ReactElement = reactElementVm.run(
    `
        const {createElement} = require('react');

        const ReactComponent = require('${tempFileName}');
        const ReactElement = createElement(ReactComponent.default, props);
        module.exports = ReactElement;
      `,
    'renderTemplate.js',
  );

  await fs.promises.unlink(tempFileName);

  return ReactElement;
};

const renderToStaticMarkup = (ReactElement: ReactNode): string => {
  const contentVm = new NodeVM({
    timeout: 5000,
    sandbox: {
      ReactElement,
    },
    require: {
      external: ['react-dom/server'],
    },
  });

  const content = contentVm.run(
    `
        const { renderToStaticMarkup } = require('react-dom/server');
        
        const content = renderToStaticMarkup(ReactElement);
        module.exports = content;
      `,
    'renderTemplate.js',
  );

  return content;
};

const renderTemplate = async ({
  type = 'html',
  templatePath,
  templateCssPath = null,
  props = {},
  styleCollectors = [styledComponentsStyleCollector],
  shadowSupport = false,
  inlineCss = true,
  minifyHtml = true,
  pdfFormat = 'a4',
  pdfOrientation = 'portrait',
}: RenderOptions): Promise<string | Buffer | void> => {
  if (!templatePath) return '';

  const ReactElement = await createReactElement(templatePath, props);
  const content = renderToStaticMarkup(ReactElement);

  const templateCss =
    templateCssPath && fs.existsSync(templateCssPath)
      ? fs.readFileSync(templateCssPath, 'utf-8')
      : null;

  let html = emailTemplate({
    css: templateCss,
    styles: (await Promise.all(styleCollectors.map((collector) => collector(ReactElement)))).join(
      '\n',
    ),
    content,
    shadowSupport,
  });

  if (type === 'html' && inlineCss) {
    html = juice(html);
  }

  if (minifyHtml) {
    html = minify(html, {
      preventAttributesEscaping: true,
      minifyCSS: true,
      minifyURLs: true,
      removeEmptyAttributes: true,
      removeComments: true,
    });
  }

  switch (type) {
    case 'png': {
      return generatePng(html);
    }
    case 'pdf': {
      return generatePdf(html, pdfFormat, pdfOrientation);
    }
    default: {
      return html;
    }
  }
};

export default renderTemplate;
