import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { createSiweMessage, createSiweMessageAction } from '../actions/createMessage';
import { type Memory } from '@elizaos/core';
import { SiweMessage } from 'siwe';
import { ethers } from 'ethers';

const TEST_USER_ID = 'aaaaa-bbbbb-ccccc-ddddd-eeeee';
const TEST_AGENT_ID = 'aaaaa-bbbbb-ccccc-ddddd-fffff';
const TEST_ROOM_ID = 'aaaaa-bbbbb-ccccc-ddddd-ddddd';
const mockAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

// Import setup first to ensure mocks are properly initialized
import './setup';

describe('Create SIWE Message Action', () => {
    let mockRuntime: any;
    let mockCallback: any;
    let message: Memory;

    beforeEach(() => {
        vi.clearAllMocks();
        
        // Setup default mock implementations
        (ethers.isAddress as unknown as Mock).mockReturnValue(true);
        (ethers.getAddress as unknown as Mock).mockReturnValue(mockAddress);

        mockCallback = vi.fn();
        mockRuntime = {
            messageManager: {
                createMemory: vi.fn().mockResolvedValue(true)
            },
            getSetting: vi.fn().mockImplementation((key) => {
                const settings = {
                    DOMAIN: 'test.domain.xyz',
                    URI: 'https://test.domain.xyz',
                    SIWE_STATEMENT: 'Test statement',
                    SIWE_VERIFICATION_EXPIRY: '600000'
                };
                return settings[key];
            }),
            agentId: TEST_AGENT_ID
        };
        message = {
            content: {
                text: mockAddress
            },
            userId: TEST_USER_ID,
            agentId: TEST_AGENT_ID,
            roomId: TEST_ROOM_ID
        } as Memory;
    });

    describe('Message Creation', () => {
        it('should create SIWE message with default settings', async () => {
            const result = await createSiweMessage(mockRuntime, message, undefined, undefined, mockCallback);

            expect(result).toBe(true);
            expect(mockRuntime.messageManager.createMemory).toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalled();
            const callbackArg = mockCallback.mock.calls[0][0];
            expect(callbackArg.text).toContain('Sign in with Ethereum');
            expect(callbackArg.text).toContain(mockAddress);
        });

        it('should handle invalid address', async () => {
            (ethers.isAddress as unknown as Mock).mockReturnValueOnce(false);
            (ethers.getAddress as unknown as Mock).mockImplementationOnce(() => {
                throw new Error('Invalid address');
            });

            message.content.text = 'invalid-address';
            const result = await createSiweMessage(mockRuntime, message, undefined, undefined, mockCallback);

            expect(result).toBe(false);
            expect(mockCallback).toHaveBeenCalledWith({
                text: expect.stringContaining('Failed to create SIWE message'),
                content: { error: expect.any(String) }
            });
        });

        it('should handle missing runtime settings', async () => {
            mockRuntime.getSetting.mockReturnValue(undefined);
            
            const result = await createSiweMessage(mockRuntime, message, undefined, undefined, mockCallback);

            expect(result).toBe(false);
            expect(mockCallback).toHaveBeenCalledWith({
                text: expect.stringContaining('Failed to create SIWE message'),
                content: { error: expect.any(String) }
            });
        });

        it('should handle memory creation failure', async () => {
            mockRuntime.messageManager.createMemory.mockRejectedValue(new Error('Failed to create memory'));

            const result = await createSiweMessage(mockRuntime, message, undefined, undefined, mockCallback);

            expect(result).toBe(false);
            expect(mockCallback).toHaveBeenCalledWith({
                text: expect.stringContaining('Failed to create SIWE message'),
                content: { error: expect.any(String) }
            });
        });
    });

    describe('Action Validation', () => {
        it('should validate ethereum addresses', async () => {
            (ethers.isAddress as unknown as Mock).mockReset();
            (ethers.isAddress as unknown as Mock)
                .mockReturnValueOnce(true)
                .mockReturnValueOnce(false);

            const validMessage = { content: { text: mockAddress } } as Memory;
            const invalidMessage = { content: { text: 'invalid' } } as Memory;

            expect(await createSiweMessageAction.validate(mockRuntime, validMessage)).toBe(true);
            expect(await createSiweMessageAction.validate(mockRuntime, invalidMessage)).toBe(false);
        });
    });
}); 