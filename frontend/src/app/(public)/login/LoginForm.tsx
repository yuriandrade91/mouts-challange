"use client";
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useLogin } from '@/hooks/useLogin';
import { useRouter } from 'next/navigation';

const LoginForm = () => {
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const { mutate, isPending, isSuccess, isError, error, data } = useLogin();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate({ email: login, password: senha });
  };

  useEffect(() => {
    if (isSuccess && data?.access_token) {
      localStorage.setItem('access_token', data.access_token);
      router.push('/home');
    }
  }, [isSuccess, router, data]);

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label htmlFor="login" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Username</label>
        <Input
          id="login"
          name="login"
          type="text"
          placeholder="Digite seu login"
          autoComplete="username"
          required
          value={login}
          onChange={e => setLogin(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="senha" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
        <Input
          id="senha"
          name="senha"
          type="password"
          placeholder="Digite sua senha"
          autoComplete="current-password"
          required
          value={senha}
          onChange={e => setSenha(e.target.value)}
        />
      </div>
      <Button type="submit" className="w-full mt-4" disabled={!login || !senha || isPending}>
        {isPending ? 'Entrando...' : 'Entrar'}
      </Button>
      {isError && (
        <div className="text-red-500 text-sm">
          Erro ao realizar login. Verifique suas credenciais e tente novamente.
        </div>
      )}
      {isSuccess && data?.access_token && (
        <div className="text-green-500 text-sm">Login realizado! Token: {data.access_token}</div>
      )}
    </form>
  );
};

export default LoginForm;
