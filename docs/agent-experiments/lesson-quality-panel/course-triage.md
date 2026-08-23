# Initial ratings for the remaining LibreUni catalog

This is a triage document, not a numeric course-quality score. It records where to spend review and repair effort first. A smoke failure means the learner-facing example or component contract is currently unreliable. An integrity finding means a heading needs manual review; it does **not** prove that the course is bad. A clean result is likewise not proof that a course teaches well.

The five courses already discussed separately are excluded from the detailed list below: Abstract Algebra, C Programming Mastery, Algorithms, Calculus & Analysis, and Computer Architecture.

## Evidence used

- complete repository `course_stats.py` smoke audit on 2026-08-19;
- complete `course_integrity.py` audit on 2026-08-19;
- course metadata, prerequisites, lesson manifests, component inventory, and representative lesson inspection; and
- the LibreUni course standard, which requires self-contained learning, transfer, meaningful practice, and an intentional authoring-surface audit.

The ratings are deliberately qualitative:

- **P0 — recovery before expansion:** broken learning surface, seriously implausible scope, or both. Stop adding material until the contract is repaired.
- **P1 — structural redesign / modernization:** substantive material may exist, but its learning arc or representation needs a course-scale redesign.
- **P2 — targeted verification / enrichment:** no urgent repository signal. Preserve the good core, then use held-out learner tasks to find the few changes that matter.

## P0 — recovery before expansion

### Modern C++ Programming — recover the executable spine

**Rating:** P0. The course has 40 lessons and a rich intended scope, but the smoke audit reports dozens of broken C++ examples across foundations, C++20/23 features, STL, and concurrency—mostly malformed generated character/string literals. A learner cannot trust a course whose executable examples routinely fail.

**What to do:** repair and run every example before changing pedagogy. Then divide the course into a coherent core-modern-C++ sequence and explicitly separate language fundamentals, library fluency, concurrency, and toolchain practice. Do not mask source failures as “output-only” runners.

### Git and Distributed Version Control — replace the fake execution model

**Rating:** P0. All 15 lessons declare `CodeRunner language="git"`, which the repository does not support. The lessons present command transcripts as though they were runnable interactions; that is a broken teaching promise.

**What to do:** choose one honest surface: a deterministic Git-repository simulator, a browser-safe shell transcript with state transitions, or non-interactive command blocks plus a real local-lab protocol. Rebuild exercises around repository states, conflicts, and recovery—not command recall.

### Modern JavaScript & Ecosystem — repair runtimes, then narrow the arc

**Rating:** P0. The smoke audit finds source-level JavaScript syntax/runtime failures and TypeScript runners that require an unavailable `tsc`. The 22-lesson scope also crosses language semantics, Node, React, testing, security, and performance, which needs a firmer prerequisite and module boundary than a survey sequence.

**What to do:** make every executable example valid in its declared environment; distinguish JavaScript from TypeScript toolchains; then decide whether React and server-side engineering belong in this course or separate follow-on courses. Add event-loop, closure, prototype, and async traces where state actually changes.

### Linear Algebra — restore correctness and rebuild around transformations

**Rating:** P0. Two Python examples fail to parse, and the 12 lessons cover a 10-ECTS subject in a very small source footprint. The issue is not the count by itself: the stated outcomes need enough room for geometric, computational, and proof-level understanding of linear maps.

**What to do:** repair the eigenvalue and inner-product examples first. Then build the course around transformations, bases, eigenstructure, and inner products, using dynamic geometry and matrix-action experiments only where they expose an invariant or counterexample.

### Geometry & Topology — establish a real course contract

**Rating:** P0. Five lessons and a very small source footprint cannot credibly cover a 10-ECTS course described as both differential geometry and topology. The smoke audit passes, but passing means only that the small existing surface is not broken.

**What to do:** make a curriculum choice before authoring: an introductory topology course, an introductory differential-geometry course, or a two-course sequence. Write the crosswalk, prerequisites, omissions, and assessment ceiling before expanding lessons.

