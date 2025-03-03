import {
    Action,
    type Handler,
    type Memory,
    type State,
    type IAgentRuntime,
    type HandlerCallback,
} from "@elizaos/core";
import { SiweMessage, SiweResponse} from 'siwe';

import { ethers } from "ethers";


export const verify: Handler = async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State,
    options?: Record<string, any>,
    callback?: HandlerCallback
): Promise<boolean> => {
    try {
        const lastSiweMessages = await runtime.messageManager.getMemories({
            roomId: message.roomId,
            count: 10,
            unique: true
        });
        const lastSiweMessage = lastSiweMessages.find(m => m.content.siwe);
        if (!lastSiweMessage) {
            if (callback) {
                await callback({
                    text: "No pending verification found. Please provide your Ethereum address first",
                    content: { error: 'No pending verification' }
                });
            }
            return false;
        }

        const signature = message.content.text;
        
        // Reconstruct SIWE message
        const siweMessage = new SiweMessage((lastSiweMessage).content.siwe);
        
        try {
            // Verify signature
            const verificationResult = await siweMessage.verify({
                signature: signature, 
                time: new Date().toUTCString()
            });

            if (!verificationResult.success) {
                if (callback) {
                    await callback({
                        text: 'Invalid signature',
                        content: { verificationResult }
                    });
                }
                return false;
            }

            try {
                // Create memory only if verification succeeded
                await runtime.messageManager.createMemory({
                    content: {
                        text: siweMessage.prepareMessage(),
                        verified: true,
                        siwe: siweMessage,
                        address: siweMessage.address,
                        deadline: siweMessage.expirationTime,
                        type: 'siwe'
                    },
                    userId: message.userId,
                    agentId: message.agentId,
                    roomId: message.roomId,
                    unique: true,
                });

                if (callback) {
                    await callback({
                        text: `Successfully verified ownership of address ${siweMessage.address}`,
                        content: {
                            verified: true,
                            address: siweMessage.address
                        }
                    });
                }
                return true;
            } catch (error: any) {
                if (callback) {
                    await callback({
                        text: `Verification error: ${error.error?.type}`,
                        content: {
                            verified: false,
                            error: error.error?.type
                        }
                    });
                }
                return false;
            }
        } catch (error: any) {
            const errorMessage = error.message || error.error?.type || 'Unknown error';
            if (callback) {
                await callback({
                    text: `Verification error: ${errorMessage}`,
                    content: {
                        error: errorMessage,
                        verified: false
                    }
                });
            }
            return false;
        }
    } catch (error: any) {
        if (callback) {
            await callback({
                text: `Verification error: ${error.error?.type || error.message}`,
                content: {
                    error: error.error?.type || error.message,
                    verified: false
                }
            });
        }
        return false;
    }
};

export const verifyAction: Action = {
    name: "SIWE_VERIFY",
    similes: ["VERIFY_SIGNATURE", "VERIFY_SIWE"],
    description: "Verify Ethereum address ownership using SIWE signature",
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        const text = message.content?.text;
        return ethers.isHexString(text, 65);
    },
    handler: verify,
    examples: [
        // [
        //     {
        //         user: "{{user1}}",
        //         content: {
        //             text: "0x78cfc5e0180e30fd66c48cb0711127e25fb0ab749e53d229c885e15e86b8ed715b6402e0b8de1a1845217d922ea216fcfe13f6c358d6f4e2a2ebe8cd93e7f8f41b",
        //             source: "direct"
        //         }
        //     },
        //     {
        //         user: "{{agent}}",
        //         content: {
        //             text: "Verifying signature, wait...",
        //             source: "direct",
        //             action: "SIWE_VERIFY"
        //         }
        //     }
        // ],
    ]
}; 