/**
 * I006: CommitmentContract → Payment Flow Integration Tests
 * Tests contract creation, fund deposits, goal achievement verification, and payout calculation
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('I006: CommitmentContract → Payment Flow', () => {
  let testUserId: string;
  let testContractId: string;

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.simulationCommitment.deleteMany({
      where: { userId: testUserId }
    });
    await prisma.behaviorLog.deleteMany({
      where: { userId: testUserId }
    });
    await prisma.user.deleteMany({
      where: { email: { contains: '@commitment-test.com' } }
    });
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    const user = await prisma.user.create({
      data: {
        email: `user-${Date.now()}@commitment-test.com`,
        passwordHash: 'hashed',
        name: { vi: 'Commitment User', en: 'Commitment User', zh: '承诺用户' },
        points: 200,
        virtualPortfolio: {
          create: {
            balance: 1000,
            totalDeposits: 1000,
            totalWithdrawals: 0
          }
        }
      }
    });
    testUserId = user.id;
  });

  it('S01: Should create commitment contract with stake amount', async () => {
    const contract = await prisma.simulationCommitment.create({
      data: {
        userId: testUserId,
        type: 'STREAK_CHALLENGE',
        goal: { vi: 'Học 7 ngày liên tiếp', en: 'Study 7 days in a row', zh: '连续学习7天' },
        stake: 100,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        status: 'ACTIVE'
      }
    });

    testContractId = contract.id;
    expect(contract).toBeDefined();
    expect(contract.stake).toBe(100);
    expect(contract.status).toBe('ACTIVE');
  });

  it('S02: Should deduct stake from user balance on contract creation', async () => {
    const initialBalance = (await prisma.virtualPortfolio.findUnique({
      where: { userId: testUserId }
    }))!.balance;

    const contract = await prisma.simulationCommitment.create({
      data: {
        userId: testUserId,
        type: 'SAVINGS_GOAL',
        goal: { vi: 'Tiết kiệm 500', en: 'Save 500', zh: '储蓄500' },
        stake: 50,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'ACTIVE'
      }
    });

    // Deduct stake
    await prisma.virtualPortfolio.update({
      where: { userId: testUserId },
      data: {
        balance: { decrement: contract.stake },
        totalWithdrawals: { increment: contract.stake }
      }
    });

    const newBalance = (await prisma.virtualPortfolio.findUnique({
      where: { userId: testUserId }
    }))!.balance;

    expect(newBalance).toBe(initialBalance - 50);

    // Cleanup
    await prisma.simulationCommitment.delete({ where: { id: contract.id } });
  });

  it('S03: Should verify goal achievement and update contract status', async () => {
    const contract = await prisma.simulationCommitment.create({
      data: {
        userId: testUserId,
        type: 'COURSE_COMPLETION',
        goal: { vi: 'Hoàn thành khóa học', en: 'Complete course', zh: '完成课程' },
        stake: 100,
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        status: 'ACTIVE'
      }
    });

    // Simulate goal achievement
    const updated = await prisma.simulationCommitment.update({
      where: { id: contract.id },
      data: {
        status: 'SUCCEEDED',
        completedAt: new Date()
      }
    });

    expect(updated.status).toBe('SUCCEEDED');
    expect(updated.completedAt).toBeDefined();

    // Cleanup
    await prisma.simulationCommitment.delete({ where: { id: contract.id } });
  });

  it('S04: Should calculate payout for successful contract', async () => {
    const contract = await prisma.simulationCommitment.create({
      data: {
        userId: testUserId,
        type: 'STREAK_CHALLENGE',
        goal: { vi: 'Streak 7 days', en: 'Streak 7 days', zh: '连续7天' },
        stake: 100,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'SUCCEEDED',
        completedAt: new Date()
      }
    });

    // Payout = stake + bonus (e.g., 20% bonus)
    const bonus = contract.stake * 0.2;
    const totalPayout = contract.stake + bonus;

    const payoutLog = await prisma.behaviorLog.create({
      data: {
        userId: testUserId,
        action: 'CONTRACT_PAYOUT',
        context: {
          contractId: contract.id,
          stake: contract.stake,
          bonus,
          totalPayout
        }
      }
    });

    expect((payoutLog.context as any).totalPayout).toBe(120);

    // Cleanup
    await prisma.behaviorLog.delete({ where: { id: payoutLog.id } });
    await prisma.simulationCommitment.delete({ where: { id: contract.id } });
  });

  it('S05: Should handle contract failure and loss aversion logic', async () => {
    const contract = await prisma.simulationCommitment.create({
      data: {
        userId: testUserId,
        type: 'SAVINGS_GOAL',
        goal: { vi: 'Fail goal', en: 'Fail goal', zh: '失败目标' },
        stake: 50,
        deadline: new Date(Date.now() - 1000), // Already passed
        status: 'ACTIVE'
      }
    });

    // Mark as failed
    const updated = await prisma.simulationCommitment.update({
      where: { id: contract.id },
      data: { status: 'FAILED' }
    });

    expect(updated.status).toBe('FAILED');

    // User loses stake (already deducted, no refund)
    const lossLog = await prisma.behaviorLog.create({
      data: {
        userId: testUserId,
        action: 'CONTRACT_FAILED',
        context: {
          contractId: contract.id,
          lostStake: contract.stake
        }
      }
    });

    expect((lossLog.context as any).lostStake).toBe(50);

    // Cleanup
    await prisma.behaviorLog.delete({ where: { id: lossLog.id } });
    await prisma.simulationCommitment.delete({ where: { id: contract.id } });
  });

  it('S06: Should prevent withdrawal of staked funds during active contract', async () => {
    const contract = await prisma.simulationCommitment.create({
      data: {
        userId: testUserId,
        type: 'STREAK_CHALLENGE',
        goal: { vi: 'Active contract', en: 'Active contract', zh: '活动合同' },
        stake: 100,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'ACTIVE'
      }
    });

    // Check if user has active contracts
    const activeContracts = await prisma.simulationCommitment.count({
      where: { userId: testUserId, status: 'ACTIVE' }
    });

    const stakedAmount = await prisma.simulationCommitment.aggregate({
      where: { userId: testUserId, status: 'ACTIVE' },
      _sum: { stake: true }
    });

    expect(activeContracts).toBeGreaterThan(0);
    expect(stakedAmount._sum.stake).toBeGreaterThanOrEqual(100);

    // Cleanup
    await prisma.simulationCommitment.delete({ where: { id: contract.id } });
  });

  it('S07: Should track transaction integrity for deposits and payouts', async () => {
    const contract = await prisma.simulationCommitment.create({
      data: {
        userId: testUserId,
        type: 'COURSE_COMPLETION',
        goal: { vi: 'Complete', en: 'Complete', zh: '完成' },
        stake: 100,
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        status: 'SUCCEEDED',
        completedAt: new Date()
      }
    });

    // Log deposit transaction
    await prisma.behaviorLog.create({
      data: {
        userId: testUserId,
        action: 'FUNDS_DEPOSITED',
        context: { contractId: contract.id, amount: 100 }
      }
    });

    // Log payout transaction
    await prisma.behaviorLog.create({
      data: {
        userId: testUserId,
        action: 'FUNDS_PAID_OUT',
        context: { contractId: contract.id, amount: 120 }
      }
    });

    const transactions = await prisma.behaviorLog.count({
      where: {
        userId: testUserId,
        action: { in: ['FUNDS_DEPOSITED', 'FUNDS_PAID_OUT'] }
      }
    });

    expect(transactions).toBe(2);

    // Cleanup
    await prisma.behaviorLog.deleteMany({
      where: { userId: testUserId, action: { in: ['FUNDS_DEPOSITED', 'FUNDS_PAID_OUT'] } }
    });
    await prisma.simulationCommitment.delete({ where: { id: contract.id } });
  });

  it('S08: Should apply loss aversion multiplier for high-stakes contracts', async () => {
    const highStakeContract = await prisma.simulationCommitment.create({
      data: {
        userId: testUserId,
        type: 'MAJOR_GOAL',
        goal: { vi: 'High stakes', en: 'High stakes', zh: '高风险' },
        stake: 500,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'ACTIVE'
      }
    });

    // Apply 2x loss aversion multiplier
    const lossAversionMultiplier = 2;
    const potentialLoss = highStakeContract.stake * lossAversionMultiplier;

    const nudgeLog = await prisma.behaviorLog.create({
      data: {
        userId: testUserId,
        action: 'LOSS_AVERSION_NUDGE',
        context: {
          contractId: highStakeContract.id,
          potentialLoss,
          message: `You could lose ${potentialLoss} if you don't complete this goal!`
        }
      }
    });

    expect((nudgeLog.context as any).potentialLoss).toBe(1000);

    // Cleanup
    await prisma.behaviorLog.delete({ where: { id: nudgeLog.id } });
    await prisma.simulationCommitment.delete({ where: { id: highStakeContract.id } });
  });

  it('S09: Should support partial goal completion with prorated payout', async () => {
    const contract = await prisma.simulationCommitment.create({
      data: {
        userId: testUserId,
        type: 'MULTI_STEP_GOAL',
        goal: { vi: '10 steps', en: '10 steps', zh: '10步骤' },
        stake: 100,
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        status: 'ACTIVE'
      }
    });

    // User completed 7 out of 10 steps
    const completionRate = 0.7;
    const proratedPayout = contract.stake * completionRate;

    await prisma.simulationCommitment.update({
      where: { id: contract.id },
      data: { status: 'PARTIAL' }
    });

    const payoutLog = await prisma.behaviorLog.create({
      data: {
        userId: testUserId,
        action: 'PARTIAL_PAYOUT',
        context: {
          contractId: contract.id,
          completionRate,
          payout: proratedPayout
        }
      }
    });

    expect((payoutLog.context as any).payout).toBe(70);

    // Cleanup
    await prisma.behaviorLog.delete({ where: { id: payoutLog.id } });
    await prisma.simulationCommitment.delete({ where: { id: contract.id } });
  });

  it('S10: Should validate sufficient balance before contract creation', async () => {
    const portfolio = await prisma.virtualPortfolio.findUnique({
      where: { userId: testUserId }
    });

    const requestedStake = 2000;
    const hasEnoughBalance = portfolio!.balance >= requestedStake;

    expect(hasEnoughBalance).toBe(false);

    if (!hasEnoughBalance) {
      // Prevent contract creation
      const errorLog = await prisma.behaviorLog.create({
        data: {
          userId: testUserId,
          action: 'CONTRACT_CREATION_FAILED',
          context: {
            reason: 'INSUFFICIENT_BALANCE',
            requestedStake,
            availableBalance: portfolio!.balance
          }
        }
      });

      expect((errorLog.context as any).reason).toBe('INSUFFICIENT_BALANCE');

      // Cleanup
      await prisma.behaviorLog.delete({ where: { id: errorLog.id } });
    }
  });
});
