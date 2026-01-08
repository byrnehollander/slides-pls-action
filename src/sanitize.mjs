/**
 * HTML sanitization utilities for Slidev/Vue compatibility.
 * Vue's template compiler requires well-formed HTML - these functions
 * help ensure generated slides can be compiled successfully.
 */

/**
 * Comprehensive HTML sanitization for Slidev/Vue compatibility.
 * This function:
 * 1. Escapes dangerous angle brackets in prose (not in code blocks)
 * 2. Fixes mismatched HTML tags
 * 3. Ensures all HTML is properly structured
 */
export function sanitizeForVue(content) {
  console.log("Starting HTML sanitization...");

  // Known HTML tags that are safe to keep (commonly used in Slidev)
  const knownHtmlTags = new Set([
    "div", "span", "p", "a", "img", "br", "hr",
    "h1", "h2", "h3", "h4", "h5", "h6",
    "ul", "ol", "li", "table", "tr", "td", "th", "thead", "tbody",
    "strong", "em", "b", "i", "u", "s", "code", "pre",
    "blockquote", "sup", "sub", "mark", "small",
    "details", "summary", "figure", "figcaption",
    "video", "audio", "source", "iframe",
  ]);

  // Self-closing tags
  const selfClosingTags = new Set([
    "br", "hr", "img", "input", "meta", "link",
    "area", "base", "col", "embed", "source", "track", "wbr",
  ]);

  // Step 1: Extract and protect code blocks
  const codeBlocks = [];
  let workingContent = content.replace(/```[\s\S]*?```/g, (match) => {
    codeBlocks.push(match);
    return `__CODEBLOCK_${codeBlocks.length - 1}__`;
  });

  // Also protect inline code
  const inlineCode = [];
  workingContent = workingContent.replace(/`[^`]+`/g, (match) => {
    inlineCode.push(match);
    return `__INLINE_${inlineCode.length - 1}__`;
  });

  // Step 2: Escape angle brackets that look like generic types or comparisons
  // Pattern: word<word> or word<word, word> (TypeScript generics in prose)
  workingContent = workingContent.replace(
    /(\w+)<(\w+(?:,\s*\w+)*)>/g,
    (match, before, inside) => {
      // Check if this looks like it's meant to be HTML
      if (knownHtmlTags.has(before.toLowerCase())) {
        return match; // Keep valid HTML
      }
      console.log(`  Escaping generic type: ${match}`);
      return `${before}&lt;${inside}&gt;`;
    }
  );

  // Step 3: Escape standalone angle brackets in prose
  // Match < not followed by valid tag name or /
  workingContent = workingContent.replace(
    /<(?![a-zA-Z\/!]|__)/g,
    "&lt;"
  );

  // Match > not preceded by valid tag ending or -
  workingContent = workingContent.replace(
    /(?<![a-zA-Z0-9"'\-\/])>/g,
    "&gt;"
  );

  // Step 4: Fix HTML tag matching issues
  const tagPattern = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*\/?>/g;
  const tagStack = [];
  const orphanCloses = [];

  let match;
  while ((match = tagPattern.exec(workingContent)) !== null) {
    const fullTag = match[0];
    const tagName = match[1].toLowerCase();
    const isClosing = fullTag.startsWith("</");
    const isSelfClosing = fullTag.endsWith("/>") || selfClosingTags.has(tagName);

    if (isSelfClosing) continue;

    if (isClosing) {
      // Find matching opening tag
      let found = false;
      for (let i = tagStack.length - 1; i >= 0; i--) {
        if (tagStack[i].tagName === tagName) {
          tagStack.splice(i, 1);
          found = true;
          break;
        }
      }
      if (!found) {
        orphanCloses.push({ tagName, index: match.index, fullTag });
      }
    } else {
      tagStack.push({ tagName, index: match.index, fullTag });
    }
  }

  // Step 5: Remove orphan closing tags (work backwards to preserve indices)
  if (orphanCloses.length > 0) {
    console.log(`  Removing ${orphanCloses.length} orphan closing tag(s)`);
    orphanCloses.sort((a, b) => b.index - a.index);
    for (const orphan of orphanCloses) {
      console.log(`    - Removing orphan </${orphan.tagName}>`);
      workingContent =
        workingContent.slice(0, orphan.index) +
        workingContent.slice(orphan.index + orphan.fullTag.length);
    }
  }

  // Step 6: Close unclosed tags at appropriate positions
  // For safety, we add closing tags at the end of the content
  if (tagStack.length > 0) {
    console.log(`  Adding ${tagStack.length} missing closing tag(s)`);
    // Close in reverse order (LIFO)
    for (const unclosed of tagStack.reverse()) {
      console.log(`    - Adding </${unclosed.tagName}>`);
      workingContent += `</${unclosed.tagName}>`;
    }
  }

  // Step 7: Restore inline code and code blocks
  workingContent = workingContent.replace(
    /__INLINE_(\d+)__/g,
    (_, idx) => inlineCode[parseInt(idx)]
  );
  workingContent = workingContent.replace(
    /__CODEBLOCK_(\d+)__/g,
    (_, idx) => codeBlocks[parseInt(idx)]
  );

  console.log("HTML sanitization complete");
  return workingContent;
}

/**
 * Validates the final content can be parsed as a Vue template.
 * Returns { valid: boolean, errors: string[] }
 */
export function validateVueCompatibility(content) {
  const errors = [];

  // Extract code blocks first
  const withoutCode = content
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]+`/g, "");

  // Check for common issues

  // 1. Unmatched angle brackets (simple heuristic)
  const openAngles = (withoutCode.match(/<(?![!-])/g) || []).length;
  const closeAngles = (withoutCode.match(/(?<!-)>/g) || []).length;
  if (Math.abs(openAngles - closeAngles) > 2) {
    errors.push(`Angle bracket mismatch: ${openAngles} opening vs ${closeAngles} closing`);
  }

  // 2. Suspicious patterns that often break Vue
  const suspiciousPatterns = [
    { pattern: /[A-Z]\w*<[A-Z]\w*>(?!`)/, desc: "Generic type outside code block" },
    { pattern: /<\/\s+\w+>/, desc: "Space after </" },
    { pattern: /<\w+\s+[^>]*[^/]>\s*$(?![\s\S]*<\/\1)/m, desc: "Potentially unclosed tag at line end" },
  ];

  for (const { pattern, desc } of suspiciousPatterns) {
    if (pattern.test(withoutCode)) {
      errors.push(`Suspicious pattern: ${desc}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Nuclear option: Strip ALL custom HTML, keeping only safe markdown.
 * Used as a last resort if normal sanitization fails.
 */
export function stripHtmlFallback(content) {
  console.log("Applying aggressive HTML stripping (fallback mode)...");

  // Protect code blocks
  const codeBlocks = [];
  let workingContent = content.replace(/```[\s\S]*?```/g, (match) => {
    codeBlocks.push(match);
    return `__CODEBLOCK_${codeBlocks.length - 1}__`;
  });

  const inlineCode = [];
  workingContent = workingContent.replace(/`[^`]+`/g, (match) => {
    inlineCode.push(match);
    return `__INLINE_${inlineCode.length - 1}__`;
  });

  // Remove ALL HTML tags (except in frontmatter)
  const lines = workingContent.split("\n");
  let inFrontmatter = false;
  let frontmatterCount = 0;

  const processedLines = lines.map((line) => {
    if (line.trim() === "---") {
      frontmatterCount++;
      inFrontmatter = frontmatterCount === 1;
      return line;
    }
    if (frontmatterCount >= 2) {
      inFrontmatter = false;
    }

    if (inFrontmatter) {
      return line; // Keep frontmatter as-is
    }

    // Strip HTML tags from content lines
    // Keep the text content inside tags
    return line
      .replace(/<[^>]+>/g, "") // Remove all HTML tags
      .replace(/&lt;/g, "<")   // Restore escaped brackets as plain text
      .replace(/&gt;/g, ">");
  });

  workingContent = processedLines.join("\n");

  // Restore code blocks
  workingContent = workingContent.replace(
    /__INLINE_(\d+)__/g,
    (_, idx) => inlineCode[parseInt(idx)]
  );
  workingContent = workingContent.replace(
    /__CODEBLOCK_(\d+)__/g,
    (_, idx) => codeBlocks[parseInt(idx)]
  );

  console.log("Aggressive HTML stripping complete");
  return workingContent;
}
