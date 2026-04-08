
import React, { useState } from 'react';
import { StorageService } from '../services/storage';

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState(StorageService.getUsers());

  const toggleVerify = (userId: string) => {
    const updated = users.map(u => u.id === userId ? { ...u, isVerified: !u.isVerified } : u);
    setUsers(updated);
    const user = updated.find(u => u.id === userId);
    if (user) StorageService.updateUser(user);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Platform Admin</h1>
        <p className="text-slate-500">Manage users, verification, and platform health.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-sm font-bold text-slate-400 uppercase">Total Users</p>
          <p className="text-4xl font-black text-indigo-600">{users.length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-sm font-bold text-slate-400 uppercase">Verified Profiles</p>
          <p className="text-4xl font-black text-blue-500">{users.filter(u => u.isVerified).length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-sm font-bold text-slate-400 uppercase">Active Sessions</p>
          <p className="text-4xl font-black text-green-500">{StorageService.getBookings().length}</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">User</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Email</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Points</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 flex items-center gap-3">
                  <img src={u.avatar} className="w-8 h-8 rounded-full" alt="" />
                  <span className="font-bold text-slate-800">{u.name}</span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">{u.email}</td>
                <td className="px-6 py-4 font-bold text-indigo-600">{u.points}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${u.isVerified ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                    {u.isVerified ? 'Verified' : 'Pending'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button 
                    onClick={() => toggleVerify(u.id)}
                    className="text-xs font-bold text-indigo-600 hover:underline"
                  >
                    {u.isVerified ? 'Revoke Verification' : 'Verify User'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;
