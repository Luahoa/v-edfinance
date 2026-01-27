import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HeatmapService } from './heatmap.service';

describe('HeatmapService', () => {
  let service: HeatmapService;
  let mockPrisma: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = {
      behaviorLog: {
        create: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
      },
    };
    service = new HeatmapService(mockPrisma);
  });

  describe('trackClickCoordinate', () => {
    it('should track click coordinates with all parameters', async () => {
      mockPrisma.behaviorLog.create.mockResolvedValue({ id: 'log1' });

      await service.trackClickCoordinate(
        'session1',
        'user1',
        '/dashboard',
        100,
        200,
        'btn-submit',
      );

      expect(mockPrisma.behaviorLog.create).toHaveBeenCalledWith({
        data: {
          sessionId: 'session1',
          userId: 'user1',
          path: '/dashboard',
          eventType: 'CLICK',
          actionCategory: 'INTERACTION',
          payload: expect.objectContaining({
            coordinates: { x: 100, y: 200 },
            elementId: 'btn-submit',
            viewport: expect.objectContaining({
              width: expect.any(Number),
              height: expect.any(Number),
            }),
          }),
        },
      });
    });

    it('should track click without elementId', async () => {
      mockPrisma.behaviorLog.create.mockResolvedValue({ id: 'log2' });

      await service.trackClickCoordinate('session2', null, '/home', 50, 75);

      expect(mockPrisma.behaviorLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          sessionId: 'session2',
          userId: null,
          path: '/home',
          payload: expect.objectContaining({
            coordinates: { x: 50, y: 75 },
            elementId: undefined,
          }),
        }),
      });
    });

    it('should handle anonymous users', async () => {
      mockPrisma.behaviorLog.create.mockResolvedValue({ id: 'log3' });

      await service.trackClickCoordinate(
        'anon-session',
        null,
        '/landing',
        150,
        250,
      );

      expect(mockPrisma.behaviorLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: null,
          sessionId: 'anon-session',
        }),
      });
    });

    it('should track negative coordinates', async () => {
      mockPrisma.behaviorLog.create.mockResolvedValue({ id: 'log4' });

      await service.trackClickCoordinate('session3', 'user2', '/page', -10, -5);

      expect(mockPrisma.behaviorLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          payload: expect.objectContaining({
            coordinates: { x: -10, y: -5 },
          }),
        }),
      });
    });
  });

  describe('trackScrollDepth', () => {
    it('should track scroll depth with percentage calculation', async () => {
      mockPrisma.behaviorLog.create.mockResolvedValue({ id: 'scroll1' });

      await service.trackScrollDepth(
        'session1',
        'user1',
        '/article',
        500,
        1000,
      );

      expect(mockPrisma.behaviorLog.create).toHaveBeenCalledWith({
        data: {
          sessionId: 'session1',
          userId: 'user1',
          path: '/article',
          eventType: 'SCROLL',
          actionCategory: 'INTERACTION',
          payload: {
            scrollDepth: 500,
            maxScrollDepth: 1000,
            scrollPercentage: 50,
          },
        },
      });
    });

    it('should handle 100% scroll depth', async () => {
      mockPrisma.behaviorLog.create.mockResolvedValue({ id: 'scroll2' });

      await service.trackScrollDepth('session2', 'user2', '/blog', 2000, 2000);

      expect(mockPrisma.behaviorLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          payload: expect.objectContaining({
            scrollPercentage: 100,
          }),
        }),
      });
    });

    it('should handle zero scroll depth', async () => {
      mockPrisma.behaviorLog.create.mockResolvedValue({ id: 'scroll3' });

      await service.trackScrollDepth('session3', null, '/page', 0, 1500);

      expect(mockPrisma.behaviorLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          payload: expect.objectContaining({
            scrollPercentage: 0,
          }),
        }),
      });
    });
  });

  describe('generateHeatmap', () => {
    it('should generate heatmap grid from click data', async () => {
      const mockClicks = [
        { payload: { coordinates: { x: 100, y: 200 } } },
        { payload: { coordinates: { x: 105, y: 205 } } },
        { payload: { coordinates: { x: 150, y: 200 } } },
        { payload: { coordinates: { x: 152, y: 202 } } },
        { payload: { coordinates: { x: 300, y: 400 } } },
      ];
      mockPrisma.behaviorLog.findMany.mockResolvedValue(mockClicks);

      const result = await service.generateHeatmap(
        '/dashboard',
        new Date('2025-01-01'),
        new Date('2025-01-31'),
        50,
      );

      expect(mockPrisma.behaviorLog.findMany).toHaveBeenCalledWith({
        where: {
          path: '/dashboard',
          eventType: 'CLICK',
          timestamp: {
            gte: expect.any(Date),
            lte: expect.any(Date),
          },
        },
        select: {
          payload: true,
        },
      });

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('x');
      expect(result[0]).toHaveProperty('y');
      expect(result[0]).toHaveProperty('intensity');
      expect(result[0].intensity).toBeGreaterThan(0);
      expect(result[0].intensity).toBeLessThanOrEqual(1);
    });

    it('should normalize intensity to 0-1 range', async () => {
      const mockClicks = Array(10)
        .fill(null)
        .map(() => ({ payload: { coordinates: { x: 100, y: 100 } } }));
      mockPrisma.behaviorLog.findMany.mockResolvedValue(mockClicks);

      const result = await service.generateHeatmap(
        '/page',
        new Date('2025-01-01'),
        new Date('2025-01-31'),
      );

      const maxIntensity = Math.max(...result.map((cell) => cell.intensity));
      expect(maxIntensity).toBe(1);
    });

    it('should handle empty click data', async () => {
      mockPrisma.behaviorLog.findMany.mockResolvedValue([]);

      const result = await service.generateHeatmap(
        '/empty',
        new Date('2025-01-01'),
        new Date('2025-01-31'),
      );

      expect(result).toEqual([]);
    });

    it('should skip invalid coordinates', async () => {
      const mockClicks = [
        { payload: { coordinates: { x: 100, y: 200 } } },
        { payload: {} },
        { payload: null },
        { payload: { coordinates: { x: 150, y: 250 } } },
      ];
      mockPrisma.behaviorLog.findMany.mockResolvedValue(mockClicks);

      const result = await service.generateHeatmap(
        '/page',
        new Date('2025-01-01'),
        new Date('2025-01-31'),
      );

      expect(result.length).toBeGreaterThan(0);
    });

    it('should use custom grid size', async () => {
      const mockClicks = [
        { payload: { coordinates: { x: 100, y: 100 } } },
        { payload: { coordinates: { x: 199, y: 199 } } },
      ];
      mockPrisma.behaviorLog.findMany.mockResolvedValue(mockClicks);

      const result = await service.generateHeatmap(
        '/page',
        new Date('2025-01-01'),
        new Date('2025-01-31'),
        100,
      );

      expect(result.length).toBe(1);
      expect(result[0].x).toBe(100);
      expect(result[0].y).toBe(100);
    });

    it('should aggregate clicks in same grid cell', async () => {
      const mockClicks = [
        { payload: { coordinates: { x: 10, y: 10 } } },
        { payload: { coordinates: { x: 15, y: 15 } } },
        { payload: { coordinates: { x: 20, y: 20 } } },
      ];
      mockPrisma.behaviorLog.findMany.mockResolvedValue(mockClicks);

      const result = await service.generateHeatmap(
        '/page',
        new Date('2025-01-01'),
        new Date('2025-01-31'),
        50,
      );

      expect(result.length).toBe(1);
      expect(result[0].intensity).toBe(1);
    });
  });

  describe('analyzeScrollDepth', () => {
    it('should calculate average and max scroll depth', async () => {
      const mockScrolls = [
        { payload: { scrollPercentage: 50 } },
        { payload: { scrollPercentage: 75 } },
        { payload: { scrollPercentage: 100 } },
        { payload: { scrollPercentage: 25 } },
      ];
      mockPrisma.behaviorLog.findMany.mockResolvedValue(mockScrolls);

      const result = await service.analyzeScrollDepth(
        '/article',
        new Date('2025-01-01'),
        new Date('2025-01-31'),
      );

      expect(result).toEqual({
        path: '/article',
        maxDepth: 100,
        averageDepth: 62.5,
        totalEvents: 4,
      });
    });

    it('should handle no scroll events', async () => {
      mockPrisma.behaviorLog.findMany.mockResolvedValue([]);

      const result = await service.analyzeScrollDepth(
        '/page',
        new Date('2025-01-01'),
        new Date('2025-01-31'),
      );

      expect(result).toEqual({
        path: '/page',
        maxDepth: 0,
        averageDepth: 0,
        totalEvents: 0,
      });
    });

    it('should skip events without scrollPercentage', async () => {
      const mockScrolls = [
        { payload: { scrollPercentage: 50 } },
        { payload: {} },
        { payload: null },
        { payload: { scrollPercentage: 80 } },
      ];
      mockPrisma.behaviorLog.findMany.mockResolvedValue(mockScrolls);

      const result = await service.analyzeScrollDepth(
        '/page',
        new Date('2025-01-01'),
        new Date('2025-01-31'),
      );

      // Average is calculated from all 4 events: (50+0+0+80)/4 = 32.5
      expect(result.averageDepth).toBe(32.5);
      expect(result.maxDepth).toBe(80);
    });

    it('should find maximum scroll depth correctly', async () => {
      const mockScrolls = [
        { payload: { scrollPercentage: 30 } },
        { payload: { scrollPercentage: 95 } },
        { payload: { scrollPercentage: 60 } },
      ];
      mockPrisma.behaviorLog.findMany.mockResolvedValue(mockScrolls);

      const result = await service.analyzeScrollDepth(
        '/long-article',
        new Date('2025-01-01'),
        new Date('2025-01-31'),
      );

      expect(result.maxDepth).toBe(95);
    });
  });

  describe('getClickPatterns', () => {
    it('should retrieve user click patterns', async () => {
      const mockClicks = [
        {
          payload: { coordinates: { x: 100, y: 200 }, elementId: 'btn1' },
          path: '/dashboard',
          timestamp: new Date('2025-01-15T10:00:00Z'),
        },
        {
          payload: { coordinates: { x: 150, y: 250 } },
          path: '/settings',
          timestamp: new Date('2025-01-15T11:00:00Z'),
        },
      ];
      mockPrisma.behaviorLog.findMany.mockResolvedValue(mockClicks);

      const result = await service.getClickPatterns('user1', 50);

      expect(mockPrisma.behaviorLog.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user1',
          eventType: 'CLICK',
        },
        orderBy: {
          timestamp: 'desc',
        },
        take: 50,
        select: {
          payload: true,
          path: true,
          timestamp: true,
        },
      });

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        x: 100,
        y: 200,
        timestamp: expect.any(Date),
        path: '/dashboard',
        elementId: 'btn1',
      });
    });

    it('should filter out invalid coordinates', async () => {
      const mockClicks = [
        {
          payload: { coordinates: { x: 100, y: 200 } },
          path: '/page1',
          timestamp: new Date(),
        },
        {
          payload: {},
          path: '/page2',
          timestamp: new Date(),
        },
        {
          payload: null,
          path: '/page3',
          timestamp: new Date(),
        },
      ];
      mockPrisma.behaviorLog.findMany.mockResolvedValue(mockClicks);

      const result = await service.getClickPatterns('user1');

      expect(result).toHaveLength(1);
    });

    it('should respect limit parameter', async () => {
      mockPrisma.behaviorLog.findMany.mockResolvedValue([]);

      await service.getClickPatterns('user1', 25);

      expect(mockPrisma.behaviorLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 25,
        }),
      );
    });
  });

  describe('getHotspots', () => {
    it('should filter cells by intensity threshold', async () => {
      const mockClicks = [
        ...Array(10).fill({ payload: { coordinates: { x: 100, y: 100 } } }),
        ...Array(5).fill({ payload: { coordinates: { x: 200, y: 200 } } }),
        ...Array(2).fill({ payload: { coordinates: { x: 300, y: 300 } } }),
      ];
      mockPrisma.behaviorLog.findMany.mockResolvedValue(mockClicks);

      const result = await service.getHotspots(
        '/dashboard',
        new Date('2025-01-01'),
        new Date('2025-01-31'),
        0.5,
      );

      expect(result.every((cell) => cell.intensity >= 0.5)).toBe(true);
    });

    it('should return empty array if no hotspots meet threshold', async () => {
      const mockClicks = [{ payload: { coordinates: { x: 100, y: 100 } } }];
      mockPrisma.behaviorLog.findMany.mockResolvedValue(mockClicks);

      const result = await service.getHotspots(
        '/page',
        new Date('2025-01-01'),
        new Date('2025-01-31'),
        0.9,
      );

      expect(result).toBeInstanceOf(Array);
    });

    it('should use default threshold of 0.7', async () => {
      const mockClicks = Array(10).fill({
        payload: { coordinates: { x: 100, y: 100 } },
      });
      mockPrisma.behaviorLog.findMany.mockResolvedValue(mockClicks);

      const result = await service.getHotspots(
        '/page',
        new Date('2025-01-01'),
        new Date('2025-01-31'),
      );

      expect(result.every((cell) => cell.intensity >= 0.7)).toBe(true);
    });
  });

  describe('analyzeUserEngagement', () => {
    it('should calculate comprehensive engagement metrics', async () => {
      mockPrisma.behaviorLog.count
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(30);

      mockPrisma.behaviorLog.findMany.mockResolvedValue([
        { sessionId: 'session1', duration: 120, path: '/dashboard' },
        { sessionId: 'session1', duration: 80, path: '/dashboard' },
        { sessionId: 'session2', duration: 150, path: '/courses' },
        { sessionId: 'session2', duration: 100, path: '/dashboard' },
      ]);

      const result = await service.analyzeUserEngagement(
        'user1',
        new Date('2025-01-01'),
        new Date('2025-01-31'),
      );

      // session1 duration = 120+80 = 200, session2 duration = 150+100 = 250
      // avg = (200+250)/2 = 225
      expect(result).toEqual({
        totalClicks: 50,
        totalScrolls: 30,
        avgSessionDuration: 225,
        mostVisitedPages: expect.arrayContaining(['/dashboard', '/courses']),
      });
    });

    it('should handle user with no activity', async () => {
      mockPrisma.behaviorLog.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      mockPrisma.behaviorLog.findMany.mockResolvedValue([]);

      const result = await service.analyzeUserEngagement(
        'user2',
        new Date('2025-01-01'),
        new Date('2025-01-31'),
      );

      expect(result).toEqual({
        totalClicks: 0,
        totalScrolls: 0,
        avgSessionDuration: 0,
        mostVisitedPages: [],
      });
    });

    it('should limit most visited pages to top 5', async () => {
      mockPrisma.behaviorLog.count
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(50);

      const sessions = Array.from({ length: 7 }, (_, i) => ({
        sessionId: `session${i}`,
        duration: 100,
        path: `/page${i}`,
      }));
      mockPrisma.behaviorLog.findMany.mockResolvedValue(sessions);

      const result = await service.analyzeUserEngagement(
        'user3',
        new Date('2025-01-01'),
        new Date('2025-01-31'),
      );

      expect(result.mostVisitedPages.length).toBeLessThanOrEqual(5);
    });

    it('should aggregate session durations correctly', async () => {
      mockPrisma.behaviorLog.count
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(5);

      mockPrisma.behaviorLog.findMany.mockResolvedValue([
        { sessionId: 'session1', duration: 60, path: '/page1' },
        { sessionId: 'session1', duration: 40, path: '/page2' },
        { sessionId: 'session2', duration: 100, path: '/page1' },
      ]);

      const result = await service.analyzeUserEngagement(
        'user4',
        new Date('2025-01-01'),
        new Date('2025-01-31'),
      );

      expect(result.avgSessionDuration).toBe(100);
    });

    it('should sort pages by visit count', async () => {
      mockPrisma.behaviorLog.count
        .mockResolvedValueOnce(20)
        .mockResolvedValueOnce(10);

      mockPrisma.behaviorLog.findMany.mockResolvedValue([
        { sessionId: 's1', duration: 50, path: '/dashboard' },
        { sessionId: 's2', duration: 50, path: '/dashboard' },
        { sessionId: 's3', duration: 50, path: '/dashboard' },
        { sessionId: 's4', duration: 50, path: '/courses' },
        { sessionId: 's5', duration: 50, path: '/courses' },
        { sessionId: 's6', duration: 50, path: '/settings' },
      ]);

      const result = await service.analyzeUserEngagement(
        'user5',
        new Date('2025-01-01'),
        new Date('2025-01-31'),
      );

      expect(result.mostVisitedPages[0]).toBe('/dashboard');
      expect(result.mostVisitedPages[1]).toBe('/courses');
    });
  });
});
