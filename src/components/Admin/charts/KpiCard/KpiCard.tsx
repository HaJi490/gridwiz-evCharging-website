import React from 'react'

export type kpiCard = {
  title: string;
  value: number;
  Icon: React.ReactElement;
}

interface kpiCardProps {
  item: kpiCard;
}

/**
 * 성과지표를 확인하는 컴포넌트
 * 예약 수, 등록된 회원 수, 차량 수, 탈퇴한 회원 수를 확인합니다. 
 * @param param0 
 * @returns 
 */
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
