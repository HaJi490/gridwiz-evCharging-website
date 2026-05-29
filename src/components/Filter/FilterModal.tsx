'use client'

import { useEffect, useState, useRef, useCallback, useMemo } from "react"

import TwowaySlider from '../Slider/TwowaySlider'
import { CHARGING_COMPANIES, CONNECTOR_TYPES } from "@/constants/charger"
import { FilterSettings } from "@/types/station/station.type"
import style from './FilterModal.module.css'

/**
 * FilterModal 컴포넌트의 Props 인터페이스
 */
interface FilterModalProps {
    /** 모달 노출 여부 */
    isOpen: boolean;
    /** 모달 닫기 콜백 함수 */
    onClose: () => void;
    /** 필터 적용 버튼 클릭 시 최종 데이터를 전달하는 콜백 함수 */
    onApplyFilters: (filters: any, msg?: string) => void;
    /** 초기 필터 설정 값 */
    initialFilters?: any;
}

/**
 * 충전소 탐색을 위한 통합 필터링 모달 컴포넌트
 * 
 * 주요 기능:
 * 1. 탭 메뉴를 통한 섹션 간 앵커 스크롤링 (Navigation)
 * 2. 다중 선택 및 범위 지정(Range) 필터 인터페이스 제공
 * 3. 폼 상태 초기화 및 일괄 적용 로직
 * 4. 모달 활성화 시 배경 스크롤 차단 및 Esc 키 닫기 등 웹 표준 준수
 */
