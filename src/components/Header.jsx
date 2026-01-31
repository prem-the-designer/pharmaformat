import { useState } from 'react';
import { Button } from './ui/Button';

export default function Header({ activeTab, onTabChange }) {
    return (
        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="bg-blue-600 p-1.5 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-white">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            {/* Placeholder icon */}
                        </svg>
                    </div>
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700">
                        PharmaFormat
                    </h1>
                </div>

                <nav className="flex space-x-2">
                    <Button
                        variant={activeTab === 'formatter' ? 'primary' : 'ghost'}
                        onClick={() => onTabChange('formatter')}
                        className={activeTab === 'formatter' ? '' : 'hover:bg-slate-100/50'}
                    >
                        Formatter
                    </Button>
                    <Button
                        variant={activeTab === 'dictionary' ? 'primary' : 'ghost'}
                        onClick={() => onTabChange('dictionary')}
                        className={activeTab === 'dictionary' ? '' : 'hover:bg-slate-100/50'}
                    >
                        Dictionary
                    </Button>
                </nav>
            </div>
        </header>
    );
}
