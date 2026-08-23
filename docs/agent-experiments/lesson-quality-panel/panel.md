# Panel: from counting lessons to proving learning

**Date of the simulation:** 2026-08-18
**Scope:** the LibreUni repository at the revision inspected for this experiment
**Status:** resolved as a verification design; the existing lessons remain a repair backlog

> This is a deliberately extended simulation. The participants are fictional roles, not claims that named people performed the review. Repository excerpts, command results, and the final operating contract are real artifacts of this workspace. The conversation ends only after the panel has produced a falsifiable workflow, tested its central failure mode, and stated what remains outside the scope of this experiment.

## The question the moderator puts on the table

**Moderator — Jo Alvarez:** The current courses often read as if an authoring machine has learned the shape of a university lesson without learning why a university lesson exists. We see headings, definitions, citations, quizzes, diagrams, and large word counts. A learner can still be left with no clear model of the subject, no way to tell whether an answer is right, and no practice that transfers beyond the examples just read.

The immediate temptation is to tighten the prompt:

- demand ten citations;
- demand 1,000 words;
- demand a quiz after every section;
- demand a diagram, a proof, a counterexample, and a “deliberately omitted” section;
- ask another agent to score the result.

The panel is forbidden to accept any of those as a solution merely because they are easy to count. It must answer a harder question:

> What evidence would let a second reviewer, who did not write the lesson, decide whether a learner can do the intended thing with the knowledge rather than merely recognize the lesson’s vocabulary?

The panel may use scripts for triage and consistency. It may not turn a proxy into the goal. It must inspect the repository, produce failed experiments, revise the proposal, and continue until the proposed process survives an adversarial attempt to game it.

## Participants

| Participant | Responsibility in the panel | Suspicion they bring |
| --- | --- | --- |
| Dr. Mira Sen | Rigorous subject-matter expert | A polished explanation can still smuggle in a false premise or skip the only proof that matters. |
| Prof. Elias Nyström | Learning scientist and cognitive designer | Recognition, fluency, and immediate correctness are weak evidence for transfer to a new problem. |
| Ada Reyes | Assessment and measurement specialist | A score is an interpretation that needs evidence; it is not a property that text possesses. |
| Noor Ibrahim | Anti-fluff editor and curriculum architect | Lists of topics, transitions, and headings can imitate scope while hiding missing structure. |
| Linh Tran | Adversarial agent red-teamer | Any fixed rule can become the target. A capable generator will satisfy the visible rule and route around its purpose. |
| Rowan Kim | Repository and build engineer | A clean parser result proves only the parser’s contract. A broken runner is evidence of broken infrastructure, not evidence that a learner cannot learn. |
| Sofia Martins | Learner advocate and accessibility reviewer | If the task, feedback, or representation is unclear to a first reader, authorial intent does not rescue it. |

---

## Session 1 — Establish the crime scene

**Jo:** Rowan, start with the repository rather than with a theory of bad prose. What did you inspect?

**Rowan:** The worktree was clean. The repository’s own routing sent us through the baseline, course, pedagogy, integrity, research, and validation rules. The first surprise is that the written policy already knows the problem. `docs/agent-rules/GENERAL.md` says:

```text
scripts/course_stats.py — course inventory and smoke tests; it does not rate pedagogical quality.
scripts/course_integrity.py — anomaly audit for filler, duplication, generic artifacts, and uncovered headings; it is a review gate, not a pedagogical score.
```

The same file says lesson size is typically 1000–6000 characters but immediately says there is no strict limit and that focus should remain on depth, clarity, and rigor. It also says automated metrics do not certify course quality. `COURSE_STANDARD.md` is even more explicit: do not maximize word count, topic coverage, component count, or repository metrics; every outcome must be demonstrated by an assessment that requires transfer.

So the problem is not simply that the repository lacks warnings against bad metrics. The problem is that the authoring and review path still makes those metrics easier to produce and report than the evidence of learning they are supposed to approximate.

**Ada:** That distinction matters. The existing documents contain a learning contract and a mechanical contract, but they do not yet define a review artifact that binds the two. The author can point to a passing smoke test and the reviewer can point to the standard, yet neither has to show a chain like:

```text
outcome → learner action → observable response → diagnostic criterion → source-backed teaching → adversarial test
```

The chain is the missing object.

**Rowan:** Here are the baseline command results, captured before adding this panel’s experiment:

| Command or artifact | Result | What it actually establishes |
| --- | ---: | --- |
| `python3 scripts/verify_lessons.py` | exit 1; 644 lessons scanned; 310 errors; 3,251 warnings | The verifier found banned phrases, missing source signals, structural warnings, and other declared defects. |
| `python3 scripts/course_stats.py` | exit 0; 22 courses passed, 11 failed in the inventory | The executable snippets and supported component structure were checked according to that script. Its own docstring says this is not a quality rating. |
| `python3 scripts/course_integrity.py --strict` | exit 0; 415 findings; 0 blocking findings | The detector found review-level uncovered headings and similar anomalies, but its current blocking category did not fire. |
| `src/data/course-quality.json` | 33 course records; 22 `passed`, 11 `failed` | A stored smoke-test snapshot, not evidence of learner mastery. |

**Linh:** That table is almost a demonstration of Goodhart’s law without needing to cite Goodhart. A metric can be correct about its narrow subject and still become a poor target when an agent is rewarded for the number. “Passed” is now semantically overloaded. It can mean “the runner did not find a supported syntax failure,” while a reader hears “the course is good.”

**Noor:** The word “warning” is overloaded too. A warning that a references section has no adjacent code block is not automatically a defect; a warning that a concept has no usable exercise may be serious. The current checker sees structural adjacency. The reviewer must decide whether the artifact supports the concept.

**Jo:** The first agreement, then: do not delete the mechanical checks. Reclassify them. They are fast triage and infrastructure checks, not a teaching verdict.

**Ada:** More precisely: a mechanical check may be a necessary condition, a review trigger, or a build invariant. It is almost never a sufficient condition for a learning claim.

### What the current inventory actually counts

**Rowan:** The implementation makes the boundary visible. `scripts/course_stats.py` has an `analyze_lesson` function that records:

```python
"words": len(re.findall(r"\w+", body)),
"characters": len(body),
"headings": len(re.findall(r"^#{1,3}\s+", body, re.MULTILINE)),
"codeBlocks": len(FENCE_RE.findall(body)),
"components": components,
"interactiveCount": sum(components.values()),
```

That is valuable inventory. It can tell us where a lesson is unusually large, where a component is missing its canonical prop, and where a code block breaks. It cannot tell us whether the definition is correct, whether the example is genuinely different from the first one, or whether the learner can solve an unseen problem.

The integrity script is stronger than a word counter but still narrower than a learning argument. Its section helper is effectively:

```python
def artifact_in_section(section: str) -> bool:
    return bool(ARTIFACT_RE.search(section))
```

Then the audit reports a substantive heading when no recognized artifact appears in its section. That is a sensible review trigger. It is not a proof that the artifact is relevant, comprehensible, accessible, or sufficient.

**Mira:** A quiz can be an artifact and still be a vocabulary mirror. A diagram can be an artifact and still be a renamed template. A code runner can be an artifact and still ask the learner to execute an answer they have not had to derive. The presence of a noun is not evidence of the function of the noun.

**Elias:** The learning distinction is between *exposure*, *performance*, and *transfer*. A reader may recognize “write skew” when shown the phrase and still fail to construct a write-skew history. A learner may reproduce Dijkstra’s example and still choose Dijkstra when an unseen negative edge invalidates the assumption. The latter task is evidence because it forces the learner to select and justify a mechanism under changed surface conditions.

**Sofia:** And the task has to be readable. An “unseen problem” with an unstated database engine, an undefined notation, or a visually clipped table is not a rigorous transfer task; it is an access and specification failure.

---

## Session 2 — Bring the lessons into the room

### Exhibit A: the lesson that looks complete because it is dense

**Jo:** Mira, take `src/content/lessons/algorithms/np-completeness.mdx`.

**Mira:** The opening is ambitious and potentially useful. It motivates the topic with logistics, chip placement, and cryptography, then introduces Cook, Karp, P versus NP, formal definitions, a diagram, a verifier, reductions, a theorem, a proof, more reductions, and exercises. The file has 5,313 words, 25 headings, and 10 interactive artifacts according to the probe.

That is not a criticism. A difficult lesson may need substantial space. But the density creates two review risks:

1. The narrative can name more results than it proves.
2. The artifacts can make coverage look wider than the learner’s independently demonstrated ability.

Here is one strong passage:

