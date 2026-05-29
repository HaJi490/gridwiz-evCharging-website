import React from 'react'
import { DayPicker } from 'react-day-picker';

import 'react-day-picker/dist/style.css';
import './my-calendar-styles.css';

/**
 * Calendar 컴포넌트의 Props 인터페이스
 */
interface CustomDayPickerProps {
    /** 현재 선택된 날짜 객체 */
    selectedDate: Date | undefined;
    /** 날짜 선택 시 상태를 업데이트하는 콜백 함수 */
    onSelectDate: (date: Date | undefined) => void;
     /** 날짜 선택 후 추가 로직(예: 타임슬롯 조회)을 실행하는 콜백 함수 (선택 사항) */
    handleTimeslots?: (date: Date) => void;
    /** 오늘 이전 날짜의 선택 비활성화 여부 (기본값: true) */
    disabledBefore?: boolean; 
}


/**
 * 공통 날짜 선택 캘린더 컴포넌트
 * 특정 날짜를 선택하여 예약 시스템이나 관리자 통계 필터에 활용할 수 있으며,
 * 프로젝트의 디자인 가이드에 맞춘 커스텀 스타일링이 적용되어 있습니다.
 */
export default function Calendar({ 
    selectedDate, 
    onSelectDate, 
    handleTimeslots, 
    disabledBefore = true, 
}: CustomDayPickerProps) {
    /** 오늘 날짜 기준점 설정 (시간 제외) */
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (
        <section aria-label='날짜 선택 달력' className='calender-wrapper'>
            <DayPicker
                mode='single'
                selected={selectedDate}
                disabled={disabledBefore ? { before: today } : undefined}
                classNames={{
                    selected: 'my-selected',
                    today: 'my-today',
                    outside: 'my-outside',
                }}
                onSelect={(date) => {
                    if (date) {
                        onSelectDate(date);
                        handleTimeslots(date);
                    } else {
                        onSelectDate(undefined);
                    }
                }}
            />
        </section>
    )
}
