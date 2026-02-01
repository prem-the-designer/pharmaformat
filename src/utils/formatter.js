import levenshtein from 'js-levenshtein';

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
export function formatAndTokenize(text, dictionary, ignoreList = new Set(), aliases = []) {
    if (!text) return [];

    // Create a map for fast alias lookup: alias_term -> { english_brand, language }
    const aliasMap = new Map();
    if (aliases && aliases.length > 0) {
        aliases.forEach(a => {
            aliasMap.set(a.alias_term.toLowerCase(), a);
        });
    }

    // 1. Build Lookup
    const lookup = {};
    const allKnownTerms = [];

    // Helper to add to lookup
    const addToLookup = (key, displayBrand, displayGeneric) => {
        const k = key.toLowerCase().trim();
        if (!k) return;
        if (!lookup[k]) {
            lookup[k] = { brand: displayBrand, generic: displayGeneric };
            allKnownTerms.push(k);
        }
    };

    // A. Add English Dictionary
    Object.entries(dictionary).forEach(([key, value]) => {
        let brandDisplay, genericDisplay;
        if (typeof value === 'string') {
            brandDisplay = key.toUpperCase();
            genericDisplay = capitalizeFirstLetter(value);
        } else {
            brandDisplay = value.brand.toUpperCase(); // Force Uppercase Display
            genericDisplay = value.generic;
        }
        addToLookup(brandDisplay, brandDisplay, genericDisplay);
        addToLookup(genericDisplay, brandDisplay, genericDisplay);
    });

    // B. Add Aliases
    if (aliases && aliases.length > 0) {
        aliases.forEach(a => {
            if (!a.alias_term || !a.english_brand) return;

            const englishKey = a.english_brand.toLowerCase().trim();
            const dictEntry = dictionary[englishKey];

            if (dictEntry) {
                // Map the ALIAS term to the ENGLISH Brand/Generic
                // Use the formatting from the English entry
                addToLookup(a.alias_term, dictEntry.brand, dictEntry.generic);
            } else {
                // Fallback: If English entry not found in dictionary, use what we have in alias
                const fallbackBrand = a.english_brand.toUpperCase(); // Strict Uppercase
                const fallbackGeneric = a.generic_name ? capitalizeFirstLetter(a.generic_name) : fallbackBrand; // Use generic if available, else brand (legacy behavior, but generic preferred)
                addToLookup(a.alias_term, fallbackBrand, fallbackGeneric);
            }
        });
    }

    // Sort known terms by length descending
    allKnownTerms.sort((a, b) => b.length - a.length);

    const knownPattern = allKnownTerms.length > 0 ? allKnownTerms.map(k => escapeRegExp(k)).join('|') : null;

    const tokens = [];

    // Pass 1: Find KNOWN terms (Case Insensitive)
    const knownRegex = new RegExp(`\\b(${knownPattern})\\b`, 'gi');
    const knownMatches = knownPattern ? [...text.matchAll(knownRegex)] : [];

    let currentIndex = 0;

    for (const m of knownMatches) {
        const matchIndex = m.index;
        const matchText = m[0]; // Original text

        // Process text BEFORE this match
        if (matchIndex > currentIndex) {
            const preText = text.slice(currentIndex, matchIndex);
            tokens.push(...detectUnknowns(preText, ignoreList, lookup, aliasMap));
        }

        // Process this KNOWN match
        const key = matchText.toLowerCase();
        const entry = lookup[key];

        if (entry) {
            const { brand, generic } = entry;
            const formattedBrand = brand;
            const formattedGeneric = generic;

            // Check for Double Formatting Suffix
            const textAfter = text.slice(matchIndex + matchText.length);
            const isFormatted = textAfter.trim().toLowerCase().startsWith(`(${formattedGeneric.toLowerCase()})`);

            // Prefix Check
            let isPrefix = false;
            if (matchIndex > 0 && text[matchIndex - 1] === '(') {
                const pre = text.slice(0, matchIndex - 1).trimEnd();
                if (pre.toLowerCase().endsWith(brand.toLowerCase()) || pre.toLowerCase().endsWith(generic.toLowerCase())) {
                    isPrefix = true;
                }
            }

            if (isFormatted || isPrefix) {
                tokens.push({ type: TOKEN_TYPES.TEXT, content: matchText });
            } else {
                const content = `${formattedBrand} (${formattedGeneric})`;
                tokens.push({ type: TOKEN_TYPES.KNOWN, content: content });
            }
        } else {
            tokens.push({ type: TOKEN_TYPES.TEXT, content: matchText });
        }

        currentIndex = matchIndex + matchText.length;
    }

    // Process remaining text
    if (currentIndex < text.length) {
        const remaining = text.slice(currentIndex);
        tokens.push(...detectUnknowns(remaining, ignoreList, lookup, aliasMap));
    }

    return tokens;
}

