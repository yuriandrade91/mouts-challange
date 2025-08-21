"use client";
import UserList from '@/components/UserList';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-500">
      <h1 className="text-2xl font-bold mb-6">Usuários</h1>
      <UserList />
    </main>
  );
}
