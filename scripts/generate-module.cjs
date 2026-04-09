#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const pluralize = require('pluralize');

// Case transformations
function pascalCase(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function camelCase(str) {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

function kebabCase(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

function snakeCase(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
}

// Get module name from CLI args
const moduleName = process.argv[2];

if (!moduleName) {
  console.error('\x1b[31mError: Module name is required\x1b[0m');
  console.log('\nUsage: pnpm generate:module <module-name>');
  console.log('Example: pnpm generate:module product');
  process.exit(1);
}

// Generate naming variations
const singular = pluralize.singular(camelCase(moduleName));
const plural = pluralize.plural(singular);

const replacements = {
  '{{PascalSingular}}': pascalCase(singular),
  '{{PascalPlural}}': pascalCase(plural),
  '{{camelSingular}}': camelCase(singular),
  '{{camelPlural}}': camelCase(plural),
  '{{kebabSingular}}': kebabCase(singular),
  '{{kebabPlural}}': kebabCase(plural),
  '{{snakeSingular}}': snakeCase(singular),
  '{{snakePlural}}': snakeCase(plural),
};

// Paths
const scriptsDir = __dirname;
const templatesDir = path.join(scriptsDir, 'templates', 'module');
const modulesDir = path.join(scriptsDir, '..', 'src', 'modules');
const targetDir = path.join(modulesDir, replacements['{{kebabPlural}}']);

// Check if module already exists
if (fs.existsSync(targetDir)) {
  console.error(`\x1b[31mError: Module "${replacements['{{kebabPlural}}']}" already exists at ${targetDir}\x1b[0m`);
  process.exit(1);
}

// Template to output file mapping
const fileMapping = {
  'module.ts.tpl': `${replacements['{{kebabPlural}}']}.module.ts`,
  'controller.ts.tpl': `${replacements['{{kebabPlural}}']}.controller.ts`,
  'service.ts.tpl': `${replacements['{{kebabPlural}}']}.service.ts`,
  'index.ts.tpl': 'index.ts',
  'dto/index.ts.tpl': 'dto/index.ts',
  'dto/request/index.ts.tpl': 'dto/request/index.ts',
  'dto/request/create.dto.ts.tpl': `dto/request/create-${replacements['{{kebabSingular}}']}.dto.ts`,
  'dto/request/update.dto.ts.tpl': `dto/request/update-${replacements['{{kebabSingular}}']}.dto.ts`,
  'dto/request/query.dto.ts.tpl': `dto/request/get-${replacements['{{kebabPlural}}']}-query.dto.ts`,
  'dto/response/index.ts.tpl': 'dto/response/index.ts',
  'dto/response/response.ts.tpl': `dto/response/${replacements['{{kebabSingular}}']}.response.ts`,
};

// Replace tokens in content
function replaceTokens(content) {
  let result = content;
  for (const [token, value] of Object.entries(replacements)) {
    result = result.split(token).join(value);
  }
  return result;
}

// Create directory recursively
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Generate module
console.log(`\nGenerating module: \x1b[36m${replacements['{{kebabPlural}}']}\x1b[0m\n`);

// Create target directories
ensureDir(path.join(targetDir, 'dto', 'request'));
ensureDir(path.join(targetDir, 'dto', 'response'));

// Process each template
for (const [templateFile, outputFile] of Object.entries(fileMapping)) {
  const templatePath = path.join(templatesDir, templateFile);
  const outputPath = path.join(targetDir, outputFile);

  if (!fs.existsSync(templatePath)) {
    console.warn(`  \x1b[33mWarning: Template not found: ${templateFile}\x1b[0m`);
    continue;
  }

  const templateContent = fs.readFileSync(templatePath, 'utf8');
  const outputContent = replaceTokens(templateContent);

  fs.writeFileSync(outputPath, outputContent);
  console.log(`  \x1b[32mCreated:\x1b[0m ${outputFile}`);
}

// Register module in app.module.ts
const appModulePath = path.join(scriptsDir, '..', 'src', 'app.module.ts');
const moduleName_pascal = replacements['{{PascalPlural}}'];
const moduleName_kebab = replacements['{{kebabPlural}}'];

function registerInAppModule() {
  if (!fs.existsSync(appModulePath)) {
    console.warn(`  \x1b[33mWarning: app.module.ts not found, skipping auto-registration\x1b[0m`);
    return false;
  }

  let content = fs.readFileSync(appModulePath, 'utf8');

  // Check if module is already imported
  if (content.includes(`${moduleName_pascal}Module`)) {
    console.warn(`  \x1b[33mWarning: ${moduleName_pascal}Module already registered in app.module.ts\x1b[0m`);
    return false;
  }

  // Add import statement after the last module import from './modules/'
  const importStatement = `import { ${moduleName_pascal}Module } from './modules/${moduleName_kebab}/${moduleName_kebab}.module';`;

  // Find the last import from ./modules/
  const moduleImportRegex = /import \{ \w+Module \} from '\.\/modules\/[^']+';/g;
  let lastMatch = null;
  let match;
  while ((match = moduleImportRegex.exec(content)) !== null) {
    lastMatch = match;
  }

  if (lastMatch) {
    const insertPosition = lastMatch.index + lastMatch[0].length;
    content = content.slice(0, insertPosition) + '\n' + importStatement + content.slice(insertPosition);
  } else {
    // Fallback: add after the last import statement
    const lastImportIndex = content.lastIndexOf('import ');
    const lineEnd = content.indexOf('\n', lastImportIndex);
    content = content.slice(0, lineEnd + 1) + importStatement + '\n' + content.slice(lineEnd + 1);
  }

  // Add module to imports array (before the closing bracket of imports)
  // Find the imports array and add the new module
  const importsArrayRegex = /(imports:\s*\[[\s\S]*?)(UploadModule,?)/;
  const importsMatch = content.match(importsArrayRegex);

  if (importsMatch) {
    // Add after the last module in imports array
    content = content.replace(
      importsArrayRegex,
      `$1$2\n    ${moduleName_pascal}Module,`
    );
  } else {
    // Fallback: try to find any module in imports and add after it
    const fallbackRegex = /(imports:\s*\[[\s\S]*?)(\],)/;
    content = content.replace(
      fallbackRegex,
      `$1  ${moduleName_pascal}Module,\n  $2`
    );
  }

  fs.writeFileSync(appModulePath, content);
  return true;
}

const registered = registerInAppModule();
if (registered) {
  console.log(`  \x1b[32mUpdated:\x1b[0m app.module.ts`);
}

// Generate Prisma schema snippet
const prismaSnippet = `
// Add this to prisma/schema.prisma:

model ${replacements['{{PascalSingular}}']} {
  id        String    @id @default(uuid()) @db.Uuid
  title     String
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")

  @@index([deletedAt])
  @@map("${replacements['{{snakePlural}}']}")
}
`;

console.log(`\n\x1b[32m✓\x1b[0m Module "\x1b[36m${replacements['{{kebabPlural}}']}\x1b[0m" generated successfully!`);
console.log(`\n\x1b[33mNext steps:\x1b[0m`);
console.log(`  1. Add Prisma model to schema.prisma:`);
console.log(`\x1b[90m${prismaSnippet}\x1b[0m`);
console.log(`  2. Run: pnpm prisma:push (or prisma:migrate)`);
console.log(`  3. Customize DTOs and service logic as needed\n`);