/**
 * Scans a text chunk for unknown drug candidates and performs fuzzy matching.
 */
function detectUnknowns(textChunk, ignoreList, lookup, aliasMap) {
    if (!textChunk) return [];

    // Regex: Matches Capitalized phrases OR Lowercase single words (3+ chars)
    // AND now we should be permissive to capture non-Latin characters if we want to support direct alias detection.
    // However, our alias logic is: "Match alias term EXACTLY? Or scan for it?"
    // If the alias is Korean "키트루다", the regex checking for [A-Z] won't catch it.

    // Updated Regex to include non-white-space chunks that might be foreign?
    // Or just simple Space splitting for everything else? 
    // Let's try splitting by non-word chars but include unicode ranges if possible.
    // For now, let's assume the user pastes text where words are separated by space/punctuation.

    // We'll iterate the "words" found by a broader regex or just check splits.
    // Given the previous logic used `unknownRegex`, we might miss non-Latin.

    // Let's use a simpler tokenization for the "between-knowns" text: Split by common delimiters.
    // (Similar to my previous failed attempt's tokenization logic).

    const parts = textChunk.split(/([ \(\)\[\]\{\}\.,;:"'?!]+|[\n\r]+)/);
    const result = [];

    parts.forEach(part => {
        if (!part) return;

        // Is it a separator?
        if (/^[ \(\)\[\]\{\}\.,;:"'?!]+|[\n\r]+$/.test(part)) {
            result.push({ type: TOKEN_TYPES.TEXT, content: part });
            return;
        }

        const lower = part.toLowerCase();



        // 2. Check Lookup (Exact Case-Insensitive)
        if (lookup[lower]) {
            const entry = lookup[lower];
            const content = `${entry.brand} (${entry.generic})`;
            result.push({ type: TOKEN_TYPES.KNOWN, content });
            return;
        }

        // 3. Ignore List
        if (ignoreList.has(lower)) {
            result.push({ type: TOKEN_TYPES.TEXT, content: part });
            return;
        }

        // 4. Fuzzy / Capitalization Check
        // Only run fuzzy/cap check if it looks like a potential drug (Latin logic)
        // If it's foreign text that didn't match alias, treat as text?
        // Or should we try to fuzzy match foreign aliases? (Too expensive/complex for now).

        // If it starts with Capital (Latin)
        const isCapitalized = /^[A-Z]/.test(part);

        if (isCapitalized) {
            // Fuzzy Match against Dictionary Keys
            let bestMatch = null;
            let minDistance = Infinity;

            Object.keys(lookup).forEach(key => {
                if (Math.abs(key.length - lower.length) > 3) return;
                if (key[0] !== lower[0]) return; // Optimization

                const dist = levenshtein(lower, key);
                const threshold = Math.max(2, Math.floor(key.length * 0.7));

                if (dist <= threshold && dist < minDistance) {
                    minDistance = dist;
                    bestMatch = lookup[key];
                }
            });

            if (bestMatch) {
                result.push({
                    type: TOKEN_TYPES.UNKNOWN,
                    content: part,
                    data: { suggestion: bestMatch }
                });
            } else {
                result.push({ type: TOKEN_TYPES.UNKNOWN, content: part });
            }
        } else {
            result.push({ type: TOKEN_TYPES.TEXT, content: part });
        }
    });

    return result;
}

/**
 * Backward compatibility wrapper if needed for simple string
 */
export function formatTextSafe(text, dictionary) {
    const tokens = formatAndTokenize(text, dictionary);
    return tokens.map(t => t.content).join('');
}

/**
 * Helper to check for suggestions for a single string.
 */
export function findSuggestion(text, dictionary) {
    if (!text || !dictionary) return null;
    const lower = text.toLowerCase();

    // Quick Lookup logic
    // Build simpler lookup just for keys if needed, 
    // BUT we need the structured lookup used in detectUnknowns.
    // Let's rebuild a transient lookup or expect dictionary to be passed as raw.
    // The dictionary object keys are NOT lowercased in the Context (stored as is? No).
    // In Context: dictionary = { "keytruda": { brand: "Keytruda" ... } }
    // So keys ARE lowercased!

    let bestMatch = null;
    let minDistance = Infinity;

    Object.keys(dictionary).forEach(key => {
        // Optimization checks
        if (Math.abs(key.length - lower.length) > 3) return;
        if (key[0] !== lower[0]) return;

        const dist = levenshtein(lower, key);

        const startThreshold = 2;
        const dynamicThreshold = Math.floor(key.length * 0.7);
        const threshold = Math.max(startThreshold, dynamicThreshold);

        if (dist <= threshold && dist < minDistance) {
            minDistance = dist;
            bestMatch = dictionary[key];
        }
    });

    return bestMatch;
}
