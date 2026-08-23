# Physical provider setup

This is the operational companion to [`agentic-runbook.md`](agentic-runbook.md). It answers: which process runs which role, where the task is selected, and how the work continues after the process exits.

## Recommended first deployment

Use the following split:

| Board role | First provider | Permission | Why |
| --- | --- | --- | --- |
| chair | deterministic coordinator + Codex CLI | coordinator writes state; model read-only | Selects and specifies one task. |
| source | Codex CLI or OpenRouter | read-only | Builds a claim ledger; does not edit lessons. |
| author/repair | Codex CLI | workspace-write | Edits only the leased files. |
| subject | OpenRouter or a fresh Codex call | read-only | Reviews independently of the author. |
| red team | OpenRouter with a different pinned model, if possible | read-only plus approved checks | Tries counterexamples and assumption mutations. |
| learner | fresh provider call | read-only | Attempts the transfer task without the author’s success narrative. |
| QA | shell scripts first, agent second | no model permission needed | Runs deterministic checks and records their actual output. |
| registrar | deterministic script plus human | no lesson-write permission | Moves work to `human-review`; never publishes. |

“Assigning an agent” therefore means that the coordinator first leases a task, then launches a fresh process with a role prompt, a task id, an allowed file list, and a permission level. The coordinator—not the model—owns leases and state transitions. A role is not a permanent persona and should not carry hidden conversation state between tasks.

## Option A: Codex CLI as the local worker

The installed CLI exposes `codex exec` for non-interactive work. Check the local version before writing a wrapper because flags can change:

```bash
cd /home/edf/Documents/GitSynced/LibreUni
codex --version
codex exec --help
codex login                 # or configure the approved API-key method
```

Use `-C` to pin the repository, `-s read-only` for reviewers, `-s workspace-write` for authors, `-a never` only for an already-reviewed unattended worker, and `--ephemeral` so the board—not a hidden chat session—is the durable memory. Never use `--dangerously-bypass-approvals-and-sandbox` for this operation.

A chair invocation looks like this after the deterministic coordinator has claimed `db-transaction-trace` and supplied its task packet:

```bash
REPO=/home/edf/Documents/GitSynced/LibreUni
REPORT="$REPO/docs/agent-experiments/lesson-quality-panel/operation/reports/chair-$(date -u +%Y%m%dT%H%M%SZ).jsonl"

timeout 20m codex exec \
  -C "$REPO" \
  -s read-only \
  -a never \
  --ephemeral \
  --json \
  > "$REPORT" <<'PROMPT'
You are the chair for the LibreUni lesson-evidence board.

Read AGENTS.md, docs/agent-rules/BASELINE.md, the routed task packs, and
docs/agent-experiments/lesson-quality-panel/operation/board.yml.
Inspect operation/state.json and the current Git status. The external
coordinator has already claimed task db-transaction-trace for this invocation.
Do not claim another task and do not edit board.yml or state.json.

Specify the task’s learner outcome, transfer task, allowed files, validation
tier, stop conditions, and next role. Do not edit lesson prose. Do not commit,
push, merge, deploy, or change the quality contract. Write a short report with
exact evidence for the coordinator to record.
PROMPT
```

An author invocation uses the same shape, but `-s workspace-write` and a different role contract:

```bash
timeout 40m codex exec \
  -C /home/edf/Documents/GitSynced/LibreUni \
  -s workspace-write \
  -a never \
  --ephemeral \
  --json \
  > "docs/agent-experiments/lesson-quality-panel/operation/reports/author-$(date -u +%Y%m%dT%H%M%SZ).jsonl" <<'PROMPT'
You are the author/repair worker for exactly one claimed LibreUni task.

Read AGENTS.md and every task pack selected by TASKS.md. Read the task packet,
the current lesson, the source ledger, the latest challenge report, and the
current Git diff. Work only on the leased lesson and packet files. Repair the
listed failing assertions; do not add words, citations, widgets, or headings
merely to satisfy counts. Preserve unrelated dirty changes.

Run the narrowest relevant validation. Record the exact command and result in
the task report, then hand off to independent review. Do not edit board.yml or
state.json; the coordinator records the heartbeat and transition after
validating your diff. Do not approve your own work. Do not commit, push, merge,
deploy, or claim a second task.
PROMPT
```

