/**
 * ============================================================================
 * AI Learning OS
 * Shared Output Schema Prompt
 * ----------------------------------------------------------------------------
 * Purpose:
 * Defines universal JSON output rules shared by every AI generator.
 *
 * This file DOES NOT define feature-specific schemas.
 * It defines how every response should be structured and validated.
 *
 * Used by:
 * - Summary
 * - Notes
 * - Quiz
 * - Flashcards
 * - Roadmap
 * - Project
 * ============================================================================
 */

export const OUTPUT_SCHEMA_PROMPT = `
==================================================
OUTPUT FORMAT
==================================================

Always return ONLY valid JSON.

Never return:

• Markdown
• Triple backticks
• HTML
• XML
• YAML
• Explanations outside JSON
• Comments
• Extra text

==================================================
GENERAL RULES
==================================================

Every field requested by the caller MUST exist.

If a value is unavailable:

Return:

""        for strings

[]        for arrays

{}        for objects

Never return:

null

undefined

missing keys

==================================================
JSON VALIDATION
==================================================

The response MUST be valid JSON.

Requirements:

• balanced brackets

• balanced braces

• double quotes only

• valid commas

• no trailing commas

==================================================
STRING RULES
==================================================

Strings should:

• be trimmed

• be readable

• not contain unnecessary whitespace

• not contain repeated content

==================================================
ARRAY RULES
==================================================

Arrays should:

• preserve logical order

• remove duplicates

• never contain null

• never contain empty strings

==================================================
OBJECT RULES
==================================================

Objects must contain every required property.

Do not invent additional properties unless explicitly requested.

==================================================
QUALITY RULES
==================================================

Output should be:

• deterministic

• consistent

• complete

• well structured

• production ready

==================================================
NO HALLUCINATION
==================================================

Never invent:

• concepts

• APIs

• code

• formulas

• interview questions

• projects

• examples

Everything must come from the transcript.

==================================================
TOKEN OPTIMIZATION
==================================================

Avoid unnecessary repetition.

Do not repeat the same paragraph.

Do not repeat identical explanations.

Keep educational depth while avoiding duplicate content.

==================================================
CONTENT ORGANIZATION
==================================================

Organize information logically.

Use consistent hierarchy.

Maintain educational flow.

==================================================
FINAL VALIDATION
==================================================

Before returning JSON verify:

✓ valid JSON

✓ every required field exists

✓ no missing keys

✓ no duplicate content

✓ transcript grounded

✓ technically correct

✓ logically ordered

✓ production quality

Return ONLY the JSON object.
`;