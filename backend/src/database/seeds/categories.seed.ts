import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { CategoriesService } from '../../modules/categories/categories.service';

const DEFAULT_CATEGORIES = [
  {
    name: 'Web Development',
    slug: 'web-development',
    description:
      'Full-stack web application development with Next.js, React, Node.js, and TypeScript.',
    iconName: 'Code',
  },
  {
    name: 'Data & Analytics',
    slug: 'data-analytics',
    description:
      'Data engineering, PostgreSQL, SQL optimization, and analytics pipelines.',
    iconName: 'Database',
  },
  {
    name: 'AI & Machine Learning',
    slug: 'ai-machine-learning',
    description:
      'Generative AI, LLMs, neural networks, PyTorch, and model deployment.',
    iconName: 'Cpu',
  },
  {
    name: 'Cloud & DevOps',
    slug: 'cloud-devops',
    description:
      'Docker, Kubernetes, AWS, CI/CD pipelines, and microservices architecture.',
    iconName: 'Cloud',
  },
  {
    name: 'Mobile Development',
    slug: 'mobile-development',
    description:
      'Cross-platform and native mobile app development with React Native, Flutter, and Android.',
    iconName: 'Smartphone',
  },
  {
    name: 'UI/UX & Product Design',
    slug: 'ui-ux-design',
    description:
      'Design systems, Figma, usability testing, and intuitive interface design.',
    iconName: 'Palette',
  },
  {
    name: 'Cybersecurity',
    slug: 'cybersecurity',
    description:
      'Application security, penetration testing, network defense, and OWASP principles.',
    iconName: 'ShieldCheck',
  },
  {
    name: 'Leadership & Strategy',
    slug: 'leadership-strategy',
    description:
      'Engineering leadership, software system design, and agile management.',
    iconName: 'Briefcase',
  },
];

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const categoriesService = app.get(CategoriesService);

  console.log('[Seed] Seeding default categories...');
  for (const cat of DEFAULT_CATEGORIES) {
    try {
      await categoriesService.findBySlug(cat.slug);
      console.log(`[Seed] Category '${cat.name}' already exists.`);
    } catch {
      await categoriesService.create(cat);
      console.log(`[Seed] Created category '${cat.name}'.`);
    }
  }

  await app.close();
}

bootstrap()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[Seed Error]:', err);
    process.exit(1);
  });
