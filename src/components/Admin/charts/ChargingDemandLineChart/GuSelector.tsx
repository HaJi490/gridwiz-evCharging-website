'use client'

import React, { useState } from 'react';
import style from './GuSelector.module.css';

// 1. 선택할 구와 부산시 전체의 위치 데이터를 미리 정의합니다.
//    실제 프로젝트에서는 이 데이터를 별도 파일로 관리하거나 API로 받을 수 있습니다.
// export const busanDistricts = [
//     { name: '부산시 전체', longitude: 129.0756, latitude: 35.1796, zoom: 10 },
//     { name: '강서구', longitude: 128.9816, latitude: 35.2132, zoom: 11 },
//     { name: '금정구', longitude: 129.0921, latitude: 35.2431, zoom: 12 },
//     { name: '기장군', longitude: 129.2136, latitude: 35.2445, zoom: 11 },
//     { name: '남구', longitude: 129.0833, latitude: 35.1365, zoom: 12.5 },
//     { name: '동구', longitude: 129.0416, latitude: 35.1296, zoom: 13 },
//     { name: '동래구', longitude: 129.0864, latitude: 35.2043, zoom: 12.5 },
//     { name: '부산진구', longitude: 129.0556, latitude: 35.1627, zoom: 12.5 },
//     { name: '북구', longitude: 129.0153, latitude: 35.1983, zoom: 12 },
//     { name: '사상구', longitude: 128.9984, latitude: 35.1524, zoom: 12.5 },
//     { name: '사하구', longitude: 128.9734, latitude: 35.1039, zoom: 12 },
//     { name: '서구', longitude: 129.0183, latitude: 35.0979, zoom: 13 },
//     { name: '수영구', longitude: 129.1121, latitude: 35.1543, zoom: 13.5 },
//     { name: '연제구', longitude: 129.0763, latitude: 35.1764, zoom: 13.5 },
//     { name: '영도구', longitude: 129.0669, latitude: 35.0911, zoom: 13 },
//     { name: '중구', longitude: 129.0333, latitude: 35.101, zoom: 14 },
//     { name: '해운대구', longitude: 129.1604, latitude: 35.1631, zoom: 12 },
// ];

// 2. 부모에게 전달할 데이터의 타입을 정의합니다.
export type District = typeof busanDistricts[0];

interface GuSelectorProps {
    onGuSelect: (district: District) => void; // 구를 선택했을 때 실행될 콜백 함수
}

export default function GuSelector({ onGuSelect }: GuSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedGu, setSelectedGu] = useState(busanDistricts[0]); // 기본값: 부산시 전체

    const handleSelect = (district: District) => {
        setSelectedGu(district);
        setIsOpen(false);
        onGuSelect(district); // 부모 컴포넌트에 선택된 구 정보를 전달
    };

    return (
        <div className={style.dropdown_container}>
            <button className={style.dropdown_button} onClick={() => setIsOpen(!isOpen)}>
                {selectedGu.name}
                <span className={style.arrow}>{isOpen ? '▲' : '▼'}</span>
            </button>

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