### Software Engineering & OOAD — replace the survey with engineering work

**Rating:** P0. The 30-lesson course has no detected authored teaching components, 22 uncovered-heading findings, and eight broken or unavailable executable examples. Its introductory material is survey-like and even uses a prohibited chronological transition, which supports the user’s concern about robotic prose.

**What to do:** rebuild around a single evolving system: requirements, domain model, architecture, tests, refactoring, release, and post-release evidence. Repair the JavaScript, Python, and TypeScript examples, but do not treat that repair as sufficient.

## P1 — structural redesign or modernization

### Theory of Computation — make formal machines inspectable

**Rating:** P1. The module arc is strong—languages, grammars, computability, complexity, then synthesis—and representative prose is rigorous. Yet all 20 lessons have uncovered substantive headings and no authored interactive or diagram components were detected.

**What to do:** preserve proofs and add deliberately chosen representations: state-machine traces, subset-construction workspaces, parse derivations, reduction checkers, and counterexample search. The aim is not widgets; it is making invariants, configurations, and quantifiers inspectable.

### Computer Networks — turn protocols into observable traces

**Rating:** P1. The manifest has a coherent layer-to-application shape, but every lesson has uncovered substantive headings and the course has no detected authored diagrams or interactions. Networking taught only as prose loses timing, state, packets, and failure behavior.

**What to do:** use packet traces, sequence/state diagrams, routing-table and congestion-window exercises, and failure-driven labs. Start with one lesson per module, then verify that learners can diagnose a changed network condition.

### Cryptography and Security — teach the attacker’s view

**Rating:** P1. The scope is sensible—threat models through protocols and systems security—but all 20 lessons are flagged for uncovered headings and no authoring components were detected. Security reasoning needs adversarial traces and boundary conditions, not just definitions.

**What to do:** add threat-model worksheets, protocol message traces, small attack/defense experiments, and explicit misuse cases. Keep cryptographic claims sourced and do not offer false “secure by quiz” reassurance.

### Data Structures — audit for density and transfer, not more artifacts

**Rating:** P1. This is structurally ambitious and already component-rich, like Algorithms: 23 lessons, many formal statements, diagrams, exercises, and case studies. It still has 15 uncovered-heading findings and a very dense source footprint, so the risk is overload or decorative artifacts rather than absence of material.

**What to do:** test whether learners can choose a representation under changing workload, locality, persistence, and concurrency constraints. Remove repeated artifact patterns that do not change the reasoning task; keep only visualizations that expose state or complexity trade-offs.

### Database Systems — convert rigorous prose into executable reasoning

**Rating:** P1. The progression from relational foundations through transactions and distributed data is good, but all 20 lessons have uncovered-heading findings and no authored components were detected. The course needs learners to manipulate schemas, queries, plans, and schedules rather than only read about them.

**What to do:** prioritize schema-design counterexamples, query-plan comparisons, transaction traces, and recovery timelines. A database lab should provide diagnosable wrong answers and visible isolation assumptions.

### DevOps, Platform Engineering & Reliability — replace study tasks with operating evidence

**Rating:** P1. The 31-lesson scope is broad and current, but every lesson has an uncovered-heading finding; its component surface is thin relative to operations, deployment, incident, and reliability outcomes. The representative foundation lesson has sound ideas but mainly prose, a study task, and a quiz.

**What to do:** organize the course around an evolving delivery system. Learners should inspect CI evidence, deployment and rollback decisions, service-level burn rates, incident timelines, and policy trade-offs. Split platform engineering from broad DevOps coverage if the crosswalk cannot sustain both.

### Machine Learning — give the models data, curves, and failure cases

**Rating:** P1. The course has quizzes and runners, but all 22 reviewed lessons have uncovered-heading findings. A machine-learning course needs more than code snippets and recognition checks: learners must see datasets, loss surfaces, train/test behavior, calibration, and failure under changed assumptions.