```mdx
<MathStatement id="np-complete" kind="definition" title="NP-completeness">
A language $L$ is NP-complete if:
1. $L \in NP$ (membership).
2. $L$ is NP-hard: for every $A \in NP$, $A \le_p L$.
</MathStatement>
```

That has a precise statement. The next question is not “does the file contain a quiz?” It is: can a learner use the direction of a reduction to diagnose a deliberately reversed proof? The panel would ask for a new target problem and require the learner to state which implication follows and why.

The same file contains the claim that COMPOSITE was shown to be in P by AKS and cites `[AKS 2004]`. The existence of a bracketed year does not tell us whether the reference list identifies the source, whether the claim is scoped correctly, or whether the text distinguishes the decision problem from a factorization problem. A claim ledger would force that distinction.

**Linh:** It is also a red-team target. Tell an agent “add ten citations and prove rigor,” and it can add named theorems, `[Cook 1971]`, `[Karp 1972]`, `[Clay 2000]`, and `[AKS 2004]` while leaving the exact support and boundaries unreviewed. The agent has obeyed the visible surface instruction and escaped the intellectual purpose.

**Ada:** The current source rule is necessary but countable. “Sources supporting material claims” is a principle. The missing review object is a row for each consequential claim:

| Claim ID | Exact claim | Location | Source | What the source supports | Boundary or dispute | Reviewer |
| --- | --- | --- | --- | --- | --- | --- |
| C-07 | `A ≤p B` in this lesson uses a polynomial-time computable many-one map | reduction section | canonical complexity text or lecture source | formal definition and notation | do not conflate with Turing reduction | subject expert |

The row is more work than adding a citation. That is intentional. A source is evidence only when a reviewer can see the claim-to-source relationship.

### Exhibit B: the lesson whose prose contains a good laboratory protocol

**Jo:** Now `database-systems/transaction-trace-lab.mdx`.

**Elias:** This file contains several features of a real learning arc even though the repository does not mark them with a formal outcome field. It says:

```mdx
For each assigned scenario, first write the serial specification and invariants.
Then provide an interleaving with at least two sessions, annotate each
operation, and identify the first point at which the observed outcome diverges
from the specification. Repeat under two isolation levels.
```

That is a learner action with a visible product. It also distinguishes what reasoning proves from what an experiment merely observes:

```mdx
A good report contains a counterexample for the unsafe version and a proof
sketch for the repaired version.
```

That is close to an evidence contract. It tells the reviewer what a response must contain and prevents “the test passed once” from masquerading as proof.

The probe records 1,881 words, 11 headings, one reference heading, a transfer signal, a counterexample signal, and a diagnostic signal. It does not record an explicit “learning outcomes” heading, explicit prerequisites, or an omission statement. The lesson may still teach well; the point is that the evidence is distributed in prose and not yet handoff-friendly.

**Mira:** It also says to name the database engine and isolation implementation. That is a boundary condition, not decorative rigor. An auditor should preserve it. A word-count optimizer might remove it to make the prose leaner, exactly where the lesson becomes more truthful.

**Sofia:** For a first reader, the lab protocol is promising but heavy. A learner needs one worked trace with the five columns filled in before being asked to produce a full report. The panel’s contract should distinguish “the lesson names the required report” from “the learner has been shown how to construct a report.”

### Exhibit C: the lesson that tests mechanism and failure mode

**Jo:** `algorithms/shortest-paths.mdx`.

**Mira:** This is the strongest exhibit for formal teaching. It states prerequisites, defines relaxation, gives a lemma, provides a proof, states Dijkstra’s theorem, provides a proof, shows a figure, includes code, and then names the negative-edge failure mode with a concrete graph. The probe records 4,029 words, 25 headings, six interactive artifacts, one reference heading, explicit prerequisites, transfer and counterexample signals, and a deliberate-omission signal.

The verifier still emits warnings that some headings have no “clear code block or example signal.” That warning may be useful for inspection, but it is not a verdict against the proof. The teaching artifact for a theorem may be a proof, not a code block. The current detector’s vocabulary is narrower than the course standard’s vocabulary.

**Noor:** This is a critical design lesson. If a checker cannot see proofs, it encourages authors to add code merely to satisfy the checker. The system then creates the very robotic feel the user described. The correct repair is not “put a code block after every proof”; it is “teach the detector the difference between an artifact and a token.” Better still, make the reviewer record the artifact’s purpose.

**Ada:** There is a second problem. The file has a quiz asking why Dijkstra fails with negative weights. That is useful as a misconception check, but it does not establish that the learner can choose Bellman–Ford on an unfamiliar graph or prove why the assumption matters. The quiz is evidence for one narrow recognition-and-explanation step, not the entire learning outcome.

### Exhibit D: the lesson that is really an authoring gallery

**Jo:** `libreuni/authoring-showcase.mdx`.

**Rowan:** It has 770 words, nine headings, three components, a code fence, and no explicit outcome or prerequisite signal. It says its purpose is to show contributors the platform surface area. It is not a learner lesson in the same sense as shortest paths. Applying the same quality contract without a type distinction would produce nonsense.

**Noor:** Exactly. A course repository has different document purposes: learner lesson, lab, assessment, contributor showcase, course assessment, and perhaps a reference page. A single universal count gate punishes a concise reference and rewards a gallery with widgets. The evidence contract needs a document type and an intended audience. “Not applicable” must be a reasoned status, never a way to skip review.

**Mira:** The showcase also exposes a platform defect: its TypeScript runner is recorded as requiring a missing `tsc`, and another JavaScript block fails syntax checking. That is a real build/infrastructure problem. It is not evidence that a contributor understands diagrams or that the gallery is pedagogically useful.

### Exhibit E: the small lesson with a clear mechanical failure

**Jo:** `c/arrays.mdx`.

**Rowan:** The file uses six level-one headings where the repository’s authoring rule asks for h1, h2, and h3 structure. It has no references heading or source-tracking comments, which the verifier reports as an error. It has a code exercise and a code runner. The prose includes claims such as “arrays are stored contiguously” and “array parameters are pointers to the first element,” which require careful C language qualification.

**Mira:** This is where source quality and teaching quality interact. A citation count would not repair the missing language-lawyer boundary conditions. The lesson should state where array-to-pointer conversion does not occur, how function parameter adjustment works, and what “undefined behavior” means. A learner must be able to predict which expression changes type and why; a code exercise that accepts a token is not enough.

**Linh:** The easiest agent escape is to add a References section with ten items and keep the same oversimplification. A source ledger plus an adversarial boundary test would reveal the defect:

```text
Test: identify two contexts where an array expression does not decay, and explain
the type of sizeof arr inside and outside the defining scope.
```

If the lesson cannot support that task, it must narrow its claim or teach the missing material. No number of references can substitute for that decision.

---

## Session 3 — The first proposed fixes fail on purpose

**Jo:** We now propose the obvious fixes one at a time. Each participant should try to break them.

### Proposal 1: increase the minimum word count

**Noor:** Set every lesson to at least 1,000 words, perhaps 2,000 for a major concept. Short drafts tend to be thin.

**Linh:** A generator can satisfy that in seconds by repeating definitions, enumerating related terms, and adding transition paragraphs. The user’s example of lorem ipsum is not an edge case; it is the predictable optimum when word count is visible and explanation is hard to judge.

**Elias:** Length is also non-monotonic. A proof can be too short to justify a crucial step, but a longer proof can bury the invariant. A compact counterexample may teach more than a page of generic examples. Use word count to find outliers for inspection, never as a pass condition.

**Ada:** A minimum turns “enough evidence for this outcome” into “enough characters.” Reject it.

### Proposal 2: require ten citations

**Mira:** Require one source for each major claim and a minimum of ten references for a lesson with a broad scope.

**Linh:** I can provide ten URLs at the end, all real, none mapped to a claim. I can cite a textbook that supports a definition but not the version-specific implementation detail in the paragraph. I can cite ten secondary summaries and omit the primary result. If the goal is sourcing, a list is the weakest possible representation.

**Ada:** The right minimum is not “ten sources.” It is “every material claim has an appropriate source or is clearly labeled as an original example, a derivation, an opinion, or an experiment.” One canonical source may be enough for a narrow lesson; ten may be inadequate for a survey with contested claims. The audit must record scope, support, and uncertainty.

**Mira:** Reject the citation count. Keep link and source checks as integrity checks, but require a claim ledger for substantive revision.

### Proposal 3: add an interactive component after every heading

**Rowan:** The existing integrity rule looks for adjacent teaching artifacts. We could make the rule stricter and require a quiz, runner, diagram, or exercise after every substantive heading.

