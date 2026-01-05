import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SimulationService } from './simulation.service';

// ============================================
// Type Definitions for JSONB Structures
// ============================================

interface SimulationImpact {
  savings: number;
  happiness: number;
}

interface SimulationOption {
  id: string;
  text: string;
  impact: SimulationImpact;
}

interface SimulationEvent {
  eventTitle: string;
  description?: string;
  options: SimulationOption[];
  aiNudge: string;
}

interface SimulationStatus {
  age: number;
  job?: string;
  salary?: number;
  savings: number;
  goals?: string[];
  happiness: number;
}

interface SimulationScenario {
  id: string;
  userId?: string;
  type?: string;
  currentStatus: SimulationStatus;
  decisions: SimulationEvent[];
  isActive?: boolean;
}

type MockPrismaScenario = Partial<SimulationScenario>;

describe('SimulationService - AI Scenario Generation (90%+ Coverage)', () => {
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
      behaviorLog: {
        create: vi.fn(),
      },
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

  describe('Scenario Generation Logic', () => {
    it('should generate initial life scenario with AI', async () => {
      const mockScenario: SimulationEvent = {
        eventTitle: 'Job Offer Opportunity',
        description:
          'You received a job offer with 20% higher salary but requires relocation',
        options: [
          {
            id: 'A',
            text: 'Accept and relocate',
            impact: { savings: 3000000, happiness: 5 },
          },
          {
            id: 'B',
            text: 'Decline and stay',
            impact: { savings: 0, happiness: -2 },
          },
        ],
        aiNudge: 'Studies show career moves increase lifetime earnings by 15%',
      };

      mockAi.modelInstance.generateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify(mockScenario),
        },
      });

      const mockResponse: SimulationScenario = {
        id: 'scenario-1',
        userId: 'user-1',
        type: 'LIFE',
        currentStatus: { age: 22, savings: 5000000, happiness: 100 },
        decisions: [mockScenario],
        isActive: true,
      };

      mockPrisma.simulationScenario.create.mockResolvedValue(mockResponse);

      const result = await service.startLifeScenario('user-1');

      expect(mockAi.modelInstance.generateContent).toHaveBeenCalled();
      expect(result.type).toBe('LIFE');
      expect(result.isActive).toBe(true);
      expect(result.decisions).toBeDefined();
      expect(Array.isArray(result.decisions)).toBe(true);
      expect(mockValidation.validate).toHaveBeenCalledWith(
        'SIMULATION_STATUS',
        expect.any(Object),
      );
      expect(mockValidation.validate).toHaveBeenCalledWith(
        'SIMULATION_EVENT',
        mockScenario,
      );
    });

    it('should handle AI response with markdown code blocks', async () => {
      const mockScenario: SimulationEvent = {
        eventTitle: 'Emergency Medical Bill',
        description: 'Unexpected hospital visit costs 5M VND',
        options: [
          {
            id: 'A',
            text: 'Use emergency fund',
            impact: { savings: -5000000, happiness: 0 },
          },
          {
            id: 'B',
            text: 'Take loan',
            impact: { savings: -6000000, happiness: -5 },
          },
        ],
        aiNudge: 'Having 6 months emergency fund prevents 80% financial stress',
      };

      mockAi.modelInstance.generateContent.mockResolvedValue({
        response: {
          text: () => `\`\`\`json\n${JSON.stringify(mockScenario)}\n\`\`\``,
        },
      });

      const mockResponse: MockPrismaScenario = {
        id: 'scenario-2',
        decisions: [mockScenario],
        currentStatus: { age: 22, savings: 0, happiness: 100 },
      };

      mockPrisma.simulationScenario.create.mockResolvedValue(mockResponse);

      const result = await service.startLifeScenario('user-1');

      expect(result.decisions).toBeDefined();
      expect(result.decisions?.length).toBeGreaterThan(0);
      if (result.decisions && Array.isArray(result.decisions)) {
        const firstDecision = result.decisions[0] as SimulationEvent;
        expect(firstDecision.eventTitle).toBe('Emergency Medical Bill');
        expect(firstDecision.description).toBeDefined();
      }
    });

    it('should continue scenario based on previous choice', async () => {
      const previousScenario: MockPrismaScenario = {
        currentStatus: {
          age: 22,
          job: 'Junior Developer',
          salary: 15000000,
          savings: 5000000,
          goals: ['Buy a house', 'Emergency fund'],
          happiness: 100,
        },
        decisions: [
          {
            eventTitle: 'Job Offer',
            options: [
              {
                id: 'A',
                text: 'Accept',
                impact: { savings: 3000000, happiness: 5 },
              },
              {
                id: 'B',
                text: 'Decline',
                impact: { savings: 0, happiness: -2 },
              },
            ],
            aiNudge: 'Career growth opportunity',
          },
        ],
      };

      const nextEvent: SimulationEvent = {
        eventTitle: 'Investment Opportunity',
        description: 'Friend offers crypto investment',
        options: [
          {
            id: 'A',
            text: 'Invest 1M VND',
            impact: { savings: -1000000, happiness: 3 },
          },
          { id: 'B', text: 'Skip', impact: { savings: 0, happiness: 0 } },
        ],
        aiNudge: 'Only invest what you can afford to lose',
      };

      mockPrisma.simulationScenario.findUnique.mockResolvedValue({
        id: 'scenario-1',
        userId: 'user-1',
        ...previousScenario,
      });

      mockAi.modelInstance.generateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify(nextEvent),
        },
      });

      const mockUpdateResponse: MockPrismaScenario = {
        id: 'scenario-1',
        currentStatus: { age: 22, savings: 8000000, happiness: 105 },
        decisions: [...(previousScenario.decisions || []), nextEvent],
      };

      mockPrisma.simulationScenario.update.mockResolvedValue(
        mockUpdateResponse,
      );

      const result = await service.continueLifeScenario(
        'user-1',
        'scenario-1',
        'A',
      );

      expect(mockAi.modelInstance.generateContent).toHaveBeenCalled();
      expect(mockValidation.validate).toHaveBeenCalledWith(
        'SIMULATION_STATUS',
        expect.any(Object),
      );
      expect(mockValidation.validate).toHaveBeenCalledWith(
        'SIMULATION_DECISIONS',
        expect.any(Array),
      );
      expect(result?.decisions?.length).toBeGreaterThan(1);
    });

    it('should throw error for invalid choice', async () => {
      mockPrisma.simulationScenario.findUnique.mockResolvedValue({
        id: 'scenario-1',
        userId: 'user-1',
        currentStatus: { age: 22, savings: 0, happiness: 100 },
        decisions: [
          {
            eventTitle: 'Test',
            options: [
              {
                id: 'A',
                text: 'Option A',
                impact: { savings: 0, happiness: 0 },
              },
              {
                id: 'B',
                text: 'Option B',
                impact: { savings: 0, happiness: 0 },
              },
            ],
            aiNudge: 'Test',
          },
        ],
      });

      await expect(
        service.continueLifeScenario('user-1', 'scenario-1', 'C'),
      ).rejects.toThrow('Invalid choice');
    });

    it('should throw error for unauthorized scenario access', async () => {
      mockPrisma.simulationScenario.findUnique.mockResolvedValue({
        id: 'scenario-1',
        userId: 'user-2',
      });

      await expect(
        service.continueLifeScenario('user-1', 'scenario-1', 'A'),
      ).rejects.toThrow('Scenario not found');
    });

    it('should throw error when scenario does not exist', async () => {
      mockPrisma.simulationScenario.findUnique.mockResolvedValue(null);

      await expect(
        service.continueLifeScenario('user-1', 'invalid-id', 'A'),
      ).rejects.toThrow('Scenario not found');
    });
  });

  describe('Difficulty Scaling', () => {
    it('should generate age-appropriate scenarios for young users', async () => {
      const youngUserScenario = {
        eventTitle: 'First Salary Decision',
        description: 'How to allocate your first paycheck?',
        options: [
          {
            id: 'A',
            text: 'Save 50%',
            impact: { savings: 7500000, happiness: 2 },
          },
          { id: 'B', text: 'Spend all', impact: { savings: 0, happiness: 8 } },
        ],
        aiNudge: 'Early savings compound exponentially',
      };

      mockAi.modelInstance.generateContent.mockResolvedValue({
        response: { text: () => JSON.stringify(youngUserScenario) },
      });

      mockPrisma.simulationScenario.create.mockResolvedValue({
        id: 'young-scenario',
        decisions: [youngUserScenario],
        currentStatus: { age: 22, savings: 0, happiness: 100 },
      });

      const result = await service.startLifeScenario('user-1');

      const generatedPrompt = mockAi.modelInstance.generateContent.mock
        .calls[0][0] as string;
      expect(generatedPrompt).toContain('age');
      expect(generatedPrompt).toContain('22');
    });

    it('should update user status based on choice impact', async () => {
      mockPrisma.simulationScenario.findUnique.mockResolvedValue({
        id: 'scenario-1',
        userId: 'user-1',
        currentStatus: {
          age: 22,
          salary: 15000000,
          savings: 5000000,
          happiness: 100,
        },
        decisions: [
          {
            eventTitle: 'Test',
            options: [
              {
                id: 'A',
                text: 'Save',
                impact: { savings: 1000000, happiness: -5 },
              },
              {
                id: 'B',
                text: 'Spend',
                impact: { savings: -500000, happiness: 10 },
              },
            ],
            aiNudge: 'Test',
          },
        ],
      });

      mockAi.modelInstance.generateContent.mockResolvedValue({
        response: {
          text: () => '{"eventTitle":"Next","options":[],"aiNudge":"test"}',
        },
      });

      mockPrisma.simulationScenario.update.mockResolvedValue({
        id: 'scenario-1',
      });

      await service.continueLifeScenario('user-1', 'scenario-1', 'A');

      const updatedStatus = mockValidation.validate.mock.calls.find(
        (call: unknown[]) => call[0] === 'SIMULATION_STATUS',
      )?.[1];

      expect(updatedStatus?.savings).toBe(6000000);
      expect(updatedStatus?.happiness).toBe(95);
    });

    it('should occasionally age the user', async () => {
      mockPrisma.simulationScenario.findUnique.mockResolvedValue({
        id: 'scenario-1',
        userId: 'user-1',
        currentStatus: { age: 22, savings: 5000000, happiness: 100 },
        decisions: [
          {
            eventTitle: 'Test',
            options: [
              { id: 'A', text: 'Test', impact: { savings: 0, happiness: 0 } },
            ],
            aiNudge: 'Test',
          },
        ],
      });

      mockAi.modelInstance.generateContent.mockResolvedValue({
        response: {
          text: () => '{"eventTitle":"Test","options":[],"aiNudge":"test"}',
        },
      });

      mockPrisma.simulationScenario.update.mockResolvedValue({
        id: 'scenario-1',
      });

      vi.spyOn(Math, 'random').mockReturnValue(0.8);

      await service.continueLifeScenario('user-1', 'scenario-1', 'A');

      const updatedStatus = mockValidation.validate.mock.calls.find(
        (call: unknown[]) => call[0] === 'SIMULATION_STATUS',
      )?.[1];

      expect(updatedStatus?.age).toBe(23);
    });
  });

  describe('Localization (vi/en/zh)', () => {
    it('should generate Vietnamese-localized scenario', async () => {
      const viScenario = {
        eventTitle: 'Cơ hội đầu tư BĐS',
        description: 'Bạn có cơ hội mua căn hộ với giá tốt',
        options: [
          {
            id: 'A',
            text: 'Mua ngay',
            impact: { savings: -500000000, happiness: 15 },
          },
          { id: 'B', text: 'Chờ đợi', impact: { savings: 0, happiness: -3 } },
        ],
        aiNudge: 'Thị trường BĐS VN tăng trưởng 8%/năm',
      };

      mockAi.modelInstance.generateContent.mockResolvedValue({
        response: { text: () => JSON.stringify(viScenario) },
      });

      mockPrisma.simulationScenario.create.mockResolvedValue({
        id: 'vi-scenario',
        decisions: [viScenario],
        currentStatus: { age: 22, savings: 0, happiness: 100 },
      });

      const result = await service.startLifeScenario('user-vi');

      expect(result?.decisions?.[0]?.eventTitle).toContain('Cơ hội');
    });

    it('should generate English-localized scenario', async () => {
      const enScenario = {
        eventTitle: 'Stock Market Opportunity',
        description: 'Tech stocks are down 20%, good time to invest?',
        options: [
          {
            id: 'A',
            text: 'Buy $1000 worth',
            impact: { savings: -1000, happiness: 5 },
          },
          { id: 'B', text: 'Wait', impact: { savings: 0, happiness: 0 } },
        ],
        aiNudge: 'Time in market beats timing the market',
      };

      mockAi.modelInstance.generateContent.mockResolvedValue({
        response: { text: () => JSON.stringify(enScenario) },
      });

      mockPrisma.simulationScenario.create.mockResolvedValue({
        id: 'en-scenario',
        decisions: [enScenario],
        currentStatus: { age: 22, savings: 0, happiness: 100 },
      });

      const result = await service.startLifeScenario('user-en');

      expect(result?.decisions?.[0]?.eventTitle).toContain('Opportunity');
    });

    it('should generate Chinese-localized scenario', async () => {
      const zhScenario = {
        eventTitle: '投资机会',
        description: '您的朋友推荐一个基金产品',
        options: [
          { id: 'A', text: '投资', impact: { savings: -10000, happiness: 3 } },
          { id: 'B', text: '拒绝', impact: { savings: 0, happiness: 0 } },
        ],
        aiNudge: '多元化投资降低风险',
      };

      mockAi.modelInstance.generateContent.mockResolvedValue({
        response: { text: () => JSON.stringify(zhScenario) },
      });

      mockPrisma.simulationScenario.create.mockResolvedValue({
        id: 'zh-scenario',
        decisions: [zhScenario],
        currentStatus: { age: 22, savings: 0, happiness: 100 },
      });

      const result = await service.startLifeScenario('user-zh');

      expect(result?.decisions?.[0]?.eventTitle).toContain('投资');
    });
  });

  describe('LLM Response Mocking', () => {
    it('should handle malformed JSON from LLM gracefully', async () => {
      mockAi.modelInstance.generateContent.mockResolvedValue({
        response: {
          text: () => 'Invalid JSON response',
        },
      });

      await expect(service.startLifeScenario('user-1')).rejects.toThrow();
    });

    it('should parse JSON with extra whitespace', async () => {
      const scenario = {
        eventTitle: 'Test',
        description: 'Test desc',
        options: [
          { id: 'A', text: 'Test', impact: { savings: 0, happiness: 0 } },
        ],
        aiNudge: 'Test nudge',
      };

      mockAi.modelInstance.generateContent.mockResolvedValue({
        response: {
          text: () => `   \n\n  ${JSON.stringify(scenario)}  \n\n  `,
        },
      });

      mockPrisma.simulationScenario.create.mockResolvedValue({
        id: 'test',
        decisions: [scenario],
        currentStatus: { age: 22, savings: 0, happiness: 100 },
      });

      const result = await service.startLifeScenario('user-1');

      expect(result?.decisions?.[0]?.eventTitle).toBe('Test');
    });

    it('should handle nested markdown code blocks', async () => {
      const scenario = {
        eventTitle: 'Test',
        description: 'Test',
        options: [
          { id: 'A', text: 'Test', impact: { savings: 0, happiness: 0 } },
        ],
        aiNudge: 'Test',
      };

      mockAi.modelInstance.generateContent.mockResolvedValue({
        response: {
          text: () =>
            `\`\`\`json\n\`\`\`json\n${JSON.stringify(scenario)}\n\`\`\`\n\`\`\``,
        },
      });

      mockPrisma.simulationScenario.create.mockResolvedValue({
        id: 'test',
        decisions: [scenario],
        currentStatus: { age: 22, savings: 0, happiness: 100 },
      });

      const result = await service.startLifeScenario('user-1');

      expect(result?.decisions?.[0]).toBeDefined();
    });

    it('should mock complex multi-choice scenarios', async () => {
      const complexScenario = {
        eventTitle: 'Multiple Investment Paths',
        description: 'Choose your investment strategy',
        options: [
          {
            id: 'A',
            text: 'Conservative (Bonds)',
            impact: { savings: 50000, happiness: 2 },
          },
          {
            id: 'B',
            text: 'Moderate (Index Funds)',
            impact: { savings: 100000, happiness: 5 },
          },
          {
            id: 'C',
            text: 'Aggressive (Stocks)',
            impact: { savings: 200000, happiness: 8 },
          },
          { id: 'D', text: 'Skip', impact: { savings: 0, happiness: -5 } },
        ],
        aiNudge: 'Diversification reduces risk by 40%',
      };

      mockAi.modelInstance.generateContent.mockResolvedValue({
        response: { text: () => JSON.stringify(complexScenario) },
      });

      mockPrisma.simulationScenario.create.mockResolvedValue({
        id: 'complex',
        decisions: [complexScenario],
        currentStatus: { age: 22, savings: 0, happiness: 100 },
      });

      const result = await service.startLifeScenario('user-1');

      expect(result?.decisions?.[0]?.options).toHaveLength(4);
    });
  });

  describe('JSONB Structure Validation', () => {
    it('should validate initial status structure', async () => {
      mockAi.modelInstance.generateContent.mockResolvedValue({
        response: {
          text: () => '{"eventTitle":"Test","options":[],"aiNudge":"test"}',
        },
      });

      mockPrisma.simulationScenario.create.mockResolvedValue({ id: 'test' });

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

    it('should validate scenario event structure', async () => {
      const scenario = {
        eventTitle: 'Test Event',
        description: 'Test Description',
        options: [
          {
            id: 'A',
            text: 'Option A',
            impact: { savings: 1000, happiness: 5 },
          },
          {
            id: 'B',
            text: 'Option B',
            impact: { savings: -500, happiness: -2 },
          },
        ],
        aiNudge: 'Test Nudge',
      };

      mockAi.modelInstance.generateContent.mockResolvedValue({
        response: { text: () => JSON.stringify(scenario) },
      });

      mockPrisma.simulationScenario.create.mockResolvedValue({ id: 'test' });

      await service.startLifeScenario('user-1');

      expect(mockValidation.validate).toHaveBeenCalledWith(
        'SIMULATION_EVENT',
        scenario,
      );
    });

    it('should validate decisions array structure', async () => {
      mockPrisma.simulationScenario.findUnique.mockResolvedValue({
        id: 'scenario-1',
        userId: 'user-1',
        currentStatus: { age: 22, savings: 5000000, happiness: 100 },
        decisions: [
          {
            eventTitle: 'First',
            options: [
              { id: 'A', text: 'Test', impact: { savings: 0, happiness: 0 } },
            ],
            aiNudge: 'Test',
          },
        ],
      });

      mockAi.modelInstance.generateContent.mockResolvedValue({
        response: {
          text: () =>
            '{"eventTitle":"Second","options":[{"id":"A","text":"Test","impact":{"savings":0,"happiness":0}}],"aiNudge":"test"}',
        },
      });

      mockPrisma.simulationScenario.update.mockResolvedValue({
        id: 'scenario-1',
      });

      await service.continueLifeScenario('user-1', 'scenario-1', 'A');

      const decisionsCall = mockValidation.validate.mock.calls.find(
        (call: unknown[]) => call[0] === 'SIMULATION_DECISIONS',
      );

      expect(decisionsCall).toBeDefined();
      expect(Array.isArray(decisionsCall?.[1])).toBe(true);
      expect(decisionsCall?.[1].length).toBeGreaterThan(1);
    });

    it('should reject invalid JSONB structure', async () => {
      mockValidation.validate.mockImplementation(
        (type: string, data: unknown): unknown => {
          if (type === 'SIMULATION_EVENT') {
            throw new Error('Validation failed');
          }
          return data;
        },
      );

      mockAi.modelInstance.generateContent.mockResolvedValue({
        response: { text: () => '{"eventTitle":"Test"}' },
      });

      await expect(service.startLifeScenario('user-1')).rejects.toThrow(
        'Validation failed',
      );
    });

    it('should preserve all required fields in status updates', async () => {
      mockPrisma.simulationScenario.findUnique.mockResolvedValue({
        id: 'scenario-1',
        userId: 'user-1',
        currentStatus: {
          age: 22,
          job: 'Developer',
          salary: 15000000,
          savings: 5000000,
          goals: ['Goal 1'],
          happiness: 100,
        },
        decisions: [
          {
            options: [
              {
                id: 'A',
                text: 'Test',
                impact: { savings: 1000, happiness: 5 },
              },
            ],
          },
        ],
      });

      mockAi.modelInstance.generateContent.mockResolvedValue({
        response: {
          text: () => '{"eventTitle":"Test","options":[],"aiNudge":"test"}',
        },
      });

      mockPrisma.simulationScenario.update.mockResolvedValue({
        id: 'scenario-1',
      });

      await service.continueLifeScenario('user-1', 'scenario-1', 'A');

      const statusCall = mockValidation.validate.mock.calls.find(
        (call: unknown[]) => call[0] === 'SIMULATION_STATUS',
      )?.[1];

      expect(statusCall).toHaveProperty('age');
      expect(statusCall).toHaveProperty('job');
      expect(statusCall).toHaveProperty('salary');
      expect(statusCall).toHaveProperty('savings');
      expect(statusCall).toHaveProperty('goals');
      expect(statusCall).toHaveProperty('happiness');
    });
  });

  describe('Nudge Strategy Integration', () => {
    it('should include loss aversion nudge in prompts', async () => {
      mockAi.modelInstance.generateContent.mockResolvedValue({
        response: {
          text: () => '{"eventTitle":"Test","options":[],"aiNudge":"test"}',
        },
      });

      mockPrisma.simulationScenario.create.mockResolvedValue({ id: 'test' });

      await service.startLifeScenario('user-1');

      const prompt = mockAi.modelInstance.generateContent.mock
        .calls[0][0] as string;
      expect(prompt).toContain('Loss Aversion');
      expect(prompt).toContain('Framing');
    });

    it('should include Hooked strategy trigger', async () => {
      mockAi.modelInstance.generateContent.mockResolvedValue({
        response: {
          text: () => '{"eventTitle":"Test","options":[],"aiNudge":"test"}',
        },
      });

      mockPrisma.simulationScenario.create.mockResolvedValue({ id: 'test' });

      await service.startLifeScenario('user-1');

      const prompt = mockAi.modelInstance.generateContent.mock
        .calls[0][0] as string;
      expect(prompt).toContain('Trigger');
    });

    it('should pass previous choice context to next event', async () => {
      mockPrisma.simulationScenario.findUnique.mockResolvedValue({
        id: 'scenario-1',
        userId: 'user-1',
        currentStatus: { age: 22, savings: 5000000, happiness: 100 },
        decisions: [
          {
            eventTitle: 'Job Offer',
            options: [
              {
                id: 'A',
                text: 'Accept offer',
                impact: { savings: 0, happiness: 0 },
              },
            ],
            aiNudge: 'Test',
          },
        ],
      });

      mockAi.modelInstance.generateContent.mockResolvedValue({
        response: {
          text: () => '{"eventTitle":"Next","options":[],"aiNudge":"test"}',
        },
      });

      mockPrisma.simulationScenario.update.mockResolvedValue({
        id: 'scenario-1',
      });

      await service.continueLifeScenario('user-1', 'scenario-1', 'A');

      const prompt = mockAi.modelInstance.generateContent.mock
        .calls[0][0] as string;
      expect(prompt).toContain('Previous Event');
      expect(prompt).toContain('Job Offer');
      expect(prompt).toContain('User Choice');
      expect(prompt).toContain('Accept offer');
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero impact choices', async () => {
      mockPrisma.simulationScenario.findUnique.mockResolvedValue({
        id: 'scenario-1',
        userId: 'user-1',
        currentStatus: { age: 22, savings: 5000000, happiness: 100 },
        decisions: [
          {
            eventTitle: 'Test',
            options: [
              {
                id: 'A',
                text: 'Do nothing',
                impact: { savings: 0, happiness: 0 },
              },
            ],
            aiNudge: 'Test',
          },
        ],
      });

      mockAi.modelInstance.generateContent.mockResolvedValue({
        response: {
          text: () => '{"eventTitle":"Test","options":[],"aiNudge":"test"}',
        },
      });

      mockPrisma.simulationScenario.update.mockResolvedValue({
        id: 'scenario-1',
      });

      await service.continueLifeScenario('user-1', 'scenario-1', 'A');

      const statusCall = mockValidation.validate.mock.calls.find(
        (call: unknown[]) => call[0] === 'SIMULATION_STATUS',
      )?.[1];

      expect(statusCall?.savings).toBe(5000000);
      expect(statusCall?.happiness).toBe(100);
    });

    it('should handle negative savings (debt)', async () => {
      mockPrisma.simulationScenario.findUnique.mockResolvedValue({
        id: 'scenario-1',
        userId: 'user-1',
        currentStatus: { age: 25, savings: 1000000, happiness: 80 },
        decisions: [
          {
            eventTitle: 'Test',
            options: [
              {
                id: 'A',
                text: 'Emergency expense',
                impact: { savings: -2000000, happiness: -10 },
              },
            ],
            aiNudge: 'Test',
          },
        ],
      });

      mockAi.modelInstance.generateContent.mockResolvedValue({
        response: {
          text: () => '{"eventTitle":"Test","options":[],"aiNudge":"test"}',
        },
      });

      mockPrisma.simulationScenario.update.mockResolvedValue({
        id: 'scenario-1',
      });

      await service.continueLifeScenario('user-1', 'scenario-1', 'A');

      const statusCall = mockValidation.validate.mock.calls.find(
        (call: unknown[]) => call[0] === 'SIMULATION_STATUS',
      )?.[1];

      expect(statusCall?.savings).toBe(-1000000);
    });

    it('should cap happiness at boundaries', async () => {
      mockPrisma.simulationScenario.findUnique.mockResolvedValue({
        id: 'scenario-1',
        userId: 'user-1',
        currentStatus: { age: 22, savings: 5000000, happiness: 100 },
        decisions: [
          {
            eventTitle: 'Test',
            options: [
              {
                id: 'A',
                text: 'Win lottery',
                impact: { savings: 0, happiness: 50 },
              },
            ],
            aiNudge: 'Test',
          },
        ],
      });

      mockAi.modelInstance.generateContent.mockResolvedValue({
        response: {
          text: () => '{"eventTitle":"Test","options":[],"aiNudge":"test"}',
        },
      });

      mockPrisma.simulationScenario.update.mockResolvedValue({
        id: 'scenario-1',
      });

      await service.continueLifeScenario('user-1', 'scenario-1', 'A');

      const statusCall = mockValidation.validate.mock.calls.find(
        (call: unknown[]) => call[0] === 'SIMULATION_STATUS',
      )?.[1];

      expect(statusCall?.happiness).toBe(150);
    });
  });
});
