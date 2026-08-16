#!/usr/bin/env node
/**
 * Build the static English-KB site into site/.
 *
 * Data sources (kept as the source of truth):
 * - logs/generation.log.jsonl         artifact registry: what exists, when,
 *                                     how it was generated, validation status
 * - base/*.json                       knowledge point content (definitions,
 *                                     examples, tags, related topics, source)
 * - base/*.learning-assets.json       learning asset bundles per knowledge point
 *
 * Output:
 * - site/index.html                   overview page with data inlined, so it
 *                                     also works when opened directly from disk
 * - site/knowledge/<id>/index.html    one detail page per knowledge point,
 *                                     including its learning assets
 * - site/data/knowledge.json          machine-readable data bundle
 * - site/style.css, site/app.js,
 *   site/detail.js                    copied from site-src/
 *
 * Usage:
 *   node scripts/build-site.mjs            build only
 *   node scripts/build-site.mjs --serve    build, then serve site/ on :4173
 *   node scripts/build-site.mjs --serve --port 8080
 */

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LOG_FILE = path.join(ROOT, 'logs', 'generation.log.jsonl');
const BASE_DIR = path.join(ROOT, 'base');
const SRC_DIR = path.join(ROOT, 'site-src');
const OUT_DIR = path.join(ROOT, 'site');

function readJson(file) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch (err) {
    throw new Error(`${path.relative(ROOT, file)}: ${err.message}`);
  }
}

function loadLog() {
  if (!existsSync(LOG_FILE)) return [];
  return readFileSync(LOG_FILE, 'utf8')
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .map((line, i) => {
      try {
        return JSON.parse(line);
      } catch (err) {
        throw new Error(`${path.relative(ROOT, LOG_FILE)}:${i + 1}: ${err.message}`);
      }
    });
}

function loadKnowledgeContent() {
  const files = readdirSync(BASE_DIR).filter(
    (f) => f.endsWith('.json') && !f.includes('.learning-assets.')
  );
  const byId = new Map();
  for (const file of files) {
    const json = readJson(path.join(BASE_DIR, file));
    byId.set(json.id, json);
  }
  return byId;
}

function loadLearningAssets() {
  const files = readdirSync(BASE_DIR).filter((f) => f.endsWith('.learning-assets.json'));
  const byKp = new Map();
  for (const file of files) {
    const json = readJson(path.join(BASE_DIR, file));
    const key = json.knowledgePointId;
    const list = byKp.get(key) ?? [];
    list.push(...(json.assets ?? []));
    byKp.set(key, list);
  }
  return byKp;
}

function buildData() {
  const logEntries = loadLog();
  const contentById = loadKnowledgeContent();
  const assetsByKp = loadLearningAssets();

  // Registry: the latest log entry per knowledge-point id wins; DELETED removes.
  const registry = new Map();
  for (const entry of logEntries) {
    if (entry.artifactType !== 'KNOWLEDGE_POINT') continue;
    if (entry.action === 'SKIPPED') continue;
    if (entry.action === 'DELETED') {
      registry.delete(entry.id);
      continue;
    }
    registry.set(entry.id, entry);
  }

  // Union of registry ids and actual files, so drift on either side is visible.
  const ids = new Set([...registry.keys(), ...contentById.keys()]);
  const knowledgePoints = [...ids].map((id) => {
    const log = registry.get(id) ?? null;
    const content = contentById.get(id) ?? null;
    const assets = assetsByKp.get(id) ?? [];
    return {
      id,
      log,
      content,
      hasContent: content !== null,
      learningAssetCount: assets.length,
      assetStrategies: [...new Set(assets.map((a) => a.strategy))],
    };
  });

  // Newest first by artifact creation time.
  knowledgePoints.sort((a, b) => {
    const ta = a.content?.createdAt ?? a.log?.createdAt ?? '';
    const tb = b.content?.createdAt ?? b.log?.createdAt ?? '';
    return ta < tb ? 1 : ta > tb ? -1 : 0;
  });

  return {
    generatedAt: new Date().toISOString(),
    sources: [
      'logs/generation.log.jsonl',
      'base/*.json',
      'base/*.learning-assets.json',
    ],
    knowledgePoints,
  };
}

function renderIndex(data) {
  const template = readFileSync(path.join(SRC_DIR, 'index.template.html'), 'utf8');
  const payload = JSON.stringify(data).replace(/</g, '\\u003c');
  return template.replace('__DATA__', payload);
}

function renderDetail(detailData) {
  const template = readFileSync(path.join(SRC_DIR, 'detail.template.html'), 'utf8');
  const payload = JSON.stringify(detailData).replace(/</g, '\\u003c');
  return template.replace('__DATA__', payload);
}

function buildDetailPages(data, assetsByKp) {
  const availableIds = data.knowledgePoints.map((p) => p.id);
  const names = Object.fromEntries(
    data.knowledgePoints.map((p) => [
      p.id,
      p.content?.definition?.name ?? p.log?.request ?? p.id,
    ])
  );
  let count = 0;
  for (const kp of data.knowledgePoints) {
    const detailData = {
      generatedAt: data.generatedAt,
      id: kp.id,
      point: kp,
      assets: assetsByKp.get(kp.id) ?? [],
      availableIds,
      names,
    };
    const dir = path.join(OUT_DIR, 'knowledge', kp.id);
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, 'index.html'), renderDetail(detailData), 'utf8');
    count += 1;
  }
  return count;
}

function build() {
  mkdirSync(path.join(OUT_DIR, 'data'), { recursive: true });
  const data = buildData();

  writeFileSync(path.join(OUT_DIR, 'index.html'), renderIndex(data), 'utf8');
  writeFileSync(
    path.join(OUT_DIR, 'data', 'knowledge.json'),
    `${JSON.stringify(data, null, 2)}\n`,
    'utf8'
  );
  copyFileSync(path.join(SRC_DIR, 'app.js'), path.join(OUT_DIR, 'app.js'));
  copyFileSync(path.join(SRC_DIR, 'detail.js'), path.join(OUT_DIR, 'detail.js'));
  copyFileSync(path.join(SRC_DIR, 'style.css'), path.join(OUT_DIR, 'style.css'));
  const detailCount = buildDetailPages(data, loadLearningAssets());

  const broken = data.knowledgePoints.filter((p) => !p.hasContent);
  console.log(
    `Site built -> ${path.relative(ROOT, OUT_DIR)} (${data.knowledgePoints.length} knowledge points, ${detailCount} detail pages)`
  );
  if (broken.length > 0) {
    console.warn(
      `Warning: ${broken.length} id(s) in the log have no matching base file: ${broken
        .map((p) => p.id)
        .join(', ')}`
    );
  }
  return data;
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};

function serve(port) {
  const server = createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    let filePath = path.resolve(
      OUT_DIR,
      url.pathname === '/' ? 'index.html' : url.pathname.slice(1)
    );
    if (filePath !== OUT_DIR && !filePath.startsWith(`${OUT_DIR}${path.sep}`)) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Forbidden');
      return;
    }
    if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
    if (!existsSync(filePath)) {
      filePath = path.join(OUT_DIR, 'index.html');
    }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(filePath)] ?? 'application/octet-stream',
    });
    res.end(readFileSync(filePath));
  });
  server.listen(port, () => {
    console.log(`Preview: http://localhost:${port}`);
  });
}

const args = process.argv.slice(2);
build();

if (args.includes('--serve')) {
  const idx = args.indexOf('--port');
  const port = idx >= 0 ? Number(args[idx + 1]) : 4173;
  serve(port);
}
