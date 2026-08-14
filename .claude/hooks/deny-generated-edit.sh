#!/usr/bin/env bash
# PreToolUse guard for Reldens: block direct Edit/Write calls to generated artifacts (a
# hard invariant from the root CLAUDE.md: generated entities are read-only, regenerate via
# `reldens generateEntities --override` after a schema change).
#
# Scope is deliberately narrow and unambiguous: anything under generated-entities/, and
# any *.generated.js file. Regenerators are unaffected: they write through the reldens CLI
# (Bash), which this hook never sees.
#
# Like the other checked-in hooks this is small and auditable: bash only, reads stdin,
# writes nothing, no network. It fails OPEN (exit 0) on anything unexpected, because a
# broken guard must never wedge the edit loop. See .claude/hooks/README.md.
set -uo pipefail

input=$(cat)

# Extract the target path from the tool input JSON without requiring jq: match the
# "file_path" key. A hook that cannot parse its input lets the call through.
path=$(printf '%s' "$input" | perl -0777 -ne 'print $1 if /"file_path"\s*:\s*"((?:[^"\\]|\\.)*)"/' 2>/dev/null || true)
[ -n "$path" ] || exit 0

# Normalize Windows backslashes so the case patterns match on every platform.
path=${path//\\//}

case "$path" in
  *generated-entities/*|*.generated.js)
    echo "Blocked: $path is a generated artifact. Never hand-edit generated files; change the schema or the owning source and regenerate via 'reldens generateEntities --override' (see the root CLAUDE.md invariant)." >&2
    exit 2
    ;;
esac
exit 0