**Sofia:** That would create interaction tax. Some theorems need a proof; some conceptual distinctions need a counterexample table; some warning needs a concise failure trace. A generic quiz after every heading fragments reading, raises cognitive load, and encourages distractors that test wording.

**Elias:** A component should expose a variable, transition, constraint, comparison, or action relevant to the outcome. The question is not “is there a widget?” but “what learner behavior does this artifact make observable?”

**Noor:** The detector should classify artifacts by purpose and permit an intentional prose-only decision with a reason. The panel should never create a quota that authors can satisfy without changing the learner’s reasoning.

### Proposal 4: have a second AI score the lesson

**Linh:** This is attractive because it scales. One agent writes; another agent grades against a detailed rubric.

**Ada:** It can help, but a judge is another measurement instrument. It inherits prompt sensitivity, preference for fluent prose, and the ability to reward visible rubric terms. It cannot be the sole authority.

**Sofia:** A judge that sees only the lesson cannot tell whether a task is solvable by a first reader, whether the solution was copied from preceding prose, or whether an accessibility issue makes the intended interaction unusable.

**Mira:** And a subject-matter judge can be confidently wrong. The best use is to generate challenge cases, point to unsupported claims, and propose disagreements for a human or independent expert to inspect.

**Ada:** External evidence supports this caution. The NCME page for the *Standards for Educational and Psychological Testing* describes the standards as guidance for valid score interpretations and explicitly notes technology issues in automated essay scoring. A 2024 study of LLM-as-a-Judge on student writing found that judgments on grammar and fluency were viewed as reasonable more often than judgments on more subjective criteria. That is not a reason to ban the tool; it is a reason to treat its output as review evidence, not as truth.

**Linh:** The judge must be tested on known adversarial cases, have its criteria versioned, and be allowed to return “insufficient evidence.” A model that always returns a score is a bad judge.

---

## Session 4 — Run the metric-bait experiment

**Jo:** Rowan, stop arguing from examples. Run the experiment.

**Rowan:** The new script is [`quality_probe.py`](quality_probe.py). It scans repository lessons for signals but labels them as signals. It also creates two synthetic fixtures in memory; they are not publishable course lessons.

The bad count gate is intentionally simple:

```python
return signals.words >= 1000 and signals.citation_markers >= 10 and signals.artifacts >= 3
```

The evidence contract asks for six traceable fields: an observable outcome, a transfer task, a counterexample or failure mode, diagnostic feedback or success criteria, a claim-to-source mapping, and a deliberate omission or scope boundary.

The command is:

```bash
python3 docs/agent-experiments/lesson-quality-panel/quality_probe.py --check
```

The output is:

```text
Repository evidence probe (signals, not a quality score)
lessons scanned: 644
smoke statuses in course-quality.json: {'failed': 11, 'passed': 22}
explicit outcome language: 68/644
explicit prerequisites: 22/644
transfer signal: 117/644
counterexample/failure signal: 72/644
diagnostic feedback/rubric signal: 129/644
deliberate omission/scope signal: 64/644
duplicate references heading: 30/644
largest lessons by words (triage only):
  src/content/lessons/algorithms/algorithms-assessment.mdx: words=5916, headings=47, artifacts=7, urls=4
  src/content/lessons/algorithms/dynamic-programming.mdx: words=5874, headings=16, artifacts=10, urls=1
  src/content/lessons/algorithms/proof-workshop.mdx: words=5628, headings=22, artifacts=7, urls=2
  src/content/lessons/algorithms/np-completeness.mdx: words=5313, headings=25, artifacts=10, urls=1
  src/content/lessons/data-structures/arrays-and-linked-lists.mdx: words=5167, headings=23, artifacts=8, urls=2

Synthetic adversarial experiment
metric-bait: words=1505, citation-markers=10, artifacts=3, count-gate=PASS, evidence-contract=FAIL
  expected failure: evidence fields missing = outcome, transfer_task, counterexample, diagnostic_feedback, claim_source, omission
evidence-first: words=175, citation-markers=2, artifacts=0, count-gate=FAIL, evidence-contract=PASS
  expected failure: count gate rejects a short but traceable lesson

Conclusion: counts may prioritize inspection; only traceable evidence can support a quality decision.
```

**Linh:** The first fixture is the agent we are trying to stop. It is not “bad” because it is short on a hidden aesthetic dimension; it fails every field that would make its teaching inspectable. It passes the visible quota.

**Elias:** The second fixture is not automatically a good lesson either. It passes a minimal evidence contract, not a subject review. That distinction is crucial. We have demonstrated a necessary separation, not manufactured a universal score.

**Ada:** This is the first solution checkpoint:

> A metric gate is disqualified if an intentionally content-free fixture can pass it, or if an intentionally traceable fixture can fail it solely because it is concise.

The count gate fails both tests. The evidence contract survives this narrow test because it asks for relationships and learner actions rather than volume.

**Noor:** Notice another result: only 68 of 644 lessons contain explicit outcome language according to this crude lexical probe. That does not prove 576 lessons have no outcomes. It proves the repository has little machine-readable evidence that outcomes are stated. The correct response is to inspect samples and introduce a handoff format, not to make authors insert the words “learning outcomes” everywhere.

**Mira:** And only 72 contain an explicit counterexample/failure signal. Again, the lexical count is not a quality score. It tells us where a reviewer may look for missing boundaries. A lesson can teach a counterexample without using that exact label, and a bad lesson can use the label decoratively.

**Sofia:** The experiment also makes a user-facing point: a learner does not experience word count, citation count, or component count. A learner experiences whether they can predict, explain, construct, repair, compare, and recover from an error.

---
---

## Session 5 — Build the replacement: the Lesson Evidence Packet

**Jo:** The panel must now specify the object that replaces the numeric verdict.

**Ada:** Call it a **Lesson Evidence Packet**, or LEP. It is not a scorecard. It is a small, reviewable bundle that makes a quality argument inspectable. Every field has one of four states:

- **Evidence** — a reviewer can point to the lesson or an attached artifact.
- **Defect** — the expected evidence is missing or contradicted.
- **Not applicable** — the document type makes the field irrelevant, with a written reason.
- **Unresolved** — reviewers disagree or the evidence is too weak to decide.

There is no total score. A lesson is publishable only when all required fields are Evidence or justified Not applicable, and no Critical Defect or Unresolved item remains. The packet records mechanical checks separately.

### Card A — learner contract

**Elias:** State between one and three observable outcomes. Avoid “understand,” “know,” and “be familiar with” unless the packet immediately defines what the learner must do. Each outcome needs:

```text
Outcome O1:
  Given:
  Learner action:
  Constraints:
  Acceptable evidence:
  Likely misconception:
```

For example, “understand serializability” is weak. “Given an interleaved schedule, construct the precedence graph, state whether it is conflict-serializable, and give a topological serial order or a cycle witness” is observable. It also tells the author what not to fill with generic history.

Record prerequisites and audience. A contributor gallery and a learner lesson may use the same components but have different contracts.

### Card B — scope and curriculum crosswalk

**Noor:** Course-scale work needs the existing curriculum crosswalk: universal material, institution-dependent material, advanced extensions, and deliberate omissions. At lesson scale, state why the topic earns space, what is deferred, and which prerequisite relationship matters.

The omission is a quality feature when it is honest. “This lesson mentions distributed consensus but does not teach quorum failure; the claim is deferred to the systems module” is better than a paragraph of names that a learner cannot use.

### Card C — claim and source ledger

**Mira:** Replace “ten citations” with claim-level provenance for material claims. The minimum fields are:

| Field | Meaning |
| --- | --- |
| Claim ID | Stable identifier used in review comments. |
| Claim | The smallest material proposition worth checking. |
| Location | Heading or line range in the lesson. |
| Type | Definition, theorem, empirical fact, implementation behavior, historical claim, example, or original synthesis. |
| Source | Verified primary or authoritative source. |
| Support | What the source actually supports; not merely a URL. |
| Boundary | Version, assumptions, population, engine, or unresolved dispute. |
| Status | Verified, needs subject review, contested, or removed. |

Do not require a ledger row for every sentence. Require it for the claims on which the learner’s reasoning depends. An original worked example should be labeled as an example and checked for correctness; it should not receive a decorative citation.

**Ada:** This is also where “citation count” becomes actively dangerous. Ten sources can create false confidence if no one checks entailment. A single source can be adequate if it is authoritative and supports the narrow claim. The release evidence is the mapping, not the cardinality.

### Card D — teaching trace

**Elias:** For each major concept, make the causal teaching path visible, even if the published lesson presents it naturally:

