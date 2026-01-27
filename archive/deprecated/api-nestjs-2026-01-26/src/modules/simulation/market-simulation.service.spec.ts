import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SimulationService } from './simulation.service';

/**
 * Market Simulation Test Suite
 * Coverage Target: 85%+
 *
 * Test Areas:
 * 1. Stock/Crypto Price Simulation (Virtual Portfolio Trading)
 * 2. Scenario-based Predictions (Life Scenarios)
 * 3. Localization (VI/EN/ZH Markets)
 * 4. JSONB Market Data Validation
 */

describe('Market Simulation Service - Comprehensive Test Suite', () => {
  let service: SimulationService;
  let mockPrisma: any;
  let mockAi: any;
  let mockEventEmitter: any;
  let mockValidation: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockPrisma = {
      virtualPortfolio: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      simulationScenario: {
        create: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      simulationCommitment: {
        create: vi.fn(),
        findUnique: vi.fn(),
        delete: vi.fn(),
      },
      behaviorLog: {
        create: vi.fn(),
      },
      $transaction: vi.fn(async (cb) => {
        if (typeof cb === 'function') {
          return cb(mockPrisma);
        }
        return cb;
      }),
    };

    mockAi = {
      modelInstance: {
        generateContent: vi.fn(),
      },
    };

    mockEventEmitter = {
      emit: vi.fn(),
    };

    mockValidation = {
      validate: vi.fn((type, data) => data),
    };

    service = new SimulationService(
      mockPrisma,
      mockAi,
      mockEventEmitter,
      mockValidation,
    );
  });

  // ==================== STOCK/CRYPTO PRICE SIMULATION ====================
  describe('Stock/Crypto Price Simulation', () => {
    describe('Virtual Portfolio Creation', () => {
      it('should create new portfolio with default balance for new user', async () => {
        mockPrisma.virtualPortfolio.findUnique.mockResolvedValue(null);
        mockPrisma.virtualPortfolio.create.mockResolvedValue({
          id: 'portfolio-1',
          userId: 'user-1',
          assets: {},
          balance: 100000.0,
          createdAt: new Date(),
        });

        const portfolio = await service.getPortfolio('user-1');

        expect(mockPrisma.virtualPortfolio.findUnique).toHaveBeenCalledWith({
          where: { userId: 'user-1' },
        });
        expect(mockPrisma.virtualPortfolio.create).toHaveBeenCalledWith({
          data: {
            userId: 'user-1',
            assets: {},
            balance: 100000.0,
          },
        });
        expect(portfolio.balance).toBe(100000.0);
        expect(portfolio.assets).toEqual({});
      });

      it('should return existing portfolio for existing user', async () => {
        const existingPortfolio = {
          id: 'portfolio-1',
          userId: 'user-1',
          assets: { BTC: 2, ETH: 10 },
          balance: 50000.0,
        };

        mockPrisma.virtualPortfolio.findUnique.mockResolvedValue(
          existingPortfolio,
        );

        const portfolio = await service.getPortfolio('user-1');

        expect(mockPrisma.virtualPortfolio.findUnique).toHaveBeenCalledWith({
          where: { userId: 'user-1' },
        });
        expect(mockPrisma.virtualPortfolio.create).not.toHaveBeenCalled();
        expect(portfolio).toEqual(existingPortfolio);
      });
    });

    describe('Stock Trading - BUY Operations', () => {
      it('should execute BUY trade for stock with sufficient balance', async () => {
        mockPrisma.virtualPortfolio.findUnique.mockResolvedValue({
          userId: 'user-1',
          balance: 100000,
          assets: {},
        });
        mockPrisma.virtualPortfolio.update.mockResolvedValue({
          userId: 'user-1',
          balance: 90000,
          assets: { AAPL: 5 },
        });

        const result = await service.trade('user-1', 'AAPL', 5, 'BUY', 2000);

        expect(mockValidation.validate).toHaveBeenCalledWith(
          'PORTFOLIO_ASSETS',
          { AAPL: 5 },
        );
        expect(mockPrisma.virtualPortfolio.update).toHaveBeenCalledWith({
          where: { userId: 'user-1' },
          data: {
            balance: { decrement: 10000 },
            assets: { AAPL: 5 },
          },
        });
        expect(result.balance).toBe(90000);
        expect(result.assets).toEqual({ AAPL: 5 });
      });

      it('should accumulate stock holdings on multiple BUY trades', async () => {
        mockPrisma.virtualPortfolio.findUnique.mockResolvedValue({
          userId: 'user-1',
          balance: 100000,
          assets: { AAPL: 5 },
        });
        mockPrisma.virtualPortfolio.update.mockResolvedValue({
          userId: 'user-1',
          balance: 95000,
          assets: { AAPL: 7.5 },
        });

        const result = await service.trade('user-1', 'AAPL', 2.5, 'BUY', 2000);

        expect(mockValidation.validate).toHaveBeenCalledWith(
          'PORTFOLIO_ASSETS',
          { AAPL: 7.5 },
        );
        expect(result.assets).toEqual({ AAPL: 7.5 });
      });

      it('should throw error when balance insufficient for BUY trade', async () => {
        mockPrisma.virtualPortfolio.findUnique.mockResolvedValue({
          userId: 'user-1',
          balance: 5000,
          assets: {},
        });

        await expect(
          service.trade('user-1', 'TSLA', 1, 'BUY', 10000),
        ).rejects.toThrow('Insufficient virtual balance');
      });
    });

    describe('Crypto Trading - BUY Operations', () => {
      it('should execute BUY trade for Bitcoin', async () => {
        mockPrisma.virtualPortfolio.findUnique.mockResolvedValue({
          userId: 'user-1',
          balance: 100000,
          assets: {},
        });
        mockPrisma.virtualPortfolio.update.mockResolvedValue({
          userId: 'user-1',
          balance: 60000,
          assets: { BTC: 1 },
        });

        const result = await service.trade('user-1', 'BTC', 1, 'BUY', 40000);

        expect(result.balance).toBe(60000);
        expect(result.assets).toEqual({ BTC: 1 });
      });

      it('should execute BUY trade for Ethereum', async () => {
        mockPrisma.virtualPortfolio.findUnique.mockResolvedValue({
          userId: 'user-1',
          balance: 100000,
          assets: { BTC: 1 },
        });
        mockPrisma.virtualPortfolio.update.mockResolvedValue({
          userId: 'user-1',
          balance: 70000,
          assets: { BTC: 1, ETH: 10 },
        });

        const result = await service.trade('user-1', 'ETH', 10, 'BUY', 3000);

        expect(result.assets).toEqual({ BTC: 1, ETH: 10 });
      });

      it('should handle fractional crypto amounts', async () => {
        mockPrisma.virtualPortfolio.findUnique.mockResolvedValue({
          userId: 'user-1',
          balance: 100000,
          assets: {},
        });
        mockPrisma.virtualPortfolio.update.mockResolvedValue({
          userId: 'user-1',
          balance: 90000,
          assets: { BTC: 0.25 },
        });

        const result = await service.trade('user-1', 'BTC', 0.25, 'BUY', 40000);

        expect(result.assets).toEqual({ BTC: 0.25 });
      });
    });

    describe('Asset Trading - SELL Operations', () => {
      it('should execute SELL trade with sufficient assets', async () => {
        mockPrisma.virtualPortfolio.findUnique.mockResolvedValue({
          userId: 'user-1',
          balance: 50000,
          assets: { BTC: 2 },
        });
        mockPrisma.virtualPortfolio.update.mockResolvedValue({
          userId: 'user-1',
          balance: 90000,
          assets: { BTC: 1 },
        });

        const result = await service.trade('user-1', 'BTC', 1, 'SELL', 40000);

        expect(mockValidation.validate).toHaveBeenCalledWith(
          'PORTFOLIO_ASSETS',
          { BTC: 1 },
        );
        expect(mockPrisma.virtualPortfolio.update).toHaveBeenCalledWith({
          where: { userId: 'user-1' },
          data: {
            balance: { increment: 40000 },
            assets: { BTC: 1 },
          },
        });
        expect(result.balance).toBe(90000);
      });

      it('should remove asset from portfolio when fully sold', async () => {
        mockPrisma.virtualPortfolio.findUnique.mockResolvedValue({
          userId: 'user-1',
          balance: 50000,
          assets: { BTC: 1, ETH: 5 },
        });
        mockPrisma.virtualPortfolio.update.mockResolvedValue({
          userId: 'user-1',
          balance: 90000,
          assets: { ETH: 5 },
        });

        const result = await service.trade('user-1', 'BTC', 1, 'SELL', 40000);

        expect(mockValidation.validate).toHaveBeenCalledWith(
          'PORTFOLIO_ASSETS',
          { ETH: 5 },
        );
        expect(result.assets).toEqual({ ETH: 5 });
      });

      it('should throw error when trying to sell more than owned', async () => {
        mockPrisma.virtualPortfolio.findUnique.mockResolvedValue({
          userId: 'user-1',
          balance: 50000,
          assets: { BTC: 0.5 },
        });

        await expect(
          service.trade('user-1', 'BTC', 1, 'SELL', 40000),
        ).rejects.toThrow('Insufficient assets');
      });

      it('should throw error when trying to sell non-existent asset', async () => {
        mockPrisma.virtualPortfolio.findUnique.mockResolvedValue({
          userId: 'user-1',
          balance: 50000,
          assets: { BTC: 1 },
        });

        await expect(
          service.trade('user-1', 'ETH', 5, 'SELL', 3000),
        ).rejects.toThrow('Insufficient assets');
      });
    });

    describe('Multi-Asset Portfolio Management', () => {
      it('should handle diverse portfolio with multiple stocks and crypto', async () => {
        const diversePortfolio = {
          userId: 'user-1',
          balance: 25000,
          assets: {
            BTC: 0.5,
            ETH: 5,
            AAPL: 10,
            TSLA: 3,
            GOOGL: 2,
          },
        };

        mockPrisma.virtualPortfolio.findUnique.mockResolvedValue(
          diversePortfolio,
        );

        const portfolio = await service.getPortfolio('user-1');

        expect(portfolio.assets).toHaveProperty('BTC');
        expect(portfolio.assets).toHaveProperty('ETH');
        expect(portfolio.assets).toHaveProperty('AAPL');
        expect(portfolio.assets).toHaveProperty('TSLA');
        expect(portfolio.assets).toHaveProperty('GOOGL');
      });
    });
  });

  // ==================== SCENARIO-BASED PREDICTIONS ====================
  describe('Scenario-Based Predictions', () => {
    describe('Life Scenario Generation', () => {
      it('should start life scenario with AI-generated event', async () => {
        const mockAiResponse = {
          eventTitle: 'Job Offer',
          description: 'You received a job offer with 20% salary increase',
          options: [
            {
              id: 'A',
              text: 'Accept and relocate',
              impact: { savings: -2000000, happiness: 20 },
            },
            {
              id: 'B',
              text: 'Decline and stay',
              impact: { savings: 0, happiness: -5 },
            },
          ],
          aiNudge:
            'Social Proof: 75% of professionals in your field accept relocation offers',
        };

        mockAi.modelInstance.generateContent.mockResolvedValue({
          response: {
            text: () => JSON.stringify(mockAiResponse),
          },
        });

        mockPrisma.simulationScenario.create.mockResolvedValue({
          id: 'scenario-1',
          userId: 'user-1',
          type: 'LIFE',
          currentStatus: expect.any(Object),
          decisions: [mockAiResponse],
          isActive: true,
        });

        const scenario = await service.startLifeScenario('user-1');

        expect(mockAi.modelInstance.generateContent).toHaveBeenCalled();
        expect(mockValidation.validate).toHaveBeenCalledWith(
          'SIMULATION_STATUS',
          expect.any(Object),
        );
        expect(mockValidation.validate).toHaveBeenCalledWith(
          'SIMULATION_EVENT',
          mockAiResponse,
        );
        expect(scenario.type).toBe('LIFE');
        expect(scenario.isActive).toBe(true);
      });

      it('should handle AI response with code block formatting', async () => {
        const mockEvent = {
          eventTitle: 'Investment Opportunity',
          description: 'Crypto investment opportunity',
          options: [
            {
              id: 'A',
              text: 'Invest',
              impact: { savings: -5000000, happiness: 0 },
            },
            { id: 'B', text: 'Skip', impact: { savings: 0, happiness: 0 } },
          ],
          aiNudge:
            'Loss Aversion: Missing this could mean losing potential gains',
        };

        mockAi.modelInstance.generateContent.mockResolvedValue({
          response: {
            text: () => `\`\`\`json\n${JSON.stringify(mockEvent)}\n\`\`\``,
          },
        });

        mockPrisma.simulationScenario.create.mockResolvedValue({
          id: 'scenario-2',
          userId: 'user-1',
          type: 'LIFE',
        });

        await service.startLifeScenario('user-1');

        expect(mockValidation.validate).toHaveBeenCalledWith(
          'SIMULATION_EVENT',
          mockEvent,
        );
      });
    });

    describe('Life Scenario Continuation', () => {
      it('should continue scenario based on user choice', async () => {
        const existingScenario = {
          id: 'scenario-1',
          userId: 'user-1',
          currentStatus: {
            age: 22,
            job: 'Junior Developer',
            salary: 15000000,
            savings: 5000000,
            goals: ['Buy a house'],
            happiness: 100,
          },
          decisions: [
            {
              eventTitle: 'Job Offer',
              options: [
                {
                  id: 'A',
                  text: 'Accept',
                  impact: { savings: -2000000, happiness: 20 },
                },
                {
                  id: 'B',
                  text: 'Decline',
                  impact: { savings: 0, happiness: -5 },
                },
              ],
            },
          ],
        };

        mockPrisma.simulationScenario.findUnique.mockResolvedValue(
          existingScenario,
        );

        const nextEvent = {
          eventTitle: 'Housing Decision',
          description: 'Rent or Buy?',
          options: [
            {
              id: 'A',
              text: 'Buy house',
              impact: { savings: -30000000, happiness: 30 },
            },
            {
              id: 'B',
              text: 'Rent',
              impact: { savings: -5000000, happiness: -10 },
            },
          ],
          aiNudge: 'Time Machine: Buying now locks in price before inflation',
        };

        mockAi.modelInstance.generateContent.mockResolvedValue({
          response: {
            text: () => JSON.stringify(nextEvent),
          },
        });

        mockPrisma.simulationScenario.update.mockResolvedValue({
          id: 'scenario-1',
          currentStatus: {
            age: 22,
            job: 'Junior Developer',
            salary: 15000000,
            savings: 3000000,
            happiness: 120,
          },
          decisions: expect.any(Array),
        });

        const result = await service.continueLifeScenario(
          'user-1',
          'scenario-1',
          'A',
        );

        expect(result.currentStatus.savings).toBe(3000000);
        expect(result.currentStatus.happiness).toBe(120);
        expect(mockValidation.validate).toHaveBeenCalledWith(
          'SIMULATION_STATUS',
          expect.any(Object),
        );
        expect(mockValidation.validate).toHaveBeenCalledWith(
          'SIMULATION_DECISIONS',
          expect.any(Array),
        );
      });

      it('should throw error for invalid scenario', async () => {
        mockPrisma.simulationScenario.findUnique.mockResolvedValue(null);

        await expect(
          service.continueLifeScenario('user-1', 'invalid-scenario', 'A'),
        ).rejects.toThrow('Scenario not found');
      });

      it('should throw error for mismatched userId', async () => {
        mockPrisma.simulationScenario.findUnique.mockResolvedValue({
          id: 'scenario-1',
          userId: 'user-2',
        });

        await expect(
          service.continueLifeScenario('user-1', 'scenario-1', 'A'),
        ).rejects.toThrow('Scenario not found');
      });

      it('should throw error for invalid choice', async () => {
        mockPrisma.simulationScenario.findUnique.mockResolvedValue({
          id: 'scenario-1',
          userId: 'user-1',
          currentStatus: { age: 22, savings: 5000000 },
          decisions: [
            {
              eventTitle: 'Test',
              options: [
                {
                  id: 'A',
                  text: 'Option A',
                  impact: { savings: 0, happiness: 0 },
                },
              ],
            },
          ],
        });

        await expect(
          service.continueLifeScenario('user-1', 'scenario-1', 'Z'),
        ).rejects.toThrow('Invalid choice');
      });

      it('should occasionally age the user during scenario progression', async () => {
        const scenario = {
          id: 'scenario-1',
          userId: 'user-1',
          currentStatus: { age: 22, savings: 5000000, happiness: 100 },
          decisions: [
            {
              eventTitle: 'Test',
              options: [
                {
                  id: 'A',
                  text: 'Choice',
                  impact: { savings: 1000000, happiness: 10 },
                },
              ],
            },
          ],
        };

        mockPrisma.simulationScenario.findUnique.mockResolvedValue(scenario);
        mockAi.modelInstance.generateContent.mockResolvedValue({
          response: {
            text: () => JSON.stringify({ eventTitle: 'Next', options: [] }),
          },
        });

        vi.spyOn(Math, 'random').mockReturnValue(0.8);

        mockPrisma.simulationScenario.update.mockResolvedValue({
          currentStatus: { age: 23 },
        });

        const result = await service.continueLifeScenario(
          'user-1',
          'scenario-1',
          'A',
        );

        expect(mockValidation.validate).toHaveBeenCalledWith(
          'SIMULATION_STATUS',
          expect.objectContaining({ age: 23 }),
        );
      });
    });

    describe('Budget Decision Scenarios', () => {
      it('should validate optimal 50/30/20 budget allocation', async () => {
        const result = await service.processBudgetDecision('user-1', {
          needs: 50,
          wants: 30,
          savings: 20,
        });

        expect(result.success).toBe(true);
        expect(result.feedback).toContain('Excellent');
        expect(result.feedback).toContain('50/30/20');
      });

      it('should warn about high wants allocation', async () => {
        const result = await service.processBudgetDecision('user-1', {
          needs: 30,
          wants: 60,
          savings: 10,
        });

        expect(result.success).toBe(true);
        expect(result.feedback).toContain('Warning');
        expect(result.feedback).toContain('Wants');
      });

      it('should warn about low savings allocation', async () => {
        const result = await service.processBudgetDecision('user-1', {
          needs: 70,
          wants: 25,
          savings: 5,
        });

        expect(result.feedback).toContain('Warning');
      });

      it('should throw error when allocation does not sum to 100', async () => {
        await expect(
          service.processBudgetDecision('user-1', {
            needs: 50,
            wants: 30,
            savings: 15,
          }),
        ).rejects.toThrow('Total allocation must be 100%');
      });

      it('should provide loss aversion nudge', async () => {
        const result = await service.processBudgetDecision('user-1', {
          needs: 40,
          wants: 40,
          savings: 20,
        });

        expect(result.nudge).toContain('Loss Aversion');
        expect(result.nudge).toContain('compound interest');
      });
    });

    describe('Financial Stress Test Scenarios', () => {
      it('should calculate survival months accurately', async () => {
        const result = await service.runStressTest('user-1', {
          monthlyIncome: 20000000,
          monthlyExpenses: 10000000,
          emergencyFund: 60000000,
        });

        expect(result.survivalMonths).toBe('6.0');
      });

      it('should calculate inflation impact on survival', async () => {
        const result = await service.runStressTest('user-1', {
          monthlyIncome: 15000000,
          monthlyExpenses: 10000000,
          emergencyFund: 60000000,
        });

        expect(result.inflationStress.newExpenses).toBe(11000000);
        expect(
          parseFloat(result.inflationStress.newSurvivalMonths),
        ).toBeLessThan(6.0);
        expect(result.inflationStress.impact).toBe('Severe');
      });

      it('should emit nudge request during stress test', async () => {
        await service.runStressTest('user-1', {
          monthlyIncome: 15000000,
          monthlyExpenses: 10000000,
          emergencyFund: 60000000,
        });

        expect(mockEventEmitter.emit).toHaveBeenCalledWith('nudge.request', {
          userId: 'user-1',
          context: 'INVESTMENT_DECISION',
          data: { riskLevel: 90 },
        });
      });

      it('should provide social proof nudge', async () => {
        const result = await service.runStressTest('user-1', {
          monthlyIncome: 15000000,
          monthlyExpenses: 10000000,
          emergencyFund: 30000000,
        });

        expect(result.nudge).toContain('Social Proof');
        expect(result.nudge).toContain('6-month emergency fund');
      });
    });
  });

  // ==================== LOCALIZATION (VI/EN/ZH) ====================
  describe('Multi-Market Localization', () => {
    describe('Long-Term Impact Calculations', () => {
      it('should provide impact statements in Vietnamese (VI)', async () => {
        const result = await service.calculateLongTermImpact(
          'user-1',
          10000000,
          10,
        );

        expect(result.impactStatement.vi).toContain('VND');
        expect(result.impactStatement.vi).toContain('năm');
        expect(result.impactStatement.vi).toContain('đầu tư');
      });

      it('should provide impact statements in English (EN)', async () => {
        const result = await service.calculateLongTermImpact(
          'user-1',
          10000000,
          10,
        );

        expect(result.impactStatement.en).toContain('VND');
        expect(result.impactStatement.en).toContain('years');
        expect(result.impactStatement.en).toContain('invest');
      });

      it('should provide impact statements in Chinese (ZH)', async () => {
        const result = await service.calculateLongTermImpact(
          'user-1',
          10000000,
          10,
        );

        expect(result.impactStatement.zh).toContain('越南盾');
        expect(result.impactStatement.zh).toContain('年');
      });

      it('should calculate future value with 8% annual return', async () => {
        const result = await service.calculateLongTermImpact(
          'user-1',
          10000000,
          10,
        );

        const expectedValue = Math.round(10000000 * Math.pow(1.08, 10));
        expect(result.futureValue).toBe(expectedValue);
        expect(result.years).toBe(10);
      });

      it('should handle custom year periods', async () => {
        const result5Years = await service.calculateLongTermImpact(
          'user-1',
          10000000,
          5,
        );
        const result20Years = await service.calculateLongTermImpact(
          'user-1',
          10000000,
          20,
        );

        expect(result5Years.years).toBe(5);
        expect(result20Years.years).toBe(20);
        expect(result20Years.futureValue).toBeGreaterThan(
          result5Years.futureValue,
        );
      });

      it('should emit nudge request for budgeting context', async () => {
        await service.calculateLongTermImpact('user-1', 5000000, 15);

        expect(mockEventEmitter.emit).toHaveBeenCalledWith('nudge.request', {
          userId: 'user-1',
          context: 'BUDGETING',
          data: { amount: 5000000 },
        });
      });
    });

    describe('Market-Specific Currency Handling', () => {
      it('should handle VND (Vietnamese Dong) amounts', async () => {
        const result = await service.calculateLongTermImpact(
          'user-vi',
          15000000,
          10,
        );

        expect(result.originalAmount).toBe(15000000);
        expect(result.impactStatement.vi).toContain('VND');
        expect(result.impactStatement.vi).toContain('năm');
      });

      it('should format large VND amounts with localization', async () => {
        const result = await service.calculateLongTermImpact(
          'user-1',
          100000000,
          10,
        );

        expect(result.futureValue).toBeGreaterThan(100000000);
        expect(result.impactStatement.vi).toBeTruthy();
        expect(result.impactStatement.en).toBeTruthy();
        expect(result.impactStatement.zh).toBeTruthy();
      });
    });
  });

  // ==================== JSONB MARKET DATA VALIDATION ====================
  describe('JSONB Market Data Validation', () => {
    describe('Portfolio Assets Validation', () => {
      it('should validate JSONB portfolio assets on BUY trade', async () => {
        mockPrisma.virtualPortfolio.findUnique.mockResolvedValue({
          userId: 'user-1',
          balance: 100000,
          assets: {},
        });
        mockPrisma.virtualPortfolio.update.mockResolvedValue({});

        await service.trade('user-1', 'BTC', 1, 'BUY', 40000);

        expect(mockValidation.validate).toHaveBeenCalledWith(
          'PORTFOLIO_ASSETS',
          { BTC: 1 },
        );
      });

      it('should validate JSONB portfolio assets on SELL trade', async () => {
        mockPrisma.virtualPortfolio.findUnique.mockResolvedValue({
          userId: 'user-1',
          balance: 50000,
          assets: { BTC: 2, ETH: 5 },
        });
        mockPrisma.virtualPortfolio.update.mockResolvedValue({});

        await service.trade('user-1', 'BTC', 1, 'SELL', 40000);

        expect(mockValidation.validate).toHaveBeenCalledWith(
          'PORTFOLIO_ASSETS',
          { BTC: 1, ETH: 5 },
        );
      });

      it('should validate complex multi-asset portfolio', async () => {
        mockPrisma.virtualPortfolio.findUnique.mockResolvedValue({
          userId: 'user-1',
          balance: 100000,
          assets: { BTC: 1, ETH: 5, AAPL: 10 },
        });
        mockPrisma.virtualPortfolio.update.mockResolvedValue({});

        await service.trade('user-1', 'TSLA', 3, 'BUY', 5000);

        expect(mockValidation.validate).toHaveBeenCalledWith(
          'PORTFOLIO_ASSETS',
          {
            BTC: 1,
            ETH: 5,
            AAPL: 10,
            TSLA: 3,
          },
        );
      });
    });

    describe('Simulation Status Validation', () => {
      it('should validate JSONB simulation status on scenario start', async () => {
        mockAi.modelInstance.generateContent.mockResolvedValue({
          response: {
            text: () =>
              JSON.stringify({
                eventTitle: 'Test',
                options: [],
                aiNudge: 'Test nudge',
              }),
          },
        });
        mockPrisma.simulationScenario.create.mockResolvedValue({});

        await service.startLifeScenario('user-1');

        expect(mockValidation.validate).toHaveBeenCalledWith(
          'SIMULATION_STATUS',
          {
            age: 22,
            job: 'Junior Developer',
            salary: 15000000,
            savings: 5000000,
            goals: ['Buy a house', 'Emergency fund'],
          },
        );
      });

      it('should validate JSONB simulation status on scenario continuation', async () => {
        mockPrisma.simulationScenario.findUnique.mockResolvedValue({
          id: 'scenario-1',
          userId: 'user-1',
          currentStatus: { age: 25, savings: 10000000, happiness: 100 },
          decisions: [
            {
              eventTitle: 'Test',
              options: [
                {
                  id: 'A',
                  text: 'Test',
                  impact: { savings: 5000000, happiness: 20 },
                },
              ],
            },
          ],
        });
        mockAi.modelInstance.generateContent.mockResolvedValue({
          response: {
            text: () => JSON.stringify({ eventTitle: 'Next', options: [] }),
          },
        });
        mockPrisma.simulationScenario.update.mockResolvedValue({});

        await service.continueLifeScenario('user-1', 'scenario-1', 'A');

        expect(mockValidation.validate).toHaveBeenCalledWith(
          'SIMULATION_STATUS',
          expect.objectContaining({
            age: expect.any(Number),
            savings: 15000000,
            happiness: 120,
          }),
        );
      });
    });

    describe('Simulation Event Validation', () => {
      it('should validate JSONB event structure', async () => {
        const mockEvent = {
          eventTitle: 'Market Crash',
          description: 'Stock market crashed 30%',
          options: [
            {
              id: 'A',
              text: 'Sell everything',
              impact: { savings: 0, happiness: -30 },
            },
            {
              id: 'B',
              text: 'Hold position',
              impact: { savings: -5000000, happiness: -10 },
            },
          ],
          aiNudge: 'Loss Aversion: Panic selling locks in losses',
        };

        mockAi.modelInstance.generateContent.mockResolvedValue({
          response: { text: () => JSON.stringify(mockEvent) },
        });
        mockPrisma.simulationScenario.create.mockResolvedValue({});

        await service.startLifeScenario('user-1');

        expect(mockValidation.validate).toHaveBeenCalledWith(
          'SIMULATION_EVENT',
          mockEvent,
        );
      });
    });

    describe('Simulation Decisions Validation', () => {
      it('should validate JSONB decisions array', async () => {
        const existingDecisions = [
          {
            eventTitle: 'Event 1',
            choice: 'Option A',
            options: [
              {
                id: 'A',
                text: 'Option A',
                impact: { savings: 1000000, happiness: 5 },
              },
            ],
          },
        ];

        mockPrisma.simulationScenario.findUnique.mockResolvedValue({
          id: 'scenario-1',
          userId: 'user-1',
          currentStatus: { age: 22, savings: 5000000, happiness: 100 },
          decisions: existingDecisions,
        });

        mockAi.modelInstance.generateContent.mockResolvedValue({
          response: {
            text: () =>
              JSON.stringify({
                eventTitle: 'Event 2',
                options: [
                  {
                    id: 'A',
                    text: 'Choice',
                    impact: { savings: 0, happiness: 0 },
                  },
                ],
                aiNudge: 'Nudge',
              }),
          },
        });

        mockPrisma.simulationScenario.update.mockResolvedValue({});

        await service.continueLifeScenario('user-1', 'scenario-1', 'A');

        expect(mockValidation.validate).toHaveBeenCalledWith(
          'SIMULATION_DECISIONS',
          expect.any(Array),
        );
      });
    });
  });

  // ==================== COMMITMENT DEVICE MARKET SIMULATION ====================
  describe('Commitment Device Market Scenarios', () => {
    describe('Goal-Based Savings', () => {
      it('should create market-linked commitment for retirement', async () => {
        mockPrisma.virtualPortfolio.findUnique.mockResolvedValue({
          userId: 'user-1',
          balance: 50000000,
        });
        mockPrisma.virtualPortfolio.update.mockResolvedValue({});
        mockPrisma.simulationCommitment.create.mockResolvedValue({
          id: 'commitment-1',
          userId: 'user-1',
          goalName: 'Retirement Fund',
          targetAmount: 500000000,
          lockedAmount: 10000000,
        });

        const result = await service.createCommitment('user-1', {
          goalName: 'Retirement Fund',
          targetAmount: 500000000,
          lockedAmount: 10000000,
          months: 120,
        });

        expect(mockPrisma.virtualPortfolio.update).toHaveBeenCalledWith({
          where: { userId: 'user-1' },
          data: { balance: { decrement: 10000000 } },
        });
        expect(result.goalName).toBe('Retirement Fund');
      });

      it('should throw error for insufficient balance', async () => {
        mockPrisma.virtualPortfolio.findUnique.mockResolvedValue({
          userId: 'user-1',
          balance: 5000000,
        });

        await expect(
          service.createCommitment('user-1', {
            goalName: 'House',
            targetAmount: 100000000,
            lockedAmount: 10000000,
            months: 60,
          }),
        ).rejects.toThrow('Insufficient virtual balance to lock');
      });
    });

    describe('Early Withdrawal Penalties', () => {
      it('should apply 10% penalty for early withdrawal', async () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 30);

        mockPrisma.simulationCommitment.findUnique.mockResolvedValue({
          id: 'commitment-1',
          userId: 'user-1',
          lockedAmount: 10000000,
          penaltyRate: 0.1,
          unlockDate: futureDate,
        });

        const result = await service.withdrawCommitment(
          'user-1',
          'commitment-1',
        );

        expect(result.withdrawnAmount).toBe(9000000);
        expect(result.early).toBe(true);
        expect(result.message).toContain('Early withdrawal');
        expect(result.message).toContain('10%');
      });

      it('should log early withdrawal behavior', async () => {
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + 6);

        mockPrisma.simulationCommitment.findUnique.mockResolvedValue({
          id: 'commitment-1',
          userId: 'user-1',
          lockedAmount: 20000000,
          penaltyRate: 0.1,
          unlockDate: futureDate,
        });

        await service.withdrawCommitment('user-1', 'commitment-1');

        expect(mockPrisma.behaviorLog.create).toHaveBeenCalledWith({
          data: {
            userId: 'user-1',
            sessionId: 'simulation-engine',
            path: '/simulation/commitment/withdraw-early',
            eventType: 'EARLY_WITHDRAWAL_PENALTY',
            payload: {
              commitmentId: 'commitment-1',
              penalty: 2000000,
              originalAmount: 20000000,
            },
          },
        });
      });

      it('should return full amount without penalty for on-time withdrawal', async () => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 1);

        mockPrisma.simulationCommitment.findUnique.mockResolvedValue({
          id: 'commitment-1',
          userId: 'user-1',
          lockedAmount: 10000000,
          penaltyRate: 0.1,
          unlockDate: pastDate,
        });

        const result = await service.withdrawCommitment(
          'user-1',
          'commitment-1',
        );

        expect(result.withdrawnAmount).toBe(10000000);
        expect(result.early).toBe(false);
        expect(result.message).toContain('Goal achieved');
        expect(mockPrisma.behaviorLog.create).not.toHaveBeenCalled();
      });

      it('should use transaction for withdrawal process', async () => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 1);

        mockPrisma.simulationCommitment.findUnique.mockResolvedValue({
          id: 'commitment-1',
          userId: 'user-1',
          lockedAmount: 10000000,
          penaltyRate: 0.1,
          unlockDate: pastDate,
        });

        await service.withdrawCommitment('user-1', 'commitment-1');

        expect(mockPrisma.$transaction).toHaveBeenCalled();
      });

      it('should throw error for invalid commitment', async () => {
        mockPrisma.simulationCommitment.findUnique.mockResolvedValue(null);

        await expect(
          service.withdrawCommitment('user-1', 'invalid-id'),
        ).rejects.toThrow('Commitment not found');
      });

      it('should throw error for mismatched user', async () => {
        mockPrisma.simulationCommitment.findUnique.mockResolvedValue({
          id: 'commitment-1',
          userId: 'user-2',
        });

        await expect(
          service.withdrawCommitment('user-1', 'commitment-1'),
        ).rejects.toThrow('Commitment not found');
      });
    });

    // ==================== AI SCENARIO GENERATION VALIDATION ====================
    describe('AI Scenario Generation Validation', () => {
      describe('Scenario Quality Checks', () => {
        it('should validate AI-generated scenario has required fields', async () => {
          const validScenario = {
            eventTitle: 'Unexpected Expense',
            description: 'Car broke down',
            options: [
              {
                id: 'A',
                text: 'Repair immediately',
                impact: { savings: -5000000, happiness: 10 },
              },
              {
                id: 'B',
                text: 'Use public transport',
                impact: { savings: 0, happiness: -5 },
              },
            ],
            aiNudge: 'Loss Aversion: Delaying repair may cost more',
          };

          mockAi.modelInstance.generateContent.mockResolvedValue({
            response: { text: () => JSON.stringify(validScenario) },
          });
          mockPrisma.simulationScenario.create.mockResolvedValue({
            id: 'scenario-1',
          });

          const result = await service.startLifeScenario('user-1');

          expect(mockValidation.validate).toHaveBeenCalledWith(
            'SIMULATION_EVENT',
            validScenario,
          );
        });

        it('should reject AI scenario missing required options', async () => {
          const invalidScenario = {
            eventTitle: 'Test',
            description: 'Missing options',
            aiNudge: 'Test',
          };

          mockAi.modelInstance.generateContent.mockResolvedValue({
            response: { text: () => JSON.stringify(invalidScenario) },
          });

          mockValidation.validate.mockImplementation((type, data) => {
            if (type === 'SIMULATION_EVENT' && !data.options) {
              throw new Error('Missing required field: options');
            }
            return data;
          });

          await expect(service.startLifeScenario('user-1')).rejects.toThrow(
            'Missing required field',
          );
        });

        it('should validate option impact values are numeric', async () => {
          const scenario = {
            eventTitle: 'Test',
            description: 'Test',
            options: [
              {
                id: 'A',
                text: 'Test',
                impact: { savings: 1000, happiness: 5 },
              },
            ],
            aiNudge: 'Test',
          };

          mockAi.modelInstance.generateContent.mockResolvedValue({
            response: { text: () => JSON.stringify(scenario) },
          });
          mockPrisma.simulationScenario.create.mockResolvedValue({});

          await service.startLifeScenario('user-1');

          expect(mockValidation.validate).toHaveBeenCalledWith(
            'SIMULATION_EVENT',
            expect.objectContaining({
              options: expect.arrayContaining([
                expect.objectContaining({
                  impact: expect.objectContaining({
                    savings: expect.any(Number),
                    happiness: expect.any(Number),
                  }),
                }),
              ]),
            }),
          );
        });
      });

      describe('Execution State Machine', () => {
        it('should track scenario execution state through lifecycle', async () => {
          const mockScenario = {
            id: 'scenario-1',
            userId: 'user-1',
            type: 'LIFE',
            isActive: true,
            currentStatus: { age: 22, savings: 5000000, happiness: 100 },
            decisions: [
              {
                eventTitle: 'Event 1',
                options: [
                  {
                    id: 'A',
                    text: 'Choice A',
                    impact: { savings: 1000, happiness: 5 },
                  },
                ],
              },
            ],
          };

          mockPrisma.simulationScenario.findUnique.mockResolvedValue(
            mockScenario,
          );
          mockAi.modelInstance.generateContent.mockResolvedValue({
            response: {
              text: () =>
                JSON.stringify({
                  eventTitle: 'Next',
                  options: [
                    {
                      id: 'A',
                      text: 'A',
                      impact: { savings: 0, happiness: 0 },
                    },
                  ],
                  aiNudge: 'Test',
                }),
            },
          });
          mockPrisma.simulationScenario.update.mockResolvedValue(mockScenario);

          await service.continueLifeScenario('user-1', 'scenario-1', 'A');

          expect(mockValidation.validate).toHaveBeenCalledWith(
            'SIMULATION_STATUS',
            expect.any(Object),
          );
          expect(mockValidation.validate).toHaveBeenCalledWith(
            'SIMULATION_DECISIONS',
            expect.any(Array),
          );
        });

        it('should prevent state transition without valid choice', async () => {
          mockPrisma.simulationScenario.findUnique.mockResolvedValue({
            id: 'scenario-1',
            userId: 'user-1',
            currentStatus: { age: 22, savings: 5000000 },
            decisions: [
              {
                eventTitle: 'Test',
                options: [
                  { id: 'A', text: 'A', impact: { savings: 0, happiness: 0 } },
                ],
              },
            ],
          });

          await expect(
            service.continueLifeScenario('user-1', 'scenario-1', 'INVALID'),
          ).rejects.toThrow('Invalid choice');
        });
      });
    });

    // ==================== CONCURRENT SIMULATION HANDLING ====================
    describe('Concurrent Simulation Handling', () => {
      describe('Multiple User Simulations', () => {
        it('should handle concurrent portfolio trades from different users', async () => {
          const users = ['user-1', 'user-2', 'user-3'];
          const portfolios = users.map((userId) => ({
            userId,
            balance: 100000,
            assets: {},
          }));

          mockPrisma.virtualPortfolio.findUnique.mockImplementation(
            ({ where }) => {
              return Promise.resolve(
                portfolios.find((p) => p.userId === where.userId) || null,
              );
            },
          );

          mockPrisma.virtualPortfolio.update.mockImplementation(({ where }) => {
            const portfolio = portfolios.find((p) => p.userId === where.userId);
            return Promise.resolve({
              ...portfolio,
              balance: 90000,
              assets: { BTC: 0.25 },
            });
          });

          const trades = await Promise.all(
            users.map((userId) =>
              service.trade(userId, 'BTC', 0.25, 'BUY', 40000),
            ),
          );

          expect(trades).toHaveLength(3);
          expect(mockPrisma.virtualPortfolio.update).toHaveBeenCalledTimes(3);
        });

        it('should handle concurrent scenario generations', async () => {
          mockAi.modelInstance.generateContent.mockResolvedValue({
            response: {
              text: () =>
                JSON.stringify({
                  eventTitle: 'Test',
                  options: [
                    {
                      id: 'A',
                      text: 'A',
                      impact: { savings: 0, happiness: 0 },
                    },
                  ],
                  aiNudge: 'Test',
                }),
            },
          });
          mockPrisma.simulationScenario.create.mockResolvedValue({
            id: 'scenario-1',
          });

          const scenarios = await Promise.all([
            service.startLifeScenario('user-1'),
            service.startLifeScenario('user-2'),
            service.startLifeScenario('user-3'),
          ]);

          expect(scenarios).toHaveLength(3);
          expect(mockPrisma.simulationScenario.create).toHaveBeenCalledTimes(3);
        });
      });

      describe('Result Calculation Accuracy', () => {
        it('should accurately calculate portfolio value with multiple assets', async () => {
          const portfolio = {
            userId: 'user-1',
            balance: 50000,
            assets: { BTC: 1, ETH: 10, AAPL: 5 },
          };

          mockPrisma.virtualPortfolio.findUnique.mockResolvedValue(portfolio);

          const result = await service.getPortfolio('user-1');

          expect(result.balance).toBe(50000);
          expect(result.assets).toEqual({ BTC: 1, ETH: 10, AAPL: 5 });
        });

        it('should precisely calculate trade costs with decimals', async () => {
          mockPrisma.virtualPortfolio.findUnique.mockResolvedValue({
            userId: 'user-1',
            balance: 100000,
            assets: {},
          });
          mockPrisma.virtualPortfolio.update.mockResolvedValue({
            userId: 'user-1',
            balance: 90000,
            assets: { BTC: 0.25 },
          });

          await service.trade('user-1', 'BTC', 0.25, 'BUY', 40000);

          const updateCall =
            mockPrisma.virtualPortfolio.update.mock.calls[0][0];
          expect(updateCall.data.balance.decrement).toBe(10000);
        });

        it('should maintain precision in scenario impact calculations', async () => {
          mockPrisma.simulationScenario.findUnique.mockResolvedValue({
            id: 'scenario-1',
            userId: 'user-1',
            currentStatus: { age: 25, savings: 10000000, happiness: 100 },
            decisions: [
              {
                eventTitle: 'Test',
                options: [
                  {
                    id: 'A',
                    text: 'A',
                    impact: { savings: -2500000, happiness: 15 },
                  },
                ],
              },
            ],
          });

          mockAi.modelInstance.generateContent.mockResolvedValue({
            response: {
              text: () =>
                JSON.stringify({
                  eventTitle: 'Next',
                  options: [],
                  aiNudge: 'Test',
                }),
            },
          });

          mockPrisma.simulationScenario.update.mockResolvedValue({});

          await service.continueLifeScenario('user-1', 'scenario-1', 'A');

          const statusValidation = mockValidation.validate.mock.calls.find(
            (call) => call[0] === 'SIMULATION_STATUS',
          );
          expect(statusValidation[1].savings).toBe(7500000);
          expect(statusValidation[1].happiness).toBe(115);
        });
      });
    });
  });
});
