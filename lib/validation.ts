export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidUsername(username: string) {
  return /^[a-zA-Z0-9_]{3,20}$/.test(username);
}
