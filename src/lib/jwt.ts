import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'E55r495+0xNpNriVa2OpsA54VF364+qsZETH8ubkbyE=';

interface User {
  id: string;
  username: string;
  address: string;
}

export function verifyJwtToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch {
    return null;
  }
}

export function createJwtToken(user: User) {
  return jwt.sign({ userId: user.id }, JWT_SECRET);
}
