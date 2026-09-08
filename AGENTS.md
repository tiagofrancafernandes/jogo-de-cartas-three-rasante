# AI Agents Guidelines

All AI agents working on this project must strictly comply with the code style and architectural guidelines defined in [UNIVERSAL-CODE-STYLE-RULES.md](./UNIVERSAL-CODE-STYLE-RULES.md).

## Non-Negotiable Rules Summary
1. **Early returns (guard clauses):** Abort early, avoid nesting.
2. **Else-less pattern:** Avoid `else` whenever possible.
3. **No nested conditionals:** Keep nesting depth to maximum 1 level.
4. **Mandatory braces:** Always use explicit curly braces `{}` even for single-line statements.
5. **No one-line control statements:** Always format control statements vertically across multiple lines.
6. **Separation with blank lines:** Separate validation, declaration, execution, and return blocks.
7. **Vertical readability:** Code must be easily readable from top to bottom.
8. **Fail fast validation:** Validate all input parameters immediately.
9. **Descriptive naming:** Booleans must read as questions (`isBusy`, `hasWon`, `canCover`). Avoid generic names (`data`, `result`, `temp`).
10. **Language:** All code, types, interfaces, and comments must be strictly in English.
