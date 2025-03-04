# @elizaos-plugins/plugin-siwe

Sign-In with Ethereum (SIWE) plugin for ElizaOS, enabling secure wallet-based authentication.

## Features

- ✅ SIWE message creation and verification
- ✅ Ethereum address validation
- ✅ Configurable verification settings
- ✅ Protected action support
- ✅ Status checking

## Installation

```bash
pnpm add @elizaos-plugins/plugin-siwe
```

## Configuration

Required settings:

```typescript
// Domain settings
SIWE_DOMAIN=your.domain.xyz
SIWE_URI=https://your.domain.xyz
SIWE_STATEMENT="Sign in with Ethereum to verify ownership of this address"
SIWE_VERIFICATION_EXPIRY=600000  // 10 minutes in milliseconds
```

## Usage

The plugin provides several actions that can be used through text commands:

### SIWE_CREATE_MESSAGE
Creates a Sign-In with Ethereum message for wallet verification.

Example inputs:
```
0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
```

### SIWE_VERIFY
Verifies the signed message to authenticate the wallet owner.

Example inputs:
```
0x78cfc5e0180e30fd66c48cb0711127e25fb0ab749e53d229c885e15e86b8ed715b6402e0b8de1a1845217d922ea216fcfe13f6c358d6f4e2a2ebe8cd93e7f8f41b
```

### STATUS
Checks the verification status of an Ethereum address.

Example inputs:
```
status 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
```

### PROTECTED_ACTION
Example of an action that requires prior SIWE verification.

Example inputs:
```
protected action
```

## Developer Utilities

### checkSiweVerification

A utility function to easily check SIWE verification status and implement allowlists:

```typescript
import { checkSiweVerification } from "@elizaos-plugins/plugin-siwe";

const ALLOWED_ADDRESSES = [
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
];

export const myProtectedHandler: Handler = async (runtime, message) => {
    const check = await checkSiweVerification(runtime, message, ALLOWED_ADDRESSES);
    
    if (!check.isValid) {
        return {
            text: check.error,
            success: false
        };
    }

    // User is verified and in allowlist
    return {
        text: `Protected action executed by ${check.address}`,
        success: true
    };
};
```

The utility handles:
- Verification status checking
- Expiration checking and cleanup
- Optional allowlist validation
- Type-safe error handling

## Development

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test
```

## Resources

- [SIWE repository](https://github.com/spruceid/siwe)
- [EIP-4361](https://eips.ethereum.org/EIPS/eip-4361)

## License

MIT
