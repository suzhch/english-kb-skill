#!/usr/bin/env node
/**
 * log-generation.mjs
 *
 * Maintains logs/generation.log.jsonl for the English Knowledge Base.
 *
 * Normal mode (call after every generation request):
 *   node scripts/log-generation.mjs --action CREATED \
 *     --file base/eng_grammar_modal_can_a2.json \
 *     --artifact-type KNOWLEDGE_POINT \
 *     --request "..." --validation PASS
 *
 * Sync mode (backfill missed entries by scanning the data directories):
 *   node scripts/log-generation.mjs --sync
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const DEFAULT_LOG = path.join(repoRoot, 'logs', 'generation.log.jsonl');
const DEFAULT_MANIFEST = path.join(repoRoot, 'logs', 'manifest.json');

const ACTIONS = ['CREATED', 'UPDATED', 'SKIPPED', 'SYNC', 'DELETED'];
const ARTIFACT_TYPES = [
  'KNOWLEDGE_POINT',
  'LEARNING_ASSET',
  'PERSONAL_ENHANCEMENT',
  'QUESTION',
];

const USAGE = `Usage:
  node scripts/log-generation.mjs --action <CREATED|UPDATED|SKIPPED> --file <path> --artifact-type <type> [options]
  node scripts/log-generation.mjs --sync

Options:
  --action          CREATED | UPDATED | SKIPPED (required in normal mode)
  --file            repository-relative or absolute path of the artifact
  --id              artifact id (required for SKIPPED, or when --file is missing)
  --artifact-type   KNOWLEDGE_POINT | LEARNING_ASSET | PERSONAL_ENHANCEMENT | QUESTION
  --request         concise summary of the user request
  --prompt          exact user input prompt, recorded verbatim (optional)
  --validation      PASS | FAIL | N/A
  --category, --subcategory, --difficulty   optional classification fields
  --log             log file path (default: logs/generation.log.jsonl)
  --manifest        manifest file path (default: logs/manifest.json)
  --sync            backfill events by scanning base/, personal/, questions/
  -h, --help        show this help
`;

function nowIso() {
  const d = new Date();
  const offset = -d.getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const abs = Math.abs(offset);
  const pad = (n) => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}` +
    `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`
  );
}

function cleanText(value) {
  if (value == null) return '';
  return String(value).replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
}

function str(args, key) {
  const value = args[key];
  return typeof value === 'string' ? value : '';
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token === '--sync') {
      args.sync = true;
    } else if (token.startsWith('--')) {
      const eq = token.indexOf('=');
      if (eq !== -1) {
        args[token.slice(2, eq)] = token.slice(eq + 1);
      } else {
        const key = token.slice(2);
        const next = argv[i + 1];
        if (next !== undefined && !next.startsWith('--')) {
          args[key] = next;
          i += 1;
        } else {
          args[key] = true;
        }
      }
    } else {
      args[token] = true;
    }
  }
  return args;
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

function toRel(file) {
  return path.relative(repoRoot, file).split(path.sep).join('/');
}

function artifactTypeFor(rel) {
  if (rel.startsWith('personal/')) return 'PERSONAL_ENHANCEMENT';
  if (rel.startsWith('questions/')) return 'QUESTION';
  if (rel.endsWith('.learning-assets.json')) return 'LEARNING_ASSET';
  return 'KNOWLEDGE_POINT';
}

function buildLine(fields) {
  const {
    action,
    artifactType,
    id,
    file,
    request,
    userPrompt,
    validation,
    category,
    subcategory,
    difficulty,
    artifact,
  } = fields;
  const line = { ts: nowIso(), action, artifactType, id };
  if (file) line.file = file;
  if (request) line.request = cleanText(request);
  if (userPrompt) line.userPrompt = userPrompt;
  if (validation) line.validation = validation;
  if (category) line.category = category;
  if (subcategory) line.subcategory = subcategory;
  if (difficulty) line.difficulty = difficulty;
  if (artifact) {
    if (artifact.createdAt) line.createdAt = String(artifact.createdAt);
    if (artifact.updatedAt != null) line.updatedAt = String(artifact.updatedAt);
    if (artifact.knowledgePointId) line.knowledgePointId = String(artifact.knowledgePointId);
    if (!category && artifact.category) line.category = String(artifact.category);
    if (!subcategory && artifact.subcategory) line.subcategory = String(artifact.subcategory);
    if (!difficulty && artifact.difficulty) line.difficulty = String(artifact.difficulty);
  }
  return JSON.stringify(line);
}

function appendLine(logPath, line) {
  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  fs.appendFileSync(logPath, line + '\n', 'utf8');
}

function requireValue(args, key, allowed) {
  const value = str(args, key);
  if (!value) {
    console.error(`[generation-log] Missing required --${key}.`);
    console.error(USAGE);
    process.exit(1);
  }
  if (allowed && !allowed.includes(value)) {
    console.error(`[generation-log] Invalid --${key} "${value}". Allowed: ${allowed.join(', ')}.`);
    process.exit(1);
  }
  return value;
}

function runNormal(args, logPath) {
  const action = requireValue(args, 'action', ACTIONS);
  const artifactType = requireValue(args, 'artifact-type', ARTIFACT_TYPES);

  let artifact = null;
  let resolvedFile = '';
  let id = cleanText(str(args, 'id'));

  const fileArg = str(args, 'file');
  if (fileArg) {
    resolvedFile = path.isAbsolute(fileArg) ? fileArg : path.resolve(repoRoot, fileArg);
    artifact = readJson(resolvedFile);
    if (!artifact && !id) {
      id = path.basename(fileArg, path.extname(fileArg));
    }
  }
  if (!id && artifact && artifact.id) id = String(artifact.id);
  if (!id) {
    console.error('[generation-log] Cannot determine the artifact id. Pass --id or a readable --file.');
    process.exit(1);
  }

  const line = buildLine({
    action,
    artifactType,
    id,
    file: resolvedFile ? toRel(resolvedFile) : '',
    request: str(args, 'request'),
    userPrompt: str(args, 'prompt'),
    validation: str(args, 'validation'),
    category: str(args, 'category'),
    subcategory: str(args, 'subcategory'),
    difficulty: str(args, 'difficulty'),
    artifact,
  });
  appendLine(logPath, line);
  console.log(`[generation-log] appended ${action} ${artifactType} ${id} -> ${logPath}`);
}

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function loadManifest(manifestPath) {
  const data = readJson(manifestPath);
  return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
}

function runSync(logPath, manifestPath) {
  const manifest = loadManifest(manifestPath);
  const counts = { CREATED: 0, UPDATED: 0, DELETED: 0 };
  const current = new Set();

  for (const root of ['base', 'personal', 'questions']) {
    const dir = path.join(repoRoot, root);
    if (!fs.existsSync(dir)) continue;
    for (const file of walk(dir)) {
      if (!file.toLowerCase().endsWith('.json')) continue;
      const rel = toRel(file);
      current.add(rel);
      const stat = fs.statSync(file);
      const sig = { mtime: stat.mtimeMs, size: stat.size };
      const prev = manifest[rel];
      let action = null;
      if (!prev) action = 'CREATED';
      else if (prev.mtime !== sig.mtime || prev.size !== sig.size) action = 'UPDATED';

      if (action) {
        const artifact = readJson(file);
        let id = artifact && artifact.id ? String(artifact.id) : '';
        if (!id) id = path.basename(file, '.json');
        const type = artifactTypeFor(rel);
        const line = buildLine({ action, artifactType: type, id, file: rel, artifact });
        appendLine(logPath, line);
        counts[action] += 1;
        sig.type = type;
        sig.id = id;
      } else {
        sig.type = prev.type;
        sig.id = prev.id;
      }
      manifest[rel] = sig;
    }
  }

  for (const rel of Object.keys(manifest)) {
    if (!current.has(rel)) {
      const prev = manifest[rel];
      const line = buildLine({
        action: 'DELETED',
        artifactType: prev.type || '',
        id: prev.id || '',
        file: rel,
      });
      appendLine(logPath, line);
      counts.DELETED += 1;
      delete manifest[rel];
    }
  }

  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

  console.log(
    `[generation-log] sync done: ${counts.CREATED} created, ${counts.UPDATED} updated, ${counts.DELETED} deleted`
  );
  console.log(`[generation-log] manifest -> ${manifestPath}`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || args.h) {
    console.log(USAGE);
    return;
  }

  const logPath = str(args, 'log') ? path.resolve(repoRoot, str(args, 'log')) : DEFAULT_LOG;
  const manifestPath = str(args, 'manifest')
    ? path.resolve(repoRoot, str(args, 'manifest'))
    : DEFAULT_MANIFEST;

  if (args.sync) {
    runSync(logPath, manifestPath);
    return;
  }
  runNormal(args, logPath);
}

main();