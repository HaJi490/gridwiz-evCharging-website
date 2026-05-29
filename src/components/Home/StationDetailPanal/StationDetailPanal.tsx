'use client'

import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react'

import { CHARGER_STATUS_MAP } from '@/constants/charger';
import ReservationPanel from './ReservationPanel';
import Toast from '@/components/Toast/Toast';
import ConfirmModal from '@/components/ConfirmModal/ConfirmModal'
import { StationListItem, ChargerInfoMap, ChargerInfoItem } from '@/types/dto'
import codeToNm from '../../../db/chgerType.json'

//Icons
import { IoCalendarClearOutline } from "react-icons/io5";
import { FiZap } from "react-icons/fi";
import { LuDot } from "react-icons/lu";


/**
 * StationDetailPanel 컴포넌트 Props 인터페이스
 */
interface StationDetailPanalProps {
    /** 현재 선택된 충전소 데이터 */
    selectedStation: StationListItem | null;
    /** 패널을 닫는 콜백 함수 */
    onClose: () => void;
    /** 데이터 선택의 출처 (map 또는 list) */
    selectionSource: string;
}

/**
 * 충전소의 상세 정보(주소, 운영시간, 운영기관) 및 개별 충전기 실시간 상태를 보여주는 상세 패널
 * 
 * 주요 기능:
 * 1. 충전기 상태별 정렬(대기 우선) 및 타입별(급속/완속) 그룹화 로직
 * 2. 지도 인터랙션 유지와 외부 클릭 닫기 간의 충돌 방지 (Event Bubbling 제어)
 * 3. 예약 시스템(ReservationPanel) 호출 및 최종 확인 모달 연동
 * 4. 애니메이션 기반의 패널 노출 제어
 */
