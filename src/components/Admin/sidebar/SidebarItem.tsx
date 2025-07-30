import React, { useContext, useState } from 'react'
import { SidebarContext } from './Sidebar';
import { useRouter } from 'next/navigation';

export default function SidebarItem({item} : {item: any}) {
    const {expanded} = useContext(SidebarContext);
    const [submenuOpen, setSubmenuOpen] = useState(false);
    const route = useRouter();

    const handleItemClick = (e: React.MouseEvent) => {
        e.stopPropagation(); //이벤트 버블링 중단
        
        // 원래 클릭 로직 실행
        if(item.onClick) {
            item.onClick();
        }
    }
    
  return (
    <li 
        data-sidebar-item="true" // 식별자 추가
        onClick={handleItemClick}
        className='relative flex items-center py-3 px-3 my-1
                font-medium rounded-md cursor-pointer
                transition-colors group
                hover:bg-[#4FA969]/10 text-gray-600'
    >
        {item.icon}
        <span className={`overflow-hidden transition-all ${expanded ? "w-52 ml-3" : "w-0"}`}
                onClick={() => route.push(item.path)}>
            {item.name}
        </span>

        {/* 접힌 상태일 때의 툴팁 */}
        {!expanded && (
            <span className={`
                absolute left-full rounded-md px-3 py-3 ml-6
                bg-[#e9faed] text-[#4FA969] text-sm
                invisible opacity-20 -translate-x-3 transition-all
                group-hover:visible group-hover:opacity-100 group-hover:translate-x-0
            `}>
                {item.name}
            </span>
        )}
    </li>
  )
}
