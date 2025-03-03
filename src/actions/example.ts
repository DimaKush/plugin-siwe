import {
    Action,
    type Handler,
    type Memory,
    type State,
    type IAgentRuntime,
    type HandlerCallback
} from "@elizaos/core";
import { checkSiweVerification } from "../utils/siweCheck";

// Example allowlist of addresses that can execute this action
const ALLOWED_ADDRESSES = [
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
];

export const protectedHandler: Handler = async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State,
    options?: { [key: string]: unknown },
    callback?: HandlerCallback
): Promise<boolean> => {
    try {
        const check = await checkSiweVerification(runtime, message, ALLOWED_ADDRESSES);
        
        if (!check.isValid) {
            callback?.({
                text: check.error || "Verification failed",
                content: { success: false }
            });
            return false;
        }

        // Example of a protected action
        callback?.({
            text: `Protected action executed successfully by ${check.address}!`,
            content: { success: true }
        });
        return true;

    } catch (error: any) {
        callback?.({
            text: `Failed to execute protected action: ${error.message}`,
            content: { error: error.message }
        });
        return false;
    }
};

export const protectedAction: Action = {
    name: "PROTECTED_ACTION",
    similes: [
        "PROTECTED_FEATURE",
        "SECURE_ACTION",
        "PRIVILEGED_ACTION",
        "VERIFIED_ACTION"
    ],
    description: "Action protected by SIWE verification",
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        return message.content?.text.includes("protected action");
    },
    handler: protectedHandler,
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "protected action",
                    source: "direct"
                }
            },
            {
                user: "{{agent}}",
                content: {
                    text: "This action requires verification. Checking your status...",
                    source: "direct",
                    action: "PROTECTED_ACTION"
                }
            }
        ]
    ]
}; 