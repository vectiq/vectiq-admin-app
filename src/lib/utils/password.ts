export function generatePassword(): string {
    const words = ['Welcome', 'Hello', 'Start', 'Begin', 'Launch'];
    const word = words[Math.floor(Math.random() * words.length)];
    const numbers = Math.floor(Math.random() * 900) + 100; // Generate 3 digits
    
    return `${word}${numbers}`;
  }