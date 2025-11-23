// NOTE: This is a simple, non-cryptographically secure hashing function for demonstration purposes.
// In a real production app, you should use a robust library like bcrypt.js.

export const simpleHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  // Add a simple salt-like modification
  const salt = 123456789;
  return (hash * salt).toString(16);
};

export const generateToken = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};