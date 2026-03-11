/**
 * Validate PIN format
 * @param pin - PIN to validate
 * @returns True if valid
 */
export function validatePIN(pin: string): boolean {
  // Must be 4-6 digits
  return /^\d{4,6}$/.test(pin);
}

/**
 * Validate seed phrase format
 * @param seedPhrase - Seed phrase to validate
 * @returns True if valid format (12 words separated by spaces)
 */
export function validateSeedPhraseFormat(seedPhrase: string): boolean {
  const words = seedPhrase.trim().split(/\s+/);
  return words.length === 12 && words.every((word) => word.length > 0);
}

/**
 * Validate Ethereum address format
 * @param address - Address to validate
 * @returns True if valid
 */
export function validateEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Truncate Ethereum address for display
 * @param address - Full address
 * @param chars - Number of chars to show on each end
 * @returns Truncated address (e.g., "0x1234...5678")
 */
export function truncateAddress(address: string, chars: number = 6): string {
  if (!address || address.length < chars * 2) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

/**
 * Format ETH balance for display
 * @param balance - Balance in ETH
 * @param decimals - Number of decimal places
 * @returns Formatted balance string
 */
export function formatBalance(balance: string | number, decimals: number = 4): string {
  const num = typeof balance === 'string' ? parseFloat(balance) : balance;
  if (isNaN(num)) return '0.0000';
  return num.toFixed(decimals);
}
