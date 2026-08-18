import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('src/content/lessons/data-structures');
const visualTag = /<(?:StructureDiagram|PlantUML|TikZ|PythonDiagram|[A-Z][A-Za-z]+Playground)\b/g;
const visualSectionTag = /^<(?:StructureDiagram|PlantUML|TikZ|PythonDiagram|[A-Z][A-Za-z]+Playground)\b/gm;
const lessons = fs.readdirSync(root).filter((name) => name.endsWith('.mdx')).sort();
const counts = lessons.map((name) => {
  const source = fs.readFileSync(path.join(root, name), 'utf8');
  const firstSection = source.indexOf('\n## ');
  const firstVisual = source.search(/^<(?:StructureDiagram|StructureExercise|[A-Z][A-Za-z]+Playground)\b/m);
  const exercise = source.indexOf('<StructureExercise');
  const sectionStarts = [...source.matchAll(/^## (.+)$/gm)].map((match) => ({ index: match.index ?? 0, title: match[1] }));
  const visualSections = new Set([...source.matchAll(visualSectionTag)].map((match) => {
    const section = sectionStarts.filter((candidate) => candidate.index < (match.index ?? 0)).at(-1);
    return section?.title;
  }).filter(Boolean));
  const bPlusIntroduction = source.indexOf('B+ trees store records in linked leaves');
  const bPlusCaseStudy = source.indexOf('<CaseStudy client:load title="Range-query index"');
  return {
    name,
    count: source.match(visualTag)?.length ?? 0,
    layoutFailure: firstSection >= 0 && firstVisual >= 0 && firstVisual < firstSection,
    exerciseFailure: exercise >= 0 && firstSection >= 0 && exercise < firstSection,
    spreadFailure: visualSections.size < 3,
    conceptOrderFailure: name === 'b-trees-and-external-memory.mdx'
      && (bPlusIntroduction < 0 || bPlusCaseStudy < bPlusIntroduction),
  };
});
const total = counts.reduce((sum, item) => sum + item.count, 0);
const failures = counts.filter((item) => item.count < 3);
const layoutFailures = counts.filter((item) => item.layoutFailure || item.exerciseFailure || item.spreadFailure || item.conceptOrderFailure);

if (total < 70) {
  console.error(`Expected at least 70 data-structures visual artifacts; found ${total}.`);
  process.exit(1);
}
if (failures.length) {
  console.error(`Every data-structures lesson needs at least 3 visual artifacts:\n${failures.map((item) => `${item.name}: ${item.count}`).join('\n')}`);
  process.exit(1);
}
if (layoutFailures.length) {
  console.error(`Visuals or exercises are front-loaded before their teaching sections:\n${layoutFailures.map((item) => item.name).join('\n')}`);
  process.exit(1);
}

console.log(`Data-structures visual inventory passed: ${total} artifacts across ${lessons.length} lessons.`);