export default function FilterModal({ isOpen, onClose, onApplyFilters, initialFilters }: FilterModalProps) {
    // 필터 상태 관리
    const [canUse, setCanUse] = useState<boolean>(initialFilters.canUse);
    const [parkingFree, setParkingFree] = useState<boolean>(initialFilters.parkingFree);
    const [limitYn, setLimitYn] = useState<boolean>(initialFilters.limitYn);
    const [selectedRange, setSelectedRange] = useState<number>(initialFilters.radius);
    const [selectedSpeedMin, setSelectedSpeedMin] = useState<number>(initialFilters.outputMin);
    const [selectedSpeedMax, setSelectedSpeedMax] = useState<number>(initialFilters.outputMax);
    const [selectedChargerTypes, setSelectedChargerTypes] = useState<string[]>(initialFilters.chargerTypes); // 커넥터타입 선택상태
    const [selectedChargerComps, setSelectedChargerComps] = useState<string[]>(() => {
        if (!initialFilters.chargerComps || initialFilters.chargerComps.length === 0)
            return CHARGING_COMPANIES.map(comp => comp.value);
        return initialFilters.Comps;
    });

    const [activeTab, setActiveTab] = useState<string>('속성');

    // 앵커 스크롤을 위한 섹션 Ref 관리
    const sectionRefs: { [key: string]: React.RefObject<HTMLDivElement | null> } = {
        '속성': useRef<HTMLDivElement>(null),
        '탐색반경': useRef<HTMLDivElement>(null),
        '충전속도': useRef<HTMLDivElement>(null),
        '커넥터': useRef<HTMLDivElement>(null),
        '운영기관': useRef<HTMLDivElement>(null),
    };


    /** 모달 이벤트 리스너 (Esc 키 닫기 및 스크롤 차단) */
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            const handleEsc = ((e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); });
            window.addEventListener('keydown', handleEsc);
            return () => {
                document.body.style.overflow = 'unset';
                window.removeEventListener('keydown', handleEsc);
            }
        }
    }, [isOpen, onClose]);


    /**
     * 탭 클릭 시 해당 필터 섹션으로 부드럽게 스크롤
     * @param {string} tabName - 이동할 섹션의 이름
     */
    const handleTabClick = (tabName: string) => {
        setActiveTab(tabName);
        sectionRefs[tabName].current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    /** 속성 버튼 클릭 제어 */
    const handlePropToggle = (type: 'canUse' | 'parkingFree' | 'limitYn') => {
        if (type === 'canUse') setCanUse(!canUse);
        if (type === 'parkingFree') setParkingFree(!parkingFree);
        if (type === 'limitYn') setLimitYn(!limitYn);
    }

    /** 커넥터 타입 다중 선택 처리 */
    const handleConnectorType = (value: string) => {
        setSelectedChargerTypes(prev =>
            prev.includes(value) ? prev.filter(type => type !== value) : [...prev, value]
        );
    }

    /** 운영기관 전체 선택/해제 토글 */
    const handleToggleAllCompanies = () => {
        const isAllSelected = CHARGING_COMPANIES.length === selectedChargerComps.length;
        setSelectedChargerComps(isAllSelected ? [] : CHARGING_COMPANIES.map(comp => comp.value));
    }

    /** 모든 필터 상태를 초기값으로 리셋 */
    const handleReset = () => {
        setCanUse(false);
        setParkingFree(false);
        setLimitYn(false);
        setSelectedRange(2000);
        setSelectedSpeedMin(0);
        setSelectedSpeedMax(300);
        setSelectedChargerTypes([]);
        setSelectedChargerComps(CHARGING_COMPANIES.map(comp => comp.value));
    }

    /** 최종 필터 데이터를 부모 컴포넌트로 전달 */
    const handleApply = () => {
        const filters: FilterSettings = {
            canUse,
            parkingFree,
            limitYn,
            radius: selectedRange,
            outputMin: selectedSpeedMin,
            outputMax: selectedSpeedMax,
            chargerTypes: selectedChargerTypes,
            chargerComps: selectedChargerComps,
        };

        const msg = selectedChargerComps.length === 0 ? '운영기관이 선택되지 않아 전체로 검색합니다.' : undefined;
        onApplyFilters(filters, msg);
    }

    if (!isOpen) return null;

    return (
        <div role="none" onClick={onClose} className={style.modalBackdrop}>

            {/* 필터모달 전체 영역 */}
            <section
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="filter-title"
                className="bg-white rounded w-full max-w-xl p-6 relative flex flex-col h-[80vh]"
            >

                {/* 헤더 영역*/}
                <header className="flex justify-between items-center mb-4">
                    <h2 id='filter-title' className="font-bold">탐색 필터 설정</h2>
                    <button
                        aria-label="필터 닫기"
                        onClick={onClose}
                        className="absolute top-4 right-4 p-1 text-2xl cursor-pointer"
                    >
                        &times;
                    </button>
                </header>

                {/* 탭 메뉴 영역 */}
                <nav aria-label="필터 카테고리" className="flex gap-2 border-b border-gray-100 pb-2 mb-4 sticky top-0 bg-white z-10 " >
                    {Object.keys(sectionRefs).map((menu) => (
                        <button
                            key={menu}
                            aria-selected={activeTab === menu}
                            onClick={() => handleTabClick(menu as string)}
                            className={`${style.filterList} ${activeTab === menu ? style.active : ''}`}
                        >
                            {menu}
                        </button>
                    ))}
                </nav>

                {/* 본문 영역 (스크롤) */}
                <div className="scrollContent">

                    {/* 속성설정 */}
                    <article ref={sectionRefs['속성']} className="mb-12">
                        <h3 className="mb-2"   >기본 속성</h3>
                        <div className="flex gap-2 ">
                            {[
                                { id: 'canUse', label: '충전가능', state: canUse },
                                { id: 'limitYn', label: '외부개방', state: limitYn },
                                { id: 'parkingFree', label: '무료주차', state: parkingFree }
                            ].map(prop => (
                                <button
                                    key={prop.id}
                                    onClick={() => handlePropToggle(prop.id as any)}
                                    className={`${style.propYn} ${prop.state ? style.active : ''}`}
                                >
                                    {prop.label}
                                </button>
                            ))}
                        </div>
                    </article>

                    {/* 탐색반경 설정 */}
                    <article ref={sectionRefs['탐색반경']} className="mb-12">
                        <h3 className="mb-2 text-gray-400" >탐색반경</h3>
                        <div className="flex flex-wrap gap-2">
                            {[2000, 3000, 5000, 10000, 30000, 0].map((range) => (
                                <button
                                    key={range}
                                    onClick={() => setSelectedRange(range)}
                                    className={`${style.propYn} ${selectedRange === range ? style.active : ''}`}
                                >
                                    {range === 0 ? '전국' : `${range / 1000}km`}
                                </button>
                            ))}
                        </div>
                    </article>

                    {/* 충전속도 설정 */}
                    <article ref={sectionRefs['충전속도']} className="mb-12">
                        <h3 className="mb-2 text-gray-400">충전속도 (kW) </h3>
                        <div className="px-2">
                            <TwowaySlider
                                min={selectedSpeedMin}
                                max={selectedSpeedMax}
                                setMinMax={(min, max) => { setSelectedSpeedMin(min); setSelectedSpeedMax(max); }}
                            />
                        </div>
                    </article>

                    {/* 커넥터 설정 */}
                    <article ref={sectionRefs['커넥터']} className="mb-12">
                        <h3 className="mb-2 text-gray-400" >커넥터</h3>
                        <div className="flex flex-wrap gap-2  ">
                            {CONNECTOR_TYPES.map((item) => (
                                <button
                                    key={item.value}
                                    onClick={() => handleConnectorType(item.value)}
                                    className={`${style.propYn} ${selectedChargerTypes.includes(item.value) ? style.active : ''}`}
                                >
                                    {item.value}
                                </button>
                            ))}
                        </div>
                    </article>

                    {/* 충전사 설정 */}
                    <article ref={sectionRefs['운영기관']} className="mb-12">
                        <div className="flex justify-between">
                            <h3 className="mb-2 text-gray-400" >운영기관</h3>
                            <button
                                onClick={() => handleToggleAllCompanies()}
                                className="text-xs text-[#4FA969] font-bold hover:underline"
                            >
                                {CHARGING_COMPANIES.length === selectedChargerComps.length ? '전체 취소' : '전체 선택'}
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                            {CHARGING_COMPANIES.map((comp) => (
                                <label key={comp.value} className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        key={comp.value}
                                        value={comp.value}
                                        checked={selectedChargerComps.includes(comp.value)}
                                        onChange={e => {
                                            const val = comp.value;
                                            setSelectedChargerComps(prev =>
                                                e.target.checked ? [...prev, val] : prev.filter(c => c !== val)
                                            );
                                        }}
                                        className="form-checkbox h-4 w-4 text-[#4FA969] rounded border-gray-300 focus:ring-[#4FA969]" />
                                    <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">{comp.value}</span>
                                </label>
                            ))}
                        </div>
                    </article>
                </div>

                {/* 하단 제어 영역 */}
                <footer className="sticky pt-4 border-t border-gray-100 bottom-0 bg-white z-10 flex gap-3">
                    <button 
                        className="w-full flex-1/3 bg-[#f2f2f2] text-[#666] rounded py-3 mt-3 cursor-pointer" 
                        onClick={() => handleReset()}
                    >
                            초기화
                    </button>
                    <button 
                        onClick={() => handleApply()}
                        className="w-full flex-2/3 bg-[#4FA969] text-white rounded py-3 mt-3 cursor-pointer" 
                    >
                        결과보기
                    </button>
                </footer>
            </section>
        </div>
    )
}
