# Agentic course-improvement runbook

This runbook turns the panel’s Lesson Evidence Packet into a durable, multi-day operating loop. It is intentionally host-neutral: use the ordinary non-interactive agent command, scheduler, and Git capabilities available in the host environment. Do not create a hidden prompt store, custom MCP runtime, or automatic publishing path.

The objective is not to let one model edit LibreUni indefinitely. The objective is to let a board of bounded workers make small, inspectable improvements while preserving a restartable record of what was attempted, what evidence was gathered, and what still needs human judgment.

## 1. The minimum repository setup

Create an explicit operations directory outside `docs/agent-context/`:

```text
docs/agent-experiments/lesson-quality-panel/
  agentic-runbook.md
  panel.md
  quality_probe.py
  operation/
    board.yml                 # queue, policy, role assignments
    state.json                # leases and task state; no prompts or secrets
    packets/                  # one evidence packet per accepted work unit
    challenges/               # held-out challenge instances and rubrics
    decisions.md              # stable operating decisions only
    reports/                  # command outputs and review summaries
```

Keep `state.json`, packets, and reports small and reviewable. Never store credentials, conversation transcripts, hidden reasoning, or personal learner data. If learner data is needed for a pilot, store anonymized aggregate results outside this experiment and link only to an approved report.

The worker should operate on an explicit branch or worktree. If commits are authorized, make one intentional commit per accepted work unit. If commits are not authorized, leave changes for the human integrator and mark the task `review`, never `done`.

## 2. Define the board before starting workers

Use a queue with small tasks. A task should normally touch one lesson and its evidence packet, or one shared validation/tooling file. Do not queue “improve the algorithms course” as a single item.

Example `board.yml`:

```yaml
schema: 1
board: libreuni-course-evidence
policy:
  max_files_per_task: 2
  max_repair_iterations: 3
  max_active_tasks: 1
  require_independent_review: true
  require_human_gate_before_merge: true
  stale_lease_minutes: 45
  stop_on_repeated_blocker: 3
roles:
  chair: planner-agent
  source: source-agent
  author: author-agent
  subject: subject-review-agent
  red_team: adversary-agent
  learner: first-reader-agent
  qa: build-and-accessibility-agent
  registrar: release-agent
tasks:
  - id: db-transaction-trace
    kind: lesson-review
    path: src/content/lessons/database-systems/transaction-trace-lab.mdx
    outcome: "Construct and diagnose concurrent transaction histories under stated visibility rules."
    packet: operation/packets/db-transaction-trace.md
    challenges: operation/challenges/database-systems.yml
    dependencies: []
    status: queued
  - id: algorithms-shortest-paths
    kind: lesson-review
    path: src/content/lessons/algorithms/shortest-paths.mdx
    outcome: "Choose and justify a shortest-path method when weight assumptions change."
    packet: operation/packets/algorithms-shortest-paths.md
    challenges: operation/challenges/algorithms.yml
    dependencies: []
    status: queued
  - id: c-arrays
    kind: lesson-review
    path: src/content/lessons/c/arrays.mdx
    outcome: "Predict array expression types and boundary behavior in C."
    packet: operation/packets/c-arrays.md
    challenges: operation/challenges/c.yml
    dependencies: []
    status: queued
```

The board is a queue and dependency graph, not a quality leaderboard. `status: done` means the defined work unit has passed its release contract, not that the lesson is globally good.

## 3. Use a state machine, not an optimistic checklist

Each task moves through these states:

```text
queued
  → claimed
  → inspected
  → specified
  → drafted
  → challenged
  → repaired (zero to three times)
  → independently-reviewed
  → mechanically-validated
  → human-review
  → accepted | blocked | rejected
```

`done` is an archival label applied only after `accepted`. A worker may not move a task directly from `drafted` to `done`.

Record state transitions in `state.json` with only operational evidence:

```json
{
  "task": "db-transaction-trace",
  "status": "challenged",
  "owner": "adversary-agent",
  "lease_started": "2026-08-18T09:30:00Z",
  "heartbeat": "2026-08-18T09:46:00Z",
  "attempt": 1,
  "files_changed": [
    "src/content/lessons/database-systems/transaction-trace-lab.mdx",
    "operation/packets/db-transaction-trace.md"
  ],
  "last_evidence": "operation/reports/db-transaction-trace-attempt-1.md",
  "next_action": "Repair missing engine boundary in claim C3",
  "blocker": null
}
```

The heartbeat makes unattended work recoverable. If a process dies, another worker may reclaim a stale lease after the configured interval. It must inspect the last report before continuing; it must not blindly restart and overwrite the previous attempt.

## 4. Assemble the board as separate responsibilities

The roles are accountability boundaries, not necessarily eight different models. In a small deployment, one host can perform several roles sequentially, but each role must receive a fresh task-specific instruction and produce a separate artifact.

### Chair / planner

