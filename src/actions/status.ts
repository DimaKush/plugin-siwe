import {
    Action,
    type Handler,
    type Memory,
    type State,
    type IAgentRuntime,
    type HandlerCallback
} from "@elizaos/core";

const extractAddress = (text: string): string | null => {
    const match = text.match(/address:(0x[0-9a-fA-F]{40})/);
    return match ? match[1] : null;
};

export const status = async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State,
    options?: { [key: string]: unknown },
    callback?: HandlerCallback
): Promise<boolean> => {
    const address = extractAddress(message.content?.text || '');
    if (!address) {
        callback?.({
            text: 'Please provide an address to check. Format: \'status 0x...\'',
            content: {
                error: 'Missing address'
            }
        });
        return false;
    }

    try {
        const memories = await runtime.messageManager.getMemories({
            roomId: message.roomId,            
        });
        const isVerified = memories.filter(memory => 
            memory.content?.verified === true && 
            // memory.content?.address === address &&
            memory.userId === message.userId
        ).length > 0;
        // const verification = await getVerification(runtime, address);

        if (isVerified) {
            callback?.({
                text: `Address ${address} is verified`,
                content: {
                    address,
                    verified: true
                }
            });
            return true;
        } else {
            callback?.({
                text: `Address ${address} is not verified or verification has expired`,
                content: {
                    address,
                    verified: false
                }
            });
            return false;
        }
    } catch (error) {
        callback?.({
            text: 'Error checking verification status',
            content: {
                error: error instanceof Error ? error.message : 'Unknown error'
            }
        });
        return false;
    }
};

export const statusAction: Action = {
    name: 'status',
    similes: ['check status', 'check verification'],
    description: 'Check if an Ethereum address is verified',
    validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
        return message.content?.text === "status";
    },
    handler: status,
    examples: [
        [
            {
                user: '{{user1}}',
                content: {
                    text: 'status 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
                    source: 'direct'
                }
            },
            {
                user: "{{agent}}",
                content: {
                    text: `Verification status of 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 {{userId}}:`,
                    source: "direct",
                }
            },
        ]
    ]
}; 