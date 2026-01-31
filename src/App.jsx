import { useState } from 'react';
import { DictionaryProvider } from './context/DictionaryContext';
import Header from './components/Header';
import Formatter from './components/Formatter';
import DictionaryEditor from './components/DictionaryEditor';

import { ToastProvider } from './context/ToastContext';

function App() {
  const [activeTab, setActiveTab] = useState('formatter');

  return (
    <ToastProvider>
      <DictionaryProvider>
        <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-blue-100 selection:text-blue-900">
          <Header activeTab={activeTab} onTabChange={setActiveTab} />

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className={`transition-all duration-300 ease-in-out ${activeTab === 'formatter' ? 'opacity-100 translate-y-0 block' : 'opacity-0 translate-y-4 hidden'}`}>
              <Formatter />
            </div>

            <div className={`transition-all duration-300 ease-in-out ${activeTab === 'dictionary' ? 'opacity-100 translate-y-0 block' : 'opacity-0 translate-y-4 hidden'}`}>
              <DictionaryEditor />
            </div>
          </main>
        </div>
      </DictionaryProvider>
    </ToastProvider>
  )
}

export default App
