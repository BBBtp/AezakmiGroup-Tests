import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const skillsRoot = path.join(process.cwd(), '.agents', 'skills');
const violations = [];

function violation(skillName, message) {
  violations.push(`${skillName}: ${message}`);
}

function yamlString(source, key) {
  return source.match(new RegExp(`^\\s*${key}:\\s*(['"])(.*?)\\1\\s*$`, 'm'))?.[2];
}

const entries = await fs.readdir(skillsRoot, { withFileTypes: true });
const skillDirectories = entries.filter((entry) => entry.isDirectory());

if (skillDirectories.length === 0) {
  violations.push('.agents/skills: at least one project skill is required');
}

for (const entry of skillDirectories) {
  const skillName = entry.name;
  const skillDirectory = path.join(skillsRoot, skillName);
  const skillPath = path.join(skillDirectory, 'SKILL.md');
  const metadataPath = path.join(skillDirectory, 'agents', 'openai.yaml');
  const skillSource = await fs.readFile(skillPath, 'utf8').catch(() => '');
  const metadataSource = await fs.readFile(metadataPath, 'utf8').catch(() => '');

  if (!skillSource) {
    violation(skillName, 'SKILL.md is missing');
    continue;
  }

  const frontmatter = skillSource.match(/^---\n([\s\S]*?)\n---\n/)?.[1];
  if (!frontmatter) {
    violation(skillName, 'SKILL.md must start with YAML frontmatter');
    continue;
  }

  const keys = [...frontmatter.matchAll(/^([a-z][a-z0-9_-]*):/gm)].map((match) => match[1]);
  if (keys.join(',') !== 'name,description') {
    violation(skillName, 'frontmatter must contain only name and description');
  }

  const declaredName = frontmatter.match(/^name:\s*(.+)$/m)?.[1].trim();
  const description = frontmatter.match(/^description:\s*(.+)$/m)?.[1].trim();
  if (declaredName !== skillName) violation(skillName, 'frontmatter name must match its directory');
  if (!description || description.includes('TODO')) {
    violation(skillName, 'description must explain the skill and its triggers');
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(skillName) || skillName.length > 64) {
    violation(skillName, 'name must be lowercase hyphen-case with at most 64 characters');
  }
  if (/\[TODO|TODO:/.test(skillSource)) violation(skillName, 'unresolved TODO placeholder found');

  const referenceLinks = [...skillSource.matchAll(/\]\((references\/[^)#\s]+)(?:#[^)]+)?\)/g)].map(
    (match) => match[1],
  );
  for (const reference of referenceLinks) {
    const referencePath = path.join(skillDirectory, reference);
    await fs.access(referencePath).catch(() => violation(skillName, `missing reference ${reference}`));
  }

  if (!metadataSource) {
    violation(skillName, 'agents/openai.yaml is missing');
    continue;
  }

  const displayName = yamlString(metadataSource, 'display_name');
  const shortDescription = yamlString(metadataSource, 'short_description');
  const defaultPrompt = yamlString(metadataSource, 'default_prompt');
  const shortLength = shortDescription ? Array.from(shortDescription).length : 0;

  if (!displayName) violation(skillName, 'display_name is required');
  if (shortLength < 25 || shortLength > 64) {
    violation(skillName, 'short_description must contain 25-64 characters');
  }
  if (!defaultPrompt?.includes(`$${skillName}`)) {
    violation(skillName, `default_prompt must mention $${skillName}`);
  }
}

if (violations.length > 0) {
  console.error(['Project skill validation failed:', ...violations.map((item) => `- ${item}`)].join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Project skill validation passed: ${skillDirectories.length} skill(s).`);
}
