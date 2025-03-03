import { Memory } from "@elizaos/core";
import { SiweMessage } from "siwe";

export interface SiweVerifyResponse {
    verified: boolean;
    address: string;
    error?: string;
    received?: string;
    expected?: string;
}


export interface SiweMemoryContent extends Memory {
    content: {
        siwe: SiweMessage;
        verified: boolean;
        text: string;
        type: 'siwe';
        address: string;
        deadline: string;
    }
} 