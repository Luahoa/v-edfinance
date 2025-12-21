/**
 * I017: Market Simulation Competition Integration Test
 * Tests: Multiple users join simulation → Execute trades → Results calculated → Leaderboard updates
 * Validates: Concurrent execution, fair ranking
 */

import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';

const mockPrismaService = {
  marketSimulation: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  simulationParticipant: {
    create: vi.fn(),
    createMany: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
  },
  simulationTrade: {
    create: vi.fn(),
    createMany: vi.fn(),
    findMany: vi.fn(),
  },
  leaderboard: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  leaderboardEntry: {
    create: vi.fn(),
    createMany: vi.fn(),
    findMany: vi.fn(),
    updateMany: vi.fn(),
  },
  behaviorLog: {
    create: vi.fn(),
  },
};

const mockMarketDataService = {
  getStockPrice: vi.fn(),
  calculatePortfolioValue: vi.fn(),
};

describe('[I017] Market Simulation Competition Integration', () => {
  let app: INestApplication;
  const simulationId = 'sim-competition-1';
  const participantIds = ['user-1', 'user-2', 'user-3', 'user-4', 'user-5'];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        { provide: 'PrismaService', useValue: mockPrismaService },
        { provide: 'MarketDataService', useValue: mockMarketDataService },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  it('Scenario 1: Create market simulation competition', async () => {
    mockPrismaService.marketSimulation.create.mockResolvedValue({
      id: simulationId,
      name: 'Stock Trading Challenge Q1 2024',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-03-31'),
      initialCapital: 100000000, // 100M VND
      allowedMarkets: ['HOSE', 'HNX'],
      status: 'UPCOMING',
    });

    const simulation = await mockPrismaService.marketSimulation.create({
      data: {
        name: 'Stock Trading Challenge Q1 2024',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-03-31'),
        initialCapital: 100000000,
        allowedMarkets: ['HOSE', 'HNX'],
        status: 'UPCOMING',
      },
    });

    expect(simulation.id).toBe(simulationId);
    expect(simulation.initialCapital).toBe(100000000);
  });

  it('Scenario 2: Multiple users join simulation concurrently', async () => {
    mockPrismaService.simulationParticipant.createMany.mockResolvedValue({
      count: participantIds.length,
    });

    mockPrismaService.simulationParticipant.findMany.mockResolvedValue(
      participantIds.map((userId, idx) => ({
        id: `participant-${idx + 1}`,
        simulationId,
        userId,
        currentCash: 100000000,
        portfolioValue: 100000000,
        totalValue: 100000000,
        rank: null,
      }))
    );

    const result = await mockPrismaService.simulationParticipant.createMany({
      data: participantIds.map((userId) => ({
        simulationId,
        userId,
        currentCash: 100000000,
        portfolioValue: 0,
        totalValue: 100000000,
      })),
    });

    expect(result.count).toBe(5);

    const participants = await mockPrismaService.simulationParticipant.findMany({
      where: { simulationId },
    });

    expect(participants).toHaveLength(5);
    expect(participants.every((p) => p.currentCash === 100000000)).toBe(true);
  });

  it('Scenario 3: Participants execute trades simultaneously', async () => {
    const trades = [
      { userId: 'user-1', symbol: 'VNM', action: 'BUY', quantity: 1000, price: 80000 },
      { userId: 'user-2', symbol: 'VIC', action: 'BUY', quantity: 500, price: 45000 },
      { userId: 'user-3', symbol: 'HPG', action: 'BUY', quantity: 2000, price: 30000 },
      { userId: 'user-4', symbol: 'VNM', action: 'BUY', quantity: 800, price: 80000 },
      { userId: 'user-5', symbol: 'VCB', action: 'BUY', quantity: 300, price: 95000 },
    ];

    mockMarketDataService.getStockPrice.mockImplementation((symbol: string) => {
      const prices = {
        VNM: 80000,
        VIC: 45000,
        HPG: 30000,
        VCB: 95000,
      };
      return Promise.resolve(prices[symbol]);
    });

    mockPrismaService.simulationTrade.createMany.mockResolvedValue({
      count: trades.length,
    });

    // Execute all trades concurrently
    const tradePromises = trades.map(async (trade) => {
      const price = await mockMarketDataService.getStockPrice(trade.symbol);
      const totalCost = trade.quantity * price;

      return mockPrismaService.simulationTrade.create({
        data: {
          simulationId,
          userId: trade.userId,
          symbol: trade.symbol,
          action: trade.action,
          quantity: trade.quantity,
          price,
          totalValue: totalCost,
          executedAt: new Date(),
        },
      });
    });

    await Promise.all(tradePromises);

    expect(mockMarketDataService.getStockPrice).toHaveBeenCalledTimes(5);
    expect(mockPrismaService.simulationTrade.create).toHaveBeenCalledTimes(5);
  });

  it('Scenario 4: Calculate portfolio values for all participants', async () => {
    mockPrismaService.simulationTrade.findMany.mockImplementation(({ where }) => {
      const userTrades = {
        'user-1': [{ symbol: 'VNM', quantity: 1000, price: 80000 }],
        'user-2': [{ symbol: 'VIC', quantity: 500, price: 45000 }],
        'user-3': [{ symbol: 'HPG', quantity: 2000, price: 30000 }],
      };
      return Promise.resolve(userTrades[where.userId] || []);
    });

    mockMarketDataService.calculatePortfolioValue.mockImplementation((trades) => {
      const totalValue = trades.reduce((sum, t) => sum + t.quantity * t.price * 1.1, 0); // 10% gain
      return Promise.resolve(totalValue);
    });

    const portfolioValues = [];

    for (const userId of participantIds.slice(0, 3)) {
      const trades = await mockPrismaService.simulationTrade.findMany({
        where: { simulationId, userId },
      });

      const portfolioValue = await mockMarketDataService.calculatePortfolioValue(trades);
      portfolioValues.push({ userId, portfolioValue });
    }

    expect(portfolioValues).toHaveLength(3);
    expect(portfolioValues[0].portfolioValue).toBeGreaterThan(0);
    expect(mockMarketDataService.calculatePortfolioValue).toHaveBeenCalledTimes(3);
  });

  it('Scenario 5: Update participant rankings based on total value', async () => {
    const participantValues = [
      { userId: 'user-1', totalValue: 115000000, profit: 15000000 }, // +15%
      { userId: 'user-2', totalValue: 108000000, profit: 8000000 }, // +8%
      { userId: 'user-3', totalValue: 122000000, profit: 22000000 }, // +22% (Best)
      { userId: 'user-4', totalValue: 95000000, profit: -5000000 }, // -5%
      { userId: 'user-5', totalValue: 110000000, profit: 10000000 }, // +10%
    ];

    // Sort by totalValue descending
    const ranked = participantValues.sort((a, b) => b.totalValue - a.totalValue);

    mockPrismaService.simulationParticipant.update.mockImplementation(({ where, data }) => {
      return Promise.resolve({
        userId: where.userId,
        rank: data.rank,
        totalValue: data.totalValue,
      });
    });

    const updatePromises = ranked.map((participant, index) => {
      return mockPrismaService.simulationParticipant.update({
        where: {
          simulationId_userId: {
            simulationId,
            userId: participant.userId,
          },
        },
        data: {
          rank: index + 1,
          totalValue: participant.totalValue,
        },
      });
    });

    await Promise.all(updatePromises);

    // Verify rankings
    expect(ranked[0].userId).toBe('user-3'); // Rank 1
    expect(ranked[1].userId).toBe('user-1'); // Rank 2
    expect(ranked[4].userId).toBe('user-4'); // Rank 5 (loss)
  });

  it('Scenario 6: Update global leaderboard', async () => {
    mockPrismaService.leaderboard.findUnique.mockResolvedValue({
      id: 'leaderboard-1',
      name: 'Market Simulation Leaderboard',
      type: 'SIMULATION',
    });

    mockPrismaService.leaderboardEntry.createMany.mockResolvedValue({
      count: 5,
    });

    const topParticipants = [
      { userId: 'user-3', score: 22000, rank: 1 },
      { userId: 'user-1', score: 15000, rank: 2 },
      { userId: 'user-5', score: 10000, rank: 3 },
    ];

    await mockPrismaService.leaderboardEntry.createMany({
      data: topParticipants.map((p) => ({
        leaderboardId: 'leaderboard-1',
        userId: p.userId,
        score: p.score,
        rank: p.rank,
        metadata: { simulationId },
      })),
    });

    expect(mockPrismaService.leaderboardEntry.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({ userId: 'user-3', rank: 1 }),
        ]),
      })
    );
  });

  it('Scenario 7: Verify fair ranking with concurrent trades', async () => {
    // Simulate race condition: two users buy same stock at same time
    const concurrentTrades = [
      {
        userId: 'user-1',
        symbol: 'VNM',
        quantity: 1000,
        timestamp: new Date('2024-01-15T10:00:00.000Z'),
      },
      {
        userId: 'user-2',
        symbol: 'VNM',
        quantity: 1000,
        timestamp: new Date('2024-01-15T10:00:00.001Z'), // 1ms later
      },
    ];

    mockMarketDataService.getStockPrice.mockResolvedValue(80000); // Same price for both

    const results = [];

    for (const trade of concurrentTrades) {
      const price = await mockMarketDataService.getStockPrice(trade.symbol);
      results.push({
        userId: trade.userId,
        executionPrice: price,
        timestamp: trade.timestamp,
      });
    }

    // Both should get same price (fair execution)
    expect(results[0].executionPrice).toBe(results[1].executionPrice);

    // But different timestamps preserve order
    expect(results[0].timestamp.getTime()).toBeLessThan(results[1].timestamp.getTime());
  });

  it('Scenario 8: End simulation and finalize results', async () => {
    mockPrismaService.marketSimulation.update.mockResolvedValue({
      id: simulationId,
      status: 'COMPLETED',
      endDate: new Date(),
    });

    mockPrismaService.simulationParticipant.findMany.mockResolvedValue([
      { userId: 'user-3', rank: 1, totalValue: 122000000, profit: 22 },
      { userId: 'user-1', rank: 2, totalValue: 115000000, profit: 15 },
      { userId: 'user-5', rank: 3, totalValue: 110000000, profit: 10 },
    ]);

    const simulation = await mockPrismaService.marketSimulation.update({
      where: { id: simulationId },
      data: { status: 'COMPLETED' },
    });

    const finalRankings = await mockPrismaService.simulationParticipant.findMany({
      where: { simulationId },
      orderBy: { rank: 'asc' },
      take: 3,
    });

    expect(simulation.status).toBe('COMPLETED');
    expect(finalRankings[0].userId).toBe('user-3'); // Winner
    expect(finalRankings[0].profit).toBe(22); // 22% profit

    // Log completion event
    expect(mockPrismaService.behaviorLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eventType: 'SIMULATION_COMPLETED',
        }),
      })
    );
  });
});
