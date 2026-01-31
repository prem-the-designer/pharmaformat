/**
 * Escapes special characters for use in a regular expression.
 */
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Capitalizes the first letter of a string.
 */
function capitalizeFirstLetter(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Token Types
 */
export const TOKEN_TYPES = {
    TEXT: 'text',
    KNOWN: 'known',
    UNKNOWN: 'unknown'
};

/**
 * Returns a list of structured tokens for rendering.
 * 
 * @param {string} text - Input text
 * @param {object} dictionary - Known drugs
 * @param {Set} ignoreList - Set of lowercased words to ignore
 * @returns {Array} - Array of token objects { type, content, data? }
 */
export function formatAndTokenize(text, dictionary, ignoreList = new Set()) {
    if (!text) return [];

    // 1. Build Lookup
    const lookup = {};
    const allKnownTerms = [];
    Object.entries(dictionary).forEach(([key, value]) => {
        // Handle migration/fallback: value could be string (old) or object (new)
        // Though Context ensures object, let's be safe.
        let brandDisplay, genericDisplay;

        if (typeof value === 'string') {
            brandDisplay = key.toUpperCase();
            genericDisplay = capitalizeFirstLetter(value);
        } else {
            brandDisplay = value.brand;
            genericDisplay = value.generic;
        }

        const brandKey = brandDisplay.toLowerCase().trim();
        const genericKey = genericDisplay.toLowerCase().trim();

        if (!brandKey || !genericKey) return;

        // Store lookup mapping to the DISPLAY values
        if (!lookup[brandKey]) {
            lookup[brandKey] = { brand: brandDisplay, generic: genericDisplay };
            allKnownTerms.push(brandKey);
        }
        if (!lookup[genericKey]) {
            lookup[genericKey] = { brand: brandDisplay, generic: genericDisplay };
            allKnownTerms.push(genericKey);
        }
    });

    // Sort known terms by length descending
    allKnownTerms.sort((a, b) => b.length - a.length);

    // 2. Build Regex for KNOWN terms
    const knownPattern = allKnownTerms.length > 0 ? allKnownTerms.map(k => escapeRegExp(k)).join('|') : null;

    // 3. Build Regex for UNKNOWN Candidates (Heuristics)
    const unknownPattern = `\\b[A-Z][a-zA-Z0-9-]{2,}(?:\\s+[A-Z][a-zA-Z0-9-]{2,})*\\b`;

    // Combine Regex
    let combinedPatternSource = '';
    if (knownPattern) {
        combinedPatternSource += `(${knownPattern})`;
    }
    if (unknownPattern) {
        combinedPatternSource += (combinedPatternSource ? '|' : '') + `(${unknownPattern})`;
    }

    if (!combinedPatternSource) {
        return [{ type: TOKEN_TYPES.TEXT, content: text }];
    }

    // This makes a single regex tricky.

    // Strategy: Two pass? Or split by Known first (insensitive), then scan text parts for Unknown?
    // Split by Known is safer to preserve the case-insensitive logic for knowns.

    const tokens = [];
    // let lastIndex = 0; // This variable is no longer used after the refactor

    // Pass 1: Find KNOWN terms (Case Insensitive)
    // We use a separate regex for knowns to support 'gi'
    const knownRegex = new RegExp(`\\b(${knownPattern})\\b`, 'gi');
    const knownMatches = [...text.matchAll(knownRegex)];

    let currentIndex = 0;

    for (const m of knownMatches) {
        const matchIndex = m.index;
        const matchText = m[0]; // Original text

        // Process text BEFORE this match for unknowns
        if (matchIndex > currentIndex) {
            const preText = text.slice(currentIndex, matchIndex);
            tokens.push(...detectUnknowns(preText, ignoreList, lookup));
        }

        // Process this KNOWN match
        const key = matchText.toLowerCase();
        const entry = lookup[key];

        if (entry) {
            const { brand, generic } = entry;
            // USE DISPLAY VALUES AS IS
            const formattedBrand = brand;
            const formattedGeneric = generic;

            // Check for Double Formatting Suffix
            const textAfter = text.slice(matchIndex + matchText.length);
            const suffixCheck = ` (${formattedGeneric})`;
            const isFormatted = textAfter.trim().toLowerCase().startsWith(`(${formattedGeneric.toLowerCase()})`);

            // Prefix Check
            let isPrefix = false;
            if (matchIndex > 0 && text[matchIndex - 1] === '(') {
                // Check logical parent
                // Simply: if we are inside parens and preceded by our brand/generic (too complex for regex looking back far?)
                // Let's rely on immediate predecessor
                const pre = text.slice(0, matchIndex - 1).trimEnd();
                if (pre.toLowerCase().endsWith(brand.toLowerCase()) || pre.toLowerCase().endsWith(generic.toLowerCase())) {
                    isPrefix = true;
                }
            }

            if (isFormatted || isPrefix) {
                // Return as TEXT (don't highlight as known/unknown, just leave it be... OR mark as known text?)
                // If it's formatted correctly, it's just text.
                tokens.push({ type: TOKEN_TYPES.TEXT, content: matchText });
            } else {
                // It's a candidate for formatting
                // We return a KNOWN token, the renderer will display the formatted string
                const content = `${formattedBrand} (${formattedGeneric})`;
                tokens.push({ type: TOKEN_TYPES.KNOWN, content: content });
            }
        } else {
            // Should not happen if regex matches keys
            tokens.push({ type: TOKEN_TYPES.TEXT, content: matchText });
        }

        currentIndex = matchIndex + matchText.length;
    }

    // Process remaining text
    if (currentIndex < text.length) {
        const remaining = text.slice(currentIndex);
        tokens.push(...detectUnknowns(remaining, ignoreList, lookup));
    }

    return tokens;
}

/**
 * Scans a text chunk for unknown drug candidates.
 */
function detectUnknowns(textChunk, ignoreList, lookup) {
    if (!textChunk) return [];

    // Heuristic: Capitalized words (3+ chars)
    // Excluding common start-of-sentence words is hard without NLP.
    // We'll just match and let user Ignore.
    const unknownRegex = /\b[A-Z][a-zA-Z0-9-]{2,}(?:\s+[A-Z][a-zA-Z0-9-]{2,})*\b/g;

    const result = [];
    let lastIdx = 0;
    let match;

    while ((match = unknownRegex.exec(textChunk)) !== null) {
        const mStart = match.index;
        const mText = match[0];

        // 1. Text before
        if (mStart > lastIdx) {
            result.push({ type: TOKEN_TYPES.TEXT, content: textChunk.slice(lastIdx, mStart) });
        }

        // 2. Check validity
        const lower = mText.toLowerCase();
        if (lookup[lower] || ignoreList.has(lower)) {
            // Known or Ignored -> Text
            result.push({ type: TOKEN_TYPES.TEXT, content: mText });
        } else {
            // UNKNOWN Candidate
            result.push({ type: TOKEN_TYPES.UNKNOWN, content: mText });
        }

        lastIdx = mStart + mText.length;
    }

    if (lastIdx < textChunk.length) {
        result.push({ type: TOKEN_TYPES.TEXT, content: textChunk.slice(lastIdx) });
    }

    return result;
}

/**
 * Backward compatibility wrapper if needed for simple string
 */
export function formatTextSafe(text, dictionary) {
    const tokens = formatAndTokenize(text, dictionary);
    return tokens.map(t => t.content).join('');
}