```text
problem or tension
  → attempted solution and obstacle
  → mechanism or invariant
  → formal statement / derivation / proof
  → worked example 1
  → substantially different example 2
  → counterexample or boundary failure
  → connection to prerequisite and next use
```

The examples must differ in the reasoning they demand. Renaming variables is not a second example. A counterexample should attack the assumption that makes the method work, not merely be a random wrong input.

**Mira:** In an algorithms lesson, “Dijkstra on another positive graph” is not enough after the happy path. The negative-edge graph tests the nonnegativity assumption. In a database lesson, “another lost update” is not enough if the learning outcome concerns predicate invariants; write skew tests a different conflict boundary.

### Card E — assessment and feedback trace

**Ada:** For every outcome, identify at least one task that cannot be answered by copying a nearby sentence. The packet records:

```text
Outcome O1 → Task T1
Task type: recall / application / transfer / synthesis
Novelty: what changes from the worked example
Expected response: what must be present
Diagnostic errors: what different wrong answers mean
Solution or grading criteria: enough for independent checking
```

“Quiz exists” is not an assessment trace. A multiple-choice item can be appropriate for a misconception, but the packet must state which misconception and why its distractors represent real alternatives. A code exercise must make the learner supply a meaningful decision, not merely fill a token that the preceding line reveals.

**Sofia:** Include print and screen behavior when the task relies on an interaction. A learner who cannot access the state change needs an equivalent static prompt or an explicit alternative. Accessibility is not a cosmetic card; it affects whether the response is observable.

### Card F — adversarial challenge set

**Linh:** This is the card that prevents the packet from becoming another optimistic checklist. For each lesson, generate a small challenge set independent of the author’s happy-path examples:

1. **Assumption mutation:** change one assumption and ask whether the method still applies.
2. **Counterexample search:** ask for a smallest failing input or schedule.
3. **Direction test:** reverse an implication, reduction, or causal statement.
4. **Boundary test:** exercise an empty, maximum, negative, concurrent, version-specific, or malformed case as relevant.
5. **Source attack:** remove one citation and ask which claim is now unsupported; replace a source with a plausible but non-entailing source.
6. **Copy test:** write an answer that repeats the lesson but does not solve the new instance; verify that the rubric rejects it.
7. **Representation test:** inspect whether a diagram, code block, table, or interactive state is legible and semantically labeled.

The author may see the general challenge families; a rotating concrete instance should not be hand-tuned to the draft. Since LibreUni is public, “hidden” cannot mean secret forever. It means held out from the generation prompt, versioned separately from the draft, and rotated so the system cannot overfit one fixture.

### Card G — independent review record

**Noor:** Record role-separated reviews: subject correctness, learning design, source entailment, learner/accessibility, and mechanical rendering. One person may perform several roles in a small change, but the packet should still show which question each pass answered.

For disagreement, record the competing claims and resolution. “Agent scored 8/10” is not a handoff. “Reviewer A says the term is implementation-specific; reviewer B found a versioned official source; we narrowed the sentence and added the version boundary” is a handoff.

**Ada:** The record should allow “unresolved.” Forced consensus is another metric trap. A truthful unresolved claim is safer than a false clean bill.

---

## Session 6 — Does the packet merely add paperwork?

**Jo:** The obvious objection is that an evidence packet could become a new bureaucratic quota. Break it.

**Linh:** I can create six headings named Outcome, Transfer Task, Counterexample, Rubric, Source Map, and Omitted. Then I can put generic sentences under each. The parser would pass. We need a second experiment.

**Ada:** Correct. The packet must not be accepted by heading presence. It requires *referential integrity*:

- Every outcome ID appears in at least one task row.
- Every task states a concrete input or situation, not only an action verb.
- The transfer task changes surface conditions while preserving the underlying concept.
- The expected response contains at least one observable criterion.
- The counterexample names the assumption it breaks.
- Every claim row points to a location and a source support statement.
- The omission names the missing depth and where it is deferred, if applicable.

The small script can check the shape. Only a subject and learning review can judge the semantics.

**Mira:** Add an adversarial requirement: for each packet field, the reviewer writes one plausible fake completion and explains why it would fail. For example:

```text
Fake counterexample: “Dijkstra is slower on a large graph.”
Why it fails: it does not violate the nonnegative-edge assumption and does not
show an incorrect result; it tests performance, not correctness.
```

This is more educational than telling an agent to “include a counterexample.”

**Elias:** The packet can also be generated after the lesson, not only before it. If the author cannot reconstruct the learning trace from the finished prose, the lesson may be a pile of sections rather than a designed experience. A pre-draft outcome/task pair and a post-draft evidence packet create a bidirectional check.

**Sofia:** Keep the packet concise. The lesson should teach the learner; the packet should let a reviewer inspect the design. It is not a second lesson and must not leak private prompts or transcripts. The repository’s durable-context rules forbid storing ordinary prompt transcripts; this experiment stores only stable method decisions and evidence summaries.

**Rowan:** Mechanically, put the packet beside a substantial revision or in a review report, not in every lesson’s frontmatter by default. A giant mandatory frontmatter schema would create parsing friction and invite empty fields. We can introduce a small template for future work and only promote stable fields to tooling once real reviews show they are useful.

**Noor:** That is important: do not create a new schema before the review method is tested. We can use Markdown tables in the experiment, then automate only the invariants that survived the panel.

---

## Session 7 — Stress-test the citation problem specifically

**Jo:** The user’s first example is ten bad citations. Give it a direct treatment.

**Mira:** Consider a paragraph that says, “PostgreSQL treats Read Uncommitted as Read Committed, Read Committed uses a statement snapshot, Repeatable Read uses a transaction snapshot, and Serializable detects dangerous structures.” One official PostgreSQL page may support much of that, but the claims have different boundaries and must be checked against the target version. A single link at the end is not enough if the paragraph also claims a behavior for every database engine.

**Ada:** The ledger would split it:

| Claim | Source support | Required qualification |
| --- | --- | --- |
| PostgreSQL’s documented isolation behavior | Official PostgreSQL transaction-isolation documentation | Version and engine specific. |
| “MVCC” alone does not determine lost-update behavior | Original synthesis from the lesson’s trace reasoning | Must be justified with a concrete API or implementation example; do not present as a universal vendor claim. |
| A predicate invariant may require more than row-local locks | Database theory source plus worked schedule | State the invariant and conflict boundary. |

The ledger exposes which sentences are sourced facts and which are the author’s synthesis.

**Linh:** Attack the ledger with a plausible source. Give the agent a real page about isolation levels, but one that discusses a different DBMS. Ask it to attach the page to a PostgreSQL-specific sentence. A URL validator passes; a claim reviewer rejects the entailment. This is why HTTP 200 is not source verification.

**Rowan:** The existing `verify_lessons.py --check-links` can tell us whether links resolve, subject to network and site behavior. It cannot tell us whether the source supports the exact claim. That command belongs in the mechanical/source-availability layer, not the claim-accuracy layer.

**Mira:** Also reject citation theater in the lesson itself. `transactions-and-isolation.mdx` has one References section at lines 85–89, then an extra exercise at line 91, then a second References section at lines 93–95. A reference count sees four URLs and can even count both headings as evidence. A human sees a structural repair candidate: the exercise is detached from the explanation, and the bibliography is duplicated. A claim ledger would make the bibliography serve the claims rather than act as a tail appended by a generator.

**Noor:** The placement is a symptom of process. If references are appended after drafting as a quota, they become decorative. If claims are identified before or during teaching design, sources shape what can honestly be said.

**Ada:** We should not require a source for a learner-created answer or a purely original toy example, but we should require the packet to label it. “Original example” is not a loophole; it means the author assumes responsibility for correctness and relevance.

---

## Session 8 — Stress-test the word-count problem specifically

**Jo:** Now lorem ipsum.

**Noor:** The cure is not a better detector for lorem ipsum. A detector can find obvious filler, but an agent can write grammatically fluent filler with correct terminology. The anti-fluff question is: what decision, derivation, or learner action does each paragraph make possible?

**Elias:** A paragraph earns its place if removing it breaks one of these:

- the motivation for the method;
- the definition or assumption;
- the reasoning that connects premise to conclusion;
- the worked example’s transfer value;
- the counterexample or failure boundary;
- the learner’s ability to attempt or diagnose the task;
- the source or scope qualification.

This is a deletion test, not a word target. It still needs judgment, but it aligns effort with learning.

**Mira:** Use compression in the right direction. If two paragraphs state the same invariant, combine them. If one missing line makes a proof invalid, add that line even if the lesson grows. Length is an outcome of the argument, not an input quota.

