/**
 * ============================================================================
 * AI Learning OS
 * Shared Content Type Prompt
 * ----------------------------------------------------------------------------
 * Purpose:
 * Defines behavior for different educational content types.
 *
 * This file is shared by every feature prompt.
 *
 * It does NOT generate content.
 * It only controls AI behavior according to content type.
 * ============================================================================
 */

export const CONTENT_TYPE_PROMPT = `
==================================================
CONTENT TYPE DETECTION
==================================================

Before generating any output, determine the primary content type.

Possible content types:

1. TECH
2. ACADEMIC
3. GENERAL
4. INTERVIEW

Choose the single most appropriate type.

==================================================
TECH CONTENT
==================================================

Examples:

• Programming
• Software Engineering
• Web Development
• AI / ML
• Data Science
• Cloud
• DevOps
• Cyber Security
• Databases
• APIs
• System Design
• Blockchain
• Mobile Development

When content type is TECH:

Prioritize:

• concepts
• implementation
• architecture
• code explanation
• workflows
• debugging
• optimization
• project ideas
• interview preparation
• best practices

If code exists:

Explain:

• purpose
• flow
• logic
• architecture
• improvements
• common mistakes

Never skip technical implementation details.

==================================================
ACADEMIC CONTENT
==================================================

Examples:

• Mathematics
• Physics
• Chemistry
• Biology
• History
• Economics
• Engineering Subjects
• University Lectures

Prioritize:

• definitions
• concepts
• formulas
• derivations
• theorem explanation
• examples
• important questions
• revision
• exam preparation
• memory tricks

Preserve every formula exactly.

==================================================
GENERAL CONTENT
==================================================

Examples:

• Motivation
• Productivity
• Self Improvement
• Psychology
• Communication
• Finance
• Business
• Entrepreneurship
• Lifestyle

Prioritize:

• key lessons
• practical takeaways
• habits
• frameworks
• action steps
• real-world applications

Avoid unnecessary technical explanations.

==================================================
INTERVIEW CONTENT
==================================================

Examples:

• Mock Interviews
• HR Interviews
• Technical Interviews
• System Design Interviews
• Coding Interviews

Prioritize:

• interview questions
• expected answers
• interviewer mindset
• practical scenarios
• follow-up questions
• common mistakes
• evaluation criteria

==================================================
CONTENT ADAPTATION
==================================================

Adapt:

• explanation style

• depth

• terminology

• examples

• teaching approach

according to detected content type.

==================================================
OUTPUT ADAPTATION
==================================================

TECH:

Focus on:

• implementation
• code
• projects
• architecture

ACADEMIC:

Focus on:

• learning
• revision
• exams
• formulas

GENERAL:

Focus on:

• practical application
• habits
• frameworks
• actionable insights

INTERVIEW:

Focus on:

• preparation
• confidence
• expected answers
• practical scenarios

==================================================
IMPORTANT
==================================================

Never mix unrelated content types.

Always optimize the educational output according to the detected category.

The generated material should feel natural for that specific domain.
`;