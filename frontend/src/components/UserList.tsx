"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

interface User {
  id: number;
  name: string;
  email: string;
  bio?: string;
}

const UserList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const router = useRouter();
  const [searchId, setSearchId] = useState('');
  const [searchResult, setSearchResult] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', bio: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);

  const fetchUsers = () => {
    setSearchResult(null);
    const token = localStorage.getItem('access_token');
    fetch('http://localhost:3000/user', {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    })
      .then(res => {
        if (!res.ok) throw new Error('Unauthorized');
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setUsers(data);
        } else if (Array.isArray(data.users)) {
          setUsers(data.users);
        } else {
          setUsers([]);
        }
      })
      .catch(() => setUsers([]));
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId) {
      setSearchResult(null);
      fetchUsers();
      return;
    }
    const token = localStorage.getItem('access_token');
    const res = await fetch(`http://localhost:3000/user/${searchId}`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    });
    if (res.ok) {
      const data = await res.json();
      setSearchResult(data);
      setUsers([]);
    } else {
      setSearchResult(null);
      setUsers([]);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [editUser, setEditUser] = useState<User | null>(null);

  const handleEdit = (user: User) => {
    setEditUser(user);
    setForm({ name: user.name, email: user.email, bio: user.bio || '', password: '' });
    setShowModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    setIsLoading(true);
    const token = localStorage.getItem('access_token');
    await fetch(`http://localhost:3000/user/${editUser.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify({ name: form.name, email: form.email, bio: form.bio }),
    });
    setIsLoading(false);
    setShowModal(false);
    setEditUser(null);
    setForm({ name: '', email: '', bio: '', password: '' });
    fetchUsers();
  };

  const handleDelete = async (id: number) => {
    const token = localStorage.getItem('access_token');
    await fetch(`http://localhost:3000/user/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    });
    fetchUsers();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const token = localStorage.getItem('access_token');
    await fetch('http://localhost:3000/user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify(form),
    });
    setIsLoading(false);
    setShowModal(false);
    setForm({ name: '', email: '', bio: '', password: '' });
    fetchUsers();
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4 w-full max-w-xl">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <input
            type="text"
            placeholder="Buscar por ID"
            className="border rounded px-3 py-2 flex-1"
            value={searchId}
            onChange={e => setSearchId(e.target.value)}
          />
          <Button type="submit">Buscar</Button>
          <Button type="button" onClick={() => { setSearchId(''); setSearchResult(null); fetchUsers(); }}>Limpar</Button>
          <Button onClick={() => { setShowModal(true); setEditUser(null); setForm({ name: '', email: '', bio: '', password: '' }); }}>Cadastrar usuário</Button>
        </form>
        <Button type="button" className="ml-4" onClick={() => { localStorage.removeItem('access_token'); router.push('/login'); }}>Logout</Button>
      </div>
      <div className="grid gap-4 w-full max-w-xl">
        {searchResult ? (
          <Card key={searchResult.id} className="flex flex-col p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold">{searchResult.name}</span>
              <span className="text-gray-500">{searchResult.email}</span>
            </div>
            <div className="mb-2 text-xs text-gray-400">ID: {searchResult.id}</div>
            <div className="mb-2 text-sm text-gray-600">{searchResult.bio}</div>
            <div className="flex gap-2">
              <Button onClick={() => handleEdit(searchResult)}>Editar</Button>
              <Button onClick={() => handleDelete(searchResult.id)}>Excluir</Button>
            </div>
          </Card>
        ) : (
          users.map(user => (
            <Card key={user.id} className="flex flex-col p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">{user.name}</span>
                <span className="text-gray-500">{user.email}</span>
              </div>
              <div className="mb-2 text-xs text-gray-400">ID: {user.id}</div>
              <div className="mb-2 text-sm text-gray-600">{user.bio}</div>
              <div className="flex gap-2">
                <Button onClick={() => handleEdit(user)}>Editar</Button>
                <Button onClick={() => handleDelete(user.id)}>Excluir</Button>
              </div>
            </Card>
          ))
        )}
      </div>
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editUser ? 'Editar usuário' : 'Cadastrar usuário'}</h2>
            <form onSubmit={editUser ? handleUpdate : handleCreate} className="space-y-4">
              <input
                type="text"
                placeholder="Nome"
                className="w-full border rounded px-3 py-2"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
              />
              <input
                type="email"
                placeholder="Email"
                className="w-full border rounded px-3 py-2"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
              />
              <input
                type="text"
                placeholder="Bio"
                className="w-full border rounded px-3 py-2"
                value={form.bio}
                onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              />
              {!editUser && (
                <input
                  type="password"
                  placeholder="Senha"
                  className="w-full border rounded px-3 py-2"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                />
              )}
              <div className="flex justify-end gap-2">
                <Button type="button" onClick={() => { setShowModal(false); setEditUser(null); }} disabled={isLoading}>Cancelar</Button>
                <Button type="submit" disabled={isLoading}>{isLoading ? (editUser ? 'Salvando...' : 'Cadastrando...') : (editUser ? 'Salvar' : 'Cadastrar')}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default UserList;
