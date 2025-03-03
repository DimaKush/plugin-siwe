import { IAgentRuntime, Memory } from "@elizaos/core";
import { SiweMemoryContent } from "../types";

export interface SiweCheckResult {
    isValid: boolean;
    address?: string;
    error?: string;
}

export const checkSiweVerification = async (
    runtime: IAgentRuntime,
    message: Memory,
    allowlist?: string[]
): Promise<SiweCheckResult> => {
    try {
        const memories = await runtime.messageManager.getMemories({
            roomId: message.roomId,
            count: 100
        });

        const siweMemory = memories.find((m: SiweMemoryContent) => 
            m.content?.verified === true && 
            m.content?.type === 'siwe' &&
            m.userId === message.userId
        );

        if (!siweMemory) {
            return { isValid: false, error: "No valid verification found" };
        }

        const address = siweMemory.content.address as string;
        const expirationTime = new Date(siweMemory.content.deadline as string).getTime();

        if (Date.now() > expirationTime) {
            await runtime.messageManager.removeMemory(siweMemory.id);
            return { isValid: false, error: "Verification expired" };
        }

        if (allowlist && !allowlist.includes(address)) {
            return { isValid: false, error: "Address not authorized" };
        }

        return { isValid: true, address };
    } catch (error) {
        return { isValid: false, error: "Verification check failed" };
    }
}; 