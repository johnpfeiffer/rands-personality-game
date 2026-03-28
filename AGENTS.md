
# Main Agent
Prefer Domain Driven Design with a Model View Controller layers pattern where the domain is encapsulated in a "models" directory, and keep business logic out of the View/Presentation.

Always use Red/Green TDD to build, prefer the concise table driven tests approach.

After completing refactoring, and especially new features, use what you know about the changes to:
- make sure existing tests are passing
- add any missing "high value" tests (happy path, most critical or likely edge cases); do not attempt fake "full coverage"
- update docs/architecture.md, including mermaid diagrams for the system design as well as the user journey

