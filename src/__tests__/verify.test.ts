import { describe, it, expect, vi, beforeEach } from 'vitest';
import { verify, verifyAction } from '../actions/verify';
import { type Memory } from '@elizaos/core';
import { SiweMessage } from 'siwe';

const TEST_USER_ID = 'aaaaa-bbbbb-ccccc-ddddd-eeeee';
const TEST_AGENT_ID = 'aaaaa-bbbbb-ccccc-ddddd-fffff';
const TEST_ROOM_ID = 'aaaaa-bbbbb-ccccc-ddddd-ddddd';

describe('Verify Action', () => {
    const mockAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
    const mockSignature = '0x' + '1'.repeat(130);
    let mockRuntime: any;
    let mockCallback: any;
    let message: Memory;

    beforeEach(() => {
        mockCallback = vi.fn();
        mockRuntime = {
            messageManager: {
                getMemories: vi.fn().mockResolvedValue([]),
                createMemory: vi.fn().mockResolvedValue(true)
            },
            getSetting: vi.fn(),
            agentId: TEST_AGENT_ID
        };
        message = {
            content: {
                text: mockSignature
            },
            userId: TEST_USER_ID,
            agentId: TEST_AGENT_ID,
            roomId: TEST_ROOM_ID
        } as Memory;
    });

    describe('Action Validation', () => {
        it('should validate signature format correctly', async () => {
            // Replace direct ethers mock with vi.mock
            vi.mock('ethers', () => ({
                ethers: {
                    isHexString: vi.fn().mockImplementation((value, length) => {
                        return value.startsWith('0x') && value.length === 132;
                    })
                }
            }));

            const validMessage = { content: { text: mockSignature } } as Memory;
            const invalidMessage = { content: { text: 'invalid' } } as Memory;

            expect(await verifyAction.validate(mockRuntime, validMessage)).toBe(true);
            expect(await verifyAction.validate(mockRuntime, invalidMessage)).toBe(false);
        });
    });

    describe('Verification Flow', () => {
        it('should handle missing verification flow', async () => {
            mockRuntime.messageManager.getMemories.mockResolvedValue([]);

            const result = await verify(mockRuntime, message, undefined, undefined, mockCallback);

            expect(result).toBe(false);
            expect(mockCallback).toHaveBeenCalledWith({
                text: "No pending verification found. Please provide your Ethereum address first",
                content: { error: "No pending verification" }
            });
        });

        it('should verify valid signature with pending flow', async () => {
            const mockSiweMessage = {
                address: mockAddress,
                verify: vi.fn().mockResolvedValue({ success: true }),
                prepareMessage: vi.fn().mockReturnValue('test message'),
                toString: vi.fn().mockReturnValue('test message string')
            };

            mockRuntime.messageManager.getMemories.mockResolvedValue([{
                content: {
                    siwe: mockSiweMessage,
                    verified: false,
                    text: 'test message'
                },
                userId: TEST_USER_ID
            }]);

            const result = await verify(mockRuntime, message, undefined, undefined, mockCallback);

            expect(result).toBe(true);
            expect(mockCallback).toHaveBeenCalledWith({
                text: `Successfully verified ownership of address ${mockAddress}`,
                content: {
                    verified: true,
                    address: mockAddress
                }
            });
        });

        it('should handle verification with invalid signature', async () => {
            const verifyMock = vi.fn().mockImplementation(() => ({
                success: false,
                error: 'Invalid signature'
            }));

            const mockSiweMessage = {
                domain: 'test.domain',
                address: mockAddress,
                uri: 'https://test.domain',
                version: '1',
                chainId: 1,
                nonce: 'test-nonce',
                prepareMessage: vi.fn().mockReturnValue('test message'),
                toMessage: vi.fn().mockReturnValue('test message'),
                validate: vi.fn().mockResolvedValue({})
            };

            // Create a class instance-like object
            const siweInstance = Object.create(SiweMessage.prototype, {
                ...Object.getOwnPropertyDescriptors(mockSiweMessage),
                verify: { value: verifyMock }
            });

            vi.mocked(SiweMessage).mockImplementation(() => siweInstance);

            mockRuntime.messageManager.getMemories.mockResolvedValue([{
                content: {
                    siwe: mockSiweMessage,
                    verified: false,
                    text: 'test message'
                },
                userId: TEST_USER_ID
            }]);

            const result = await verify(mockRuntime, message, undefined, undefined, mockCallback);

            expect(result).toBe(false);
            expect(mockCallback).toHaveBeenCalledWith({
                text: 'Invalid signature',
                content: { verificationResult: { success: false, error: 'Invalid signature' } }
            });
        });

        it('should handle expired verification', async () => {
            const verifyMock = vi.fn().mockImplementation(() => {
                throw new Error('ExpiredMessage');
            });

            const mockSiweMessage = {
                domain: 'test.domain',
                address: mockAddress,
                uri: 'https://test.domain',
                version: '1',
                chainId: 1,
                nonce: 'test-nonce',
                prepareMessage: vi.fn().mockReturnValue('test message'),
                toMessage: vi.fn().mockReturnValue('test message'),
                validate: vi.fn().mockResolvedValue({})
            };

            const siweInstance = Object.create(SiweMessage.prototype, {
                ...Object.getOwnPropertyDescriptors(mockSiweMessage),
                verify: { value: verifyMock }
            });

            vi.mocked(SiweMessage).mockImplementation(() => siweInstance);

            mockRuntime.messageManager.getMemories.mockResolvedValue([{
                content: {
                    siwe: mockSiweMessage,
                    verified: false,
                    text: 'test message'
                },
                userId: TEST_USER_ID
            }]);

            const result = await verify(mockRuntime, message, undefined, undefined, mockCallback);

            expect(result).toBe(false);
            expect(mockCallback).toHaveBeenCalledWith({
                text: 'Verification error: ExpiredMessage',
                content: { error: 'ExpiredMessage', verified: false }
            });
        });

        it('should handle memory creation failure', async () => {
            const verifyMock = vi.fn().mockResolvedValue({ success: true });

            const mockSiweMessage = {
                domain: 'test.domain',
                address: mockAddress,
                uri: 'https://test.domain',
                version: '1',
                chainId: 1,
                nonce: 'test-nonce',
                prepareMessage: vi.fn().mockReturnValue('test message'),
                toMessage: vi.fn().mockReturnValue('test message'),
                validate: vi.fn().mockResolvedValue({})
            };

            const siweInstance = Object.create(SiweMessage.prototype, {
                ...Object.getOwnPropertyDescriptors(mockSiweMessage),
                verify: { value: verifyMock }
            });

            vi.mocked(SiweMessage).mockImplementation(() => siweInstance);

            mockRuntime.messageManager.getMemories.mockResolvedValue([{
                content: { siwe: mockSiweMessage, verified: false },
                userId: TEST_USER_ID
            }]);
            
            mockRuntime.messageManager.createMemory.mockRejectedValue({ error: { type: 'MemoryCreationFailed' } });

            const result = await verify(mockRuntime, message, undefined, undefined, mockCallback);

            expect(result).toBe(false);
            expect(mockCallback).toHaveBeenCalledWith({
                text: 'Verification error: MemoryCreationFailed',
                content: { verified: false, error: 'MemoryCreationFailed' }
            });
        });
    });
}); 