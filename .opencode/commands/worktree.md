---
description: Create a Git worktree under .worktrees/<name>
---

Analyze the provided argument: "$ARGUMENTS".
Derive the worktree name directly from this context, ensuring it contains no whitespace.

Execute strictly the following shell command to create the worktree:
`git worktree add .worktrees/<worktree-name>` (where `<worktree-name>` is the name derived from the argument).

Do not perform any other actions:

- Do not change directory (`cd`).
- Do not inspect or explore the new worktree directory.
- Do not modify, stage, or create any other files.
- Simply run the worktree creation command and finish.
- If the arguments are too large simplify them to a significant name.
