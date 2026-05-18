import React, { useState } from 'react';
import Agenda from './views/Agenda';
import SettingsView from './views/SettingsView';
import BottomNavigation from './components/BottomNavigation';

const App: React.FC = () => {
  const [view, setView] = useState<'Agenda' | 'Settings'>('Agenda');

  const renderView = () => {
    switch (view) {
      case 'Agenda':
        return <Agenda />;
      case 'Settings':
        return <SettingsView />;
      default:
        return <Agenda />;
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-grow overflow-y-auto">{renderView()}</div>
      <BottomNavigation currentView={view} setView={setView} />
    </div>
  );
};

export default App;