#!/usr/bin/env node

const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderDefinition(definition) {
  if (!definition || typeof definition !== "object") return "";
  const description = definition.description ? `<p>${escapeHtml(definition.description)}</p>` : "";
  return `<section><h2>Definition</h2>${description}</section>`;
}

function renderExamples(examples) {
  if (!Array.isArray(examples) || examples.length === 0) return "";
  const rows = examples
    .filter((item) => item && typeof item === "object")
    .map((item) => {
      const en = item.english ? `<p class="en">${escapeHtml(item.english)}</p>` : "";
      const zh = item.translation ? `<p class="zh">${escapeHtml(item.translation)}</p>` : "";
      const note = item.note ? `<p class="note">${escapeHtml(item.note)}</p>` : "";
      return `<li>${en}${zh}${note}</li>`;
    })
    .join("");

  return rows ? `<section><h2>Examples</h2><ol>${rows}</ol></section>` : "";
}

function renderExpressions(expressions) {
  if (!Array.isArray(expressions) || expressions.length === 0) return "";
  const rows = expressions
    .filter((item) => item && typeof item === "object")
    .map((item) => {
      return (
        "<tr>" +
        `<td>${escapeHtml(item.expression || "")}</td>` +
        `<td>${escapeHtml(item.meaning || "")}</td>` +
        `<td>${escapeHtml(item.register || "")}</td>` +
        `<td>${escapeHtml(item.scenario || "")}</td>` +
        "</tr>"
      );
    })
    .join("");

  if (!rows) return "";
  return (
    "<section><h2>Expressions</h2>" +
    "<table><thead><tr><th>Expression</th><th>Meaning</th><th>Register</th><th>Scenario</th></tr></thead>" +
    `<tbody>${rows}</tbody></table></section>`
  );
}

function renderKnowledgeMeta(kp) {
  const meta = [];
  if (kp.category) meta.push(`<li><strong>Category:</strong> ${escapeHtml(kp.category)}</li>`);
  if (kp.subcategory) meta.push(`<li><strong>Subcategory:</strong> ${escapeHtml(kp.subcategory)}</li>`);
  if (kp.difficulty) meta.push(`<li><strong>Difficulty:</strong> ${escapeHtml(kp.difficulty)}</li>`);
  if (Array.isArray(kp.tags) && kp.tags.length > 0) {
    meta.push(`<li><strong>Tags:</strong> ${escapeHtml(kp.tags.join(", "))}</li>`);
  }

  return meta.length ? `<section><h2>Knowledge Point Meta</h2><ul>${meta.join("")}</ul></section>` : "";
}

