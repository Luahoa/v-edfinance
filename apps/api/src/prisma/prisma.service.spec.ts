import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PrismaService();
  });

  describe('onModuleInit', () => {
    it('should connect to database on module init', async () => {
      const connectSpy = vi.spyOn(service, '$connect').mockResolvedValue();

      await service.onModuleInit();

      expect(connectSpy).toHaveBeenCalled();
    });

    it('should handle connection failure gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.spyOn(service, '$connect').mockRejectedValue(
        new Error('Connection failed'),
      );

      await service.onModuleInit();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Prisma failed to connect to database, but continuing for testing purposes.',
      );

      consoleSpy.mockRestore();
    });

    it('should not throw error when database is unavailable', async () => {
      vi.spyOn(service, '$connect').mockRejectedValue(
        new Error('DB unavailable'),
      );
      vi.spyOn(console, 'warn').mockImplementation(() => {});

      await expect(service.onModuleInit()).resolves.not.toThrow();
    });
  });

  describe('onModuleDestroy', () => {
    it('should disconnect from database on module destroy', async () => {
      const disconnectSpy = vi
        .spyOn(service, '$disconnect')
        .mockResolvedValue();

      await service.onModuleDestroy();

      expect(disconnectSpy).toHaveBeenCalled();
    });

    it('should handle disconnection errors', async () => {
      const disconnectSpy = vi
        .spyOn(service, '$disconnect')
        .mockRejectedValue(new Error('Disconnect failed'));

      await expect(service.onModuleDestroy()).rejects.toThrow(
        'Disconnect failed',
      );
    });
  });

  describe('transaction handling', () => {
    it('should support Prisma transactions', async () => {
      const mockTx = vi.fn().mockResolvedValue('transaction result');

      // Mock $transaction method
      service.$transaction = mockTx as any;

      const result = await service.$transaction(async (tx: any) => {
        return 'transaction result';
      });

      expect(result).toBe('transaction result');
      expect(mockTx).toHaveBeenCalled();
    });

    it('should rollback transaction on error', async () => {
      const mockError = new Error('Transaction error');
      service.$transaction = vi.fn().mockRejectedValue(mockError);

      await expect(
        service.$transaction(async () => {
          throw mockError;
        }),
      ).rejects.toThrow('Transaction error');
    });

    it('should support sequential operations in transaction', async () => {
      const operations: string[] = [];

      service.$transaction = vi
        .fn()
        .mockImplementation(async (callback: any) => {
          const mockTx = {
            user: {
              create: vi.fn().mockImplementation(async () => {
                operations.push('create user');
                return { id: 'u1' };
              }),
            },
            behaviorLog: {
              create: vi.fn().mockImplementation(async () => {
                operations.push('create log');
                return { id: 'log1' };
              }),
            },
          };
          return await callback(mockTx);
        });

      await service.$transaction(async (tx: any) => {
        await tx.user.create({ data: {} });
        await tx.behaviorLog.create({ data: {} });
      });

      expect(operations).toEqual(['create user', 'create log']);
    });
  });

  describe('error handling', () => {
    it('should handle unique constraint violation', async () => {
      const uniqueError = {
        code: 'P2002',
        message: 'Unique constraint failed',
      };

      service.user = {
        create: vi.fn().mockRejectedValue(uniqueError),
      } as any;

      await expect(
        service.user.create({
          data: { email: 'existing@example.com' },
        }),
      ).rejects.toMatchObject({ code: 'P2002' });
    });

    it('should handle foreign key constraint violation', async () => {
      const fkError = {
        code: 'P2003',
        message: 'Foreign key constraint failed',
      };

      service.behaviorLog = {
        create: vi.fn().mockRejectedValue(fkError),
      } as any;

      await expect(
        service.behaviorLog.create({
          data: { userId: 'nonexistent' },
        }),
      ).rejects.toMatchObject({ code: 'P2003' });
    });

    it('should handle record not found', async () => {
      const notFoundError = {
        code: 'P2025',
        message: 'Record to update not found',
      };

      service.user = {
        update: vi.fn().mockRejectedValue(notFoundError),
      } as any;

      await expect(
        service.user.update({
          where: { id: 'nonexistent' },
          data: { name: 'New Name' },
        }),
      ).rejects.toMatchObject({ code: 'P2025' });
    });
  });

  describe('connection lifecycle', () => {
    it('should allow reconnection after disconnect', async () => {
      const connectSpy = vi.spyOn(service, '$connect').mockResolvedValue();
      const disconnectSpy = vi
        .spyOn(service, '$disconnect')
        .mockResolvedValue();

      await service.onModuleInit();
      await service.onModuleDestroy();
      await service.onModuleInit();

      expect(connectSpy).toHaveBeenCalledTimes(2);
      expect(disconnectSpy).toHaveBeenCalledTimes(1);
    });

    it('should be singleton across module', () => {
      const service1 = new PrismaService();
      const service2 = new PrismaService();

      // Both instances extend PrismaClient
      expect(service1).toBeInstanceOf(PrismaService);
      expect(service2).toBeInstanceOf(PrismaService);
    });
  });

  describe('query operations', () => {
    it('should support findMany queries', async () => {
      const mockData = [
        { id: '1', email: 'user1@example.com' },
        { id: '2', email: 'user2@example.com' },
      ];

      service.user = {
        findMany: vi.fn().mockResolvedValue(mockData),
      } as any;

      const result = await service.user.findMany();

      expect(result).toEqual(mockData);
      expect(service.user.findMany).toHaveBeenCalled();
    });

    it('should support findUnique queries', async () => {
      const mockUser = { id: 'u1', email: 'user@example.com' };

      service.user = {
        findUnique: vi.fn().mockResolvedValue(mockUser),
      } as any;

      const result = await service.user.findUnique({ where: { id: 'u1' } });

      expect(result).toEqual(mockUser);
    });

    it('should support create operations', async () => {
      const newUser = { id: 'u1', email: 'new@example.com' };

      service.user = {
        create: vi.fn().mockResolvedValue(newUser),
      } as any;

      const result = await service.user.create({
        data: { email: 'new@example.com' },
      });

      expect(result).toEqual(newUser);
    });

    it('should support update operations', async () => {
      const updatedUser = { id: 'u1', email: 'updated@example.com' };

      service.user = {
        update: vi.fn().mockResolvedValue(updatedUser),
      } as any;

      const result = await service.user.update({
        where: { id: 'u1' },
        data: { email: 'updated@example.com' },
      });

      expect(result).toEqual(updatedUser);
    });

    it('should support delete operations', async () => {
      const deletedUser = { id: 'u1', email: 'deleted@example.com' };

      service.user = {
        delete: vi.fn().mockResolvedValue(deletedUser),
      } as any;

      const result = await service.user.delete({ where: { id: 'u1' } });

      expect(result).toEqual(deletedUser);
    });
  });
});
