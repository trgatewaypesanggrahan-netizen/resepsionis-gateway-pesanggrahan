import React, { useState } from 'react';
import { VisitorCheckInForm } from './VisitorCheckInForm';
import { CheckMyTicket } from './CheckMyTicket';
import { VisitorTicketCard } from './VisitorTicketCard';
import { Guest } from '../types/guest';
import { ClipboardList, QrCode, Search, ShieldCheck } from 'lucide-react';

interface VisitorPortalProps {
  onCheckInSuccess: (guest: Guest) => void;
}

export const VisitorPortal: React.FC<VisitorPortalProps> = ({ onCheckInSuccess }) => {
  const [activeTab, setActiveTab] = useState<'form' | 'lookup' | 'active_ticket'>('form');
  const [currentGuest, setCurrentGuest] = useState<Guest | null>(null);

  const handleFormSuccess = (guest: Guest) => {
    setCurrentGuest(guest);
    setActiveTab('active_ticket');
    onCheckInSuccess(guest);
  };

  const handleDoneTicket = () => {
    setCurrentGuest(null);
    setActiveTab('form');
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      
      {/* Mode Navigation Tabs */}
      <div className="flex bg-slate-200/80 p-1.5 rounded-2xl gap-1.5 shadow-2xs max-w-md mx-auto">
        <button
          type="button"
          onClick={() => {
            setActiveTab('form');
            setCurrentGuest(null);
          }}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'form' || (activeTab === 'active_ticket' && !currentGuest)
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ClipboardList className="w-4 h-4 text-blue-600" />
          <span>Form Check-In</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('lookup');
            setCurrentGuest(null);
          }}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'lookup'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <QrCode className="w-4 h-4 text-indigo-600" />
          <span>Cek Tiket Saya</span>
        </button>
      </div>

      {/* Content Rendering based on Tab */}
      {activeTab === 'active_ticket' && currentGuest ? (
        <div className="space-y-4">
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-center text-xs text-emerald-800 font-semibold">
            ✓ Check-In Berhasil! Silakan simpan Barcode Check-Out Anda di bawah ini.
          </div>
          <VisitorTicketCard
            guest={currentGuest}
            onDone={handleDoneTicket}
            showBackAction={true}
          />
        </div>
      ) : activeTab === 'lookup' ? (
        <CheckMyTicket
          onBackToForm={() => setActiveTab('form')}
        />
      ) : (
        <div className="space-y-6">
          <VisitorCheckInForm
            onCheckInSuccess={handleFormSuccess}
          />

          {/* Quick link to ticket lookup for visitors who returned */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <QrCode className="w-5 h-5 text-blue-600 shrink-0" />
              <div>
                <p className="font-bold text-slate-800">Sudah pernah Check-In dan mencari tiket Anda?</p>
                <p className="text-[11px] text-slate-500">Tampilkan kembali Barcode Check-Out Anda menggunakan nomor HP atau nomor kartu.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('lookup')}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl transition-colors whitespace-nowrap text-xs border border-slate-200"
            >
              Cek Tiket Saya →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
