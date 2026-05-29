'use client'

import React, { createContext } from 'react'
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAtom } from 'jotai';

import { accessTokenAtom } from '@/store/auth';
import SidebarItem from './SidebarItem';
import { LuLayoutDashboard } from "react-icons/lu";
import { FiUser, FiLogOut, FiHelpCircle } from "react-icons/fi";


/**
 * 사이드바 메뉴 아이템 데이터 정의
 */
const NAV_ITEMS = [
    { name: 'Dashboard', icon: <LuLayoutDashboard size={20} />, path: '/admin/dashboard' },
    { name: 'Customers', icon: <FiUser size={20} />, path: '/admin/manageMem' },
    { name: 'Inquiry', icon: <FiHelpCircle size={20} />, path: '/admin/manageInquiry' },
]

/**
 * 사이드바 확장 상태 공유를 위한 Context
 */
export const SidebarContext = createContext<{ expanded: boolean }>({ expanded: true });

/**
 * Sidebar 컴포넌트의 Props 인터페이스
 */
interface SidebarProps {
    /** 사이드바의 확장/축소 상태 */
    expanded: boolean;
    /** 확장 상태를 제어하는 상태 변경 함수 */
    setExpanded: (val: boolean) => void;
}

/**
 * 관리자 페이지 전용 네비게이션 사이드바 컴포넌트
 * 확장/축소 기능을 지원하며, Context API를 통해 하위 아이템들과 상태를 공유합니다.
 * 로그아웃 및 관리자 프로필 요약 정보를 포함합니다.
 */
export default function Sidebar({ expanded, setExpanded }: SidebarProps) {
    const route = useRouter();
    const [, setToken] = useAtom(accessTokenAtom);

    /**
     * 인증 토큰을 초기화하고 로그인 페이지로 리다이렉트합니다.
     */
    const handleLogout = () => {
        setToken(null);
        route.push('/login?toast=로그아웃 되었습니다.');
    };


    return (
        <aside className={`h-screen transition-all duration-300 ease-in-out ${expanded ? 'w-72' : 'w-20'} z-50`}>
            <nav aria-label="관리자 메뉴" className='relative h-full flex flex-col bg-white shadow-sm'>
                {/* 로고 영역 */}
                <div className={`p-4 pb-2 flex justify-between items-center ${expanded ? 'p-8 pb-8' : 'p-7'}`}>
                    {expanded
                        ? <Image src="/gwLogo.png" alt='Gridwiz Logo-lg' width={180} height={80} priority />
                        : <Image src="/logo_small.png" alt='Gridwiz Logo-sm' width={30} height={30} priority />
                    }
                </div>
                
                {/* 메뉴 리스트 영역 */}
                <SidebarContext.Provider value={{ expanded }}>
                    <ul className='flex-1 px-3' onClick={() => setExpanded(!expanded)} >
                        {NAV_ITEMS.map((item, idx) => (
                            <SidebarItem key={idx} item={item} />
                        ))}
                    </ul>
                </SidebarContext.Provider>
                
                {/* 프로필 영역 */}
                <footer className="border-t flex p-3">
                    <img src="/admin_avatar.png" alt="Admin Profile" className="w-10 h-10 rounded-md" />
                    <div className={`flex justify-between items-center overflow-hidden transition-all ${expanded ? 'w-52 ml-3' : 'w-0'}`}>
                        <div className="leading-4">
                            <h4 className="font-semibold">Admin Manager</h4>
                            <span className="text-xs text-gray-600">admin@gridwiz.com</span>
                        </div>

                        {/* 로그아웃 버튼 */}
                        <button
                            type='button'
                            aria-label='로그아웃' 
                            onClick={() => handleLogout()}
                            className='cursor-pointer text-[23px] text-[#666] rounded-full p-2 hover:bg-[#f2f2f2]'
                        >
                            <FiLogOut size={20} />
                        </button>
                    </div>
                </footer>
            </nav>
        </aside>
    )
}
