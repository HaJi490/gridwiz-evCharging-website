'use client'

import React from 'react'
import { useAtom } from 'jotai';
import { usePathname } from 'next/navigation';
import Nav from './Nav'; // 기존 Nav 컴포넌트 경로
import { roleAtom } from '@/store/auth';

/**
 * 사용자 권한 및 현재 경로에 따라 상단 네비게이션 바(Nav)의 렌더링 여부를 결정하는 컴포넌트
 * 관리자 페이지(/admin) 진입 시에는 일반 네비게이션을 숨기고 대시보드 전용 UI에 집중할 수 있도록 제어합니다.
 */
export default function ConditionalNav() {
    const [role] = useAtom(roleAtom);
    const pathname = usePathname();

    /** 
     * 관리자 페이지 여부를 판별
     * 경로가 /admin으로 시작하고 권한이 ROLE_MANAGER인 경우 상단 메뉴를 렌더링하지 않음
     */
    if(pathname.startsWith('/admin') && role === 'ROLE_MANAGER') {
        return null;
    }

    /** 일반 사용자 영역에서의 네비게이션 반환 */
    return <Nav/>;
}
