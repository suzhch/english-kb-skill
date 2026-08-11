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

function cssName(value) {
  const text = String(value || "unknown").trim().toLowerCase();
  const compact = text
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return compact || "unknown";
}

function pLine(label, value) {
  return `<p><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</p>`;
}

function ulText(items, className = "") {
  if (!Array.isArray(items) || items.length === 0) return "";
  const cls = className ? ` class="${escapeHtml(className)}"` : "";
  const rows = items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  return `<ul${cls}>${rows}</ul>`;
}

function renderExamples(examples) {
  if (!Array.isArray(examples) || examples.length === 0) return "";
  const blocks = [];

  examples.forEach((ex, idx) => {
    if (!ex || typeof ex !== "object") return;
    const row = [`<div class="example-item" data-index="${idx + 1}">`];
    if (ex.english != null) row.push(`<p class="en">${escapeHtml(ex.english)}</p>`);
    if (ex.translation != null) row.push(`<p class="zh">${escapeHtml(ex.translation)}</p>`);
    if (ex.note) row.push(`<p class="note">${escapeHtml(ex.note)}</p>`);
    row.push("</div>");
    blocks.push(row.join(""));
  });

  if (blocks.length === 0) return "";
  return `<section><h4>Examples</h4>${blocks.join("")}</section>`;
}

function renderExpressions(expressions) {
  if (!Array.isArray(expressions) || expressions.length === 0) return "";
  const rows = [];

  expressions.forEach((ex) => {
    if (!ex || typeof ex !== "object") return;
    rows.push(
      "<tr>" +
        `<td>${escapeHtml(ex.expression || "")}</td>` +
        `<td>${escapeHtml(ex.meaning || "")}</td>` +
        `<td>${escapeHtml(ex.register || "")}</td>` +
        `<td>${escapeHtml(ex.scenario || "")}</td>` +
      "</tr>"
    );
  });

  if (rows.length === 0) return "";

  return (
    "<section><h4>Expressions</h4>" +
    "<table>" +
    "<thead><tr><th>Expression</th><th>Meaning</th><th>Register</th><th>Scenario</th></tr></thead>" +
    `<tbody>${rows.join("")}</tbody>` +
    "</table></section>"
  );
}

function renderKnowledgePoint(data) {
  const definition = (data && typeof data.definition === "object") ? data.definition : {};
  const category = data.category || "";
  const subcategory = data.subcategory || "";
  const difficulty = data.difficulty || "";

  const parts = [
    `<div class="kb-snippet kb-knowledge-point" data-id="${escapeHtml(data.id || "")}" data-category="${escapeHtml(category)}" data-difficulty="${escapeHtml(difficulty)}">`,
    `<h3>${escapeHtml(definition.name || data.id || "Knowledge Point")}</h3>`,
    `<p class="meta">${escapeHtml(category)}${subcategory ? ` | ${escapeHtml(subcategory)}` : ""}${difficulty ? ` | ${escapeHtml(difficulty)}` : ""}</p>`
  ];

  if (definition.description) {
    parts.push(`<p class="description">${escapeHtml(definition.description)}</p>`);
  }

  parts.push(renderExamples(data.examples));
  parts.push(renderExpressions(data.expressions));

  if (Array.isArray(data.relatedTopics) && data.relatedTopics.length > 0) {
    parts.push(`<section><h4>Related Topics</h4>${ulText(data.relatedTopics, "related-topics")}</section>`);
  }

  if (Array.isArray(data.tags) && data.tags.length > 0) {
    parts.push(`<section><h4>Tags</h4>${ulText(data.tags, "tags")}</section>`);
  }

  if (data.createdAt) parts.push(pLine("Created At", data.createdAt));
  if (data.updatedAt) parts.push(pLine("Updated At", data.updatedAt));

  parts.push("</div>");
  return parts.join("");
}