**Linh:** An adversarial agent can try to satisfy the deletion test with a chain of trivial dependencies. So the reviewer should sample paragraphs and ask, “What would a learner be able to do after this that they could not do before?” If the answer is “recognize another term,” that is weak unless vocabulary itself is the outcome.

**Sofia:** The first-reader review is essential. A subject expert can infer omitted steps. A learner cannot. The reviewer should attempt the transfer task with only the lesson and stated prerequisites. Any external lookup needed to understand the task is a defect or an explicit prerequisite.

**Ada:** This aligns with the National Academies’ *How People Learn II*: technology decisions should be aligned with the type of learning and goals, and ongoing assessment of learning and implementation is needed to identify improvements. The panel is not claiming that a word count has no correlation with quality; it is saying the correlation is not a valid release argument.

---
## Session 9 — Stress-test the AI judge

**Jo:** If we use agentic AI in this workflow, how do we prevent “judge says good” from becoming the next quota?

**Linh:** Separate roles and inputs:

1. The authoring agent receives the curriculum outcome, source pack, and authoring surface.
2. The structural agent extracts claims, outcomes, tasks, and artifacts without awarding a quality score.
3. The red-team agent attempts to break assumptions, citations, examples, and rubrics.
4. The subject reviewer resolves factual and formal disputes.
5. The learning reviewer attempts the transfer tasks as a first reader.
6. The build pipeline checks rendering and executable fragments.

The agents must not share a single self-congratulatory summary. The red-team input should include the draft and the contract but should not be given the author’s preferred answers as a prompt hint.

**Ada:** Use pairwise or categorical judgments only when the decision is well specified. Do not ask a model for “overall quality 0–100.” A global score hides which proposition failed and encourages score optimization. Ask: “Does this task require transfer? Quote the input change and the criterion. If insufficient evidence, return insufficient evidence.”

**Mira:** Require evidence spans. An agent that cannot point to the paragraph, proof step, source support, or task criterion is not making an auditable judgment.

**Sofia:** Require an accessible rendering or a text alternative when the judgment depends on a visual. A model looking at MDX source can miss that an SVG label is illegible on mobile or that a code exercise gives away the answer in its comment.

**Rowan:** Run the same judge against the synthetic metric-bait fixture. If it praises the fixture because it sees “references,” “quiz,” and “long explanation,” it fails the calibration test. Run it against a concise evidence-first fixture. If it penalizes it for being short despite traceable transfer criteria, it fails the anti-length test.

**Ada:** The educational measurement principle is simple: the proposed interpretation needs supporting evidence and known limitations. The NCME/AERA/APA standards are useful here not because LibreUni is administering a high-stakes exam, but because they provide the right habit: distinguish the observed response from the interpretation we want to make about it.

**Linh:** Also no private chain-of-thought storage. The useful artifact is the decision, evidence span, uncertainty, and challenge result. The repository should not store hidden reasoning transcripts as if they were durable evidence.

---

## Session 10 — Turn the packet into an operating loop

**Jo:** We have a packet. Show how an agent would actually use it without making the process impossible.

**Rowan:** The proposed loop has six passes, each with a different failure mode.

### Pass 0: choose the document contract

Record course/module/lesson/assessment/lab/showcase, intended audience, prerequisites, and the one to three outcomes. If the work is course-scale, attach the curriculum crosswalk required by `COURSE_STANDARD.md`.

### Pass 1: evidence-first design

Write the transfer task and success criteria before drafting the explanation. Identify the motivating problem, the central mechanism, the counterexample, and the deliberate omission. Select the representation—prose, proof, diagram, runner, quiz, case study, or exercise—by the learner action it supports.

### Pass 2: sourced draft

Draft by hand in the repository surface. Maintain claim IDs for material claims. Use a small number of authoritative sources and record exact support and boundaries. Do not add a reference merely to reach a number.

### Pass 3: independent red team

Ask a separate agent or reviewer to mutate assumptions, reverse implications, create a smallest counterexample, inspect the source entailment, and attempt the transfer task from the stated prerequisites. The authoring agent may receive defects, not a single scalar score.

### Pass 4: review and repair

The subject reviewer checks correctness and scope. The learning reviewer checks that examples, task, solution, and feedback expose the intended reasoning. The learner/accessibility reviewer checks clarity, cognitive load, responsive behavior, and alternatives for interaction. Unresolved disagreements remain visible.

### Pass 5: mechanical release evidence

Run the narrowest useful checks: lesson verifier, course smoke test, integrity audit, build/render checks, and relevant browser/visual checks. Report these separately from pedagogical judgments. A mechanical failure blocks release as a broken artifact; a mechanical pass does not certify learning.

**Noor:** The loop is intentionally asymmetric. We spend more review effort on the outcome, transfer task, and source ledger than on counts because those are the claims that matter. Counts still help triage: a 5,916-word lesson with 47 headings deserves inspection, but it does not deserve either automatic praise or automatic rejection.

**Elias:** It also supports incremental repair. A lesson can begin with a narrow outcome and one strong transfer task. Expanding scope requires expanding evidence. That is safer than asking an agent to make a lesson “more comprehensive.”

**Mira:** And it respects the existing course standard. The packet does not lower the upper-division bar. It makes the bar reviewable.

---

## Session 11 — A concrete packet for one repository lesson

**Jo:** Produce a miniature packet for `transaction-trace-lab.mdx`, not an abstract template.

**Elias:** Here is a compressed version based on the actual lesson’s protocol:

```text
Document type: laboratory lesson
Audience: database-systems learner with transaction and SQL prerequisites

Outcome O1:
  Given a two- or three-session history, annotate operations, identify the
  first invariant violation, and distinguish logical commit from durable commit.

Outcome O1 evidence:
  Task T1 requires a hand trace with operation, session state, locks/snapshots,
  visible state, and explanation columns.

Transfer variant:
  Replace the two-doctor write-skew example with a three-nurse staffing
  invariant and require the learner to state whether a row lock protects it.

Counterexample:
  Two sessions read the same predicate and update disjoint rows; both writes
  are locally valid but the set invariant fails.

Diagnostic criteria:
  A response that names only an isolation label has not identified the
  visibility rule. A response that says “the test passed” without a barrier
  has not established that the schedule occurred. A response that repairs
  the row but not the predicate has protected the wrong resource.

Claim C1:
  The lesson's distinction between a database commit, a WAL durability point,
  and an external side effect must be checked against the selected DBMS and
  failure model. Source: the visible references and the target engine docs.

Scope boundary:
  Exact lock modes and retry error codes are deferred until a target DBMS is
  selected; the lesson explicitly tells the learner to name the engine.
```

**Mira:** The packet reveals a source improvement: “PostgreSQL” appears in the lesson’s references and examples, but the protocol is written as a general database lesson. Claims need a label—general theory, common implementation, or PostgreSQL behavior.

**Rowan:** The packet also reveals that the existing lesson has no explicit omission signal according to the lexical probe, although its text has scope instructions. This is a perfect case for a semantic review rather than a blind parser repair. We can add a concise scope boundary if the author agrees; we should not inject the phrase “deliberately omitted” to make a count pass.

**Sofia:** The transfer task should have a static version in the PDF. The lab already says not to use a script as a substitute for a hand trace. That is good screen/book coherence: the executable experiment supports evidence, while the reasoning product remains visible without a browser.

**Ada:** The packet does not say “quality = 8.2.” It says what a reviewer can check. That makes a disagreement actionable.

---

## Session 12 — The panel tries to game its own solution

**Jo:** We have been suspicious of authors. Now be suspicious of the panel’s solution.

**Linh:** Attack one: require every packet field, and an agent writes fluent boilerplate. Countermeasure: challenge-set referential integrity and evidence spans. A transfer task must contain a concrete changed situation and a criterion. “Apply the concept to a new problem” fails.

**Noor:** Attack two: require one to three outcomes, and an agent writes outcomes so vague that any answer passes. Countermeasure: the reviewer must write a plausible learner response and a plausible wrong response. If the rubric cannot distinguish them, the outcome is not operational.

**Mira:** Attack three: source ledger with ten rows, but all rows are trivial definitions. Countermeasure: identify the claims that carry the proof, algorithm choice, implementation behavior, or boundary. A ledger is complete only relative to the lesson’s reasoning, not row count.

**Ada:** Attack four: adversarial tests become predictable. Countermeasure: rotate concrete instances and require a held-out challenge. The panel’s public protocol is visible, but the exact numbers, graph, schedule, or code input can vary. The review must also include human-created cases because agent-generated cases can share the draft’s blind spots.

**Sofia:** Attack five: a beautiful transfer task is inaccessible or impossible from the stated prerequisites. Countermeasure: first-reader attempt and accessibility rendering review. The task is evidence only if a learner can understand what is being asked and has the representations needed to respond.

