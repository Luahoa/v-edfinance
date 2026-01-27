import { NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../prisma/prisma.service';
import { ChecklistsService } from './checklists.service';

describe('ChecklistsService', () => {
  let service: ChecklistsService;
  let prisma: PrismaService;

  const mockPrisma = {
    userChecklist: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    user: {
      update: vi.fn(),
    },
    userAchievement: {
      create: vi.fn(),
    },
  };

  const mockEventEmitter = {
    emit: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ChecklistsService(mockPrisma as any, mockEventEmitter as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updateItem', () => {
    it('should update item and calculate progress correctly', async () => {
      const checklistId = 'cl-1';
      const userId = 'user-1';
      const mockChecklist = {
        id: checklistId,
        userId,
        items: [
          { text: 'Task 1', completed: false },
          { text: 'Task 2', completed: false },
        ],
        progress: 0,
      };

      mockPrisma.userChecklist.findUnique.mockResolvedValue(mockChecklist);
      mockPrisma.userChecklist.update.mockResolvedValue({
        ...mockChecklist,
        progress: 50,
      });

      const result = await service.updateItem(userId, checklistId, 0, true);

      expect(result.checklist.progress).toBe(50);
      expect(mockPrisma.userChecklist.update).toHaveBeenCalledWith({
        where: { id: checklistId },
        data: expect.objectContaining({ progress: 50 }),
      });
    });

    it('should reward when 100% completed', async () => {
      const checklistId = 'cl-1';
      const userId = 'user-1';
      const mockChecklist = {
        id: checklistId,
        userId,
        title: 'Test Checklist',
        items: [
          { text: 'Task 1', completed: true },
          { text: 'Task 2', completed: false },
        ],
        progress: 50,
      };

      mockPrisma.userChecklist.findUnique.mockResolvedValue(mockChecklist);
      mockPrisma.userChecklist.update.mockResolvedValue({
        ...mockChecklist,
        progress: 100,
      });

      const result = await service.updateItem(userId, checklistId, 1, true);

      expect(result.rewarded).toBe(true);
      expect(mockPrisma.user.update).toHaveBeenCalled();
      expect(mockPrisma.userAchievement.create).toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'points.earned',
        expect.objectContaining({
          userId,
          eventType: 'CHECKLIST_COMPLETED',
          pointsEarned: 50,
        }),
      );
    });

    it('should not reward if already 100% completed before', async () => {
      const checklistId = 'cl-1';
      const userId = 'user-1';
      const mockChecklist = {
        id: checklistId,
        userId,
        title: 'Test Checklist',
        items: [
          { text: 'Task 1', completed: true },
          { text: 'Task 2', completed: true },
        ],
        progress: 100,
      };

      mockPrisma.userChecklist.findUnique.mockResolvedValue(mockChecklist);
      mockPrisma.userChecklist.update.mockResolvedValue(mockChecklist);

      const result = await service.updateItem(userId, checklistId, 0, true);

      expect(result.rewarded).toBe(false);
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
      expect(mockPrisma.userAchievement.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException for non-existent checklist', async () => {
      mockPrisma.userChecklist.findUnique.mockResolvedValue(null);

      await expect(
        service.updateItem('user-1', 'cl-999', 0, true),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException for wrong user', async () => {
      mockPrisma.userChecklist.findUnique.mockResolvedValue({
        id: 'cl-1',
        userId: 'other-user',
        items: [],
      });

      await expect(
        service.updateItem('user-1', 'cl-1', 0, true),
      ).rejects.toThrow(NotFoundException);
    });

    it('should mark item as incomplete and recalculate progress', async () => {
      const checklistId = 'cl-1';
      const userId = 'user-1';
      const mockChecklist = {
        id: checklistId,
        userId,
        items: [
          { text: 'Task 1', completed: true },
          { text: 'Task 2', completed: true },
        ],
        progress: 100,
      };

      mockPrisma.userChecklist.findUnique.mockResolvedValue(mockChecklist);
      mockPrisma.userChecklist.update.mockResolvedValue({
        ...mockChecklist,
        progress: 50,
      });

      const result = await service.updateItem(userId, checklistId, 1, false);

      expect(result.checklist.progress).toBe(50);
      expect(result.message).toContain('Đừng bỏ cuộc');
    });

    it('should set completedAt timestamp when completing item', async () => {
      const checklistId = 'cl-1';
      const userId = 'user-1';
      const mockChecklist = {
        id: checklistId,
        userId,
        items: [{ text: 'Task 1', completed: false, completedAt: null }],
        progress: 0,
      };

      mockPrisma.userChecklist.findUnique.mockResolvedValue(mockChecklist);
      mockPrisma.userChecklist.update.mockImplementation(async ({ data }) => ({
        ...mockChecklist,
        items: data.items,
        progress: data.progress,
      }));

      await service.updateItem(userId, checklistId, 0, true);

      expect(mockPrisma.userChecklist.update).toHaveBeenCalledWith({
        where: { id: checklistId },
        data: expect.objectContaining({
          items: expect.arrayContaining([
            expect.objectContaining({
              completed: true,
              completedAt: expect.any(Date),
            }),
          ]),
        }),
      });
    });
  });

  describe('create', () => {
    it('should create a new checklist with 0 progress', async () => {
      const userId = 'user-1';
      const title = 'Daily Tasks';
      const category = 'FINANCIAL';
      const items = [
        { text: 'Review budget', completed: false },
        { text: 'Track expenses', completed: false },
      ];

      mockPrisma.userChecklist.create.mockResolvedValue({
        id: 'cl-1',
        userId,
        title,
        category,
        items,
        progress: 0,
      });

      const result = await service.create(userId, title, category, items);

      expect(result.progress).toBe(0);
      expect(mockPrisma.userChecklist.create).toHaveBeenCalledWith({
        data: {
          userId,
          title,
          category,
          items,
          progress: 0,
        },
      });
    });
  });

  describe('findAll', () => {
    it('should return all checklists ordered by updatedAt desc', async () => {
      const userId = 'user-1';
      const mockChecklists = [
        {
          id: 'cl-2',
          userId,
          title: 'Recent',
          updatedAt: new Date('2025-12-20'),
        },
        {
          id: 'cl-1',
          userId,
          title: 'Older',
          updatedAt: new Date('2025-12-19'),
        },
      ];

      mockPrisma.userChecklist.findMany.mockResolvedValue(mockChecklists);

      const result = await service.findAll(userId);

      expect(result).toEqual(mockChecklists);
      expect(mockPrisma.userChecklist.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
      });
    });

    it('should return empty array if no checklists exist', async () => {
      mockPrisma.userChecklist.findMany.mockResolvedValue([]);

      const result = await service.findAll('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('Progress calculation', () => {
    it('should calculate 0% for all incomplete items', async () => {
      const checklistId = 'cl-1';
      const userId = 'user-1';
      const mockChecklist = {
        id: checklistId,
        userId,
        items: [
          { text: 'Task 1', completed: false },
          { text: 'Task 2', completed: false },
          { text: 'Task 3', completed: false },
        ],
        progress: 0,
      };

      mockPrisma.userChecklist.findUnique.mockResolvedValue(mockChecklist);
      mockPrisma.userChecklist.update.mockResolvedValue({
        ...mockChecklist,
        progress: 33,
      });

      const result = await service.updateItem(userId, checklistId, 0, true);

      expect(mockPrisma.userChecklist.update).toHaveBeenCalledWith({
        where: { id: checklistId },
        data: expect.objectContaining({
          progress: 33,
        }),
      });
    });

    it('should round progress correctly', async () => {
      const checklistId = 'cl-1';
      const userId = 'user-1';
      const mockChecklist = {
        id: checklistId,
        userId,
        items: [
          { text: 'Task 1', completed: true },
          { text: 'Task 2', completed: false },
          { text: 'Task 3', completed: false },
        ],
        progress: 33,
      };

      mockPrisma.userChecklist.findUnique.mockResolvedValue(mockChecklist);
      mockPrisma.userChecklist.update.mockResolvedValue({
        ...mockChecklist,
        progress: 67,
      });

      await service.updateItem(userId, checklistId, 1, true);

      expect(mockPrisma.userChecklist.update).toHaveBeenCalledWith({
        where: { id: checklistId },
        data: expect.objectContaining({
          progress: 67,
        }),
      });
    });
  });
});
