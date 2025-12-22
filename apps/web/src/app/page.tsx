'use client';

import { Badge } from '@/components/atoms/Badge';
import { Card } from '@/components/atoms/Card';
import { cn } from '@/lib/cn';
import {
  ArrowRight,
  Award,
  BookOpen,
  Brain,
  ChevronRight,
  Play,
  Shield,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import Link from 'next/link';

/**
 * Landing Page - Professional EdTech + Fintech Hybrid
 *
 * Sections:
 * 1. Hero - Value proposition & CTA
 * 2. Trust - Security badges & social proof
 * 3. Features - Core value props
 * 4. How It Works - 3-step process
 * 5. Testimonials - Social proof
 * 6. Pricing - Plans
 * 7. Final CTA - Conversion
 */
export default function LandingPage() {
  return (
    <main className="relative bg-gradient-to-b from-blue-50 via-white to-purple-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-purple-950">
      <HeroSection />
      <TrustSection />
      <FeaturesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <FinalCTASection />
    </main>
  );
}

/**
 * Hero Section - Above the Fold
 * Goal: Capture attention & communicate value in 5 seconds
 */
function HeroSection() {
  return (
    <section className="relative overflow-hidden px-6 py-20 lg:py-32">
      {/* Background Gradient Orbs */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="mx-auto max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Value Proposition */}
          <div className="space-y-8 text-center lg:text-left">
            <Badge variant="primary" size="md" icon={<Sparkles className="w-4 h-4" />}>
              AI-Powered Financial Education
            </Badge>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
              Master Your Money,
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Master Your Future
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl">
              Learn financial literacy through interactive simulations, AI mentorship, and gamified
              learning paths. Built for Vietnam, designed for the world.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                href="/register"
                className="group inline-flex items-center justify-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all hover:scale-105 hover:shadow-lg"
              >
                Start Learning Free
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition" />
              </Link>
              <Link
                href="#demo"
                className="inline-flex items-center justify-center px-8 py-4 bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-500 font-semibold rounded-xl transition-all"
              >
                <Play className="mr-2 w-5 h-5" />
                Watch Demo (2 min)
              </Link>
            </div>

            {/* Social Proof */}
            <div className="flex flex-col sm:flex-row items-center gap-6 pt-4 justify-center lg:justify-start">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 border-2 border-white dark:border-zinc-900 flex items-center justify-center text-white text-sm font-bold"
                  >
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <div className="text-center sm:text-left">
                <p className="font-semibold text-lg text-zinc-900 dark:text-zinc-100">
                  10,000+ Learners
                </p>
                <div className="flex items-center gap-1 text-yellow-500">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} fill="currentColor" className="w-4 h-4" />
                  ))}
                  <span className="text-sm text-zinc-600 dark:text-zinc-400 ml-1">
                    4.9/5 Rating
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Interactive Preview */}
          <div className="relative">
            <Card variant="elevated" className="relative z-10">
              <DashboardPreview />
            </Card>
            {/* Floating Achievement Badges */}
            <FloatingBadge className="absolute -top-6 -right-6 animate-bounce" delay={0}>
              💰 +500 Points!
            </FloatingBadge>
            <FloatingBadge className="absolute -bottom-4 -left-4 animate-bounce" delay={1000}>
              🔥 7 Day Streak
            </FloatingBadge>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Trust Section - Security & Credibility
 * Critical for fintech platforms
 */