export default function StationDetailPanal({
    selectedStation,
    onClose,
    selectionSource
}: StationDetailPanalProps) {
    const panelRef = useRef<HTMLDivElement>(null);
    const justSelectedFromMap = useRef<boolean>(false);

    // UI 상태 관리
    const [viewMode, setviewMode] = useState<'reserv' | 'navi' | null>(null);
    const [showReserv, setShowReserv] = useState<boolean>(false);
    const [selectedCharger, setSelectedCharger] = useState<ChargerInfoItem | null>(null);
    const [toastMsg, setToastMsg] = useState<string>('');
    const [modalInfo, setModalInfo] = useState({
        show: false, message: '', submessage: '', onConfirm: () => { },
    });

    /** 
     * 지도 마커 클릭 시 추적 로직 (레이스 컨디션 방지) 
     */
    useEffect(() => {
        if (selectedStation && selectionSource === 'map') {
            justSelectedFromMap.current = true;
            const timer = setTimeout(() => { justSelectedFromMap.current = false; }, 200);
            return () => clearTimeout(timer);
        } else {
            justSelectedFromMap.current = false;
        }
    }, [selectedStation, selectionSource])

    /** 
     * 외부 클릭 시 패널 닫기 및 지도 요소 예외 처리 
     */
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (modalInfo.show || showReserv || justSelectedFromMap.current) return;

            const target = e.target as HTMLElement;

            // 마커나 오버레이 클릭시 패널이 닫히지 않도록 방어
            const isMapElement = (target as Element).closest('.kakao-map') ||
                (target as Element).closest('[class*="marker"]') ||
                (target as Element).closest('[class*="overlay"]') ||
                (target as Element).closest('.map-container');

            if (panelRef.current && !panelRef.current.contains(target) && !isMapElement) {
                onClose();
            }
        }

        document.addEventListener('click', handleClickOutside)
        return () => document.removeEventListener('click', handleClickOutside)
    }, [onClose, showReserv, modalInfo.show]);


    /** 
     * 충전기 정렬(상태순) 및 그룹화(타입순) 
     */
    const groupedAndSortedChargers = useMemo(() => {
        if (!selectedStation?.chargerInfo) return {};

        const stausPriority: Record<string, number> = { '2': 1, '3': 2 }; // '대기상태' 기기 상단 노출
        const chargers = Object.values(selectedStation.chargerInfo);

        const sorted = chargers.sort((a, b) => (stausPriority[a.stat] || 99) - (stausPriority[b.stat] || 99));

        return sorted.reduce((acc, charger) => {
            const typeMatch = codeToNm.find(t => charger.chgerType.includes(t.code))
            const typeName = typeMatch?.type || '기타';
            if (!acc[typeName]) acc[typeName] = [];
            acc[typeName].push(charger);
            return acc;
        }, {} as Record<string, ChargerInfoItem[]>)
    }, [selectedStation]);

    /**
     * 마지막 업데이트 시간을 "N분 전" 형식의 텍스트로 변환
     */
    const getTimeAgo = (ts: string): string => {
        if (!ts || ts.length < 12) return '방금 전';
        const past = new Date(
            parseInt(ts.substring(0, 4)), parseInt(ts.substring(4, 6)) - 1,
            parseInt(ts.substring(6, 8)), parseInt(ts.substring(8, 10)), parseInt(ts.substring(10, 12))
        );
        const diff = Math.floor(new Date().getTime() - past.getTime() / 60000);

        if (diff < 1) return '방금 전';
        if (diff < 60) return `${diff}분 전`;
        if (diff < 1440) return `${Math.floor(diff / 60)}시간 전`;
        return `${Math.floor(diff / 1440)}일 전`;
    }

    /**
     * 예약 확인 모달 호출 핸들러
     * @param msg 
     * @param submsg 
     * @param action
     */
    const handleOpenConfirmModal = (msg: string, submsg: string, action: () => void) => {
        setModalInfo({ show: true, message: msg, submessage: submsg, onConfirm: action });
    };

    useEffect(() => {
        // selectedStation이 변경될 때마다 viewMode를 초기 상태(null)
        setviewMode(null);
    }, [selectedStation]);

    if (!selectedStation) return null;

    return (
        <>
            <Toast message={toastMsg} setMessage={setToastMsg} />
            {modalInfo.show &&
                <ConfirmModal
                    message={modalInfo.message}
                    submsg={modalInfo.submessage}
                    onConfirm={() => { modalInfo.onConfirm(); setModalInfo({ ...modalInfo, show: false }); }}
                    onCancel={() => setModalInfo({ ...modalInfo, show: false })} />
            }
            <aside
                ref={panelRef}
                className='absolute z-20 top-103 left-162 -translate-x-1/2 -translate-y-1/2 
                    h-full w-100 max-h-[85vh] bg-white rounded-lg shadow-xl 
                    flex flex-col transition-all duration-300 ease-out'
                aria-label={`${selectedStation.statNm} 상세 정보`}
            >
                {/* 충전소 기본 정보 */}
                <header className='mb-4 flex flex-col gap-2 w-full p-6 border-b border-[#f2f2f2]'>
                    <div className='flex gap-1 text-[12px]'>
                        <span className={selectedStation.parkingFree ? 'badgetrue' : 'badgefalse'}>
                            {selectedStation.parkingFree ? '무료주차' : '유료주차'}
                        </span>
                        <span className={selectedStation.limitYn ? 'badgetrue' : 'badgefalse'}>
                            {selectedStation.limitYn ? '개방' : '비개방'}
                        </span>
                    </div>
                    <h2 className='text-xl font-bold text-gray-800'>{selectedStation.statNm}</h2>

                    <dl className='flex flex-col gap-1 mb-3 text-sm'>
                        <div className='flex items-center'>
                            <dt className='text-gray-900 font-medium mr-4 w-15'>주소</dt>
                            <dd className='flex-1 text-gray-500'>{selectedStation.addr}</dd>
                        </div>
                        {selectedStation.useTime !== '0시간' &&
                            <div className='flex items-center'>
                                <dt className='text-gray-900 font-medium mr-4 w-15'>운영시간</dt>
                                <dd className='flex-1 text-gray-500'> {selectedStation.useTime} </dd>
                            </div>
                        }
                        <div className='flex items-center'>
                            <dt className='text-gray-900 font-medium mr-4 w-15'>운영기관</dt>
                            <dd className='flex-1 items-center text-gray-500'>
                                {selectedStation.busiNm}
                            </dd>
                        </div>
                    </dl>

                    {/* 탭 전환 버튼 */}
                    <nav className='mt-6'>
                        <button className='flex justify-center items-center gap-2 border border-[#afafaf] text-[#666] hover:bg-[#f2f2f2] rounded py-1.5 cursor-pointer'
                            onClick={() => setviewMode(viewMode === 'reserv' ? null : 'reserv')}>
                            {viewMode === 'reserv' ? <FiZap size={15} className='mb-1' /> : <IoCalendarClearOutline size={15} className='mb-1' />}
                            {viewMode === 'reserv' ? '실시간 충전 현황 보기' : '충전 예약하기'}
                        </button>
                    </nav>
                </header>

                {/* 실시간 충전현황 */}
                <div className='flex-1 overflow-y-auto px-6 custom-scrollbar'>
                    <h3 className="font-semibold text-gray-800 mb-3">
                        {viewMode === 'reserv' ? '충전 예약하기' : '실시간 충전현황'}
                    </h3>

                    <ul className='grid grid-cols-1 gap-2'>
                        {Object.entries(groupedAndSortedChargers).map(([type, chargers]) => (
                            <li key={type} className='mb-5'>
                                <h4 className='font-medium text-[13px] text-[#666] mb-2 flex'>
                                    {type.split('+').map((part, idx, arr) => (
                                        <React.Fragment key={idx}>
                                            {part} {idx < arr.length - 1 && <LuDot className='mt-1' />}
                                        </React.Fragment>
                                    ))}
                                </h4>
                                <div className='grid grid-cols-1 gap-2'>
                                    {chargers.map((charger) => {
                                        const status = CHARGER_STATUS_MAP[charger.stat as keyof typeof CHARGER_STATUS_MAP] || CHARGER_STATUS_MAP['9'];
                                        const isAvailable = charger.stat === '2';

                                        return (
                                            <article
                                                key={charger.chgerId}
                                                onClick={() => viewMode === 'reserv' && status.available && (setSelectedCharger(charger), setShowReserv(true))}
                                                className={`p-3 border rounded text-left transitions-colors
                                                            ${viewMode === 'reserv' && isAvailable
                                                        ? 'border-[#4FA969] bg-green-50'
                                                        : 'border-gray-300 bg-gray-50/50'
                                                    }`}
                                            >
                                                <div className='flex justify-between items-center mb-2'>
                                                    <div className='flex items-center gap-2'>
                                                        {status.icon}
                                                        <span className={`font-bold ${isAvailable ? 'text-[#4FA969]' : 'text-gray-500'}`}>
                                                            {status.text}
                                                        </span>
                                                    </div>
                                                    <span className={`font-bold ${isAvailable ? 'text-[#4FA969]' : 'text-gray-500'}`}>{charger.chgerId}</span>
                                                </div>
                                                <div className='mt-2 flex justify-between items-end'>
                                                    <p className="text-sm text-gray-600"> {charger.output}kW </p>
                                                    <p className="text-xs text-gray-500"> {getTimeAgo(charger.lastTsdt)}</p>
                                                </div>
                                            </article>
                                        )
                                    })}

                                </div>
                            </li>
                        )
                        )}
                    </ul>
                </div>

                {/* 예약 패널 내부 섹션 정의 */}
                {showReserv && selectedCharger && (
                    <ReservationPanel
                        charger={selectedCharger}
                        onClose={() => {setShowReserv(false); setSelectedCharger(null);}}
                        onOpenConfirm={handleOpenConfirmModal}
                        onCancel={() => setModalInfo({...modalInfo, show: false})}
                        onSetToastmsg={setToastMsg}
                    />
                )}
            </aside>
        </>
    )
}
