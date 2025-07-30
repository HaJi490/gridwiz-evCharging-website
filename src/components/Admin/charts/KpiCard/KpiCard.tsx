import React from 'react'
import { FiMinus } from "react-icons/fi";

export type kpiCard = {
  title: string;
  value: number;
  Icon: React.ReactElement;
}

interface kpiCardProps {
  item: kpiCard;
}

export default function KpiCard({item}: kpiCardProps) {
  return (
    <div className='flex flex-col justify-between h-full'>
      {/* 상단 아이콘 */}
      <div className='flex justify-end'>
        <div className='bg-[#4FA969]/20 text-[#4FA969] p-3 rounded-full'>
          {item.Icon}
        </div>
      </div>

      {/* 하단 컨텐츠 */}
      <div>
        <p className='text-5xl font-bold text-gray-800'>{ item.value != null ? item.value : '-'}</p>
        <p className='text-sm text-gray-500 mt-2'>{item.title}</p>
      </div>
        
    </div>
  )
}
