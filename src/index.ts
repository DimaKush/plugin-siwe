import { Plugin } from "@elizaos/core";
import { verifyAction } from "./actions/verify";
import { statusAction } from "./actions/status";
import { protectedAction } from "./actions/example";
import { createSiweMessageAction } from "./actions/createMessage";
export { checkSiweVerification, type SiweCheckResult } from "./utils/siweCheck";


export const pluginSiwe: Plugin = {
    name: "siwe",
    description: "Sign In With Ethereum (SIWE) plugin for ElizaOS",
    actions: [verifyAction, statusAction, protectedAction, createSiweMessageAction],
    evaluators: [],
    providers: [],
};

export default pluginSiwe; 