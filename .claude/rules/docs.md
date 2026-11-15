# Reading docs

- Read `AGENTS.md` (the index) first, then only the `docs/` part the task touches.
- Never read a whole file above 200 lines: `grep -n` for the term, then
  `sed -n '<start>,<end>p'` around the hit.
- When a doc grows past ~200 lines, split it into an index plus parts instead of
  appending.
