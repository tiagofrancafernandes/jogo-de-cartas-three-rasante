# Gemini Guidelines

All Gemini and AI assistant workflows on this project must strictly adhere to the standards outlined in [UNIVERSAL-CODE-STYLE-RULES.md](./UNIVERSAL-CODE-STYLE-RULES.md).

## Key Enforcement Rules
1. **Early returns (guard clauses):** Abort execution as soon as an invalid or edge case is detected.
2. **Else-less pattern:** Prefer early returns over `else` blocks.
3. **Conditionals nesting limit:** Maximum 1 level of nesting; flatten logic using guard clauses.
4. **Mandatory braces:** Every `if`, `for`, `while`, `try`, `catch` block must be enclosed in curly braces `{}`.
5. **No one-line statements:** Never compress control structures into a single line.
6. **Vertical readability:** Keep code vertically readable, with blank lines separating distinct logical stages (validation, preparation, execution, return).
7. **Explicit and descriptive naming:** Booleans must read as questions. No generic variable names (`data`, `result`, `temp`).
8. **Testability:** Core domain logic must remain pure, decoupled from rendering engines and DOM APIs.
9. **Language:** Code, types, and comments must be in English.
