/**
 * Safe JSON parsing utilities for API responses
 *
 * Handles cases where the server may append PHP warnings/notices
 * or return non-JSON error pages.
 */

/**
 * Safely parse a fetch Response as JSON.
 * - Checks response.ok
 * - Handles malformed JSON (e.g. PHP warnings appended after valid JSON)
 *
 * @param {Response} response - Fetch API Response object
 * @returns {Promise<Object>} Parsed JSON object
 * @throws {Error} If response is not ok or JSON cannot be extracted
 */
export async function safeJsonParse(response) {
    if (!response.ok) {
        throw new Error(`Server error (${response.status})`);
    }

    const text = await response.text();

    try {
        return JSON.parse(text);
    } catch (parseError) {
        // Try to extract valid JSON from the beginning of the response
        // This handles cases where PHP appends warnings/notices after JSON output
        const jsonMatch = text.match(/^(\{[\s\S]*\})\s*[^}\s]/);
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[1]);
            } catch {
                // Fall through to error
            }
        }

        // Try matching a complete JSON object at the start
        const simpleMatch = text.match(/^(\{[^]*?\})(?:\s*<|$)/);
        if (simpleMatch) {
            try {
                return JSON.parse(simpleMatch[1]);
            } catch {
                // Fall through to error
            }
        }

        throw new Error("Invalid server response");
    }
}

/**
 * Promise-chain compatible version for .then() usage
 * @param {Response} res - Fetch API Response object
 * @returns {Promise<Object>} Parsed JSON object
 */
export function safeJsonParseChain(res) {
    return safeJsonParse(res);
}

export default safeJsonParse;
