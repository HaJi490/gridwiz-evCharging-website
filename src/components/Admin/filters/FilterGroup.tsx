'use client'

import React, { useState } from 'react'
import TimeFilter from './TimeFilter';
import RegionFilter, { District } from './RegionFilter'
import Calender from '@/components/Calender/Calendar';

/**
 * 히트맵 필터 구성을 위한 데이터 인터페이스
 */
export interface HeatmapFilter {
    /** 분석 대상 시간 (0~23) */
    time: number;
    /** 분석 대상 행정 구역 명칭 */
    region: string;
    /** 분석 대상 날짜 객체 */
    date: Date;
}

/**
 * FilterGroup 컴포넌트의 Props 인터페이스
 */
interface FilterGroupProps {
    /** 필터 적용 버튼 클릭 시 최종 필터링 상태를 전달하는 콜백 함수 */
    onFilterChange: (filter: HeatmapFilter) => void;
    /** 컴포넌트 초기화 시 사용할 기본 필터 값 */
    initialFilter: HeatmapFilter;
}

/**
 * 히트맵 수요 분석을 위한 통합 필터링 컴포넌트
 * 지역 선택, 날짜 선택(캘린더), 시간 슬라이더를 하나의 그룹으로 관리하며,
 * 사용자의 입력에 따라 동적으로 상태를 업데이트하고 최종 검색 조건을 부모 컴포넌트로 전달합니다.
 */
export default function FilterGroup({ onFilterChange, initialFilter }: FilterGroupProps) {
    const [filters, setFilters] = useState<HeatmapFilter>(initialFilter);
    const [showDate, setShowDate] = useState<boolean>(false);
    const [showTime, setShowTime] = useState<boolean>(false);

    /**
     * 특정 필터 항목의 값을 업데이트
     * @param {keyof HeatmapFilter} key - 업데이트할 필터 항목의 키
     * @param {any} value - 업데이트할 새로운 값
     */
    const handleChange = (key: keyof HeatmapFilter, value: any) => {
        const updated = { ...filters, [key]: value };
        setFilters(updated);
    }

    /**
     * 현재 설정된 모든 필터 조건을 부모 컴포넌트의 적용 로직으로 전달
     */
    const handleApplyFilter = () => {
        onFilterChange(filters);
    }


    /**
     * 캘린더에서 날짜 선택이 완료되면 팝업을 닫음
     * @param {Date} _date - 선택된 날짜 (현재 로직에서는 사용하지 않음)
     */
    const handleCloseDate = (date: Date) => {
        setShowDate(false);
    }


    return (
        <section className="flex flex-col gap-6" aria-label="히트맵 검색 필터">

            {/* 지역 선택 그룹 */}
            <div className='textlst outside'>
                <h3 className="text-gray-200 font-normal mr-4 w-15">지역</h3>
                <RegionFilter value={filters.region} onRegionSelect={(val) => handleChange('region', val)} />
            </div>

            {/* 날짜 선택 그룹 (Pop-over) */}
            <div role="group" aria-labelledby="date-label" className='relative'>
                <div role="group" aria-labelledby="region-label" className='flex items-center font-medium text-white '>
                    <h3 className='text-gray-200 font-normal mr-4 w-15'>날짜</h3>
                    <button 
                        type="button"
                        className='cursor-pointer font-bold hover:bg-[#323232] py-1 rounded-md'
                        onClick={() => setShowDate(prev => !prev)}
                        aria-haspopup="grid"
                        aria-expanded={showDate}
                    >
                        {filters.date.toLocaleDateString()}
                    </button>
                </div>
                {showDate && (
                    <div className='absolute top-0 right-full mr-5 bg-white p-3 rounded-lg drop-shadow-lg'>
                        <Calender
                            selectedDate={filters.date}
                            onSelectDate={(date) => handleChange('date', date)}
                            handleTimeslots={handleCloseDate}
                            disabledBefore={false} />
                    </div>
                )
                }
            </div>
            
            {/* 시간 선택 그룹 (Accordion) */}
            <div role="group" aria-labelledby="time-label" className='mb-3'>
                <div className='textlst outside mb-3'>
                    <h3 className="text-gray-200 font-normal mr-4 w-15">시간</h3>
                    <button 
                        type="button"
                        className='flex items-center font-medium text-white cursor-pointer'
                        onClick={() => setShowTime(prev => !prev)}
                        aria-expanded={showTime}
                    >
                        {filters.time}:00
                    </button>
                </div>
                {showTime &&
                    <div className='pl-16 animate-slide-down'>
                        <TimeFilter 
                            value={filters.time} 
                            onTimeSelect={(val) => handleChange('time', val)} 
                            showLabel={false} 
                        />
                    </div>
                }
            </div>

            {/* 최종 적용 버튼 */}
            <button 
                onClick={handleApplyFilter} 
                className='w-full px-3 py-2 bg-[#4FA969] font-medium rounded-sm text-white cursor-pointer'
            >
                수요 분석 데이터 확인
            </button>
        </section>
    )
}
