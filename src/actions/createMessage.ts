import {
    Action,
    type Handler,
    type Memory,
    type State,
    type IAgentRuntime,
    type HandlerCallback
} from "@elizaos/core";
import { ethers } from "ethers";
import { generateNonce, SiweMessage } from "siwe";

const DEFAULT_DOMAIN = 'siweexample.xyz';
const DEFAULT_URI = 'https://siweexample.xyz';
const DEFAULT_STATEMENT = 'Sign in with Ethereum to verify ownership of this address';
const DEFAULT_VERSION = '1';
const DEFAULT_CHAIN_ID = 11155111;

export const createSiweMessage: Handler = async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State,
    options?: Record<string, any>,
    callback?: HandlerCallback
): Promise<boolean> => {
    try {
        const domain = runtime.getSetting("SIWE_DOMAIN") || DEFAULT_DOMAIN;
        const uri = runtime.getSetting("SIWE_URI") || DEFAULT_URI
        const address = ethers.getAddress(message.content?.text);
        const chainId = runtime.getSetting("SIWE_CHAIN_ID") || DEFAULT_CHAIN_ID
        const statement = runtime.getSetting("SIWE_STATEMENT") || DEFAULT_STATEMENT
        const now = new Date();
        const expirationTime = new Date(now.getTime() + parseInt(runtime.getSetting('SIWE_VERIFICATION_EXPIRY'))); 

        const messageParams = {
            address: address,
            domain: domain,
            nonce: generateNonce(),
            statement: statement,
            uri: uri,
            version: DEFAULT_VERSION,
            chainId: chainId as number,
            issuedAt: now.toISOString(),
            expirationTime: expirationTime.toISOString(),
            notBefore: now.toISOString(),
            resources: []
        };

        const siweMessage = new SiweMessage(messageParams);

        const siweMessageString = siweMessage.prepareMessage()

        await runtime.messageManager.createMemory({
            content: {
                text: siweMessageString,
                verified: false,
                siwe: siweMessage,
                address: address,
                deadline: expirationTime,
                type: 'siwe'
            },
            userId: message.userId,
            agentId: message.agentId,
            roomId: message.roomId,
            unique: true,
        });

        callback({
            text: siweMessageString
        })

        return true;
    } catch (error: any) {
        if (callback) {
            await callback({
                text: `Failed to create SIWE message: ${error.message}`,
                content: { error: error.message }
            });
        }
        return false;
    }
};

export const createSiweMessageAction: Action = {
    name: "SIWE_CREATE_MESSAGE",
    similes: ["CREATE_SIWE_MESSAGE", "verify address"],
    description: "Create a SIWE message for address verification",
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        return ethers.isAddress(message.content?.text)
    },
    handler: createSiweMessage,
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
                    source: "direct"
                }
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Review next message carefully and provide signature of signed message. See https://etherscan.io/verifiedSignatures",
                    source: "direct",
                    action: "SIWE_CREATE_MESSAGE"
                }
            }
        ]
    ]
}; 