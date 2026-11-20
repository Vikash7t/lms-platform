import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Sparkles,
  Users,
  Video,
  Award,
  ArrowRight,
  Code,
  Database,
  Cpu,
  Cloud,
  Palette,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const CATEGORIES = [
  {
    name: "Web Development",
    icon: Code,
    description: "Next.js, React, Node.js, TypeScript & Full-stack Architecture",
    courses: "120+ courses",
  },
  {
    name: "Data & Analytics",
    icon: Database,
    description: "PostgreSQL, SQL optimization, Data Engineering & Pipelines",
    courses: "85+ courses",
  },
  {
    name: "AI & Machine Learning",
    icon: Cpu,
    description: "LLMs, LangChain, PyTorch, Model Deployment & GenAI",
    courses: "64+ courses",
  },
  {
    name: "Cloud & DevOps",
    icon: Cloud,
    description: "Docker, Kubernetes, AWS, CI/CD pipelines & Microservices",
    courses: "95+ courses",
  },
  {
    name: "UI/UX & Product Design",
    icon: Palette,
    description: "Figma, Design Systems, Responsive Interfaces & Usability",
    courses: "40+ courses",
  },
  {
    name: "Leadership & Strategy",
    icon: Briefcase,
    description: "Engineering Management, System Design & Tech Leadership",
    courses: "35+ courses",
  },
];

const FEATURES = [
  {
    icon: Video,
    title: "HD Video Streaming",
    description:
      "Structured, high-definition video modules with automatic playback tracking and bookmarking.",
  },
  {
    icon: Sparkles,
    title: "Interactive Assessments",
    description:
      "Reinforce knowledge with built-in chapter quizzes, milestone projects, and instant feedback.",
  },
  {
    icon: Award,
    title: "Verified Credentials",
    description:
      "Earn verifiable completion certificates to showcase on LinkedIn and tech portfolios.",
  },
  {
    icon: Users,
    title: "Active Learning Community",
    description:
      "Engage directly with instructors and peers via lecture discussion forums and Q&A threads.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background py-20 md:py-32">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-4 px-3 py-1 text-sm font-medium">
              <Sparkles className="mr-1.5 h-3.5 w-3.5 text-primary" />
              Empowering 10,000+ Learners Worldwide
            </Badge>

            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl text-foreground">
              Master Modern Skills with{" "}
              <span className="text-primary underline decoration-primary/30 underline-offset-8">
                Industry Leaders
              </span>
            </h1>

            <p className="mt-6 text-lg text-muted-foreground sm:text-xl leading-relaxed">
              Explore meticulously structured video courses, hands-on architectural projects,
              and verifiable industry credentials built to accelerate your engineering career.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button asChild size="lg" className="h-12 px-8 text-base shadow-sm">
                <Link href="/courses">
                  <BookOpen className="mr-2 h-5 w-5" />
                  Explore Courses
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 px-8 text-base">
                <Link href="/courses">
                  Browse Curriculum
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* Quick Highlights */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Zero Subscription Lock-in</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Lifetime Lecture Access</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Verified Certificates</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Stats */}
      <section className="border-y bg-muted/40 py-12">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4 text-center">
            <div>
              <p className="text-3xl font-bold tracking-tight sm:text-4xl text-primary">500+</p>
              <p className="mt-1 text-sm font-medium text-muted-foreground">Curated Courses</p>
            </div>
            <div>
              <p className="text-3xl font-bold tracking-tight sm:text-4xl text-primary">10k+</p>
              <p className="mt-1 text-sm font-medium text-muted-foreground">Active Learners</p>
            </div>
            <div>
              <p className="text-3xl font-bold tracking-tight sm:text-4xl text-primary">4.9 / 5</p>
              <p className="mt-1 text-sm font-medium text-muted-foreground">Instructor Rating</p>
            </div>
            <div>
              <p className="text-3xl font-bold tracking-tight sm:text-4xl text-primary">98%</p>
              <p className="mt-1 text-sm font-medium text-muted-foreground">Completion Satisfaction</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Top Learning Categories
            </h2>
            <p className="mt-3 text-muted-foreground">
              Deep-dive into high-impact disciplines taught by senior practitioners.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <Card
                  key={cat.name}
                  className="group hover:border-primary/50 transition-all duration-200 hover:shadow-md cursor-pointer"
                >
                  <CardHeader className="flex flex-row items-center gap-4 pb-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold">{cat.name}</CardTitle>
                      <span className="text-xs text-muted-foreground font-medium">
                        {cat.courses}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {cat.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Core Platform Features */}
      <section className="bg-muted/30 py-20 border-t">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center mb-14">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Engineered for Real-World Competence
            </h2>
            <p className="mt-3 text-muted-foreground">
              Everything you need to master complex technical concepts from day one.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="rounded-xl border bg-card p-6 shadow-xs flex flex-col items-start"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-lg">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Instructor Callout */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="rounded-2xl border bg-gradient-to-r from-primary/10 via-primary/5 to-background p-8 md:p-14 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-xl">
              <Badge variant="outline" className="mb-3 border-primary text-primary">
                <GraduationCap className="mr-1.5 h-3.5 w-3.5" />
                Become an Instructor
              </Badge>
              <h3 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Share Your Expertise with Global Engineers
              </h3>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                Publish high-quality video courses, manage curricula with our intuitive builder,
                and earn revenue sharing while building your personal brand.
              </p>
            </div>
            <Button asChild size="lg" className="shrink-0 h-12 px-6">
              <Link href="/instructor/courses">Start Teaching Today</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t py-8 bg-muted/20">
        <div className="container mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-primary" />
            <span className="font-semibold text-foreground">LMS Platform</span>
            <span>&copy; {new Date().getFullYear()} All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/terms" className="hover:underline">Terms of Service</Link>
            <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
            <Link href="/security" className="hover:underline">Security</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
