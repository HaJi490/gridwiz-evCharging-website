'use client'

import React, { useState } from 'react';
import style from './GuSelector.module.css';

/**
 * 부산광역시 행정구역별 위치 및 지도 설정 데이터
 * 각 구별 중심 좌표와 시각적으로 최적화된 초기 줌(Zoom) 레벨을 정의합니다.
 */
export const busanDistricts = [
    { name: '부산시 전체', longitude: 129.0756, latitude: 35.1796, zoom: 10 },
    { name: '강서구', longitude: 128.9816, latitude: 35.2132, zoom: 11 },
    { name: '금정구', longitude: 129.0921, latitude: 35.2431, zoom: 12 },
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

/**
 * 행정구역 데이터 객체의 타입 정의
 */
export type District = typeof busanDistricts[0];

/**
 * GuSelector 컴포넌트의 Props 인터페이스
 */
interface GuSelectorProps {
    /** 지역 선택 시 호출되어 선택된 구 객체를 전달하는 콜백 함수 */
    onGuSelect: (district: District) => void;
}

/**
 * 지역(구) 선택 컴포넌트
 * 부산광역시 내의 행정구역을 선택할 수 있는 드롭다운 메뉴를 제공하며,
 * 선택된 지역의 지리학적 메타데이터를 상위 컴포넌트로 전파합니다.
 */
export default function GuSelector({ onGuSelect }: GuSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    
    // 선택된 지역 상태(초깃값: 부산시 전체)
    const [selectedGu, setSelectedGu] = useState(busanDistricts[0]);

    /**
     * 특정 행정구역 아이템 클릭 시 내부 상태를 업데이트하고 부모 컴포넌트로 데이터를 전달
     * @param {District} district - 사용자가 선택한 행정구역 데이터 객체
     */
    const handleSelect = (district: District) => {
        setSelectedGu(district);
        setIsOpen(false);
        onGuSelect(district);
    };

    return (
        <div className={style.dropdown_container}>
            {/* 드롭다운 활성화 버튼 */}
            <button className={style.dropdown_button} onClick={() => setIsOpen(!isOpen)}>
                {selectedGu.name}
                <span className={style.arrow}>{isOpen ? '▲' : '▼'}</span>
            </button>

            {/* 행정구역 리스트 영역 */}
            {isOpen && (
                <ul className={style.dropdown_list}>
                    {busanDistricts.map((district) => (
                        <li
                            key={district.name}
                            className={style.dropdown_item}
                            onClick={() => handleSelect(district)}
                        >
                            {district.name}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
