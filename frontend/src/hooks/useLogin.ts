import { useMutation } from '@tanstack/react-query';

interface LoginPayload {
  email: string;
  password: string;
}

interface LoginResponse {
  access_token: string;
}

async function login(payload: LoginPayload): Promise<LoginResponse> {
  const res = await fetch('http://localhost:3000/auth/login', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error('Login failed');
  }
  return res.json();
}

export function useLogin() {
  return useMutation<LoginResponse, Error, LoginPayload>({
    mutationFn: login,
  });
}
