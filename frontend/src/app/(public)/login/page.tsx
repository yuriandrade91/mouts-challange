"use client";
import { Card } from '@/components/ui/Card';
import LoginForm from './LoginForm';
// import { LoginForm } from './LoginForm';

export default function LoginPage() {
  return (
    <main className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-800">
      <Card className="w-full max-w-md mx-auto">
        <LoginForm />
      </Card>
    </main>
  );
}