function renderStrategyPayload(asset) {
  const strategy = String(asset.strategy || "").toUpperCase();

  if (strategy === "CLASSIFICATION" && asset.classification) {
    return (
      `<p><strong>Parent:</strong> ${escapeHtml(asset.classification.parent || "")}</p>` +
      `<p><strong>Reason:</strong> ${escapeHtml(asset.classification.reason || "")}</p>`
    );
  }

  if (strategy === "COMPARISON" && asset.comparison) {
    const similarities = Array.isArray(asset.comparison.similarities)
      ? `<h4>Similarities</h4><ul>${asset.comparison.similarities.map((x) => `<li>${escapeHtml(x)}</li>`).join("")}</ul>`
      : "";
    const differences = Array.isArray(asset.comparison.differences)
      ? `<h4>Differences</h4><ul>${asset.comparison.differences.map((x) => `<li>${escapeHtml(x)}</li>`).join("")}</ul>`
      : "";
    return `<p><strong>Compare With:</strong> ${escapeHtml(asset.comparison.compareWith || "")}</p>${similarities}${differences}`;
  }

  if (strategy === "ASSOCIATION" && asset.association) {
    const topics = Array.isArray(asset.association.relatedTopics)
      ? `<h4>Related Topics</h4><ul>${asset.association.relatedTopics.map((x) => `<li>${escapeHtml(x)}</li>`).join("")}</ul>`
      : "";
    const words = Array.isArray(asset.association.relatedWords)
      ? `<h4>Related Words</h4><ul>${asset.association.relatedWords.map((x) => `<li>${escapeHtml(x)}</li>`).join("")}</ul>`
      : "";
    const note = asset.association.note ? `<p><strong>Note:</strong> ${escapeHtml(asset.association.note)}</p>` : "";
    return `${topics}${words}${note}`;
  }

  if (strategy === "COUNTER_EXAMPLE" && asset.counterExample) {
    return (
      `<p><strong>Wrong:</strong> ${escapeHtml(asset.counterExample.wrong || "")}</p>` +
      `<p><strong>Reason:</strong> ${escapeHtml(asset.counterExample.reason || "")}</p>`
    );
  }

  if (strategy === "SCENARIO" && asset.scenario) {
    return `<p>${escapeHtml(asset.scenario.description || "")}</p>`;
  }

  if (strategy === "MNEMONIC" && asset.mnemonic) {
    return (
      `<p><strong>Method:</strong> ${escapeHtml(asset.mnemonic.method || "")}</p>` +
      `<p><strong>Content:</strong> ${escapeHtml(asset.mnemonic.content || "")}</p>`
    );
  }

  if (strategy === "CONFUSION" && asset.confusion) {
    return (
      `<p><strong>Confused With:</strong> ${escapeHtml(asset.confusion.confusedWith || "")}</p>` +
      `<p><strong>Reason:</strong> ${escapeHtml(asset.confusion.reason || "")}</p>`
    );
  }

  if (strategy === "EXTENSION" && asset.extension) {
    const topics = Array.isArray(asset.extension.nextTopics)
      ? `<ul>${asset.extension.nextTopics.map((x) => `<li>${escapeHtml(x)}</li>`).join("")}</ul>`
      : "";
    return topics;
  }

  if (strategy === "DIALOGUE" && asset.dialogue && Array.isArray(asset.dialogue.conversation)) {
    const turns = asset.dialogue.conversation
      .map((turn) => `<li><strong>${escapeHtml(turn.speaker || "")}:</strong> ${escapeHtml(turn.text || "")}</li>`)
      .join("");
    return `<ul>${turns}</ul>`;
  }

  if (strategy === "EXAMPLE" && asset.example) {
    const note = asset.example.note ? `<p><strong>Note:</strong> ${escapeHtml(asset.example.note)}</p>` : "";
    return (
      `<p><strong>English:</strong> ${escapeHtml(asset.example.english || "")}</p>` +
      `<p><strong>Translation:</strong> ${escapeHtml(asset.example.translation || "")}</p>` +
      note
    );
  }

  return "";
}

function renderLearningAssets(assets) {
  if (!Array.isArray(assets) || assets.length === 0) {
    return "<section><h2>Learning Assets</h2><p>No learning assets found.</p></section>";
  }

  const blocks = assets
    .filter((asset) => asset && typeof asset === "object")
    .map((asset) => {
      const strategy = escapeHtml(String(asset.strategy || "UNKNOWN").toUpperCase());
      const title = escapeHtml(asset.title || asset.id || "Untitled");
      const payload = renderStrategyPayload(asset);

      return (
        "<article class=\"learning-item\">" +
        `<h3 class="strategy">${strategy}</h3>` +
        `<h4 class="title">${title}</h4>` +
        (payload ? `<div class="payload">${payload}</div>` : "") +
        "</article>"
      );
    })
    .join("");

  return `<section><h2>Learning Assets</h2>${blocks}</section>`;
}

function renderPage(kp, assets) {
  const pageTitle = (kp.definition && kp.definition.name) ? kp.definition.name : (kp.id || "Knowledge Point");

  return (
    "<!doctype html>" +
    "<html lang=\"en\">" +
    "<head>" +
    "<meta charset=\"UTF-8\">" +
    "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">" +
    `<title>${escapeHtml(pageTitle)}</title>` +
    "<style>" +
    "body{font-family:Georgia,serif;max-width:980px;margin:32px auto;padding:0 16px;line-height:1.6;color:#1a1a1a;}" +
    "h1{font-size:2rem;margin-bottom:0.4rem;}" +
    "h2{margin-top:2rem;border-bottom:1px solid #ddd;padding-bottom:0.3rem;}" +
    "h3.strategy{margin:1.2rem 0 0.2rem;font-size:1.1rem;letter-spacing:0.02em;color:#0b4f6c;}" +
    "h4.title{margin:0 0 0.6rem;font-size:1rem;color:#333;}" +
    "article.learning-item{padding:10px 12px;border-left:3px solid #e0e0e0;margin:12px 0;background:#fafafa;}" +
    "table{border-collapse:collapse;width:100%;}" +
    "th,td{border:1px solid #ddd;padding:6px 8px;text-align:left;vertical-align:top;}" +
    ".meta{color:#555;}" +
    ".en{font-weight:600;}" +
    ".note{color:#666;font-size:0.95rem;}" +
    "</style>" +
    "</head>" +
    "<body>" +
    `<h1>${escapeHtml(pageTitle)}</h1>` +
    `<p class="meta">ID: ${escapeHtml(kp.id || "")}</p>` +
    renderKnowledgeMeta(kp) +
    renderDefinition(kp.definition) +
    renderExamples(kp.examples) +
    renderExpressions(kp.expressions) +
    renderLearningAssets(assets) +
    "</body></html>"
  );
}

