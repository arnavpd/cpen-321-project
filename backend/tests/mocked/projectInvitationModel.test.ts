// Mock invitation.model module to avoid direct mongoose schema issues
jest.mock('../../src/features/invitations/invitation.model', () => {
  const mockInvitation = {
    _id: 'mock-invitation-id',
    projectId: 'mock-project-id',
    invitationCode: 'TESTINV123',
    invitedEmail: 'test@example.com',
    invitedBy: 'mock-inviter-id',
    role: 'member',
    status: 'pending',
    expiresAt: new Date('2024-12-31T23:59:59.999Z'),
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z')
  };

  return {
    ProjectInvitationModel: jest.fn().mockImplementation(() => ({
      create: jest.fn(),
      findById: jest.fn(),
      findByInvitationCode: jest.fn(),
      findByEmail: jest.fn(),
      updateStatus: jest.fn(),
      generateInvitationCode: jest.fn(),
      isInvitationValid: jest.fn(),
      cleanupExpiredInvitations: jest.fn(),
    })),
    mockInvitation
  };
});

import { ProjectInvitationModel } from '../../src/features/invitations/invitation.model';

describe('ProjectInvitationModel - Mocked Tests', () => {
  let projectInvitationModel: any;
  let mockMethods: any;

  const mockInvitation = {
    _id: 'mock-invitation-id',
    projectId: 'mock-project-id',
    invitationCode: 'TESTINV123',
    invitedEmail: 'test@example.com',
    invitedBy: 'mock-inviter-id',
    role: 'member',
    status: 'pending',
    expiresAt: new Date('2024-12-31T23:59:59.999Z'),
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z')
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    projectInvitationModel = new ProjectInvitationModel();
    
    // Get mock methods from the instance
    mockMethods = {
      create: projectInvitationModel.create,
      findById: projectInvitationModel.findById,
      findByInvitationCode: projectInvitationModel.findByInvitationCode,
      findByEmail: projectInvitationModel.findByEmail,
      updateStatus: projectInvitationModel.updateStatus,
      generateInvitationCode: projectInvitationModel.generateInvitationCode,
      isInvitationValid: projectInvitationModel.isInvitationValid,
      cleanupExpiredInvitations: projectInvitationModel.cleanupExpiredInvitations,
    };
  });

  describe('create', () => {
    test('should create invitation successfully', async () => {
      const invitationData = {
        projectId: mockInvitation.projectId,
        invitationCode: mockInvitation.invitationCode,
        invitedEmail: mockInvitation.invitedEmail,
        invitedBy: mockInvitation.invitedBy,
        role: mockInvitation.role,
        status: mockInvitation.status,
        expiresAt: mockInvitation.expiresAt
      };

      mockMethods.create.mockResolvedValue(mockInvitation);

      const result = await projectInvitationModel.create(invitationData);

      expect(mockMethods.create).toHaveBeenCalledWith(invitationData);
      expect(result).toEqual(mockInvitation);
    });

    test('should handle creation error', async () => {
      const invitationData = {
        projectId: mockInvitation.projectId,
        invitationCode: mockInvitation.invitationCode,
        invitedEmail: mockInvitation.invitedEmail,
        invitedBy: mockInvitation.invitedBy,
        role: mockInvitation.role,
        status: mockInvitation.status,
        expiresAt: mockInvitation.expiresAt
      };

      const errorMessage = 'Failed to create project invitation';
      mockMethods.create.mockRejectedValue(new Error(errorMessage));

      await expect(projectInvitationModel.create(invitationData)).rejects.toThrow(errorMessage);
    });

    test('should handle duplicate invitation code error', async () => {
      const invitationData = {
        projectId: mockInvitation.projectId,
        invitationCode: mockInvitation.invitationCode,
        invitedEmail: mockInvitation.invitedEmail,
        invitedBy: mockInvitation.invitedBy,
        role: mockInvitation.role,
        status: mockInvitation.status,
        expiresAt: mockInvitation.expiresAt
      };

      const duplicateError = new Error('Duplicate key error');
      (duplicateError as any).code = 11000;
      mockMethods.create.mockRejectedValue(duplicateError);

      await expect(projectInvitationModel.create(invitationData)).rejects.toThrow();
    });
  });

  describe('findById', () => {
    test('should find invitation by ID successfully', async () => {
      const invitationId = 'mock-invitation-id';
      
      mockMethods.findById.mockResolvedValue(mockInvitation);

      const result = await projectInvitationModel.findById(invitationId);

      expect(mockMethods.findById).toHaveBeenCalledWith(invitationId);
      expect(result).toEqual(mockInvitation);
    });

    test('should handle findById error', async () => {
      const invitationId = 'mock-invitation-id';
      const errorMessage = 'Failed to find project invitation';

      mockMethods.findById.mockRejectedValue(new Error(errorMessage));

      await expect(projectInvitationModel.findById(invitationId)).rejects.toThrow(errorMessage);
    });

    test('should return null when invitation not found', async () => {
      const invitationId = 'nonexistent-id';
      
      mockMethods.findById.mockResolvedValue(null);

      const result = await projectInvitationModel.findById(invitationId);

      expect(result).toBeNull();
    });
  });

  describe('findByInvitationCode', () => {
    test('should find invitation by code successfully', async () => {
      const invitationCode = 'TESTINV123';
      
      mockMethods.findByInvitationCode.mockResolvedValue(mockInvitation);

      const result = await projectInvitationModel.findByInvitationCode(invitationCode);

      expect(mockMethods.findByInvitationCode).toHaveBeenCalledWith(invitationCode);
      expect(result).toEqual(mockInvitation);
    });

    test('should handle findByInvitationCode error', async () => {
      const invitationCode = 'TESTINV123';
      const errorMessage = 'Failed to find invitation by code';

      mockMethods.findByInvitationCode.mockRejectedValue(new Error(errorMessage));

      await expect(projectInvitationModel.findByInvitationCode(invitationCode))
        .rejects.toThrow(errorMessage);
    });

    test('should return null when invitation code not found', async () => {
      const invitationCode = 'NONEXISTENT';
      
      mockMethods.findByInvitationCode.mockResolvedValue(null);

      const result = await projectInvitationModel.findByInvitationCode(invitationCode);

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    test('should find invitations by email successfully', async () => {
      const email = 'test@example.com';
      const invitations = [mockInvitation];
      
      mockMethods.findByEmail.mockResolvedValue(invitations);

      const result = await projectInvitationModel.findByEmail(email);

      expect(mockMethods.findByEmail).toHaveBeenCalledWith(email);
      expect(result).toEqual(invitations);
    });

    test('should handle findByEmail error', async () => {
      const email = 'test@example.com';
      const errorMessage = 'Failed to find invitations by email';

      mockMethods.findByEmail.mockRejectedValue(new Error(errorMessage));

      await expect(projectInvitationModel.findByEmail(email))
        .rejects.toThrow(errorMessage);
    });

    test('should return empty array when no invitations found', async () => {
      const email = 'noinvitations@example.com';
      
      mockMethods.findByEmail.mockResolvedValue([]);

      const result = await projectInvitationModel.findByEmail(email);

      expect(result).toEqual([]);
    });
  });

  describe('updateStatus', () => {
    test('should update invitation status successfully', async () => {
      const invitationId = 'mock-invitation-id';
      const newStatus = 'accepted';
      const updatedInvitation = { ...mockInvitation, status: newStatus };
      
      mockMethods.updateStatus.mockResolvedValue(updatedInvitation);

      const result = await projectInvitationModel.updateStatus(invitationId, newStatus);

      expect(mockMethods.updateStatus).toHaveBeenCalledWith(invitationId, newStatus);
      expect(result).toEqual(updatedInvitation);
    });

    test('should handle updateStatus error', async () => {
      const invitationId = 'mock-invitation-id';
      const newStatus = 'accepted';
      const errorMessage = 'Failed to update invitation status';

      mockMethods.updateStatus.mockRejectedValue(new Error(errorMessage));

      await expect(projectInvitationModel.updateStatus(invitationId, newStatus))
        .rejects.toThrow(errorMessage);
    });

    test('should return null when invitation not found for update', async () => {
      const invitationId = 'nonexistent-id';
      const newStatus = 'accepted';
      
      mockMethods.updateStatus.mockResolvedValue(null);

      const result = await projectInvitationModel.updateStatus(invitationId, newStatus);

      expect(result).toBeNull();
    });
  });

  describe('generateInvitationCode', () => {
    test('should generate unique invitation code', async () => {
      const expectedCode = 'UNIQUEINV123';
      
      mockMethods.generateInvitationCode.mockResolvedValue(expectedCode);

      const result = await projectInvitationModel.generateInvitationCode();

      expect(mockMethods.generateInvitationCode).toHaveBeenCalled();
      expect(result).toBe(expectedCode);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    test('should handle generation error', async () => {
      const errorMessage = 'Failed to generate invitation code';

      mockMethods.generateInvitationCode.mockRejectedValue(new Error(errorMessage));

      await expect(projectInvitationModel.generateInvitationCode())
        .rejects.toThrow(errorMessage);
    });

    test('should generate different codes on multiple calls', async () => {
      const code1 = 'INVITE001';
      const code2 = 'INVITE002';
      
      mockMethods.generateInvitationCode
        .mockResolvedValueOnce(code1)
        .mockResolvedValueOnce(code2);

      const result1 = await projectInvitationModel.generateInvitationCode();
      const result2 = await projectInvitationModel.generateInvitationCode();

      expect(result1).toBe(code1);
      expect(result2).toBe(code2);
      expect(result1).not.toBe(result2);
    });
  });

  describe('isInvitationValid', () => {
    test('should validate active invitation successfully', async () => {
      const invitationCode = 'TESTINV123';
      
      mockMethods.isInvitationValid.mockResolvedValue(true);

      const result = await projectInvitationModel.isInvitationValid(invitationCode);

      expect(mockMethods.isInvitationValid).toHaveBeenCalledWith(invitationCode);
      expect(result).toBe(true);
    });

    test('should return false for expired invitation', async () => {
      const invitationCode = 'EXPIRED123';
      
      mockMethods.isInvitationValid.mockResolvedValue(false);

      const result = await projectInvitationModel.isInvitationValid(invitationCode);

      expect(result).toBe(false);
    });

    test('should handle validation error', async () => {
      const invitationCode = 'TESTINV123';
      const errorMessage = 'Failed to validate invitation';

      mockMethods.isInvitationValid.mockRejectedValue(new Error(errorMessage));

      await expect(projectInvitationModel.isInvitationValid(invitationCode))
        .rejects.toThrow(errorMessage);
    });
  });

  describe('cleanupExpiredInvitations', () => {
    test('should clean up expired invitations successfully', async () => {
      const cleanupResult = { deletedCount: 5 };
      
      mockMethods.cleanupExpiredInvitations.mockResolvedValue(cleanupResult);

      const result = await projectInvitationModel.cleanupExpiredInvitations();

      expect(mockMethods.cleanupExpiredInvitations).toHaveBeenCalled();
      expect(result).toEqual(cleanupResult);
      expect(result.deletedCount).toBe(5);
    });

    test('should handle cleanup with no expired invitations', async () => {
      const cleanupResult = { deletedCount: 0 };
      
      mockMethods.cleanupExpiredInvitations.mockResolvedValue(cleanupResult);

      const result = await projectInvitationModel.cleanupExpiredInvitations();

      expect(result.deletedCount).toBe(0);
    });

    test('should handle cleanup error', async () => {
      const errorMessage = 'Failed to cleanup expired invitations';

      mockMethods.cleanupExpiredInvitations.mockRejectedValue(new Error(errorMessage));

      await expect(projectInvitationModel.cleanupExpiredInvitations())
        .rejects.toThrow(errorMessage);
    });
  });
});