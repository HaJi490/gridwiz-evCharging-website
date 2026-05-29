import React, { useContext } from 'react'
import Link from 'next/link';
import { SidebarContext } from './Sidebar';
import { useRouter } from 'next/navigation';

/**
 * SidebarItem 컴포넌트의 Props 인터페이스
 */
interface SidebarItemProps {
    /** 메뉴 아이템 데이터 (이름, 아이콘, 이동 경로, 클릭 콜백 등) */
    item: {
        name: string;
        icon: React.ReactNode;
        path: string;
        onClick?: () => void;
    };
}

/**
 * 관리자 사이드바 내부에 위치하는 개별 내비게이션 아이템 컴포넌트
 * 사이드바의 확장(Expanded) 상태를 구독하여 UI를 동적으로 변경하며,
 * 축소 상태에서는 사용자 편의를 위한 플로팅 툴팁을 제공합니다.
 */
export default function SidebarItem({ item }: SidebarItemProps) {
    const { expanded } = useContext(SidebarContext);
    const route = useRouter();

    /**
     * 아이템 클릭 시 부모 요소(Sidebar)로의 클릭 이벤트 전파를 차단하고
     * 정의된 별도의 액션이 있을 경우 실행
     * @param {React.MouseEvent} e - 마우스 이벤트 객체
     */
    const handleItemClick = (e: React.MouseEvent) => {
        e.stopPropagation();

        if (item.onClick) item.onClick();
    }

    return (
        <li
            data-sidebar-item="true"
            onClick={handleItemClick}
            className='group relative flex items-center my-1
                font-medium rounded-md cursor-pointer
                transition-colors hover:bg-[#4FA969]/10 text-gray-600'
        >
            <Link
                href={item.path}
                aria-label={item.name}
                className='flex items-center py-3 px-3'
            >
                <span className="flex-shrink-0">{item.icon}</span>
                <span className={`overflow-hidden transition-all ${expanded ? "w-52 ml-3" : "w-0"}`}
                    onClick={() => route.push(item.path)}>
                    {item.name}
                </span>
            </Link>

            {/* 플로팅 툴팁 (사이드바 접힘 상태일 때)*/}
            {!expanded && (
                <span
                    role="tooltip"
                    className={`
                        absolute left-full rounded-md px-3 py-3 ml-6
                        bg-[#e9faed] text-[#4FA969] text-sm
                        invisible opacity-20 -translate-x-3 transition-all
                        group-hover:visible group-hover:opacity-100 group-hover:translate-x-0
                    `}
                >
                    {item.name}
                </span>
            )}
        </li>
    )
}
