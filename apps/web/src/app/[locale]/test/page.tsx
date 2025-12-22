'use client';

import { Badge, BadgeGroup } from '@/components/atoms/Badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/atoms/Card';
import { ProgressBar, ProgressRing } from '@/components/atoms/ProgressRing';
import {
  AchievementCelebration,
  AchievementProgress,
  AchievementToast,
} from '@/components/organisms/AchievementCelebration';
import { Award, BookOpen, TrendingUp, Zap } from 'lucide-react';
import { useState } from 'react';

/**
 * Component Showcase Page
 *
 * Test page to demonstrate all new UI/UX components
 * Visit: http://localhost:3000/test
 */
export default function TestPage() {
  const [showAchievement, setShowAchievement] = useState(false);
  const [showToast, setShowToast] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
      <div className="mx-auto max-w-7xl space-y-12">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
            Component Showcase
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Testing all new UI/UX components from Frontend Implementation
          </p>
        </div>

        {/* Card Variants */}
        <section>
          <h2 className="text-2xl font-bold mb-6 text-zinc-900 dark:text-zinc-100">
            Card Variants
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card variant="default">
              <CardHeader>
                <CardTitle>Default Card</CardTitle>
                <CardDescription>Standard card with border</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Basic card styling with clean borders.
                </p>
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Elevated Card</CardTitle>
                <CardDescription>Shadow-based depth</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Uses shadows for depth perception.
                </p>
              </CardContent>
            </Card>

            <Card variant="bordered">
              <CardHeader>
                <CardTitle>Bordered Card</CardTitle>
                <CardDescription>Emphasized border</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-600 dark:text-zinc-400">2px border with primary color.</p>
              </CardContent>
            </Card>

            <Card variant="glass">
              <CardHeader>
                <CardTitle>Glass Card</CardTitle>
                <CardDescription>Glassmorphism effect</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Frosted glass with backdrop blur.
                </p>
              </CardContent>
            </Card>

            <Card variant="default" glowOnHover>
              <CardHeader>
                <CardTitle>Glow on Hover</CardTitle>
                <CardDescription>Interactive effect</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Hover to see the blue glow effect.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Badges */}
        <section>
          <h2 className="text-2xl font-bold mb-6 text-zinc-900 dark:text-zinc-100">
            Badge Variants
          </h2>
          <BadgeGroup>
            <Badge variant="default">Default</Badge>
            <Badge variant="primary" icon={<Zap className="w-3 h-3" />}>
              Primary
            </Badge>
            <Badge variant="success" icon={<Award className="w-3 h-3" />}>
              Success
            </Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="danger">Danger</Badge>
            <Badge variant="accent">Accent</Badge>
          </BadgeGroup>

          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-3 text-zinc-900 dark:text-zinc-100">Sizes</h3>
            <BadgeGroup>
              <Badge size="sm">Small</Badge>
              <Badge size="md">Medium</Badge>
              <Badge size="lg">Large</Badge>
            </BadgeGroup>
          </div>
        </section>

        {/* Progress Indicators */}
        <section>
          <h2 className="text-2xl font-bold mb-6 text-zinc-900 dark:text-zinc-100">
            Progress Indicators
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Progress Rings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-around">
                  <ProgressRing progress={25} size="sm" color="blue" />
                  <ProgressRing progress={50} size="md" color="green" />
                  <ProgressRing progress={75} size="lg" color="purple" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Progress Bars</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ProgressBar progress={30} color="blue" />
                <ProgressBar progress={60} color="green" />
                <ProgressBar progress={90} color="purple" />
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Stats Cards (like Dashboard) */}
        <section>
          <h2 className="text-2xl font-bold mb-6 text-zinc-900 dark:text-zinc-100">Stat Cards</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="flex items-center gap-4 p-6">
                <div className="rounded-lg bg-blue-100 dark:bg-blue-950 p-3">
                  <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase font-bold">Courses</p>
                  <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">12</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-4 p-6">
                <div className="rounded-lg bg-green-100 dark:bg-green-950 p-3">
                  <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase font-bold">Completed</p>
                  <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">45</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-4 p-6">
                <div className="rounded-lg bg-purple-100 dark:bg-purple-950 p-3">
                  <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase font-bold">Points</p>
                  <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">2,450</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-4 p-6">
                <div className="rounded-lg bg-amber-100 dark:bg-amber-950 p-3">
                  <Award className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase font-bold">Streak</p>
                  <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">7</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Achievement Progress */}
        <section>
          <h2 className="text-2xl font-bold mb-6 text-zinc-900 dark:text-zinc-100">
            Achievement Progress
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <AchievementProgress
              current={750}
              target={1000}
              title="Complete 10 Lessons"
              icon="📚"
              reward={500}
            />
            <AchievementProgress
              current={280}
              target={300}
              title="Earn 300 Points"
              icon="⚡"
              reward={100}
            />
          </div>
        </section>

        {/* Interactive Buttons */}
        <section>
          <h2 className="text-2xl font-bold mb-6 text-zinc-900 dark:text-zinc-100">
            Interactive Components
          </h2>
          <Card>
            <CardHeader>
              <CardTitle>Achievement Celebrations</CardTitle>
              <CardDescription>Test the gamification modals</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-4">
              <button
                onClick={() => setShowAchievement(true)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
              >
                Show Achievement Modal
              </button>
              <button
                onClick={() => setShowToast(true)}
                className="px-6 py-3 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 font-semibold rounded-xl transition-colors"
              >
                Show Achievement Toast
              </button>
            </CardContent>
          </Card>
        </section>

        {/* Design Tokens Reference */}
        <section>
          <h2 className="text-2xl font-bold mb-6 text-zinc-900 dark:text-zinc-100">
            Color Palette
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Primary (Blue)</CardTitle>
                <CardDescription>Trust & Security</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-12 bg-blue-500 rounded-lg" />
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">#3B82F6</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Secondary (Green)</CardTitle>
                <CardDescription>Growth & Success</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-12 bg-green-500 rounded-lg" />
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">#22C55E</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Accent (Purple)</CardTitle>
                <CardDescription>Gamification</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-12 bg-purple-500 rounded-lg" />
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">#A855F7</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Warning (Amber)</CardTitle>
                <CardDescription>Nudges & Loss</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-12 bg-amber-500 rounded-lg" />
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">#F59E0B</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>

      {/* Achievement Modals */}
      {showAchievement && (
        <AchievementCelebration
          achievement={{
            id: 'test-1',
            title: 'First Steps',
            description: 'Complete your first lesson on V-EdFinance!',
            icon: '🎉',
            rarity: 'epic',
            points: 500,
            category: 'Learning',
          }}
          onClose={() => setShowAchievement(false)}
          autoClose={0} // Don't auto-close for demo
        />
      )}

      {showToast && (
        <AchievementToast
          achievement={{
            id: 'test-2',
            title: 'Quick Learner',
            icon: '⚡',
            rarity: 'rare',
            points: 100,
          }}
          onDismiss={() => setShowToast(false)}
        />
      )}
    </div>
  );
}
