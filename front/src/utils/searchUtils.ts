/**
 * Utility functions for intelligent fuzzy searching.
 * Highlights: Accent removal, case insensitivity, space lenience, and typographical error tolerance.
 */

/**
 * Normalizes a string by removing accents, converting to lowercase, and an option to strip all spaces.
 */
export function normalizeString(str: string, removeSpaces = false): string {
    if (!str) return '';
    let normalized = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    if (removeSpaces) {
        normalized = normalized.replace(/\s+/g, '');
    } else {
        normalized = normalized.trim();
    }
    return normalized;
}

/**
 * Calculates a simple Levenshtein distance between two strings.
 */
function levenshtein(a: string, b: string): number {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = Array(a.length + 1).fill(null).map(() => Array(b.length + 1).fill(null));

    for (let i = 0; i <= a.length; i += 1) {
        matrix[i][0] = i;
    }
    for (let j = 0; j <= b.length; j += 1) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= a.length; i += 1) {
        for (let j = 1; j <= b.length; j += 1) {
            const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i][j - 1] + 1, // insertion
                matrix[i - 1][j] + 1, // deletion
                matrix[i - 1][j - 1] + indicator // substitution
            );
        }
    }

    return matrix[a.length][b.length];
}

/**
 * Checks if query matches text with fuzzy logic (accents, spaces, minor typos).
 * @param query The search query entered by the user
 * @param text The target text to search within
 * @returns boolean true if it's considered a match
 */
export function fuzzyMatch(query: string, text: string): boolean {
    if (!query || !text) return false;

    // 1. If normalized subset match (without spaces) is true, it's a match regardless of distance.
    const queryNoSpace = normalizeString(query, true);
    const textNoSpace = normalizeString(text, true);

    if (textNoSpace.includes(queryNoSpace)) {
        return true;
    }

    // 2. If length of query is very small, we demand exact substring match (already checked above)
    if (queryNoSpace.length < 3) {
        return false;
    }

    // 3. Fallback to token-based Levenshtein distance for typos
    const queryTokens = normalizeString(query, false).split(/\s+/).filter(t => t.length > 0);
    const textTokens = normalizeString(text, false).split(/\s+/).filter(t => t.length > 0);

    // If ANY query token completely fails to loosely match ANY text token, it's not a match.
    // We want all query tokens to be "found" somewhere in the text.
    for (const qTok of queryTokens) {
        let bestDist = Infinity;

        // For small query tokens, require exact inclusion.
        if (qTok.length < 3) {
            const isIncluded = textTokens.some(tTok => tTok.includes(qTok) || qTok.includes(tTok));
            if (!isIncluded) return false;
            continue;
        }

        for (const tTok of textTokens) {
            // If qTok is a substring of tTok, distance is 0.
            if (tTok.includes(qTok)) {
                bestDist = 0;
                break;
            }
            // Calculate dist
            const dist = levenshtein(qTok, tTok);
            if (dist < bestDist) bestDist = dist;
        }

        // Allowed typos: 1 for words 3-5 chars, 2 for > 5 chars.
        const maxAllowedDist = qTok.length > 5 ? 2 : 1;
        if (bestDist > maxAllowedDist) {
            return false; // This query token wasn't found closely enough
        }
    }

    return true;
}
