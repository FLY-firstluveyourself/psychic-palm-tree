# GitHub Copilot Instructions

This document provides coding guidelines and best practices for the WonderWallet cryptocurrency wallet project.

## Project Overview

WonderWallet is a React-based cryptocurrency wallet application with advanced security features including:
- BIP39 mnemonic wallet generation
- Ethereum wallet support via ethers.js
- PIN-based authentication with AES-256 encryption
- Revolutionary decoy wallet security system
- Web-based interface built with React and Vite

## Technology Stack

- **Frontend**: React 18.2+ with JSX and TypeScript
- **Build Tool**: Vite 6.3+
- **Testing**: Vitest with jsdom
- **Blockchain**: ethers.js v6.16+, bip39
- **Encryption**: crypto-js for AES-256 encryption
- **Package Manager**: npm

## Coding Guidelines

### Language and File Structure

- Use **TypeScript (.ts, .tsx)** for all service layer files and components requiring type safety
- Use **JSX (.jsx)** for React components that don't require strict typing
- Organize code into clear layers:
  - `/src/services/` - Business logic and blockchain operations
  - `/src/components/` - Reusable UI components
  - `/src/screens/` - Full page/screen components
  - `/src/utils/` - Utility functions and helpers

### React Best Practices

- Use functional components with React Hooks (useState, useEffect)
- Keep components focused and single-purpose
- Extract reusable logic into custom hooks when appropriate
- Props should be clearly typed (TypeScript interfaces)
- Use proper cleanup in useEffect hooks

### TypeScript Guidelines

- Always define interfaces for complex objects and API responses
- Export interfaces that are used across multiple files
- Use type inference where appropriate to reduce verbosity
- Document public interfaces with JSDoc comments
- Example from project:
  ```typescript
  export interface WalletData {
    id: string;
    address: string;
    mnemonic: string;      // Must be encrypted before storage
    privateKey: string;    // Must be encrypted before storage
  }
  ```

### Styling

- Each component/screen should have a corresponding CSS file
- Use CSS classes with descriptive, kebab-case names
- Follow the existing dark theme (matrix-style green/black)
- Ensure responsive design for mobile and desktop

### Code Comments

- Add JSDoc comments for all public methods in services
- Include clear inline comments for complex cryptographic operations
- Document security-critical code sections thoroughly
- Example:
  ```typescript
  /**
   * Generate a new wallet with BIP39 mnemonic
   * @returns Wallet data including mnemonic and address
   */
  async generateWallet(): Promise<WalletData>
  ```

## Security Guidelines

**CRITICAL**: This is a cryptocurrency wallet application. Security is paramount.

### Encryption and Key Management

- **NEVER** store private keys or mnemonics in plain text
- Always use AES-256 encryption with PBKDF2 key derivation (10,000+ iterations)
- Use cryptographically secure random generation (crypto.getRandomValues, NOT Math.random())
- Implement proper memory wiping for sensitive data
- All encryption must use the utilities in `/src/utils/crypto.ts`

### Sensitive Data Handling

- Never log private keys, mnemonics, or PINs to console
- Avoid storing sensitive data in component state longer than necessary
- Use localStorage only for encrypted data
- Implement rate limiting for authentication attempts
- Clear sensitive data from memory after use

### Input Validation

- Validate all user inputs, especially:
  - PIN format (4-6 digits)
  - Seed phrase format (12 valid BIP39 words)
  - Ethereum addresses (proper format)
- Use validation utilities from `/src/utils/validation.ts`
- Sanitize inputs to prevent injection attacks

### Dependencies

- Only use well-maintained, reputable cryptographic libraries
- Review security advisories before adding new dependencies
- Current approved libraries: ethers.js, bip39, crypto-js, buffer
- Run security audits with `npm audit` regularly

## Testing

### Test Framework

- Use **Vitest** for all unit and integration tests
- Tests should be co-located with the code they test
- Naming convention: `ComponentName.test.jsx` or `ServiceName.test.ts`

### Testing Commands

```bash
npm test              # Run tests in watch mode
npm run build         # Build for production
npm start             # Start development server
```

### Test Coverage

- Aim for high test coverage on services and utilities
- Security-critical functions (encryption, validation) must have comprehensive tests
- Test both success and failure cases
- Mock external dependencies (blockchain RPC calls)

### Example Test Structure

```javascript
import { expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';

test('descriptive test name', () => {
  // Arrange
  // Act
  // Assert
  expect(result).toBeDefined();
});
```

## Development Workflow

### Build and Run

```bash
npm install           # Install dependencies
npm start             # Start dev server on port 3000
npm run build         # Production build
npm run preview       # Preview production build
npm test              # Run test suite
```

### Code Quality

- Ensure code passes linting before committing
- Build must succeed without errors or warnings
- All tests must pass
- No TypeScript compilation errors

### Git Conventions

- Write clear, descriptive commit messages
- Keep commits focused on a single change
- Reference issue numbers when applicable
- Follow existing commit message style in the repository

## Common Patterns

### Service Pattern

Services are singleton classes that encapsulate business logic:

```typescript
class WalletService {
  private provider: ethers.JsonRpcProvider;
  
  constructor() {
    // Initialize
  }
  
  async generateWallet(): Promise<WalletData> {
    // Implementation
  }
}

export default new WalletService();
```

### Storage Pattern

Use StorageService for all localStorage operations:

```typescript
import StorageService from './services/StorageService';

// Save encrypted data
await StorageService.saveWallet(encryptedWallet);

// Retrieve data
const wallet = await StorageService.getWallet(id);
```

### Error Handling

```typescript
try {
  const result = await riskyOperation();
  return { success: true, data: result };
} catch (error) {
  console.error('Operation failed:', error.message);
  return { success: false, message: error.message };
}
```

## Important Notes

### Browser Compatibility

- Requires modern browser with Web Crypto API support
- HTTPS required in production for Web Crypto API
- Target: Chrome 90+, Firefox 88+, Safari 14+

### Performance

- Monitor bundle size to keep application lightweight (check with `npm run build`)
- Optimize imports and use code splitting when needed
- Lazy load screens if bundle size grows significantly

### Documentation

- Update README.md when adding major features
- Document breaking changes clearly
- Keep IMPLEMENTATION_SUMMARY.md updated with architectural changes

## Resources

- [React Documentation](https://reactjs.org/)
- [Vite Documentation](https://vitejs.dev/)
- [ethers.js v6 Documentation](https://docs.ethers.org/v6/)
- [Vitest Documentation](https://vitest.dev/)
- [BIP39 Specification](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki)

## Support

For questions or issues with these guidelines, please open a GitHub issue or contact the repository maintainers.