**Rowan:** Attack six: the build pipeline is clean because a code runner simply displays declared output rather than executing the language. Countermeasure: record what each check actually does. A displayed output is not runtime evidence. If a component is intentionally illustrative, label it as such; if execution is part of the outcome, run it in a real supported environment and validate the result.

**Elias:** Attack seven: the reviewer starts grading style instead of learning. Countermeasure: ask the reviewer to begin with the outcome and transfer task. Style findings are relevant when they impair comprehension or hide reasoning, not because an agent dislikes a sentence.

**Ada:** Attack eight: we convert the packet to a dashboard with green, yellow, and red percentages. Countermeasure: forbid aggregation into a quality score. A dashboard may show “missing claim locations” or “unresolved transfer tasks” as workflow status, but it must preserve the underlying evidence and cannot rank lessons as good or bad by total.

**Jo:** Does the packet survive?

**Linh:** It survives the attacks only if we preserve the human judgment and challenge evidence. The parser is a guardrail, not the judge.

---

## Session 13 — What should be automated, and what must remain judgment?

**Rowan:** I propose three automation tiers.

| Tier | Automate | Do not infer |
| --- | --- | --- |
| A — broken artifact | MDX syntax, supported props, missing tools, code parse/runtime checks, link shape, duplicate heading patterns, render failures | That the explanation is correct or the exercise is useful |
| B — evidence extraction | Locate headings, outcome/task labels, claim IDs, source URLs, artifact locations, repeated prose, references, and packet cross-links | That a located artifact satisfies the outcome |
| C — adversarial assistance | Generate assumption mutations, counterexample candidates, source-entailment questions, and first-reader prompts | That a model’s preferred answer is correct without independent review |

**Ada:** Add a provenance field to every automated output: tool version, command, input revision, and whether the result is deterministic. A check without a scope statement becomes folklore.

**Mira:** Add a “not tested” result. If no target database is configured, the protocol cannot claim engine behavior. If a diagram was not rendered on mobile, the visual review is not complete. Absence of evidence must not be rendered as green.

**Noor:** And add suppression reasons. A prose-only proof may have no code artifact because code would distract from the proof. That is acceptable if the packet names the proof as the teaching artifact and gives a transfer task. Suppressing a finding without a pedagogical reason is not acceptable.

**Sofia:** The same for interactive elements. If a `Quiz` is omitted, say what better representation serves the outcome. If a diagram is omitted, say why prose or a table is clearer. This mirrors the repository’s existing authoring-surface audit, but shifts it from feature presence to representation purpose.

**Linh:** The automation should never rewrite a lesson to satisfy a finding. The repository rules already forbid mass-rewriting lessons and fake source tracking. The agent can open a review item, propose a change, or repair a file with explicit scope; it cannot manufacture evidence.

---
## Session 14 — Connect the solution to learning evidence, not just software process

**Jo:** We have a software-quality workflow. Why should anyone believe it addresses learning rather than documentation hygiene?

**Elias:** Because the central unit is learner performance on an unfamiliar task. The *How People Learn II* report distinguishes learning goals, learner characteristics, context, and support when evaluating technology; its chapter on digital technology emphasizes transfer, open-ended input, linked representations, feedback, and ongoing assessment. The panel’s packet operationalizes those ideas without claiming that a repository scan can measure learning by itself.

The report also warns against assuming that a technology is effective outside the situation in which evidence was gathered. That is directly relevant to agentic authoring. A prompt that yields good examples in algorithms does not prove it yields good examples in C, philosophy, or a database engine with different semantics. The course-level reviewer must sample every module and inspect the actual domain reasoning.

**Ada:** Measurement language keeps us honest. We observe a response to a task. We then make an interpretation: “the learner can apply the invariant.” The interpretation needs evidence. One correct multiple-choice answer is weak evidence for a proof-writing outcome. A transfer response with a rubric is stronger, but still not a guarantee for every future problem. That is why the packet includes multiple task types and periodic learner pilots.

**Mira:** A pilot is not required before every single line change, but it is necessary for a new lesson pattern, a major course revision, and a sample of repaired lessons. A subject expert can validate truth; only learner evidence can reveal whether the explanation is usable.

**Sofia:** Include a read-aloud or first-reader session where the reviewer is not allowed to ask the author what a sentence means. Confusion is evidence. If an assumption is only obvious to the author, the lesson has an implicit prerequisite or missing explanation.

**Linh:** And let the learner or reviewer submit uncertainty, not only answers. “I can reproduce the example but do not know which condition matters” is exactly the failure mode that a quantitative checklist cannot see.

---

## Session 15 — Final resolution

**Jo:** State the resolution as if we had to adopt it tomorrow.

**Ada:** Adopt this rule:

> LibreUni does not certify a lesson by its size, source count, heading count, component count, or automated score. It certifies a revision only when a reviewer can inspect the evidence connecting an observable learner outcome to source-backed teaching, an independent transfer task, diagnostic criteria, scope boundaries, and adversarial challenge results, while mechanical checks are reported as a separate layer.

**Mira:** Add subject correctness and claim entailment. A task can be beautifully designed around a false theorem.

**Elias:** Add the first-reader condition. The learner must be able to attempt the task from the stated prerequisites.

**Noor:** Add scope. A lesson may be excellent because it deliberately omits material; it is not excellent because it names everything.

**Linh:** Add anti-overfitting. Challenge instances rotate, and a judge must return insufficient evidence when it cannot support a claim.

**Rowan:** Add reproducibility. The packet names commands, tool versions where relevant, input revision, and the exact limits of each check.

**Sofia:** Add accessible equivalence for interaction and visual representations.

**Jo:** Then the final contract is:

### Release contract

1. **Contract chosen:** document type, audience, prerequisites, outcomes, scope, and curriculum relation are stated.
2. **Teaching trace present:** problem, mechanism, examples, failure boundary, and connections are evidenced at the appropriate scale.
3. **Assessment trace present:** every outcome maps to an independent task with expected evidence and diagnostic feedback or grading criteria.
4. **Claim ledger present:** material claims have verified, appropriate source support and explicit boundaries; original synthesis is labeled.
5. **Adversarial set attempted:** assumption mutation, counterexample, direction, boundary, copy, source, and representation attacks are run as applicable.
6. **Independent review complete:** subject, learning, source, learner/accessibility, and mechanical questions are answered, with disagreements recorded.
7. **Mechanical checks complete:** verifier, smoke, integrity, build, and visual/browser checks are reported according to the affected surface.
8. **No aggregation:** no total score or green percentage may substitute for the packet. A missing critical card blocks release; a justified Not applicable is visible; an unresolved item remains unresolved.

**Ada:** This is solved at the architecture level because we have removed the false target and replaced it with an evidence argument that can be attacked. It is not solved at the content level: 644 existing lessons still require review and repair.

**Jo:** That distinction must stay in the record. The panel has solved the verification design problem, not magically verified every course.

---

## The operating template the panel leaves behind

The following is intentionally a compact review template. It is not a lesson quota and should not be pasted into every file merely to make a parser happy.

```markdown
# Review evidence: <document>

Document type: lesson | lab | assessment | showcase | other
Audience and prerequisites:
Scope boundary and curriculum relation:

## Outcome-to-task map

| ID | Observable outcome | Transfer task | Expected evidence | Diagnostic failure |
| --- | --- | --- | --- | --- |
| O1 | ... | ... | ... | ... |

## Claim ledger

| ID | Claim and location | Type | Source and exact support | Boundary | Status |
| --- | --- | --- | --- | --- | --- |
| C1 | ... | ... | ... | ... | ... |

## Teaching trace

- Motivating problem:
- Mechanism / derivation / proof:
- Worked example A:
- Worked example B:
- Counterexample or failure boundary:
- Connection to prerequisites and later use:
- Deliberately omitted:

## Adversarial review

| Challenge | Instance | Result | Evidence span | Repair or reason not applicable |
| --- | --- | --- | --- | --- |
| assumption mutation | ... | ... | ... | ... |
| counterexample | ... | ... | ... | ... |
| direction test | ... | ... | ... | ... |
| boundary test | ... | ... | ... | ... |
| copy test | ... | ... | ... | ... |
| source attack | ... | ... | ... | ... |
| representation/accessibility | ... | ... | ... | ... |

## Review record

- Subject correctness:
- Learning design and first-reader attempt:
- Source entailment:
- Learner/accessibility:
- Mechanical commands and outputs:
- Unresolved disagreements:
```

The empty cells are not “passes.” They are review work remaining.

---

## What changes in agent instructions

The panel would change the agent workflow in these ways.

