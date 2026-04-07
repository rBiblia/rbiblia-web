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
        // Log the initial error and try fallbacks
        console.warn("[safeJsonParse] Standard JSON parse failed, trying fallbacks", parseError);

        parsedJson = tryParseEmbeddedJson(text) || tryParseSimpleJson(text);

        if (!parsedJson && isOk) {
            throw new Error("Invalid server response");
        }
    }

    if (!isOk) {
        if (parsedJson?.message) {
            throw new Error(parsedJson.message);
        }
        throw new Error(`Server error (${response.status})`);
    }

    return parsedJson;
}

/**
 * Tries to extract valid JSON from the beginning of the response
 * handling cases where PHP appends warnings/notices after JSON output.
 */
function tryParseEmbeddedJson(text) {
    const jsonRegex = /^(\{[\s\S]*\})\s*[^}\s]/;
    const jsonMatch = jsonRegex.exec(text);
    if (jsonMatch) {
        try {
            return JSON.parse(jsonMatch[1]);
        } catch (e) {
            console.debug("[safeJsonParse] Embedded JSON parse failed", e);
        }
    }
    return null;
}

/**
 * Tries matching a complete JSON object at the start.
 */
function tryParseSimpleJson(text) {
    const simpleRegex = /^(\{[^]*?\})(?:\s*<|$)/;
    const simpleMatch = simpleRegex.exec(text);
    if (simpleMatch) {
        try {
            return JSON.parse(simpleMatch[1]);
        } catch (e) {
            console.debug("[safeJsonParse] Simple JSON parse failed", e);
        }
    }
    return null;
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
