'use client'

import React, {useState, createContext, useContext, ReactNode} from 'react'
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAtom } from 'jotai';

import { accessTokenAtom } from '@/store/auth';
import SidebarItem from './SidebarItem';
import { 
    LuLayoutDashboard, LuFileText
} from "react-icons/lu";
import { FiUser, FiSettings, FiCalendar, FiLogOut, FiHelpCircle , FiChevronLeft, FiChevronRight } from "react-icons/fi";


// 메뉴 아이템 데이터구조
const navItems = [
    {
        name: 'Dashboard', 
        icon: <LuLayoutDashboard size={20}/>, 
        path:'/admin/dashboard',
    },
    {
        name: 'Customers',
        icon: <FiUser size={20}/>,
        path: '/admin/manageMem'
    },
    {
        name: 'Inquiry',
        icon: <FiHelpCircle size={20}/>,
        path: '/admin/manageInquiry'
    },
    // {
    //     name: 'Setting',
    //     icon: <FiSettings size={20}/>,
    //     path: '/admin/setting'
    // }
]

// Context를 사용하여 상태 공유 - props없이 바로 전달가능
export const SidebarContext = createContext<{ expanded: boolean }>({ expanded: true });

interface SidebarProps {
    expanded: boolean;
    setExpanded: (val: boolean) => void;
}

export default function Sidebar({expanded, setExpanded} : SidebarProps) {
    const route = useRouter();
    const [, setToken] = useAtom(accessTokenAtom);

    const handleLogout = () => {
        setToken(null);
        // alert("로그아웃 되었습니다.");
        route.push('/login?toast=로그아웃 되었습니다.');
    };

    // 사이드바 클릭이벤트
    // const handleSidebarClick = (e: React.MouseEvent) => {
    //     // 클릭된 요소가 sidebar-item인지 확인
    //     const target = e.target as HTMLElement;
    //     const sidebarItem = target.closest('[data-sidebar-item]');
        
    //     // SidebarItem이 클릭된 경우 토글하지 않음
    //     if (sidebarItem) {
    //         return;
    //     }
        
    //     // 빈 공간이나 다른 요소 클릭 시만 토글
    //     setExpanded(!expanded);
    // };

    

    return (
        // <aside className= {`h-screen transition-all duration-300 ease-in-out ${expanded ? 'w-72' : 'w-20'} z-50`}>
            <nav className='relative h-full flex flex-col bg-white shadow-sm'>
                <div className={`p-4 pb-2 flex justify-between items-center ${expanded? 'p-8 pb-8' : 'p-7'}`}>
                    {expanded
                        ?<Image src="/gwLogo.png" alt='gw로고lg' width={180} height={80} priority />
                        :<Image src="/logo_small.png" alt='gw로고sm' width={30} height={30} priority />
                    }
                </div>
                {/* 확장버튼 추가 */}
                {/* <button
                    onClick={()=>setExpanded(!expanded)}
                    className='absolute -right-3 top-10 p-1.5 rounded-full border-[#4FA969] text-[#4FA969] bg-[#4FA969]/20 hover:bg-[#4FA969]/50 border cursor-pointer'
                >
                    {expanded ? <FiChevronLeft size={18}/> : <FiChevronRight />}
                </button> */}
                {/* Context Provider로 expanded 상태를 하위 컴포넌트에 전달 */}
                <SidebarContext.Provider value={{ expanded }}>
                    <ul className='flex-1 px-3' onClick={()=>setExpanded(!expanded)} >
                        {navItems.map((item, idx) => (
                            <SidebarItem  key={idx} item={item}/>
                        ))}
                    </ul>
                </SidebarContext.Provider>

                <div className="border-t flex p-3">
                    <img src="/admin_avatar.png" alt="Avatar" className="w-10 h-10 rounded-md" />
                    <div className={`flex justify-between items-center overflow-hidden transition-all ${expanded ? 'w-52 ml-3' : 'w-0'}`}>
                        <div className="leading-4">
                            <h4 className="font-semibold">John Doe</h4>
                            <span className="text-xs text-gray-600">johndoe@gmail.com</span>
                        </div>
                        <span onClick={()=>handleLogout()}
                                className='cursor-pointer text-[23px] text-[#666] rounded-full p-2 hover:bg-[#f2f2f2]'>
                                    <FiLogOut size={20} />
                        </span>
                    </div>
                </div>

            </nav>
        // </aside>
    )
}
