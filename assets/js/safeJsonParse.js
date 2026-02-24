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
    const isOk = response.ok;
    const text = await response.text();

    let parsedJson = null;

    try {
        parsedJson = JSON.parse(text);
    } catch (parseError) {
        // Try to extract valid JSON from the beginning of the response
        // This handles cases where PHP appends warnings/notices after JSON output
        const jsonMatch = text.match(/^(\{[\s\S]*\})\s*[^}\s]/);
        if (jsonMatch) {
            try {
                parsedJson = JSON.parse(jsonMatch[1]);
            } catch {
                // Fall through to error
            }
        }

        if (!parsedJson) {
            // Try matching a complete JSON object at the start
            const simpleMatch = text.match(/^(\{[^]*?\})(?:\s*<|$)/);
            if (simpleMatch) {
                try {
                    parsedJson = JSON.parse(simpleMatch[1]);
                } catch {
                    // Fall through to error
                }
            }
        }

        if (!parsedJson && isOk) {
            throw new Error("Invalid server response");
        }
    }

    if (!isOk) {
        if (parsedJson && parsedJson.message) {
            throw new Error(parsedJson.message);
        }
        throw new Error(`Server error (${response.status})`);
    }

    return parsedJson;
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