**What to do:** rebuild selected modules as experiments with held-out data and diagnostic plots. Make every model choice answer a concrete prediction question; do not add dashboards or notebooks merely to increase apparent interactivity.

### Discrete Mathematics — deepen the foundational contract

**Rating:** P1. The smoke and integrity audits find no current anomaly, but ten lessons and a small source footprint are not yet persuasive evidence of a 10-ECTS foundation spanning combinatorics, graphs, and discrete structures.

**What to do:** audit the curriculum crosswalk and assessment ceiling. Ensure proof, counting, graph reasoning, recurrence/induction, and discrete modeling are taught as transfer skills, not compressed topic labels.

### Mathematical Foundations — preserve the sequence, increase intellectual depth

**Rating:** P1. The course has a workable breadth and no immediate audit finding, but its 26 lessons must carry logic, sets, functions, and proof techniques for many downstream courses. The current source footprint calls for a depth audit, especially around proof diagnosis and prerequisite self-containment.

**What to do:** run held-out proof and counterexample tasks. Add truth/quantifier and proof-construction interactions only when they reveal the learner’s incorrect inference, not merely the selected answer.

### Probability & Statistics — fix the broken example and distinguish inference from calculation

**Rating:** P1. A Bayesian-statistics Python example has a syntax error, and 8 lessons have uncovered-heading findings. The course has useful case-study potential but must protect against formula-driven pattern matching.

**What to do:** repair the example, then build data-generating-process, uncertainty, sampling, model-checking, and decision tasks. Learners should explain why an estimate changes, not only compute it.

### Philosophy — add argument structure, not software-style widgets

**Rating:** P1. The 40-lesson range is ambitious and the smoke audit passes, but all 40 lessons are flagged for uncovered headings and quizzes are the only detected interactive component. Philosophy can be prose-forward, but it still needs visible argument maps, primary-text evidence, counterarguments, and diagnostic writing tasks.

**What to do:** use argument reconstruction, objection/reply matrices, and source-grounded case analysis. Do not force code runners or diagrams where they would trivialize interpretation.

### Philosophy of Science and Engineering — make evidence and values contestable

**Rating:** P1. The course has quizzes and diagrams but all 22 lessons remain flagged for uncovered headings. This suggests that the available artifacts are not yet carrying the substantive claims and case reasoning.

**What to do:** center competing explanations, engineering trade-offs, evidence quality, and ethical conflict cases. Each activity should make a learner defend a conclusion under changed evidence or stakeholder constraints.

### The Art of Power Using — repair platform-specific practice

**Rating:** P1. Two PowerShell runners use an unsupported language, and all nine lessons have integrity review findings. A cross-platform productivity course must not promise execution it cannot provide.

**What to do:** replace unsupported runners with safe command transcripts, a platform-aware simulation, or explicitly local exercises. Separate general workflow principles from operating-system-specific commands and destructive operations.

### Programming Concepts & Paradigms — make semantic differences concrete

**Rating:** P1. The course has a coherent historical/paradigm arc and many PlantUML diagrams, but all 20 lessons have uncovered-heading findings and one diagram is generic. Diagrams alone do not teach evaluation, binding, effects, types, or implementation trade-offs.

**What to do:** use tiny interpreters, execution traces, and compare-the-semantics exercises. Replace generic diagrams with domain-specific models that show what a program state or language feature actually changes.

### Python for Scientific Computing — validate the experiments’ reasoning value

**Rating:** P1. The smoke audit passes and the course has many CodeRunners, but eight lessons have uncovered headings and the course crosses NumPy, SymPy, pandas, scikit-learn, visualization, and integration. The risk is a collection of runnable fragments rather than a scientific-computing learning arc.

