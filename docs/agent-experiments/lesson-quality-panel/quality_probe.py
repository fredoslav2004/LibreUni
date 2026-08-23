#!/usr/bin/env python3
"""Small experiments for the LibreUni lesson-quality panel.

This is deliberately a probe, not a pedagogical score.  It reports observable
signals and runs two synthetic fixtures that demonstrate why counts cannot be
used as a definition of quality.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter
from dataclasses import dataclass
from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
LESSONS = ROOT / "src" / "content" / "lessons"
QUALITY_DATA = ROOT / "src" / "data" / "course-quality.json"

WORD_RE = re.compile(r"\b[\w'-]+\b")
HEADING_RE = re.compile(r"^#{1,3}\s+", re.MULTILINE)
REFERENCE_HEADING_RE = re.compile(
    r"^#{1,3}\s+.*(?:references?|further reading|sources)\b",
    re.IGNORECASE | re.MULTILINE,
)
URL_RE = re.compile(r"https?://[^)\s>]+")
COMPONENT_RE = re.compile(r"<(Quiz|CodeRunner|CodeExercise|CaseStudy)\b")
CODE_FENCE_RE = re.compile(r"^```[\w+#.-]*\s*$", re.MULTILINE)

EVIDENCE_FIELDS = {
    "outcome": re.compile(r"(?im)^\s*(?:outcome|learning outcome|learner can)\s*[:.]"),
    "transfer_task": re.compile(r"(?im)^\s*(?:transfer task|unseen task|novel case)\s*[:.]"),
    "counterexample": re.compile(r"(?im)^\s*(?:counterexample|failure mode|limitation)\s*[:.]"),
    "diagnostic_feedback": re.compile(r"(?im)^\s*(?:rubric|diagnosis|diagnostic feedback|success evidence)\s*[:.]"),
    "claim_source": re.compile(r"(?im)^\s*(?:claim|claim id|source map|source mapping)\b.*(?:source|reference)\s*[:.]"),
    "omission": re.compile(r"(?im)^\s*(?:omitted|deliberately omitted|scope boundary)\s*[:.]"),
}


@dataclass(frozen=True)
class LessonSignals:
    path: str
    words: int
    headings: int
    references: int
    urls: int
    citation_markers: int
    artifacts: int
    code_fences: int
    explicit_outcome: bool
    explicit_prerequisite: bool
    transfer_signal: bool
    counterexample_signal: bool
    diagnostic_signal: bool
    omission_signal: bool
    duplicate_reference_heading: bool


def body_without_frontmatter(text: str) -> str:
    return re.sub(r"^---\s*\n.*?\n---\s*\n", "", text, count=1, flags=re.DOTALL)


def signals_for(path: Path, text: str | None = None) -> LessonSignals:
    content = text if text is not None else path.read_text(encoding="utf-8")
    body = body_without_frontmatter(content)
    references = len(REFERENCE_HEADING_RE.findall(body))
    return LessonSignals(
        path=str(path.relative_to(ROOT)) if path.is_absolute() else str(path),
        words=len(WORD_RE.findall(body)),
        headings=len(HEADING_RE.findall(body)),
        references=references,
        urls=len(URL_RE.findall(body)),
        citation_markers=len(re.findall(r"(?i)\b(?:source|reference|citation)\s+\d+\b", body)),
        artifacts=len(COMPONENT_RE.findall(body)),
        code_fences=len(CODE_FENCE_RE.findall(body)) // 2,
        explicit_outcome=bool(re.search(r"(?i)\b(?:learning outcomes?|objectives?)\b", body)),
        explicit_prerequisite=bool(re.search(r"(?i)\bprerequisites?\b", body)),
        transfer_signal=bool(re.search(r"(?i)\b(?:transfer|unseen|novel case|new scenario|synthesis)\b", body)),
        counterexample_signal=bool(re.search(r"(?i)\b(?:counterexample|failure mode|limitation|boundary case)\b", body)),
        diagnostic_signal=bool(re.search(r"(?i)\b(?:diagnos|rubric|grading criteria|common misconception)\w*\b", body)),
        omission_signal=bool(re.search(r"(?i)\b(?:deliberately omitted|scope boundary|out of scope|omitted)\b", body)),
        duplicate_reference_heading=references > 1,
    )


def contract_fields(text: str) -> dict[str, bool]:
    body = body_without_frontmatter(text)
    return {name: bool(pattern.search(body)) for name, pattern in EVIDENCE_FIELDS.items()}


def metric_gate(signals: LessonSignals) -> bool:
    """A deliberately bad gate used only to demonstrate metric gaming."""
    return signals.words >= 1000 and signals.citation_markers >= 10 and signals.artifacts >= 3


def evidence_gate(text: str) -> bool:
    return all(contract_fields(text).values())


def synthetic_cases() -> dict[str, str]:
    bait_words = " ".join(["lorem ipsum dolor sit amet consectetur adipiscing elit"] * 180)
    bait_sources = "\n".join(f"Reference {index}: an unexamined source label" for index in range(1, 11))
    metric_bait = f"""# Metric Bait\n\n{bait_words}\n\n{bait_sources}\n\n<Quiz />\n<Quiz />\n<Quiz />\n"""

    evidence_first = """# Evidence First\n\nOutcome: Given an unfamiliar concurrent schedule, the learner can identify the invariant that fails, construct a counterexample, and choose a repair whose protected resource matches that invariant.\n\nClaim C1 — Source: the repository's database lesson states that row-local constraints do not automatically protect a predicate over a set.\n\nTransfer task: A hospital schedule uses three nurses instead of two. Decide whether the proposed row lock protects the staffing invariant and justify the decision without copying the worked example.\n\nCounterexample: two transactions read the same predicate, update disjoint rows, and both commit; no row is individually invalid, but the set-level invariant fails.\n\nSuccess evidence: the response names the read set, write set, conflict boundary, and one possible abort or retry.\n\nRubric: full credit requires a valid interleaving, a stated invariant, a repair that protects the same boundary, and a diagnosis of why the tempting repair is insufficient.\n\nOmitted: engine-specific lock syntax and distributed deadlock protocols; those require a separate lab with a target database.\n\nReference 1: PostgreSQL transaction documentation.\nReference 2: LibreUni transaction trace lab.\n"""
    return {"metric-bait": metric_bait, "evidence-first": evidence_first}