### Prompts stop asking for proxies as goals

Bad instruction:

```text
Write 1,000 words, include 10 citations, add two quizzes, and finish with a references section.
```

Better instruction:

```text
Before drafting, state the one to three outcomes and an unseen task that would
demonstrate each. Draft only the explanation needed to make those tasks
solvable. Track material claims with source support and boundaries. Include a
counterexample that attacks the central assumption. After drafting, create a
separate evidence packet and try to break it with an assumption mutation,
source-entailment check, and copy-resistant transfer task. Return unresolved
questions instead of filling gaps with generic prose.
```

The second prompt can still produce bad content. Its advantage is that the failure is more visible and more actionable.

### Agents cannot self-certify

The authoring pass and adversarial pass must be separate calls or separate roles with separate outputs. The author may propose repairs after the red-team report, but a revised claim must be rechecked. The process should keep the original defect and its repair evidence; otherwise the system forgets how the content failed.

### Agents must report evidence, not confidence

Required handoff language:

```text
Mechanical: <commands and actual results>
Pedagogical evidence: <outcome/task/trace findings>
Source evidence: <claim rows and unresolved boundaries>
Adversarial result: <challenge instances and failures>
Remaining risk: <what was not tested>
```

Forbidden handoff language:

```text
This lesson is high quality because it has 2,000 words, 12 sources, and 5 quizzes.
```

---

## Sources and repository evidence

The external sources below support the panel’s measurement and learning-design framing. They do not certify LibreUni’s lessons and are not being used as a citation quota.

