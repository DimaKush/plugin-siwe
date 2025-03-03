import { vi } from 'vitest';
import { type IAgentRuntime, type IMemoryManager } from '@elizaos/core';

// Mock memory manager
const createMockMemoryManager = (): IMemoryManager => ({
    runtime: {} as IAgentRuntime,
    tableName: 'test-table',
    createMemory: vi.fn(),
    getMemories: vi.fn().mockResolvedValue([]),
    addEmbeddingToMemory: vi.fn(),
    searchMemoriesByEmbedding: vi.fn(),
    removeAllMemories: vi.fn(),
    removeMemory: vi.fn(),
    getMemoryById: vi.fn(),
    getMemoriesByRoomIds: vi.fn(),
    getCachedEmbeddings: vi.fn(),
    countMemories: vi.fn()
});

// Mock elizaLogger
vi.mock('@elizaos/core', () => ({
    elizaLogger: {
        info: vi.fn(),
        debug: vi.fn(),
        error: vi.fn(),
        warn: vi.fn()
    },
    MemoryManager: vi.fn().mockImplementation(() => createMockMemoryManager()),
    // Add mock runtime factory
    createMockRuntime: () => ({
        agentId: 'test-agent',
        getMemoryManager: vi.fn().mockReturnValue(createMockMemoryManager()),
        registerMemoryManager: vi.fn(),
        messageManager: createMockMemoryManager(),
        getSetting: vi.fn().mockImplementation((key) => {
            const settings = {
                DOMAIN: 'test.eliza.xyz',
                URI: 'https://test.eliza.xyz',
                CHAIN_ID: '1'
            };
            return settings[key];
        })
    })
}));

// Mock SIWE
vi.mock('siwe', () => ({
    SiweMessage: vi.fn().mockImplementation((params) => {
        // For string input (from verify tests)
        if (typeof params === 'string') {
            return {
                prepareMessage: vi.fn().mockReturnValue(`Sign in with Ethereum to verify ownership of 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`),
                toString: vi.fn().mockReturnValue('test message string'),
                address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
                verify: vi.fn().mockResolvedValue({ success: true })
            };
        }
        
        // For object input (from createMessage tests)
        if (typeof params === 'object') {
            return {
                ...params,
                prepareMessage: vi.fn().mockReturnValue(
                    `Sign in with Ethereum to verify ownership of ${params.address}`
                ),
                toString: vi.fn().mockReturnValue('test message string'),
                verify: vi.fn().mockResolvedValue({ success: true })
            };
        }

        // Default fallback
        return {
            prepareMessage: vi.fn().mockReturnValue('default message'),
            toString: vi.fn().mockReturnValue('default string'),
            address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
            verify: vi.fn().mockResolvedValue({ success: true })
        };
    }),
    generateNonce: vi.fn().mockReturnValue('test-nonce-123')
}));

// Mock ethers
vi.mock('ethers', () => ({
    ethers: {
        isAddress: vi.fn(),
        getAddress: vi.fn(),
        isHexString: vi.fn().mockImplementation((value) => {
            return value.startsWith('0x') && value.length === 132;
        }),
        JsonRpcProvider: vi.fn().mockImplementation(() => ({
            resolveName: vi.fn().mockResolvedValue('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266')
        }))
    }
})); 