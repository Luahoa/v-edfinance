import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface ClickCoordinate {
  x: number;
  y: number;
  timestamp: Date;
  path: string;
  elementId?: string;
}

export interface HeatmapCell {
  x: number;
  y: number;
  intensity: number;
}

export interface ScrollDepthData {
  path: string;
  maxDepth: number;
  averageDepth: number;
  totalEvents: number;
}

@Injectable()
export class HeatmapService {
  private readonly logger = new Logger(HeatmapService.name);

  constructor(private prisma: PrismaService) {}

  async trackClickCoordinate(
    sessionId: string,
    userId: string | null,
    path: string,
    x: number,
    y: number,
    elementId?: string,
  ): Promise<void> {
    await this.prisma.behaviorLog.create({
      data: {
        sessionId,
        userId,
        path,
        eventType: 'CLICK',
        actionCategory: 'INTERACTION',
        payload: {
          coordinates: { x, y },
          elementId,
          viewport: {
            width: typeof window !== 'undefined' ? window.innerWidth : 1920,
            height: typeof window !== 'undefined' ? window.innerHeight : 1080,
          },
        },
      },
    });
  }

  async trackScrollDepth(
    sessionId: string,
    userId: string | null,
    path: string,
    scrollDepth: number,
    maxScrollDepth: number,
  ): Promise<void> {
    await this.prisma.behaviorLog.create({
      data: {
        sessionId,
        userId,
        path,
        eventType: 'SCROLL',
        actionCategory: 'INTERACTION',
        payload: {
          scrollDepth,
          maxScrollDepth,
          scrollPercentage: (scrollDepth / maxScrollDepth) * 100,
        },
      },
    });
  }

  async generateHeatmap(
    path: string,
    startDate: Date,
    endDate: Date,
    gridSize = 50,
  ): Promise<HeatmapCell[]> {
    const clicks = await this.prisma.behaviorLog.findMany({
      where: {
        path,
        eventType: 'CLICK',
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        payload: true,
      },
    });

    const grid = new Map<string, number>();

    for (const click of clicks) {
      const coords = click.payload as any;
      if (!coords?.coordinates) continue;

      const { x, y } = coords.coordinates;
      const gridX = Math.floor(x / gridSize) * gridSize;
      const gridY = Math.floor(y / gridSize) * gridSize;
      const key = `${gridX},${gridY}`;

      grid.set(key, (grid.get(key) || 0) + 1);
    }

    const maxIntensity = Math.max(...Array.from(grid.values()), 1);

    return Array.from(grid.entries()).map(([key, count]) => {
      const [x, y] = key.split(',').map(Number);
      return {
        x,
        y,
        intensity: count / maxIntensity,
      };
    });
  }

  async analyzeScrollDepth(
    path: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ScrollDepthData> {
    const scrollEvents = await this.prisma.behaviorLog.findMany({
      where: {
        path,
        eventType: 'SCROLL',
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        payload: true,
      },
    });

    if (scrollEvents.length === 0) {
      return {
        path,
        maxDepth: 0,
        averageDepth: 0,
        totalEvents: 0,
      };
    }

    let totalDepth = 0;
    let maxDepth = 0;

    for (const event of scrollEvents) {
      const data = event.payload as any;
      if (!data?.scrollPercentage) continue;

      const depth = data.scrollPercentage;
      totalDepth += depth;
      maxDepth = Math.max(maxDepth, depth);
    }

    return {
      path,
      maxDepth,
      averageDepth: totalDepth / scrollEvents.length,
      totalEvents: scrollEvents.length,
    };
  }

  async getClickPatterns(
    userId: string,
    limit = 100,
  ): Promise<ClickCoordinate[]> {
    const clicks = await this.prisma.behaviorLog.findMany({
      where: {
        userId,
        eventType: 'CLICK',
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: limit,
      select: {
        payload: true,
        path: true,
        timestamp: true,
      },
    });

    return clicks
      .map((click) => {
        const data = click.payload as any;
        if (!data?.coordinates) return null;

        return {
          x: data.coordinates.x,
          y: data.coordinates.y,
          timestamp: click.timestamp,
          path: click.path,
          elementId: data.elementId,
        };
      })
      .filter(
        (item) => item !== null && item !== undefined,
      ) as ClickCoordinate[];
  }

  async getHotspots(
    path: string,
    startDate: Date,
    endDate: Date,
    threshold = 0.7,
  ): Promise<HeatmapCell[]> {
    const heatmap = await this.generateHeatmap(path, startDate, endDate);
    return heatmap.filter((cell) => cell.intensity >= threshold);
  }

  async analyzeUserEngagement(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    totalClicks: number;
    totalScrolls: number;
    avgSessionDuration: number;
    mostVisitedPages: string[];
  }> {
    const [clicks, scrolls, sessions] = await Promise.all([
      this.prisma.behaviorLog.count({
        where: {
          userId,
          eventType: 'CLICK',
          timestamp: { gte: startDate, lte: endDate },
        },
      }),
      this.prisma.behaviorLog.count({
        where: {
          userId,
          eventType: 'SCROLL',
          timestamp: { gte: startDate, lte: endDate },
        },
      }),
      this.prisma.behaviorLog.findMany({
        where: {
          userId,
          timestamp: { gte: startDate, lte: endDate },
        },
        select: {
          sessionId: true,
          duration: true,
          path: true,
        },
      }),
    ]);

    const sessionDurations = new Map<string, number>();
    const pageCounts = new Map<string, number>();

    for (const session of sessions) {
      const current = sessionDurations.get(session.sessionId) || 0;
      sessionDurations.set(
        session.sessionId,
        current + (session.duration || 0),
      );

      const pageCount = pageCounts.get(session.path) || 0;
      pageCounts.set(session.path, pageCount + 1);
    }

    const totalDuration = Array.from(sessionDurations.values()).reduce(
      (sum, dur) => sum + dur,
      0,
    );

    const mostVisitedPages = Array.from(pageCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([page]) => page);

    return {
      totalClicks: clicks,
      totalScrolls: scrolls,
      avgSessionDuration:
        sessionDurations.size > 0 ? totalDuration / sessionDurations.size : 0,
      mostVisitedPages,
    };
  }
}
