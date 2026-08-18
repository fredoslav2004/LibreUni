import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const courses = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/courses' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    overview: z.string().optional(),
    icon: z.string(),
    color: z.string(),
    image: z.string().optional(),
    status: z.enum(['public', 'draft']).default('public'),
    ects: z.union([z.literal(0), z.literal(5), z.literal(7.5), z.literal(10)]),
    prerequisites: z.object({
      required: z.array(z.string()),
      recommended: z.array(z.string()),
    }),
  }),
});

const lessons = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/lessons' }),
  schema: z.object({
    title: z.string(),
    course: z.string(),
    description: z.string().optional(),
  }),
});

const careers = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/careers' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    icon: z.string(),
    color: z.string(),
    details: z.object({
      importance: z.string().optional(),
      rolesAndResponsibilities: z.string().optional(),
      aiImpact: z.string().optional(),
      salary: z.array(z.object({
        region: z.string(),
        period: z.string(),
        junior: z.string(),
        mid: z.string(),
        senior: z.string(),
      })).optional(),
      marketDemand: z.string().optional(),
      peopleCount: z.string().optional(),
      topCompanies: z.array(z.string()).optional(),
      prominentFigures: z.array(z.string()).optional(),
      expectations: z.object({
        junior: z.string(),
        mid: z.string(),
        senior: z.string(),
      }).optional(),
    }).optional(),
    steps: z.array(z.object({
      title: z.string(),
      courses: z.array(z.object({
        id: z.string().optional(),
        title: z.string(),
        type: z.enum(['internal', 'external']),
        description: z.string().optional(),
        link: z.string().optional(),
      })),
    })),
  }),
});

export const collections = { courses, lessons, careers };
