import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import { join } from 'path';

import { Injectable } from '@nestjs/common';
import Handlebars from 'handlebars';

import { registerAuthHelpers } from './helpers/auth.uz';
import { registerFormatUzHelpers } from './helpers/format.uz';
import { registerStudentHelpers } from './helpers/student';
import { registerUiHelpers } from './helpers/ui';
import { PageContextMap, TemplatePageName } from './types';

type CacheEntry = {
  hash: string;
  template: Handlebars.TemplateDelegate;
};

@Injectable()
export class TemplateService {
  private readonly handlebars = Handlebars.create();
  private readonly pageCache = new Map<TemplatePageName, CacheEntry>();
  private partialsSignature = '';
  private readonly baseDirCandidates = [
    __dirname,
    join(process.cwd(), 'src', 'infra', 'templates'),
    join(process.cwd(), 'dist', 'src', 'infra', 'templates'),
    join(process.cwd(), 'dist', 'infra', 'templates'),
  ];
  private readonly allowedPages = new Set<TemplatePageName>([
    'login',
    'dashboard',
    'students',
    'branches',
    'managers',
    'reports',
    'groups-overview',
  ]);

  constructor() {
    registerFormatUzHelpers(this.handlebars);
    registerAuthHelpers(this.handlebars);
    registerStudentHelpers(this.handlebars);
    registerUiHelpers(this.handlebars);
  }

  async render<TPage extends TemplatePageName>(
    name: TPage,
    context: PageContextMap[TPage],
  ): Promise<string> {
    if (!this.allowedPages.has(name)) {
      throw new Error(`Template "${name}" is not registered`);
    }

    const rootDir = await this.resolveBaseDir();
    const partialsSignature = await this.registerPartials(rootDir);
    const pagePath = join(rootDir, 'pages', `${name}.hbs`);
    const source = await fs.readFile(pagePath, 'utf-8');
    const hash = this.hash(`${source}:${partialsSignature}`);
    const cached = this.pageCache.get(name);

    if (cached && cached.hash === hash) {
      return cached.template(context);
    }

    const compiled = this.handlebars.compile(source, { noEscape: false });
    this.pageCache.set(name, { hash, template: compiled });

    return compiled(context);
  }

  clearCache(name?: TemplatePageName): void {
    if (name) {
      this.pageCache.delete(name);
      return;
    }

    this.pageCache.clear();
    this.partialsSignature = '';
  }

  private async resolveBaseDir(): Promise<string> {
    for (const directory of this.baseDirCandidates) {
      try {
        await fs.access(directory);
        return directory;
      } catch {}
    }

    throw new Error('Templates directory was not found');
  }

  private async registerPartials(rootDir: string): Promise<string> {
    const files = [
      ...(await this.readTemplateDir(join(rootDir, 'layouts'))).map((name) => ({
        name,
        fullPath: join(rootDir, 'layouts', name),
        partialName: name.replace(/\.hbs$/, ''),
      })),
      ...(await this.readTemplateDir(join(rootDir, 'partials'))).map((name) => ({
        name,
        fullPath: join(rootDir, 'partials', name),
        partialName: name.replace(/^_/, '').replace(/\.hbs$/, ''),
      })),
    ];

    let signatureSource = '';

    for (const file of files) {
      const source = await fs.readFile(file.fullPath, 'utf-8');
      this.handlebars.registerPartial(file.partialName, source);
      signatureSource += `${file.partialName}:${source}`;
    }

    const nextSignature = this.hash(signatureSource);
    if (nextSignature !== this.partialsSignature) {
      this.partialsSignature = nextSignature;
      this.pageCache.clear();
    }

    return this.partialsSignature;
  }

  private async readTemplateDir(directory: string): Promise<string[]> {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.hbs'))
      .map((entry) => entry.name)
      .sort((left, right) => left.localeCompare(right));
  }

  private hash(source: string): string {
    return createHash('sha256').update(source).digest('hex');
  }
}