function TrustSection() {
  const trustBadges = [
    {
      icon: Shield,
      label: 'Bank-Grade Security',
      desc: 'AES-256 Encryption',
      color: 'text-blue-600 dark:text-blue-500',
    },
    {
      icon: Users,
      label: '10K+ Active Users',
      desc: 'Trusted Community',
      color: 'text-green-600 dark:text-green-500',
    },
    {
      icon: Award,
      label: 'ISO Certified',
      desc: 'Quality Assured',
      color: 'text-purple-600 dark:text-purple-500',
    },
    {
      icon: Brain,
      label: 'AI-Powered',
      desc: 'Personalized Learning',
      color: 'text-amber-600 dark:text-amber-500',
    },
  ];

  return (
    <section className="py-12 bg-white dark:bg-zinc-900 border-y border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto max-w-7xl px-6">
        <p className="text-center text-sm font-semibold text-zinc-500 dark:text-zinc-400 mb-8 tracking-wider">
          TRUSTED BY LEADING INSTITUTIONS
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {trustBadges.map((badge, i) => (
            <div key={i} className="flex flex-col items-center text-center group">
              <div className="mb-3 transform transition-transform group-hover:scale-110">
                <badge.icon className={cn('w-10 h-10', badge.color)} />
              </div>
              <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                {badge.label}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{badge.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Features Section - Core Value Props
 */
function FeaturesSection() {
  const features = [
    {
      icon: Brain,
      title: 'AI Mentor',
      description: 'Personal AI coach adapts to your learning style and financial goals',
      color: 'blue',
      stats: '24/7 Available',
    },
    {
      icon: Zap,
      title: 'Gamified Learning',
      description: 'Earn points, unlock achievements, and compete on leaderboards',
      color: 'purple',
      stats: '50+ Achievements',
    },
    {
      icon: TrendingUp,
      title: 'Real Simulations',
      description: 'Practice with realistic financial scenarios without real risk',
      color: 'green',
      stats: '100+ Scenarios',
    },
    {
      icon: Users,
      title: 'Social Learning',
      description: 'Connect with peers, share strategies, and learn together',
      color: 'amber',
      stats: '10K+ Community',
    },
  ];

  return (
    <section className="py-24 px-6">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
            Everything You Need to
            <span className="text-blue-600 dark:text-blue-500"> Succeed Financially</span>
          </h2>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
            Comprehensive tools and resources designed to transform your financial future
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <FeatureCard key={i} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  color: 'blue' | 'purple' | 'green' | 'amber';
  stats: string;
}

function FeatureCard({ icon: Icon, title, description, color, stats }: FeatureCardProps) {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    green: 'from-green-500 to-green-600',
    amber: 'from-amber-500 to-amber-600',
  };

  return (
    <Card
      variant="default"
      glowOnHover
      className="hover:border-blue-400 dark:hover:border-blue-600 transition-all group"
    >
      <div
        className={cn(
          'w-12 h-12 rounded-lg bg-gradient-to-br flex items-center justify-center mb-4 group-hover:scale-110 transition-transform',
          colors[color as keyof typeof colors]
        )}
      >
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">{title}</h3>
      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">{description}</p>
      <Badge variant="default" size="sm">
        {stats}
      </Badge>
    </Card>
  );
}

/**
 * How It Works Section - 3-Step Process
 */
function HowItWorksSection() {
  const steps = [
    {
      number: '01',
      title: 'Sign Up Free',
      description: 'Create your account in 60 seconds. No credit card required.',
    },
    {
      number: '02',
      title: 'Choose Your Path',
      description: 'AI analyzes your goals and creates a personalized learning journey.',
    },
    {
      number: '03',
      title: 'Learn & Earn',
      description: 'Complete lessons, earn rewards, and track your financial growth.',
    },
  ];

  return (
    <section className="py-24 px-6 bg-zinc-50 dark:bg-zinc-900">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
            Get Started in 3 Simple Steps
          </h2>
        </div>

        <div className="relative">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 -translate-y-1/2 z-0" />

          <div className="grid lg:grid-cols-3 gap-8 relative z-10">
            {steps.map((step, i) => (
              <div key={i} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl font-bold mb-4 shadow-lg">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                  {step.title}
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Testimonials Section - Social Proof
 */
function TestimonialsSection() {
  const testimonials = [
    {
      name: 'Nguyen Van A',
      role: 'University Student',
      avatar: '🎓',
      quote: 'V-EdFinance helped me understand investing. I started my first portfolio!',
      rating: 5,
    },
    {
      name: 'Tran Thi B',
      role: 'Young Professional',
      avatar: '💼',
      quote: 'The AI mentor feels like having a personal financial advisor. Amazing!',
      rating: 5,
    },
    {
      name: 'Le Van C',
      role: 'Entrepreneur',
      avatar: '🚀',
      quote: 'Gamification makes learning fun. I completed 20 lessons in my first week!',
      rating: 5,
    },
  ];

  return (
    <section className="py-24 px-6">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
            Loved by 10,000+ Learners
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, i) => (
            <Card key={i} variant="elevated">
              <div className="flex items-center gap-4 mb-4">
                <div className="text-4xl">{testimonial.avatar}</div>
                <div>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {testimonial.name}
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">{testimonial.role}</p>
                </div>
              </div>
              <div className="flex gap-1 mb-3">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} fill="currentColor" className="w-4 h-4 text-yellow-500" />
                ))}
              </div>
              <p className="text-zinc-700 dark:text-zinc-300 italic">
                &ldquo;{testimonial.quote}&rdquo;
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Final CTA Section - Conversion Driver
 */
function FinalCTASection() {
  return (
    <section className="py-24 px-6 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-3xl sm:text-5xl font-bold mb-6">
          Ready to Transform Your Financial Future?
        </h2>
        <p className="text-xl mb-8 opacity-90">
          Join 10,000+ learners who are already mastering their money
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/register"
            className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-zinc-100 transition-all hover:scale-105"
          >
            Get Started Free
            <ChevronRight className="ml-2 w-5 h-5" />
          </Link>
          <Link
            href="/courses"
            className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white font-semibold rounded-xl hover:bg-white/10 transition-all"
          >
            Browse Courses
          </Link>
        </div>
        <p className="text-sm mt-6 opacity-75">
          No credit card required • Free forever • Cancel anytime
        </p>
      </div>
    </section>
  );
}

/**
 * Supporting Components
 */
function DashboardPreview() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Your Progress</h3>
        <Badge variant="success">Level 5</Badge>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4">
          <BookOpen className="w-5 h-5 text-blue-600 mb-2" />
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">12</p>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">Courses</p>
        </div>
        <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4">
          <Zap className="w-5 h-5 text-purple-600 mb-2" />
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">2,450</p>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">Points</p>
        </div>
      </div>
    </div>
  );
}

interface FloatingBadgeProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

function FloatingBadge({ children, className, delay = 0 }: FloatingBadgeProps) {
  return (
    <div
      className={cn(
        'bg-gradient-to-br from-green-500 to-green-600 text-white px-4 py-2 rounded-lg shadow-lg font-semibold text-sm',
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
