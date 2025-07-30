'use client'

import React, { useState } from 'react'
import Sidebar from './sidebar/Sidebar'
import type { ReactNode } from 'react';


export default function AdminLayoutCSR({ children }: { children: ReactNode }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="w-full h-screen flex overflow-hidden">
            <div
                className={`fixed left-0 top-0 z-10 h-full transition-all duration-300 ${expanded ? 'w-72' : 'w-20'
                    }`}
            >
                <Sidebar expanded={expanded} setExpanded={setExpanded} />
            </div>
            <main
                className={`flex-1 h-full overflow-y-auto transition-all duration-300 ${expanded ? 'ml-72' : 'ml-20'
                    }`}
            >
                {children}
            </main>
        </div>
    );
}
