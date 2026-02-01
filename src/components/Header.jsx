import { useState } from 'react';
import { Button } from './ui/Button';

export default function Header({ activeTab, onTabChange }) {
    return (
        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-16 py-2 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <h1 className="text-3xl font-black text-blue-900 tracking-tight" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                        PHARMAT
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