The scheduler must invoke one of these bounded processes, not keep one prompt alive for days. A minimal Linux cron entry is:

```cron
*/30 * * * * cd /home/edf/Documents/GitSynced/LibreUni && flock -n docs/agent-experiments/lesson-quality-panel/operation/worker.lock timeout 45m ./docs/agent-experiments/lesson-quality-panel/operation/run-next-codex-worker.sh >> docs/agent-experiments/lesson-quality-panel/operation/reports/scheduler.log 2>&1
```

`run-next-codex-worker.sh` is the small coordinator that reads `board.yml`, acquires the next lease, chooses the role’s permission, invokes `codex exec` once, validates the resulting diff, and records the next state. It must exit after one role/task attempt. The `flock` prevents cron overlap; the lease and heartbeat prevent a crashed process from permanently owning a task. Put API credentials in the service environment or a secret manager, never in `board.yml`, a prompt, or a report.

The first safe run is sequential:

```text
chair → source → author → subject → red team → learner → QA → registrar → human gate
```

After the registrar writes `human-review`, the scheduler must stop on that task. A human either accepts it or writes the next repair decision. Only then may the next worker claim it.

## Option B: OpenRouter as a model/API worker

OpenRouter is not, by itself, a local repository editor. Its API sends messages to a selected model. The controller you write must own leases, read only allowed files, execute approved checks, apply patches, write reports, and stop after the budget. OpenRouter documents a direct chat-completions API, an OpenAI-compatible client, and an Agent SDK with tool use, loops, and state primitives. The board’s `state.json` remains the source of truth even if an SDK maintains conversational state.

First test the credential and model route without giving the model repository access:

```bash
export OPENROUTER_API_KEY='provided-by-your-secret-manager'
export OPENROUTER_MODEL='your-pinned-model-slug'

curl --fail-with-body https://openrouter.ai/api/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  -d "{\"model\":\"$OPENROUTER_MODEL\",\"messages\":[{\"role\":\"user\",\"content\":\"Reply with exactly READY.\"}]}"
```

The controller then exposes a deliberately small tool surface to the model:

```text
read_file(path within the leased allowlist)
list_files(within an allowed directory)
run_check(named check from a fixed registry)
apply_patch(unified diff limited to the leased files)
write_report(report fields, no secrets or transcripts)
request_state(next state, evidence, heartbeat, blocker)
```

Do not start by exposing arbitrary shell execution or unrestricted `apply_patch`. The controller validates paths, diff size, task state, and transitions before executing a tool call. A model may request a state transition, but the controller decides whether it is legal. Cap each invocation by wall clock, tool calls, repair attempts, and output size. If the model asks for a tool outside the contract, return a refusal as tool output and end the attempt.

A model assignment in the controller is explicit, for example:

```yaml
models:
  source: your-pinned-research-model-slug
  subject: your-pinned-independent-review-model-slug
  red_team: your-pinned-adversarial-model-slug
```

The controller loads the task’s role and model, sends only the packet plus the minimum relevant excerpts, executes approved tool calls, and writes the same evidence packet format used by Codex workers. Do not let the author’s private explanation become the reviewer’s evidence; pass the lesson, claims, challenge, and diff instead.

OpenRouter requests can be rate-limited or fail because of credits, permissions, timeouts, or provider availability. The controller should honor `Retry-After`, record the provider error, and retry only within the task budget. A provider outage is a `waiting`/`blocked` operational state, not permission to rewrite the lesson or lower a gate.

## Which one should be used?

Start with Codex CLI for the authoring lane. It already supplies the local repository interaction, Git-root awareness, sandbox selection, and non-interactive execution needed by this board. Add OpenRouter once the first sequential lane works, primarily for independent subject/red-team calls or for deliberate model diversity. Use OpenRouter as the author only if you are prepared to maintain the controller and its safe file/check tools.

The durable loop is:

```text
cron/systemd → coordinator → lease one task → provider worker → evidence report
             → deterministic checks → independent review → human gate
```

The scheduler can run this for days because every invocation is restartable. The agents do not get unlimited authority, and no provider call is allowed to convert a count into evidence.