**What to do:** organize around reproducible numerical investigations: assumptions, units, numerical stability, visual diagnosis, and model limitations. Keep a runner only when changing its inputs reveals a scientific or computational invariant.

### Software Architecture — retain diagrams, add decisions and consequences

**Rating:** P1. The course is visually rich—70 PlantUML references—but all 12 reviewed lessons have uncovered headings. This is the opposite failure from Computer Architecture: diagrams are present, yet the audit says they do not cover the surrounding reasoning.

**What to do:** use architectural decision records, quality-attribute scenarios, deployment failure cases, and evolving system constraints. Each diagram should support a decision and a trade-off, not stand in for the explanation.

## P2 — targeted verification and enrichment

### Operating Systems Internals — preserve, then challenge the code-heavy path

**Rating:** P2. The 34-lesson course passes smoke tests, has only three integrity findings, no detected robotic phrase hits, and a substantial mix of exercises, case studies, and diagrams. That is stronger repository evidence than most courses, not a guarantee of learner mastery.

**What to do:** run held-out traces for scheduling, virtual memory, synchronization, filesystems, and kernel boundaries. Repair the three flagged units after checking whether prose-only treatment is intentional.

### The Rust Programming Language — preserve correctness, strengthen independent design

**Rating:** P2. The course passes smoke tests and has only one integrity finding despite a substantial runnable-code surface. The primary risk is not obvious breakage but whether ownership, borrowing, lifetimes, and concurrency exercises require explanation rather than copyable edits.

**What to do:** use compiler-error diagnosis and ownership-trace tasks with changed constraints. Verify that the one flagged heading has an intentional teaching treatment.

### Team Dynamics & Leadership — keep it case-led and evidence-based

**Rating:** P2. The audit finds no current anomaly. Because the subject is organizational rather than executable, a low component count is not a defect by itself.

**What to do:** inspect whether learners make and defend leadership or collaboration decisions from a realistic case, with consequences and competing stakeholder views. Add components only if they expose a genuine decision boundary.

### UML Design — keep it compact, verify modeling transfer

**Rating:** P2. The short course passes smoke and integrity checks and already uses PlantUML. Its real question is whether learners can model an unfamiliar system and explain why one diagram type, boundary, or relationship is appropriate.

**What to do:** use one changed-domain modeling challenge per diagram family and require a critique of an incorrect model. Do not grow it with diagrams that merely repeat notation.

### Contributing to LibreUni — repair the showcase, keep the guide practical

**Rating:** P2 for educational priority, P0 for its two broken example surfaces. This is a contributor guide rather than an academic course. Its TypeScript-tooling and JavaScript examples fail smoke tests, which is particularly harmful because it demonstrates the platform’s own authoring surface.

**What to do:** repair the showcase examples and make the guide a small end-to-end contribution workflow: inspect, edit one bounded lesson, validate, and review. Keep it separate from the academic-course queue.

## Recommended queue after the five already reviewed

1. **C++**, **Git**, **JavaScript**, **Linear Algebra**, and **Software Engineering**: establish a trustworthy executable learning surface and course boundary.
2. **Topology**: decide what the course is before adding material.
3. **Theory of Computation**, **Networks**, **Cryptography**, **Databases**, **DevOps**, and **Machine Learning**: build outcome-specific representations and transfer tasks from the existing prose.
4. **Data Structures**, **Python**, **Software Architecture**, and the mathematics foundation courses: run learner-transfer probes to decide what to keep, remove, or deepen.
5. **Operating Systems**, **Rust**, **Team Dynamics**, and **UML**: protect the strongest current evidence and improve only defects discovered by independent review.

## What this does not establish

These ratings do not establish mathematical correctness, source quality, accessibility, real learner outcomes, or curriculum equivalence to a university course. Before accepting any redesign, the board should create a course-specific crosswalk, inspect every lesson and manifest, run held-out challenges, and obtain subject review. The target is evidence-backed learner improvement, never a higher count of words, citations, diagrams, or components.