function renderStrategyPayload(data, strategy) {
  const token = String(strategy || "").toUpperCase();

  if (token === "CLASSIFICATION" && data.classification && typeof data.classification === "object") {
    return pLine("Parent", data.classification.parent || "") + pLine("Reason", data.classification.reason || "");
  }

  if (token === "COMPARISON" && data.comparison && typeof data.comparison === "object") {
    const out = [pLine("Compare With", data.comparison.compareWith || "")];
    if (Array.isArray(data.comparison.similarities)) {
      out.push(`<h4>Similarities</h4>${ulText(data.comparison.similarities)}`);
    }
    if (Array.isArray(data.comparison.differences)) {
      out.push(`<h4>Differences</h4>${ulText(data.comparison.differences)}`);
    }
    return out.join("");
  }

  if (token === "ASSOCIATION" && data.association && typeof data.association === "object") {
    const out = [];
    if (Array.isArray(data.association.relatedTopics)) {
      out.push(`<h4>Related Topics</h4>${ulText(data.association.relatedTopics)}`);
    }
    if (Array.isArray(data.association.relatedWords)) {
      out.push(`<h4>Related Words</h4>${ulText(data.association.relatedWords)}`);
    }
    if (data.association.note) out.push(pLine("Note", data.association.note));
    return out.join("");
  }

  if (token === "EXAMPLE" && data.example && typeof data.example === "object") {
    const out = [
      pLine("English", data.example.english || ""),
      pLine("Translation", data.example.translation || "")
    ];
    if (data.example.note) out.push(pLine("Note", data.example.note));
    return out.join("");
  }

  if (token === "COUNTER_EXAMPLE" && data.counterExample && typeof data.counterExample === "object") {
    return pLine("Wrong", data.counterExample.wrong || "") + pLine("Reason", data.counterExample.reason || "");
  }

  if (token === "SCENARIO" && data.scenario && typeof data.scenario === "object") {
    return pLine("Description", data.scenario.description || "");
  }

  if (token === "MNEMONIC" && data.mnemonic && typeof data.mnemonic === "object") {
    return pLine("Method", data.mnemonic.method || "") + pLine("Content", data.mnemonic.content || "");
  }

  if (token === "CONFUSION" && data.confusion && typeof data.confusion === "object") {
    return pLine("Confused With", data.confusion.confusedWith || "") + pLine("Reason", data.confusion.reason || "");
  }

  if (token === "EXTENSION" && data.extension && typeof data.extension === "object") {
    const nextTopics = Array.isArray(data.extension.nextTopics) ? data.extension.nextTopics : [];
    return `<h4>Next Topics</h4>${ulText(nextTopics)}`;
  }

  if (token === "DIALOGUE" && data.dialogue && typeof data.dialogue === "object" && Array.isArray(data.dialogue.conversation)) {
    const lines = data.dialogue.conversation
      .filter((turn) => turn && typeof turn === "object")
      .map((turn) => `<li><strong>${escapeHtml(turn.speaker || "")}:</strong> ${escapeHtml(turn.text || "")}</li>`)
      .join("");
    return `<h4>Conversation</h4><ul>${lines}</ul>`;
  }

  return "";
}

function renderLearningAsset(data) {
  const strategy = String(data.strategy || "UNKNOWN").toUpperCase();
  const parts = [
    `<div class="kb-snippet kb-learning-asset strategy-${cssName(strategy)}" data-id="${escapeHtml(data.id || "")}" data-strategy="${escapeHtml(strategy)}">`,
    `<h3>${escapeHtml(data.title || data.id || strategy)}</h3>`,
    pLine("Knowledge Point", data.knowledgePointId || ""),
    pLine("Strategy", strategy)
  ];

  const payload = renderStrategyPayload(data, strategy);
  if (payload) parts.push(`<section>${payload}</section>`);

  if (data.createdAt) parts.push(pLine("Created At", data.createdAt));
  if (data.updatedAt) parts.push(pLine("Updated At", data.updatedAt));

  parts.push("</div>");
  return parts.join("");
}

function renderEnhancementContent(content, targetType) {
  const token = String(targetType || "").toUpperCase();
  if (Array.isArray(content)) {
    const tag = (token === "EXAMPLE" || token === "SCENARIO" || token === "COUNTER_EXAMPLE") ? "ol" : "ul";
    const lines = content.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
    return `<${tag} class="content-list">${lines}</${tag}>`;
  }
  if (content == null) return "";
  return `<p class="content-text">${escapeHtml(content)}</p>`;
}

function renderEnhancement(data) {
  const targetType = String(data.targetType || "UNKNOWN").toUpperCase();
  const parts = [
    `<div class="kb-snippet kb-enhancement target-${cssName(targetType)}" data-id="${escapeHtml(data.id || "")}" data-target-type="${escapeHtml(targetType)}">`,
    `<h3>${escapeHtml(data.title || data.id || "Enhancement")}</h3>`,
    pLine("Knowledge Point", data.knowledgePointId || ""),
    pLine("Target Type", targetType),
    pLine("Enhancement Type", data.enhancementType || ""),
    "<section><h4>Content</h4>",
    renderEnhancementContent(data.content, targetType),
    "</section>"
  ];

  if (Array.isArray(data.tags) && data.tags.length > 0) {
    parts.push(`<section><h4>Tags</h4>${ulText(data.tags, "tags")}</section>`);
  }

  if (data.confidence != null) parts.push(pLine("Confidence", data.confidence));
  if (data.source) parts.push(pLine("Source", data.source));
  if (data.createdAt) parts.push(pLine("Created At", data.createdAt));

  parts.push("</div>");
  return parts.join("");
}