def repository_inventory() -> tuple[list[LessonSignals], Counter[str]]:
    lessons = [signals_for(path) for path in sorted(LESSONS.glob("*/*.mdx"))]
    statuses: Counter[str] = Counter()
    if QUALITY_DATA.exists():
        data = json.loads(QUALITY_DATA.read_text(encoding="utf-8"))
        statuses.update(record.get("smokeTest", {}).get("status", "unknown") for record in data.values())
    return lessons, statuses


def print_inventory(lessons: list[LessonSignals], statuses: Counter[str]) -> None:
    print("Repository evidence probe (signals, not a quality score)")
    print(f"lessons scanned: {len(lessons)}")
    print(f"smoke statuses in course-quality.json: {dict(sorted(statuses.items()))}")
    checks = {
        "explicit outcome language": lambda x: x.explicit_outcome,
        "explicit prerequisites": lambda x: x.explicit_prerequisite,
        "transfer signal": lambda x: x.transfer_signal,
        "counterexample/failure signal": lambda x: x.counterexample_signal,
        "diagnostic feedback/rubric signal": lambda x: x.diagnostic_signal,
        "deliberate omission/scope signal": lambda x: x.omission_signal,
        "duplicate references heading": lambda x: x.duplicate_reference_heading,
    }
    for label, predicate in checks.items():
        count = sum(predicate(lesson) for lesson in lessons)
        print(f"{label}: {count}/{len(lessons)}")
    print("largest lessons by words (triage only):")
    for lesson in sorted(lessons, key=lambda x: x.words, reverse=True)[:5]:
        print(f"  {lesson.path}: words={lesson.words}, headings={lesson.headings}, artifacts={lesson.artifacts}, urls={lesson.urls}")


def print_synthetic_experiment() -> bool:
    print("\nSynthetic adversarial experiment")
    passed = True
    for name, text in synthetic_cases().items():
        signals = signals_for(Path(name), text)
        fields = contract_fields(text)
        count_result = metric_gate(signals)
        evidence_result = evidence_gate(text)
        print(
            f"{name}: words={signals.words}, citation-markers={signals.citation_markers}, "
            f"artifacts={signals.artifacts}, count-gate={'PASS' if count_result else 'FAIL'}, "
            f"evidence-contract={'PASS' if evidence_result else 'FAIL'}"
        )
        if name == "metric-bait":
            passed &= count_result and not evidence_result
            missing = [field for field, present in fields.items() if not present]
            print(f"  expected failure: evidence fields missing = {', '.join(missing)}")
        else:
            passed &= not count_result and evidence_result
            print(f"  expected failure: count gate rejects a short but traceable lesson")
    return passed


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="exit non-zero if the adversarial demonstration does not behave as expected")
    args = parser.parse_args()

    lessons, statuses = repository_inventory()
    print_inventory(lessons, statuses)
    synthetic_passed = print_synthetic_experiment()
    if args.check and not synthetic_passed:
        print("\nERROR: the synthetic metric-gaming contract did not demonstrate the expected separation", file=sys.stderr)
        return 1
    print("\nConclusion: counts may prioritize inspection; only traceable evidence can support a quality decision.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