- [National Academies of Sciences, Engineering, and Medicine, *How People Learn II: Learners, Contexts, and Cultures*, Chapter 8](https://www.nationalacademies.org/read/24783/chapter/10). The chapter discusses alignment among learning goals, learners, context, and technology, and the need for ongoing assessment and implementation evaluation.
- [National Academies, *How People Learn II* consensus-study highlights](https://nap.nationalacademies.org/resource/24783/How%20People%20Learn%202.pdf). The highlights state that assessing learning is central and that technology use should be aligned with learning goals and evaluated over time.
- [NCME, *Standards for Educational and Psychological Testing*](https://ncme.org/resources/books/testing-standards/). The standards are a joint AERA/APA/NCME reference for interpreting testing evidence and include technology-related assessment concerns.
- [Seungyoon Kim and Seungone Kim, “Can Language Models Evaluate Human Written Text?”](https://arxiv.org/abs/2407.17022). This study examines LLM-as-a-Judge on student writing and reports that judgment quality varies by criterion, which supports using model judgments as bounded evidence rather than an unexamined final score.

Repository evidence cited in the discussion:

- [`docs/agent-rules/GENERAL.md`](../../../docs/agent-rules/GENERAL.md) — repository layout, the stated non-pedagogical scope of the existing scripts, authoring rules, and validation caveat.
- [`docs/agent-rules/COURSE_STANDARD.md`](../../../docs/agent-rules/COURSE_STANDARD.md) — the learning contract, transfer requirement, source obligation, deliberate omissions, and adversarial self-review.
- [`docs/agent-rules/COURSE_INTEGRITY.md`](../../../docs/agent-rules/COURSE_INTEGRITY.md) — the distinction between mechanical smoke tests, integrity findings, and pedagogical judgment.
- [`scripts/course_stats.py`](../../../scripts/course_stats.py) — current inventory and executable smoke-test implementation.
- [`scripts/course_integrity.py`](../../../scripts/course_integrity.py) — current anomaly and heading-artifact implementation.
- [`scripts/verify_lessons.py`](../../../scripts/verify_lessons.py) — current lesson audit behavior.
- [`src/content/lessons/algorithms/np-completeness.mdx`](../../../src/content/lessons/algorithms/np-completeness.mdx) — dense formal lesson used as an exhibit.
- [`src/content/lessons/algorithms/shortest-paths.mdx`](../../../src/content/lessons/algorithms/shortest-paths.mdx) — proof, example, code, and failure-mode exhibit.
- [`src/content/lessons/database-systems/transaction-trace-lab.mdx`](../../../src/content/lessons/database-systems/transaction-trace-lab.mdx) — evidence-oriented laboratory protocol exhibit.
- [`src/content/lessons/database-systems/transactions-and-isolation.mdx`](../../../src/content/lessons/database-systems/transactions-and-isolation.mdx) — duplicated-reference and exercise-placement exhibit.
- [`src/content/lessons/libreuni/authoring-showcase.mdx`](../../../src/content/lessons/libreuni/authoring-showcase.mdx) — contributor-gallery document-type exhibit.
- [`src/content/lessons/c/arrays.mdx`](../../../src/content/lessons/c/arrays.mdx) — concise but unsourced and boundary-sensitive exhibit.
- [`quality_probe.py`](quality_probe.py) — the reproducible signal inventory and adversarial synthetic experiment created for this panel.

## Final moderator note

The panel did not conclude that automation is useless. It concluded that automation must be assigned the questions it can answer:

- Is the artifact syntactically and mechanically usable?
- Is a source reachable and is a claim row present?
- Is there a declared learner action and a linked task?
- Does a challenge instance expose a missing assumption or copied answer?
- Can a reviewer locate the evidence and uncertainty?

It must not be assigned the question “How good is this lesson?” as a single scalar and then allowed to optimize against that scalar. The repository now has a concrete experiment showing why. The next work is substantive, file-by-file course repair under the evidence contract, with the current mechanical gates preserved and their meaning kept honest.

---

## The board reconvenes — how to let agents work for days without losing the plot

**Jo:** The first panel solved the verification argument. The practical objection is harder: nobody wants to sit in front of the model for three days, manually paste context, and approve every sentence. How do we let agents keep working on the platform while preserving the quality contract?

**Rowan:** Do not make one conversation live for three days. Make the work durable. A scheduler starts short, bounded worker invocations. Each invocation claims one task, reads the current repository and its packet, performs one role, writes evidence, and exits. The next invocation resumes from the queue and state file.

**Linh:** That is the first important correction. “Autonomous for days” should mean *persistent state plus repeated bounded decisions*, not “unlimited permission in one context.” A long context creates its own failure mode: the agent forgets the initial contract, rationalizes its previous edits, and begins treating its own summary as source truth.

**Ada:** And a daily count of completed tasks is not the goal. The board must track leases, attempts, defects, and unresolved decisions. It may tell us that the system is stalled; it may not infer that more completed rows mean better education.

**Noor:** We need a queue with a small unit of work. “Improve algorithms” is not a task. “Review the transfer task and negative-weight boundary in `shortest-paths.mdx`, update its evidence packet, and run the narrow checks” is a task. A worker that can finish a unit in an hour can be safely restarted hundreds of times.

**Mira:** The unit should be concept-sized, not merely file-sized. One lesson can contain five independent concepts and one outcome can cross two files. The chair records the conceptual boundary and allowed files before an author agent edits anything.

### The board’s roles

**Jo:** Assemble the board. Which agents exist?

**Rowan:** The runbook records eight responsibilities:

| Role | Owns | Must not do |
| --- | --- | --- |
| Chair / planner | Queue, scope, dependencies, leases, stop conditions | Draft lesson prose or approve its own task |
| Source librarian | Claim ledger, source entailment, boundaries | Add links to satisfy a citation count |
| Author | Hand-edit lesson and packet within scope | Declare acceptance |
| Subject reviewer | Formal correctness, examples, assumptions, omissions | Treat fluent prose as proof |
| Adversary | Counterexamples, assumption mutations, copy tests, source attacks | Close its own defects |
| First-reader/accessibility reviewer | Solvability, feedback, mobile/PDF and interaction access | Ask the author to explain missing context during the test |
| Build/QA reviewer | Mechanical and rendering evidence | Convert a clean build into a pedagogical verdict |
| Registrar/release reviewer | Packet completeness, state transitions, human gate | Rewrite content to make the board green |

These can be different models, the same model with fresh contexts, or human roles. Independence is about the evidence and instruction boundary, not about buying eight models.

**Linh:** Fresh contexts matter. If the author gets to tell the adversary why a paragraph is correct before the adversary inspects it, the adversary has been recruited into the author’s framing. Feed the adversary the lesson, outcome, rubric, and challenge family. Let it discover the problem.

**Ada:** Fresh context does not mean no shared facts. The packet and source ledger are shared evidence. A private chain of thought is not evidence and should not be passed around as if it were.

**Sofia:** The first-reader role must have an actual learner-facing view, not only MDX source. If the task depends on a diagram, code runner, or disclosure, the reviewer needs the rendered form or an equivalent static representation. The board should be able to say “the logic is sound but the learner cannot find the state change.”

### The queue and the lease

**Jo:** What prevents two agents from editing the same lesson or one crashed worker from holding the queue forever?

**Rowan:** Each task receives an explicit lease. The state record includes task ID, owner, status, attempt number, heartbeat, files, last report, and next action. Only the chair can claim a queued task. A heartbeat expires after a fixed interval; a replacement worker first reads the last report and then reclaims the task. It never overwrites an active lease silently.

**Linh:** Test the failure case. Kill the author halfway through a repair. The replacement must see `status: drafted`, a changed file, and an incomplete packet. It must not conclude “the previous worker probably finished.” It must run the relevant checks and either continue or roll back through an explicitly authorized operation.

**Rowan:** The worktree also matters. A worker operates in an explicit branch or worktree. The branch name, task ID, and starting revision go into the report. There is no hidden staging directory where edits disappear from human review. A human integrator decides whether to merge or apply changes.

**Noor:** One active task is the safest pilot. Parallelism can come later for independent lessons, but a shared component, course rule, or validation script must have a dependency edge. “Agents work faster in parallel” is not a reason to create merge conflicts and contradictory pedagogical decisions.

### The first multi-day experiment

**Jo:** Run a thought experiment. It is Monday morning. What happens over the first three days?

**Rowan:** On Day 0, the chair creates three small tasks: transaction traces, shortest paths, and C arrays. It records outcomes and challenge families. The board also includes the authoring showcase as a document-type control, but the chair marks it `showcase`, not `learner-lesson`.

On Day 1, the source librarian maps claims for transaction traces. It finds that a sentence sounds universal while its evidence is PostgreSQL-specific. The task moves to `blocked` with a subject-review reason, not `drafted`, because narrowing the sentence changes the intended scope.

On Day 2, a subject reviewer resolves the boundary. The author revises the lesson and packet. The adversary generates a three-nurse write-skew case instead of repeating the two-doctor example. The first-reader fails: the task says “protect the invariant” but does not state whether a summary row exists. That is a real learner-facing defect, so the task returns to `repaired`.

On Day 3, the revised task is solvable. The build reviewer finds no new rendering errors, but the course already has unrelated smoke failures. The report says “new change passes focused checks; repository baseline remains X,” and the registrar moves it to `human-review`. The agent does not continue editing because its local evidence is complete but the release decision belongs to a human.

**Elias:** The important result is not that the task took three days. It is that the agents discovered different kinds of failure in sequence: source scope, conceptual transfer, task specification, and baseline infrastructure. A single “review score” would compress those into an unhelpful number.

**Mira:** The process also stops a common AI shortcut. The author cannot respond to a source dispute by adding another citation; it must either narrow the claim, find a source that entails it, or mark the issue unresolved.

### What a worker is told

**Linh:** The authoring prompt should be generated from the failing packet assertions, not from a generic demand for quality:

```text
Task: db-transaction-trace
Target: src/content/lessons/database-systems/transaction-trace-lab.mdx

Repair only these assertions:
1. The transfer task changes the surface case but does not yet specify the
   protected resource.
2. Claim C3 is written as a general database rule but the cited source is
   PostgreSQL-specific.
3. The diagnostic feedback reveals the correct answer but does not distinguish
   a row-conflict error from a predicate-conflict error.

Do not add length, citations, headings, or interactive components unless they
repair an assertion. Preserve the existing hand-trace protocol. Return:
changed files, changed claim rows, the revised transfer task, one adversarial
result, focused validation output, and remaining uncertainty.
```

**Noor:** This is what “AI works for days” should feel like. Each invocation has a reason to exist, a boundary, a stop condition, and an evidence product. It is not told to “keep improving until satisfied.” Satisfaction is not a reliable termination condition.

**Ada:** The board also needs a negative instruction: if no assertion can be improved with the available evidence, stop and ask the chair. An agent that must always make a change will manufacture work.

### What happens when the agents disagree

**Jo:** Suppose the subject agent says a claim is correct, the source agent says the source does not entail it, and the author wants to keep it. What does the board do?

**Mira:** It records the disagreement as an unresolved claim. The author may propose a narrower sentence, a second source, or a deliberate omission. It may not override the source reviewer by majority vote.

**Ada:** The registrar’s state is `blocked`, not `failed`. “Failed” suggests the system knows the answer. “Blocked” says a decision or evidence is missing. After the same blocker has recurred three times, the board stops retrying automatically and requests human direction.

**Linh:** This is another anti-loop rule. Without it, the author can make three increasingly elaborate paraphrases while the source problem remains. The model’s persistence becomes a liability.

**Sofia:** A learner disagreement is equally important. If three reviewers can solve the task but a first reader cannot tell what a word means, the board does not average them. It repairs the specification or adds the necessary prerequisite.

**Rowan:** Tool disagreement gets a different path. If the build fails because a language tool is missing, the QA agent reports an infrastructure blocker. It does not alter the lesson to avoid the check. The board may schedule a tooling task, but that is a different work unit.

### The board’s quantitative dashboard

**Jo:** The previous panel rejected a quality score. What numbers should a multi-day operation show?

**Ada:** Show operational facts by category:

| Dashboard fact | Valid interpretation | Invalid interpretation |
| --- | --- | --- |
| `12/15` tasks reached human review | The queue progressed through the review pipeline | The course improved by 80% |
| `4` unresolved critical claims | Four release blockers remain | The lesson is “60% good” |
| `7/9` adversarial cases passed | Two specified challenges still fail | The content quality is 78% |
| `3` repair loops on one task | The task is unstable or underspecified | The agent worked harder, so the lesson is better |
| `18/24` learners solved transfer task T2 | Evidence about one outcome in one context | The whole course has 75% quality |

**Elias:** Learner response rates are the closest thing to a quantitative learning measure, but they must remain outcome-specific. Report the task, population, prerequisites, rubric, attempt conditions, and error taxonomy. A learner success percentage without those details is another decorative number.

**Linh:** Never feed the aggregate dashboard back to the author as a reward. Give it the failing rows and anonymized error patterns. Otherwise it will learn to optimize the reporting surface.

### Stop conditions and recovery

**Jo:** Define the emergency brakes.

**Rowan:** The scheduler pauses new claims if:

- a worker has changed files outside its lease;
- a task has exceeded its repair limit;
- the same validation failure recurs without a relevant source change;
- an agent attempts to weaken a test, fabricate a citation, or erase a defect;
- a source or learner-data boundary is unclear;
- the board state is inconsistent or a lease is ambiguous;
- the operator invokes the kill switch.

The current task is preserved with its report. Another worker can inspect it later. The scheduler does not “helpfully” reset the task and erase evidence.

**Noor:** The correct response to an empty queue is also a stop. Do not give an agent an open-ended “find more improvements” task. The chair creates a new bounded queue after reviewing the pilot’s defect taxonomy.

**Ada:** If the board is blocked on human review, it can work on an independent task only if the dependency graph permits it. Waiting is not failure; silent autonomous merging is failure.

### Final board agreement

**Jo:** Is the practical setup now complete?

**Rowan:** Yes, if “complete” means a restartable operating system for bounded work: queue, lease, worktree, role separation, evidence packets, challenge bank, focused validation, reports, stop conditions, and a human gate. The runbook next to this discussion contains the sample `board.yml`, state record, role contracts, worker loop, and two-week pilot.

**Mira:** Add that the board must begin with a small representative pilot. It must not unleash agents on all 644 lessons. The agent will discover the repository’s repeated patterns more reliably after we understand which checks and prompts produce false positives.

**Elias:** Add learner evidence after the calibration period. Agent judgments are provisional. The board needs held-out transfer attempts by people or independent reviewers.

**Linh:** Add rotating challenges and independent contexts. Otherwise a persistent agent will eventually learn the test fixtures instead of the teaching problem.

**Sofia:** Add accessibility and PDF checks to the first-reader role, not as a final cosmetic sweep.

**Ada:** Add the rule that the board can measure workflow completeness but cannot call that course quality. Actual quantitative learning evidence is per outcome, per task, and per learner context.

**Jo:** Then the operational resolution is:

> Run agentic improvement as a durable queue of small lesson-and-evidence tasks. Let specialized agents inspect, source, draft, attack, and validate in separate bounded invocations. Persist only state and evidence, recover stale work explicitly, stop on repeated blockers, rotate challenge cases, and require a human gate before integration. Feed agents failed assertions and learner error patterns, never a single quality score.

The board is reassembled in [`agentic-runbook.md`](agentic-runbook.md). The platform can now support days of useful work without pretending that uninterrupted autonomy is the same thing as educational judgment.
