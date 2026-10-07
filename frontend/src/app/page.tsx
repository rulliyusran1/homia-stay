'use client';

import React, { useState, useEffect } from 'react';
import { Plus, RefreshCcw } from 'lucide-react';

interface Room {
  id: string;
  roomNumber: string;
  floor: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'OVERDUE';
  priceMonthly: number;
  tenants?: {
    fullName: string;
    phone: string;
  }[];
}

const statusConfig = {
  AVAILABLE: { label: 'Tersedia', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  OCCUPIED: { label: 'Terisi', bg: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  MAINTENANCE: { label: 'Perbaikan', bg: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  OVERDUE: { label: 'Menunggak', bg: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
};

export default function RoomDashboard() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filter, setFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  // Fetch rooms from backend API (falls back to mock sample if backend isn't connected yet)
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/rooms`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data.length > 0) {
          setRooms(data.data);
        } else {
          // Fallback Sample Data for immediate visual preview
          setRooms([
            { id: '1', roomNumber: '101', floor: 1, status: 'OCCUPIED', priceMonthly: 1750000, tenants: [{ fullName: 'Budi Santoso', phone: '08123456789' }] },
            { id: '2', roomNumber: '102', floor: 1, status: 'AVAILABLE', priceMonthly: 1750000, tenants: [] },
            { id: '3', roomNumber: '103', floor: 1, status: 'OVERDUE', priceMonthly: 1900000, tenants: [{ fullName: 'Siti Rahma', phone: '08987654321' }] },
            { id: '4', roomNumber: '201', floor: 2, status: 'MAINTENANCE', priceMonthly: 2000000, tenants: [] },
          ]);
        }
        setLoading(false);
      })
      .catch(() => {
        // Fallback if backend is offline
        setRooms([
          { id: '1', roomNumber: '101', floor: 1, status: 'OCCUPIED', priceMonthly: 1750000, tenants: [{ fullName: 'Budi Santoso', phone: '08123456789' }] },
          { id: '2', roomNumber: '102', floor: 1, status: 'AVAILABLE', priceMonthly: 1750000, tenants: [] },
        ]);
        setLoading(false);
      });
  }, []);

  const filteredRooms = filter === 'ALL' ? rooms : rooms.filter(r => r.status === filter);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Homia Stay Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Sistem Manajemen Kos-kosan Pintar & Terintegrasi</p>
        </div>
        <button className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium shadow-sm transition-all">
          <Plus size={18} /> Tambah Kamar Baru
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="max-w-7xl mx-auto mb-6 flex flex-wrap gap-2">
        {['ALL', 'AVAILABLE', 'OCCUPIED', 'OVERDUE', 'MAINTENANCE'].map((item) => (
          <button
            key={item}
            onClick={() => setFilter(item)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              filter === item ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            {item === 'ALL' ? 'Semua Kamar' : statusConfig[item as keyof typeof statusConfig]?.label}
          </button>
        ))}
      </div>

      {/* Room Grid */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Memuat data kamar...</div>
      ) : (
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {filteredRooms.map((room) => {
            const config = statusConfig[room.status];
            const activeTenant = room.tenants && room.tenants.length > 0 ? room.tenants[0] : null;

            return (
              <div 
                key={room.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold text-slate-800">Kamar {room.roomNumber}</span>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${config.bg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                      {config.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-4">Lantai {room.floor} • Sewa Bulanan</p>

                  {activeTenant ? (
                    <div className="bg-slate-50 rounded-xl p-3 mb-4 border border-slate-100">
                      <p className="text-xs text-slate-500 font-medium">Penyewa Aktif:</p>
                      <p className="text-sm font-semibold text-slate-700 mt-0.5">{activeTenant.fullName}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{activeTenant.phone}</p>
                    </div>
                  ) : (
                    <div className="bg-emerald-50/50 rounded-xl p-3 mb-4 border border-emerald-100/50 text-center">
                      <p className="text-xs text-emerald-600 font-medium">Kamar Siap Huni</p>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Tarif</span>
                    <span className="text-sm font-bold text-slate-900">Rp {Number(room.priceMonthly).toLocaleString('id-ID')}</span>
                  </div>
                  <button className="text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors">
                    Detail
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}