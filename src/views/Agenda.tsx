import React from 'react';
import { useAppStore } from '../store/useAppStore';

const Agenda: React.FC = () => {
  const { apiKey } = useAppStore();

  return (
    <div className="p-4">
      {!apiKey && (
        <div className="bg-yellow-200 text-yellow-800 p-3 mb-4 rounded">
          Reminder: Configure your API key and mail sync in Settings.
        </div>
      )}
      <div className="text-center">
        <p className="text-gray-500">No items yet. Go to Settings to configure your LLM key and Mail sync.</p>
      </div>
    </div>
  );
};

export default Agenda;