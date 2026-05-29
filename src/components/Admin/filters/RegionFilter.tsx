'use client'

import { useState, useMemo } from 'react'
import style from './RegionFilter.module.css'

/**
 * 부산광역시 행정구역 메타데이터 리스트
 */
export const busanDistricts = [
    { name: '금정구', longitude: 129.0921, latitude: 35.2431, zoom: 12 },
    { name: '강서구', longitude: 128.9816, latitude: 35.2132, zoom: 11 },
    { name: '기장군', longitude: 129.2136, latitude: 35.2445, zoom: 11 },
    { name: '남구', longitude: 129.0833, latitude: 35.1365, zoom: 12.5 },
    { name: '동구', longitude: 129.0416, latitude: 35.1296, zoom: 13 },
    { name: '동래구', longitude: 129.0864, latitude: 35.2043, zoom: 12.5 },
    { name: '부산진구', longitude: 129.0556, latitude: 35.1627, zoom: 12.5 },
    { name: '북구', longitude: 129.0153, latitude: 35.1983, zoom: 12 },
    { name: '사상구', longitude: 128.9984, latitude: 35.1524, zoom: 12.5 },
    { name: '사하구', longitude: 128.9734, latitude: 35.1039, zoom: 12 },
    { name: '서구', longitude: 129.0183, latitude: 35.0979, zoom: 13 },
    { name: '수영구', longitude: 129.1121, latitude: 35.1543, zoom: 13.5 },
    { name: '연제구', longitude: 129.0763, latitude: 35.1764, zoom: 13.5 },
    { name: '영도구', longitude: 129.0669, latitude: 35.0911, zoom: 13 },
    { name: '중구', longitude: 129.0333, latitude: 35.101, zoom: 14 },
    { name: '해운대구', longitude: 129.1604, latitude: 35.1631, zoom: 12 },
];

/** 행정구역 데이터 객체의 타입 정의 */
export type District = typeof busanDistricts[0];

/**
 * RegionFilter 컴포넌트의 Props 인터페이스
 */
interface GuSelectorProps {
    /** 현재 부모 컴포넌트에서 선택된 지역명 */
    value: string;
    /** 새로운 지역이 선택되었을 때 호출되는 콜백 함수 */
    onRegionSelect: (district: string) => void;
}

/**
 * 부산 지역(구) 선택 전용 드롭다운 필터 컴포넌트
 * 선택된 지역명에 따라 내부 UI 상태를 동기화합니다.
 */
export default function RegionFilter({ value, onRegionSelect }: GuSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    // 부모의 value 값과 일치하는 구 객체 (기본값: 금정구)
    const selectedGu = useMemo(() => {
        return busanDistricts.find(d => d.name === value) || busanDistricts[0];
    }, [value]);

    /**
     * 특정 구를 클릭했을 때 호출되는 핸들러
     * @param {District} district - 선택된 행정구역 객체
     */
    const handleSelect = (district: District) => {
        setIsOpen(false);
        onRegionSelect(district.name);
    };


    return (
        <nav className={style.dropdown_container}>
            <button
                type='button'
                className={style.dropdown_button} 
                onClick={() => setIsOpen(!isOpen)}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                {selectedGu.name}
                <span className={style.arrow} aria-hidden='true'>
                    {isOpen ? '▲' : '▼'}
                </span>
            </button>

            {isOpen && (
                <ul
                    role='listbox'
                    aria-label='부산광역시 구 선택 목록'
                    className={style.dropdown_list}
                >
                    {busanDistricts.map((district) => (
                        <li
                            key={district.name}
                            role='option'
                            aria-selected={value === district.name}
                            onClick={() => handleSelect(district)}
                            className={style.dropdown_item}
                        >
                            {district.name}
                        </li>
                    ))}
                </ul>
            )}
        </nav>
    )
}
