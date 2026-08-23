# Lesson quality panel

This folder records a repository-grounded panel discussion about verifying whether LibreUni lessons support durable learning. It is an experiment and design record, not course content and not a new numeric quality score.

Read [`panel.md`](panel.md) for the discussion, evidence excerpts, proposed operating contract, and the final resolution. Read [`agentic-runbook.md`](agentic-runbook.md) for the durable queue, board roles, worker state machine, scheduler controls, and two-week pilot. Read [`provider-setup.md`](provider-setup.md) for the physical Codex CLI/OpenRouter assignments and scheduler commands. Read [`course-triage.md`](course-triage.md) for the initial repository-grounded ratings of the remaining catalog. Run the reproducible probe from the repository root:

```bash
python3 docs/agent-experiments/lesson-quality-panel/quality_probe.py --check
```

The probe keeps mechanical signals separate from evidence claims. Its synthetic fixtures intentionally demonstrate that a long text with ten source labels and three widgets can pass a count gate while failing to establish a learner outcome, and that a shorter traceable lesson can do the reverse.