async function listKnowledgeFiles(inputDir, outputDir) {
  const files = [];

  async function walk(dir) {
    const entries = await fsp.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (path.resolve(full).startsWith(path.resolve(outputDir))) continue;
        await walk(full);
        continue;
      }

      if (!entry.isFile() || !entry.name.toLowerCase().endsWith(".json")) continue;
      if (entry.name.toLowerCase().endsWith(".learning-assets.json")) continue;

      files.push(full);
    }
  }

  await walk(inputDir);
  return files;
}

async function parseJson(filePath) {
  const raw = await fsp.readFile(filePath, "utf8");
  return JSON.parse(raw);
}

function isKnowledgePointShape(data) {
  return Boolean(
    data &&
    typeof data === "object" &&
    !Array.isArray(data) &&
    Object.prototype.hasOwnProperty.call(data, "id") &&
    Object.prototype.hasOwnProperty.call(data, "definition") &&
    Object.prototype.hasOwnProperty.call(data, "difficulty")
  );
}

async function processKnowledgeFile(kpPath, inputDir, outputDir) {
  let kp;
  try {
    kp = await parseJson(kpPath);
  } catch (error) {
    return { ok: false, file: kpPath, message: `knowledge JSON parse failed: ${error.message}` };
  }

  if (!isKnowledgePointShape(kp)) {
    return { ok: false, file: kpPath, message: "not a knowledge-point JSON (missing id/definition/difficulty)" };
  }

  const assetPath = kpPath.replace(/\.json$/i, ".learning-assets.json");
  let assets = [];
  if (fs.existsSync(assetPath)) {
    try {
      const parsed = await parseJson(assetPath);
      assets = Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return { ok: false, file: kpPath, message: `learning-assets JSON parse failed: ${error.message}` };
    }
  }

  const rel = path.relative(inputDir, kpPath);
  const outPath = path.join(outputDir, rel.replace(/\.json$/i, ".bundle.html"));
  await fsp.mkdir(path.dirname(outPath), { recursive: true });

  const html = renderPage(kp, assets);
  await fsp.writeFile(outPath, html, "utf8");

  return { ok: true, kp: kpPath, assets: fs.existsSync(assetPath) ? assetPath : null, out: outPath };
}

function parseArgs(argv) {
  const args = argv.slice(2);
  if (args.length === 0) {
    return { error: "Usage: node web/json-to-html-bundle.js <json_dir> [--out <output_dir>]" };
  }

  const jsonDir = args[0];
  let outDir = null;

  for (let i = 1; i < args.length; i += 1) {
    if (args[i] === "-o" || args[i] === "--out") {
      outDir = args[i + 1] || null;
      i += 1;
    }
  }

  return { jsonDir, outDir };
}

async function main() {
  const parsed = parseArgs(process.argv);
  if (parsed.error) {
    console.error(parsed.error);
    process.exitCode = 2;
    return;
  }

  const inputDir = path.resolve(parsed.jsonDir);
  const outputDir = parsed.outDir
    ? path.resolve(parsed.outDir)
    : path.resolve(path.join(inputDir, "html-bundles"));

  if (!fs.existsSync(inputDir) || !fs.statSync(inputDir).isDirectory()) {
    console.error(`[ERROR] Not a directory: ${inputDir}`);
    process.exitCode = 2;
    return;
  }

  await fsp.mkdir(outputDir, { recursive: true });
  const kpFiles = await listKnowledgeFiles(inputDir, outputDir);

  if (kpFiles.length === 0) {
    console.log(`[WARN] No knowledge-point JSON found in: ${inputDir}`);
    return;
  }

  let ok = 0;
  let fail = 0;

  for (const kpFile of kpFiles) {
    const result = await processKnowledgeFile(kpFile, inputDir, outputDir);
    if (result.ok) {
      ok += 1;
      console.log(`[OK] ${result.kp} + ${result.assets || "(no assets)"} -> ${result.out}`);
    } else {
      fail += 1;
      console.log(`[FAIL] ${result.file}: ${result.message}`);
    }
  }

  console.log(`\nDone. Success: ${ok}, Failed: ${fail}, Output: ${outputDir}`);
  process.exitCode = fail > 0 ? 1 : 0;
}

main().catch((error) => {
  console.error(`[ERROR] ${error.message}`);
  process.exitCode = 1;
});
