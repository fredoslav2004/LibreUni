import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'yaml';

interface CourseManifest {
  modules?: {
    title?: string;
    lessons?: string[];
  }[];
}

type LessonEntry = CollectionEntry<'lessons'>;

export type OrderedLesson = LessonEntry & {
  data: LessonEntry['data'] & {
    module?: string;
  };
};

const manifestCache = new Map<string, Promise<CourseManifest>>();

function lessonStem(lesson: LessonEntry) {
  return lesson.id.split('/').pop() ?? lesson.id;
}

function loadCourseManifest(courseId: string) {
  let manifestName = courseId;
  if (courseId.startsWith('math-') && !['math-stats', 'math-algebra', 'math-calculus'].includes(courseId)) {
    manifestName = 'math';
  }

  if (!manifestCache.has(manifestName)) {
    const manifestPath = path.resolve(
      process.cwd(),
      'src/data/course-manifests',
      `${manifestName}.yml`,
    );
    manifestCache.set(
      manifestName,
      readFile(manifestPath, 'utf-8')
        .then((content) => parse(content) as CourseManifest)
        .catch(() => ({ modules: [] })),
    );
  }

  return manifestCache.get(manifestName)!;
}

export async function getCourseLessons(courseId: string, lessonEntries?: LessonEntry[]): Promise<OrderedLesson[]> {
  const allLessons = lessonEntries ?? await getCollection('lessons');
  const courseLessons = allLessons.filter(l => l.data.course === courseId);
  const manifest = await loadCourseManifest(courseId);
  const orderedLessons: OrderedLesson[] = [];
  const remainingLessons = new Map(courseLessons.map(lesson => [lessonStem(lesson), lesson]));

  for (const module of manifest.modules ?? []) {
    const moduleTitle = module.title || 'Overview';
    for (const slug of module.lessons ?? []) {
      const lesson = remainingLessons.get(slug);
      if (!lesson) continue;

      orderedLessons.push({
        ...lesson,
        data: {
          ...lesson.data,
          module: moduleTitle,
        },
      });
      remainingLessons.delete(slug);
    }
  }

  const fallbackLessons = [...remainingLessons.values()]
    .sort((a, b) => lessonStem(a).localeCompare(lessonStem(b)))
    .map((lesson) => ({
      ...lesson,
      data: {
        ...lesson.data,
        module: 'Overview',
      },
    }));

  return [...orderedLessons, ...fallbackLessons];
}

export async function getLessonsByCourse(lessonEntries?: LessonEntry[]) {
  const allLessons = lessonEntries ?? await getCollection('lessons');
  const courseIds = [...new Set(allLessons.map(lesson => lesson.data.course))];
  const entries = await Promise.all(
    courseIds.map(async courseId => [courseId, await getCourseLessons(courseId, allLessons)] as const),
  );

  return Object.fromEntries(entries);
}

export async function getLessonNavigation(courseId: string, currentSlug: string) {
  const lessons = await getCourseLessons(courseId);
  const currentIndex = lessons.findIndex(l => l.id === currentSlug);
  
  return {
    prev: lessons[currentIndex - 1],
    next: lessons[currentIndex + 1],
    lessons
  };
}