function renderGenericObject(data) {
  const rows = Object.entries(data).map(([key, value]) => {
    const pretty = (value && typeof value === "object") ? JSON.stringify(value) : String(value);
    return `<tr><th>${escapeHtml(key)}</th><td>${escapeHtml(pretty)}</td></tr>`;
  }).join("");

  return `<div class="kb-snippet kb-generic"><h3>JSON Object</h3><table><tbody>${rows}</tbody></table></div>`;
}

function detectKind(data) {
  if (typeof data.type === "string" && data.type.trim()) {
    const token = data.type.trim().toLowerCase();
    if (token === "knowledge_point" || token === "knowledgepoint" || token === "base") return "knowledge_point";
    if (token === "learning_asset" || token === "learningasset" || token === "asset") return "learning_asset";
    if (token === "enhancement" || token === "personal_enhancement") return "enhancement";
  }

  if (Object.prototype.hasOwnProperty.call(data, "targetType")) return "enhancement";
  if (Object.prototype.hasOwnProperty.call(data, "strategy") && Object.prototype.hasOwnProperty.call(data, "knowledgePointId")) return "learning_asset";
  if (Object.prototype.hasOwnProperty.call(data, "definition") && Object.prototype.hasOwnProperty.call(data, "category") && Object.prototype.hasOwnProperty.call(data, "difficulty")) return "knowledge_point";
  return "generic";
}

function renderRecord(data) {
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const kind = detectKind(data);
    if (kind === "knowledge_point") return renderKnowledgePoint(data);
    if (kind === "learning_asset") return renderLearningAsset(data);
    if (kind === "enhancement") return renderEnhancement(data);
    return renderGenericObject(data);
  }
  return `<div class="kb-snippet kb-primitive">${escapeHtml(data)}</div>`;
}

function renderPayload(payload) {
  if (Array.isArray(payload)) {
    return payload.map((item) => renderRecord(item)).join("\n");
  }
  return renderRecord(payload);
}

async function listJsonFiles(inputDir, outputDir) {
  const out = [];

  async function walk(dir) {
    const entries = await fsp.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (path.resolve(full).startsWith(path.resolve(outputDir))) {
          continue;
        }
        await walk(full);
        continue;
      }
      if (entry.isFile() && entry.name.toLowerCase().endsWith(".json")) {
        out.push(full);
      }
    }
  }

  await walk(inputDir);
  return out;
}

async function processFile(filePath, inputDir, outputDir) {
  const rel = path.relative(inputDir, filePath);
  const outPath = path.join(outputDir, `${rel}.html`);
  const outDir = path.dirname(outPath);
  await fsp.mkdir(outDir, { recursive: true });

  let payload;
  try {
    const raw = await fsp.readFile(filePath, "utf8");
    payload = JSON.parse(raw);
  } catch (error) {
    return { ok: false, src: filePath, message: `JSON parse failed: ${error.message}` };
  }

  const snippet = renderPayload(payload);
  await fsp.writeFile(outPath, `${snippet}\n`, "utf8");
  return { ok: true, src: filePath, dest: outPath };
}

function parseArgs(argv) {
  const args = argv.slice(2);
  if (args.length === 0) {
    return { error: "Usage: node web/json-to-html-snippets.js <json_dir> [--out <output_dir>]" };
  }

  const jsonDir = args[0];
  let outDir = null;

  for (let i = 1; i < args.length; i += 1) {
    const token = args[i];
    if (token === "-o" || token === "--out") {
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
    : path.resolve(path.join(inputDir, "html-snippets"));

  if (!fs.existsSync(inputDir) || !fs.statSync(inputDir).isDirectory()) {
    console.error(`[ERROR] Not a directory: ${inputDir}`);
    process.exitCode = 2;
    return;
  }

  await fsp.mkdir(outputDir, { recursive: true });
  const files = await listJsonFiles(inputDir, outputDir);

  if (files.length === 0) {
    console.log(`[WARN] No JSON files found in: ${inputDir}`);
    return;
  }

  let okCount = 0;
  let failCount = 0;

  for (const filePath of files) {
    const result = await processFile(filePath, inputDir, outputDir);
    if (result.ok) {
      okCount += 1;
      console.log(`[OK] ${result.src} -> ${result.dest}`);
    } else {
      failCount += 1;
      console.log(`[FAIL] ${result.src}: ${result.message}`);
    }
  }

  console.log(`\nDone. Success: ${okCount}, Failed: ${failCount}, Output: ${outputDir}`);
  process.exitCode = failCount > 0 ? 1 : 0;
}

main().catch((error) => {
  console.error(`[ERROR] ${error.message}`);
  process.exitCode = 1;
});