Reads the queue, repository rules, current status, and dependencies. It chooses one task, defines the work boundary, and refuses vague tasks. It does not write lesson prose.

Output:

```text
task id, target file, outcome, prerequisites, allowed files, validation tier,
known risks, stop conditions, and next role
```

### Source librarian

Builds the claim ledger from authoritative sources. It records source support and boundaries, flags claims that require subject review, and may recommend narrowing or removing claims. It does not add citations to hit a count.

### Author

Edits the lesson by hand, using the outcome, transfer task, claim ledger, and authoring-surface rules. It may add an exercise or component only when the packet states what learner behavior it exposes. It does not mark its own draft accepted.

### Subject reviewer

Checks definitions, derivations, examples, edge cases, implementation scope, and source entailment. It must be able to say “the source does not support this sentence” or “this proof skips a necessary implication.” It may be a separate model, a human, or both; it must not share the author’s success summary as its only context.

### Adversary

Generates and runs assumption mutations, counterexamples, reversed directions, boundary cases, copy tests, and source attacks from the challenge bank. It reports the failing instance and the evidence needed for a repair. It is rewarded for finding a real defect, not for producing a dramatic critique.

### First-reader / accessibility reviewer

Attempts the transfer task from the stated prerequisites without asking the author for missing context. It checks text alternatives, mobile/PDF legibility, interaction discoverability, and whether the feedback diagnoses the error. “I could not tell what the exercise wanted” is a valid defect.

### Build and QA reviewer

Runs the narrowest relevant repository checks, records exact commands and results, and distinguishes a parser/build failure from a pedagogical finding. It checks the changed route or lesson visually when the change affects rendering.

### Registrar / release reviewer

Checks that the packet is complete, role outputs are present, unresolved critical items are absent, and the task did not modify files outside its lease. It does not rewrite the lesson to make the board green. It moves the task to `human-review` or `blocked`.

## 5. The worker loop for one task

Every worker invocation should be short enough to restart. A practical unit is one task, one role, and one evidence-producing action. The scheduler may run hundreds of these units over days; no single prompt needs to remain alive for days.

### Claim the task

Acquire a lease atomically. If another worker owns the task, exit. Read `AGENTS.md`, the routed task packs, the task file, the relevant source, and the previous report. Do not trust a stale packet over the current source.

### Inspect before editing

Record the starting commit or working-tree revision, relevant dirty changes, and the exact files in scope. If an unrelated dirty change overlaps the target, stop and request human direction. The worker may not “clean up” unrelated files.

### Specify before drafting

Create or update the packet’s learner contract:

```text
Outcome:
Prerequisites:
Transfer task:
Expected response:
Diagnostic failures:
Central claims:
Counterexample:
Deliberate omission:
Representation decision:
```

If the outcome cannot be expressed this way, the task returns to `blocked` with a question for the chair. The author should not fill the ambiguity with prose.

### Draft or repair

The author changes only the leased files. It preserves correct material only when it serves the learning arc. It works file by file, never mass-rewrites a course, and updates the packet as claims or tasks change.

### Challenge independently

The adversary receives the revised lesson, packet, challenge family, and source ledger. It does not receive the author’s “why this is good” explanation. Each challenge result is one of:

```text
pass with evidence | defect with repair target | not applicable with reason | unresolved
```

The adversary may not close its own defect. A repair sends the task back through the subject and first-reader roles.

### Validate mechanically

For lesson content, use the narrowest useful checks first:

```bash
python3 scripts/verify_lessons.py database-systems
python3 scripts/course_stats.py <course-id>
python3 scripts/course_integrity.py <course-id>
```

Then run the build/render or visual checks required by the affected surface. Report pre-existing failures separately. A worker does not weaken a threshold, add fake source comments, or declare a failed check irrelevant because the prose is good.

### Hand off, never self-approve

The worker writes a short report:

```text
Task:
Files changed:
Outcome and transfer task:
Claims changed:
Adversarial defects found:
Repairs made:
Mechanical commands and actual results:
Independent review result:
Remaining risk:
Next state:
```

The registrar moves the task to `human-review`, `blocked`, or `rejected`. The author never sets `accepted`.

## 6. How to run for days without runaway behavior

Use a scheduler or CI runner to invoke the worker repeatedly. The scheduler should make one bounded attempt, then exit. The next invocation resumes from `state.json` and the board.

The outer loop needs these controls:

- **Lease:** only one active worker may own a task unless the board explicitly schedules independent review.
- **Attempt limit:** after three repair cycles, stop and escalate rather than generating more prose.
- **Wall-clock limit:** terminate a role that exceeds its allowance; preserve its report.
- **File limit:** reject a task that changes files outside its declared scope.
- **Validation limit:** do not keep rerunning the same failed check without changing the relevant cause.
- **Budget limit:** cap tokens, tool calls, and external research per task.
- **No publish permission:** workers may not push, merge, deploy, or send messages unless the operator explicitly grants that authority.
- **Human gate:** accepted work waits for review; the scheduler cannot convert `human-review` to `done`.
- **Stale recovery:** reclaim dead leases only after inspecting the last heartbeat and report.
- **Kill switch:** a single operator action pauses new claims and leaves current work recoverable.

