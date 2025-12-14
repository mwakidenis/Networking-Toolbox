export type RegexValidation = { ok: true; pattern: string; flags: string } | { ok: false; error: string };

const CANDIDATE_FLAGS = 'dgimsuyv'; // runtime-detected
const SUPPORTED_FLAGS = (() => {
  let out = '';
  for (const f of CANDIDATE_FLAGS)
    try {
      new RegExp('', f);
      out += f;
    } catch {
      // Flag not supported, skip it
    }
  return out;
})();
const supportsLookbehind = (() => {
  try {
    new RegExp('(?<=x)y');
    return true;
  } catch {
    return false;
  }
})();

const splitRegexLiteral = (src: string): { pattern: string; flags: string } | null => {
  if (!src || src[0] !== '/') return null;
  for (let i = src.length - 1; i > 0; i--) {
    if (src[i] !== '/') continue;
    let bs = 0;
    for (let j = i - 1; j >= 0 && src[j] === '\\'; j--) bs++;
    if (bs % 2 === 0) return { pattern: src.slice(1, i), flags: src.slice(i + 1) };
  }
  return null;
};

const dups = (s: string): string => {
  const seen = new Set<string>(),
    dup = new Set<string>();
  for (const c of s) {
    if (seen.has(c)) {
      dup.add(c);
    } else {
      seen.add(c);
    }
  }
  return [...dup].join('');
};

const balanceBrackets = (src: string): { paren: number; bracket: number; brace: number } => {
  let paren = 0,
    bracket = 0,
    brace = 0,
    inClass = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (c === '\\') {
      i++;
      continue;
    }
    if (c === '[' && !inClass) {
      inClass = true;
      bracket++;
      continue;
    }
    if (c === ']' && inClass) {
      inClass = false;
      bracket--;
      continue;
    }
    if (!inClass) {
      if (c === '(') paren++;
      else if (c === ')') paren--;
      else if (c === '{') brace++;
      else if (c === '}') brace--;
    }
  }
  return { paren, bracket, brace };
};

/** Explain *why* a regex failed and how to fix it. */
export function explainRegexError(message: string, pattern: string, flags = '', rawInput?: string): string {
  const base = message.replace(/^Invalid regular expression:\s*/i, '').trim() || 'Invalid pattern.';
  const tips: string[] = [];

  if (/\\$/.test(pattern)) tips.push('Trailing backslash — escape as \\\\ or remove.');
  if (/(\\p\{|\\u\{)/.test(pattern) && !flags.includes('u'))
    tips.push("Add 'u' flag for Unicode escapes (\\p{…}, \\u{…}).");
  if (!supportsLookbehind && /(\(\?<=|\(\?<!)/.test(pattern))
    tips.push('Lookbehind not supported — refactor to capturing groups.');
  if (/nothing to repeat|invalid quantifier|numbers out of order/i.test(base))
    tips.push('Fix quantifiers (*, +, ?, {m,n}) placement/order.');
  if (/range out of order|character class/i.test(base))
    tips.push("Inside [...], escape '-' (\\-) or move it to edges; ensure ']' closes the class.");
  if (/invalid group|named capture|group name|reference/i.test(base))
    tips.push('Check group syntax/backreferences; avoid (?<name>…) on older runtimes.');
  if (rawInput && /^\/.*\/[a-z]*$/i.test(rawInput) && /[^\\]\//.test(rawInput.slice(1, -1)))
    tips.push('If using /…/ literal, escape internal slashes as \\/.');
  const b = balanceBrackets(pattern);
  if (b.paren) tips.push("Unbalanced parentheses '()'.");
  if (b.bracket) tips.push("Unbalanced character class '[]'.");
  if (b.brace) tips.push("Unbalanced braces '{}' (quantifier).");

  return tips.length ? `${base} — ${tips.join(' ')}` : base;
}

/** Validate a regex (string, "/pattern/flags" literal, or RegExp). Compilation-only (no execution). */
export function validateRegexInput(input: string | RegExp, inputFlags?: string | null): RegexValidation {
  if (input instanceof RegExp) return { ok: true, pattern: input.source, flags: input.flags };

  const raw = String(input);
  const literal = typeof inputFlags !== 'string' ? splitRegexLiteral(raw) : null;
  const pattern = literal ? literal.pattern : raw;
  const flags = literal ? literal.flags : (inputFlags ?? '');

  // flag checks (runtime-based)
  const allowed = new Set(SUPPORTED_FLAGS.split(''));
  const bad = [...new Set([...flags].filter((c) => !allowed.has(c)))].join('');
  if (bad) return { ok: false, error: `Unsupported flag(s): "${bad}". Supported: [${[...allowed].join(', ')}]` };
  const dup = dups(flags);
  if (dup) return { ok: false, error: `Duplicate flag(s): "${dup}"` };

  try {
    new RegExp(pattern, flags);
    return { ok: true, pattern, flags };
  } catch (e) {
    const msg = String((e as Error)?.message ?? e);
    return { ok: false, error: explainRegexError(msg, pattern, flags, raw) };
  }
}

export default { validateRegexInput, explainRegexError };
