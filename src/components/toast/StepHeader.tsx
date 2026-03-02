import { Clock, Home, MessageCircle, Wallet } from 'lucide-react';
import React from 'react';

// --- Header hiển thị các bước (1, 2, 3, 4) ---
interface StepHeaderProps {
  step: number;
  title: string;
}

export const StepHeader: React.FC<StepHeaderProps> = ({ step, title }) => {
  return (
    <div className="bg-white p-4 pb-2">
      <div className="flex justify-between mb-4 px-4">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm
              ${s <= step ? 'bg-green-500' : 'bg-gray-300'}`}
          >
            {s}
          </div>
        ))}
      </div>
      <div className="bg-cyan-400 py-3 text-center rounded-sm">
        <h1 className="text-xl font-bold text-black uppercase">{title}</h1>
      </div>
    </div>
  );
};

// --- Thanh Menu dưới cùng ---
export const BottomNav = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-200 h-16 flex items-center justify-around border-t border-gray-300 z-50">
      <button className="p-2 text-black"><Home size={24} /></button>
      <button className="p-2 text-black"><Wallet size={24} /></button>
      <button className="p-2 text-black"><Clock size={24} /></button>
      <button className="p-2 text-black"><MessageCircle size={24} /></button>
    </div>
  );
};

// --- Ô nhập liệu (Input) ---
interface InputGroupProps {
    label: string;
    placeholder?: string;
    isTextArea?: boolean;
}

export const InputGroup: React.FC<InputGroupProps> = ({ label, placeholder, isTextArea = false }) => (
  <div className="mb-3">
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    {isTextArea ? (
      <textarea className="w-full bg-gray-200 p-2 rounded h-24 resize-none outline-none" placeholder={placeholder} />
    ) : (
      <input type="text" className="w-full bg-gray-200 p-2 rounded outline-none" placeholder={placeholder} />
    )}
  </div>
);