The system should stop when the queue is empty, when the same blocker recurs three times, when a source dispute cannot be resolved, or when a worker begins changing the definition of the quality contract to pass its own output. Unchanged external state is not a reason to pretend progress; record the wait and move to another independent task if the board allows it.

## 7. Two-week pilot, not a 644-lesson rewrite

### Day 0 — prepare

1. Create the explicit operation directory and board.
2. Add three challenge files for different domains.
3. Choose four lessons: `transaction-trace-lab`, `shortest-paths`, `c/arrays`, and `authoring-showcase` as a document-type control.
4. Write packets by hand for the first task so the board does not learn from an empty template.
5. Confirm the human gate, branch/worktree policy, stop command, and allowed files.

### Days 1–3 — calibrate

Run one task at a time. Have humans inspect every role output. Record false positives: a proof reported as “missing code,” a prose-only explanation reported as “uncovered,” a source flagged despite exact support, or a generic challenge that does not test the outcome. Repair the board or prompts, not the lesson, when the process is wrong.

### Days 4–7 — repeat

Run the same board on two new lessons per domain. Rotate challenge instances. Compare defect categories, repair loops, and human overrides. Do not publish a dashboard ranking lessons.

### Days 8–10 — learner evidence

Ask independent reviewers or learners to attempt held-out tasks. Record per-outcome responses and error types, not personal data. A lesson is not “validated” because the agent predicted that the learner would succeed.

### Days 11–12 — harden

Remove prompts or checks that did not produce useful evidence. Add only stable, source-backed rules to repository documentation. Promote a script check only after the panel has shown that it catches a real defect and does not incentivize decorative content.

### Days 13–14 — integrate

The human reviewer accepts, rejects, or defers each work unit. Update the board’s decisions, clear completed temporary state, and create a bounded next queue. Do not leave a fake “all courses complete” status when only the pilot was reviewed.

## 8. What the AI is actually told to improve

The worker receives failing assertions, not a quality score:

```text
Repair task db-transaction-trace.

Failed assertions:
1. Outcome O1 has no transfer task with changed surface conditions.
2. Claim C3 is written as universal but its source documents PostgreSQL behavior.
3. The current exercise solution is adjacent to the prompt and does not diagnose
   the write-set misconception.

Do not add word count, citations, or components unless they repair one of these
assertions. Preserve the existing hand-trace protocol. Return the changed claim
rows, revised task, adversarial result, and remaining uncertainty.
```

This is the key control loop:

```text
defect → targeted repair → independent challenge → evidence report → human gate
```

The AI is useful because it can inspect, propose, test, and revise repeatedly. It is safe because the unit of progress is an externally inspectable defect and its evidence, not the model’s confidence or a rising aggregate score.

## 9. Completion definition

The board may say a work unit is accepted only when:

- its outcome and transfer task are explicit and linked;
- material claims have source support and boundaries;
- the teaching trace includes the necessary mechanism and failure boundary;
- the task has diagnostic criteria and is not answer-copyable;
- the adversarial challenge set was attempted;
- independent subject, learner/accessibility, and mechanical reviews are recorded;
- no critical unresolved item remains;
- the exact changed files and checks are known;
- a human has accepted the work.

This is a quantitative workflow in the narrow sense that it counts unresolved assertions, attempts, files, and learner responses. It is not a quantitative course-quality score. The only useful course-level outcome measure comes from held-out learner performance, reported by outcome and error type, with the context and limitations preserved.

## 10. The first concrete command sequence

From the repository root, the first pilot can begin with:

```bash
git status --short
python3 -B docs/agent-experiments/lesson-quality-panel/quality_probe.py --check
python3 scripts/verify_lessons.py
python3 scripts/course_stats.py database-systems
python3 scripts/course_integrity.py database-systems
```

Then the chair creates the first packet and claims exactly one task. The worker is not allowed to start a second lesson until the first packet has reached `human-review`. This narrow start is deliberate: multi-day autonomy comes from durable state and repeated bounded invocations, not from granting a model permission to rewrite the platform without interruption.

## 11. Provider assignment

The board does not assign “an AI” to a lesson. It assigns one bounded role invocation to one leased task. The concrete Codex CLI and OpenRouter wiring, including a scheduler command, is in [`provider-setup.md`](provider-setup.md).

For the first pilot, use Codex for the chair, author, and repair workers, and use an independent OpenRouter call for subject or adversarial review if a controller is available. This gives the author a local repository agent while keeping review context fresh and model/provider-diverse. Do not run two writers in the same worktree. Start with `max_active_tasks: 1`; add parallel worktrees only after lease and state updates are atomic.
