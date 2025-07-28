'use client'

import React,{ useState} from 'react'
import TimeFilter from './TimeFilter';
import RegionFilter, { District } from './RegionFilter'
import Calender from '@/components/Calender/Calender';

export interface HeatmapFilter {
    time: number;
    region: string;
    date: Date;
}

interface FilterGroupProps {
    onFilterChange: (filter: HeatmapFilter) => void;
    initialFilter : HeatmapFilter;
}

export default function FilterGroup({onFilterChange, initialFilter }: FilterGroupProps) {
    const [filters, setFilters] = useState<HeatmapFilter>(initialFilter);
    const [showDate, setShowDate] = useState<boolean>(false);
    const [showTime, setShowTime] = useState<boolean>(false);

    // 필터적용
    const handleChange = (key: keyof HeatmapFilter, value: any) => {
        const updated = {...filters, [key]: value};
        setFilters(updated);
        // console.log(updated);
    }

    // 히트맵에 요청
    const handleApplyFilter = () => {
        console.log('[FilterGroup] 필터 적용:', filters);
        onFilterChange(filters); 
    }


    // 달력닫기
    const handleCloseDate = (date: Date) => {
        setShowDate(false);
    }
    

    return (
        <>
            <div className='flex flex-col gap-6'>
                <div className='textlst outside'>
                    <h3 className="text-gray-200 font-normal mr-4 w-15">지역</h3>
                    <RegionFilter value={filters.region} onRegionSelect={(val) => handleChange('region', val)} />
                </div>

                <div className='relative'>
                    <div className='flex items-center font-medium text-white '>
                        <h3 className='text-gray-200 font-normal mr-4 w-15'>날짜</h3>
                        <span className='cursor-pointer font-bold hover:bg-[#323232] py-1 rounded-md'
                                onClick={()=>setShowDate(prev => !prev)}
                        >
                            {filters.date.toLocaleDateString()}
                        </span>
                    </div>
                    {showDate && (
                        <div className='absolute top-0 right-full mr-5 bg-white p-3 rounded-lg drop-shadow-lg'>
                            <Calender 
                                selectedDate={filters.date} 
                                onSelectDate={(date) => handleChange('date', date)} 
                                handleTimeslots={handleCloseDate}
                                disabledBefore={false}/>
                        </div>
                    )
                    }
                </div>

                <div className='mb-3'>
                    <div className='textlst outside mb-3'>
                        <h3 className="text-gray-200 font-normal mr-4 w-15">시간</h3>
                        <span className='flex items-center font-medium text-white cursor-pointer'
                            onClick={()=>setShowTime(prev => !prev)}    
                        >
                            {filters.time}:00
                        </span>
                    </div>
                    {showTime &&
                        <TimeFilter value={filters.time} onTimeSelect={(val) => handleChange('time', val)} showLabel={false}/>
                    }
                </div>
            </div>
            <button onClick={handleApplyFilter} className='w-full px-3 py-2 bg-[#4FA969] font-medium rounded-sm text-white cursor-pointer'>수요확인</button>
        </>
    )
}
