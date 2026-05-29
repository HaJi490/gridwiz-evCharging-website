'use client'

import React, { useState } from 'react'
import Sidebar from './sidebar/Sidebar'
import type { ReactNode } from 'react';

/**
 * AdminLayoutCSR 컴포넌트의 Props 인터페이스
 */
interface AdminLayoutProps {
    /** 레이아웃 내부 영역에 렌더링될 페이지 요소 */
    children: ReactNode;
}

/**
 * 관리자 페이지 전용 대시보드 레이아웃 컴포넌트
 * 좌측 네비게이션 사이드바와 우측 메인 콘텐츠 영역으로 구성되며,
 * 사이드바의 확장/축소 상태에 따라 메인 영역의 여백(Margin)을 동적으로 조절합니다.
 */
export default function AdminLayoutCSR({ children }: AdminLayoutProps) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="w-full h-screen flex overflow-hidden">
            
            {/* 사이드바 영역 */}
            <div className={`fixed left-0 top-0 z-10 h-full transition-all duration-300 ${expanded ? 'w-72' : 'w-20'}`}>
                <Sidebar expanded={expanded} setExpanded={setExpanded} />
            </div>

            {/* 핵심 콘텐츠 영역 */}
            <main className={`flex-1 h-full overflow-y-auto transition-all duration-300 ${expanded ? 'ml-72' : 'ml-20'}`}>
                {children}
            </main>
        </div>
    );
}
