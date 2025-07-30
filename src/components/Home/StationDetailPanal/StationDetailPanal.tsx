'use client'

import React, { useRef, useEffect, useState, useMemo, use } from 'react'

import ReservationPanel from './ReservationPanel';
import Toast from '@/components/Toast/Toast';
import ConfirmModal from '@/components/ConfirmModal/ConfirmModal'
import { StationListItem, ChargerInfoMap, ChargerInfoItem } from '@/types/dto'
import codeToNm from '../../../db/chgerType.json'
import { IoCalendarClearOutline } from "react-icons/io5";
import { FiBattery, FiBatteryCharging, FiXCircle, FiZap } from "react-icons/fi";
import { LuDot } from "react-icons/lu";
import { BiSolidNavigation } from "react-icons/bi";

interface StationDetailPanalProps {
    selectedStation: StationListItem | null;
    onClose: () => void;
    // closeDetailRef?: React.RefObject<HTMLButtonElement | null>;
    selectionSource: string;
}

// 충전기 상태 매핑
const CHARGER_STATUS = {
    '1': { text: '통신이상', color: 'bg-red-500', available: false, icon: <FiXCircle size={20} className='text-[#666] ' /> },
    '2': { text: '충전대기', color: 'bg-green-500', available: true, icon: <FiBattery size={20} className='text-[#4FA969] ' /> },
    '3': { text: '충전중', color: 'bg-blue-500', available: true, icon: <FiBatteryCharging size={20} className='text-[#666] ' /> },
    '4': { text: '운영중지', color: 'bg-gray-500', available: false, icon: <FiXCircle size={20} className='text-[#666] ' /> },
    '5': { text: '점검중', color: 'bg-yellow-500', available: false, icon: <FiXCircle size={20} className='text-[#666] ' /> },
    '9': { text: '상태미확인', color: 'bg-gray-400', available: false, icon: <FiXCircle size={20} className='text-[#666] ' /> }
} as const;

export default function StationDetailPanal({
    selectedStation,
    onClose,
    // closeDetailRef,
    selectionSource
}: StationDetailPanalProps) {
    const panelRef = useRef<HTMLDivElement>(null);
    const [viewMode, setviewMode] = useState<'reserv' | 'navi' | null>(null);
    const [showReserv, setShowReserv] = useState<boolean>(false);
    const [selectedCharger, setSelectedCharger] = useState<ChargerInfoItem | null>(null);

    // 마커클릭 직후인지 추적하는 ref
    const justSelectedFromMap = useRef<boolean>(false);

    // 예약확인 모달
    const [modalInfo, setModalInfo] = useState<{
        show: boolean;
        message: string;
        submessage: string;
        onConfirm: () => void; // 확인 버튼을 눌렀을 때 실행될 함수
    }>({
        show: false,
        message: '',
        submessage: '',
        onConfirm: () => { },
    });
    const [isClosing, setIsClosing] = useState<boolean>(false);
    // 토스트메시지
    const [toastMsg, setToastMsg] = useState<string>('');

    // selectedStation이 변경될 때 마커에서 선택된 것인지 추적
    useEffect(() => {
        if(selectedStation && selectionSource === 'map'){
            justSelectedFromMap.current = true;
            // 200ms 후에 플래그 해제 (마커 클릭 이벤트 처리 완료 후 - 안하면 statDetail이 안꺼짐)
            const timer = setTimeout(() => {
                justSelectedFromMap.current = false;
            }, 200);
            return () => clearTimeout(timer);
        } else{
            justSelectedFromMap.current = false;
        }
    }, [selectedStation, selectionSource])
    
    // 1. 위부 클릭시 패널닫기 (모달 떠있을때는 처리하지 않음)
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            // 모달이 떠있으면 패널 닫기 이벤트 무시
            if (modalInfo.show) return;

            // 마커 클릭 직후라면 외부 클릭 무시
            if (justSelectedFromMap.current) {
                console.log('🗺️ 마커 클릭 직후 - 외부 클릭 무시');
                return;
            }

            // 클릭된 요소가 HTML노드인지 확인
            const targetNode = e.target as Node;

            // 1. closeDetailRef 버튼 클릭시 패널 닫기
            // if (closeDetailRef?.current?.contains(targetNode)) {
            //     onClose();
            //     return;
            // }

            // 2. 예약창이 열려있으면 예약창에서 처리
            if (showReserv) return;

            // 3. 지도 마커 클릭인지 확인 (이벤트 버블링 방지)
            // 마커나 지도 관련 요소 클릭시 패널 닫기 방지
            const isMapClick = (targetNode as Element).closest('.kakao-map') ||
                (targetNode as Element).closest('[class*="marker"]') ||
                (targetNode as Element).closest('[class*="overlay"]') ||
                // 추가적으로 지도 컨테이너 클래스가 있다면 여기에 추가
                (targetNode as Element).closest('.map-container');
                // (selectionSource === 'map');    // 내가추가했음. 문제생기면 의심하기⭐⭐

            if (isMapClick) {
                console.log('🗺️ 지도 관련 클릭 감지 - 패널 닫기 방지');
                return;
            }

            // 3. 전체 패널 외부 클릭시 닫기
            if (panelRef.current && !panelRef.current.contains(targetNode)) {
                onClose()
            }
        }

        document.addEventListener('click', handleClickOutside)
        return () => document.removeEventListener('click', handleClickOutside)

    }, [onClose, showReserv, selectedStation, modalInfo.show]); //closeDetailRef

    // 패널 닫기 애니메이션 처리
    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
            setIsClosing(false);
        }, 300); // 애니메이션 duration과 맞춤
    };

    // 2. 경과시간계산 - 타임스탬프 파싱
    const parseTimestamp = (respDt: string) => {
        const year = parseInt(respDt.substring(0, 4))
        const month = parseInt(respDt.substring(4, 6)) - 1
        const day = parseInt(respDt.substring(6, 8))
        const hour = parseInt(respDt.substring(8, 10))
        const minute = parseInt(respDt.substring(10, 12))
        const second = parseInt(respDt.substring(12, 14))

        return new Date(year, month, day, hour, minute, second);
    }

    // 2-2. 경과시간계산 
    const getTimeAgo = (respDt: string) => {
        const past = parseTimestamp(respDt);
        const now = new Date();
        const diffMs = now.getTime() - past.getTime();

        const diffSeconds = Math.floor(diffMs / 1000);
        const diffMinutes = Math.floor(diffSeconds / 60);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays >= 1) {
            return `${diffDays}일 전`;
        } else if (diffHours >= 1) {
            return `${diffHours}시간 ${diffMinutes % 60}분 전`
        } else if (diffMinutes >= 1) {
            return `${diffMinutes}분 전`
        } else {
            return '방금 전';
        }
    }

    // 3. 렌더링 전에 데이터 정렬, 그루핑 - 타입별, 상태별❓
    // 충전기 타입 변환
    const typeCodeToNm = (chgerCode: string) => {
        const match = codeToNm.find(type => chgerCode.includes(type.code));
        return match?.type || '';
    }

    // 충전기 상태 정보 가져오기
    const getChargerStatusInfo = (stat: string) => {
        return CHARGER_STATUS[stat as keyof typeof CHARGER_STATUS] || CHARGER_STATUS['9']
    }


    const groupedAndSortedChargers = useMemo(() => {
        if (!selectedStation || !selectedStation.chargerInfo) return {};

        // 3-1. 충전기 상태에 따라 정렬 순서를 정의
        const statusOrder: { [key: string]: number } = {
            '2': 1, // 1순위: 충전대기
            '3': 2, // 2순위: 충전중
        };

        // 3-2. ChargerInfoMap을 배열로 변환하고 정의된 순서에따라 정렬
        const sortedChargers = Object.values(selectedStation.chargerInfo as ChargerInfoMap)
            .sort((a, b) => {
                const orderA = statusOrder[a.stat] || 99; // 정의되지 않은 상태는 맨뒤로
                const orderB = statusOrder[b.stat] || 99;
                return orderA - orderB;
            });

        // 3-3. 정렬된 배열을 충전기 타입('급/완') 으로 그룹핑
        const grouped = sortedChargers.reduce((acc, charger) => {
            const typeName = typeCodeToNm(charger.chgerType) || '기타';
            if (!acc[typeName]) {
                acc[typeName] = [];
            }
            acc[typeName].push(charger);
            return acc;
        }, {} as Record<string, ChargerInfoItem[]>) // 타입지정

        return grouped;

    }, [selectedStation])

    // 예약모드로 변경
    const handleModeReserv = () => {

        if (viewMode !== 'reserv') {
            setviewMode('reserv');
        } else {
            setviewMode(null);
        }
        console.log(viewMode)
    }

    // 예약화면 띄우기
    const handleChargerReservation = (charger: ChargerInfoItem) => {
        // 상태에따라 예약여부결정
        // const statusInfo = getChargerStatusInfo(charger.stat);
        // if (!statusInfo.available) {
        //     setToastMsg('현재 예약할 수 없는 충전기입니다.')
        //     return
        // }

        setSelectedCharger(charger);
        setShowReserv(true);
    }

    // 예약패널 닫기
    const handleCloseReservation = () => {
        setShowReserv(false);
        setSelectedCharger(null);   // undefined?
    }

    useEffect(() => {
        // selectedStation이 변경될 때마다 viewMode를 초기 상태(null)
        setviewMode(null);
    }, [selectedStation]);

    // 예약확인 모달 여는함수(props로 전달)
    const handleOpenConfirmModal = (
        message: string,
        submessage: string,
        confirmAction: () => void
    ) => {
        setModalInfo({
            show: true,
            message: message,
            submessage: submessage,
            onConfirm: confirmAction,
        });
    };

    // 확인모달 닫기
    const onCancelConrirmModal = () => {
        setModalInfo({
            message: '',
            submessage: '',
            show: false,
            onConfirm: () => { }
        });
    }

    // ToastMsg 콜백
    const handleToastmsg = (msg: string) => {
        setToastMsg(msg);
    }

    // 클린업함수 - 디테일 패널 다시 켰을때 모달안나오도록
    useEffect(() => {
        // 이 return 함수는 StationDetailPanal 컴포넌트가 unmount 될 때 실행
        return () => {
            // 다른 곳에서 어떻게 닫히든, 사라지기 직전에 모달 상태를 확실히 닫아줍니다.
            onCancelConrirmModal();
            setToastMsg('');
        };
    }, []); // 빈 배열[]: 컴포넌트가 처음 마운트될 때 한 번, 언마운트될 때 한 번" 실행

    // 0. selectedStation이 null인 경우 렌더링하지 않음 
    // 제일 위쪽에 둘 경우, '훅의 규칙(Rules of Hooks)' 위반으로 어떤경우에는 밑에 훅들이 렌더링안되서 오류가뜸!
    if (!selectedStation) return null;

    return (
        <>
            <Toast message={toastMsg} setMessage={setToastMsg} />
            {modalInfo.show &&
                <ConfirmModal message={modalInfo.message} submsg={modalInfo.submessage} onConfirm={() => modalInfo.onConfirm()} onCancel={onCancelConrirmModal} />
            }
            <div
                ref={panelRef}
                className={`absolute top-103 left-162 h-full -translate-x-1/2 -translate-y-1/2 bg-white  rounded-lg shadow-xl z-20 w-100 max-h-[85vh] transition-all duration-300 ease-out`}
            >
                {/* overflow-y-auto, relative */}
                <div className='h-full flex flex-col relative'>
                    {/* <button ref={closeDetailRef} className='bg-black'></button> */}
                    {/* 헤더 */}
                    <header className='mb-4 flex flex-col gap-2 w-full p-6 border-b border-[#f2f2f2]'>
                        <div className='flex gap-1 text-[12px]'>
                            {selectedStation.parkingFree
                                ? <span className='badgetrue'>
                                    무료주차
                                </span>
                                : <span className='badgefalse'>
                                    유료주차
                                </span>
                            }
                            {selectedStation.limitYn
                                ? <span className='badgetrue'>
                                    개방
                                </span>
                                : <span className='badgefalse'>
                                    비개방
                                </span>
                            }
                        </div>
                        <h2 className='text-xl font-bold text-gray-800'>{selectedStation.statNm}</h2>
                        <div className='flex flex-col gap-1 mb-3'>
                            <p className='text-sm text-gray-500 flex items-center'>
                                <span className='text-gray-900 font-medium mr-4 w-15'>주소</span>
                                {selectedStation.addr}
                            </p>
                            {selectedStation.useTime !== '0시간' &&
                                <p className='text-sm text-gray-500 flex items-center'>
                                    <span className='text-gray-900 font-medium mr-4 w-15'>운영시간</span>
                                    <span className='flex items-center'>
                                        {selectedStation.useTime}
                                    </span>
                                </p>
                            }
                            <p className='text-sm text-gray-500 flex items-center'>
                                <span className='text-gray-900 font-medium mr-4 w-15'>운영기관</span>
                                <span className='flex items-center'>
                                    {selectedStation.busiNm}
                                </span>
                            </p>
                        </div>
                        {/* 충전기 현황 */}
                        {/* <div className='w-fit bg-[#f2f2f2] px-3 py-1 flex gap-3 rounded-md'>
                            {selectedStation.totalFastNum > 0 &&
                                <p className='text-[12px] font-bold'>
                                    <span className='mr-1'>급속</span>
                                    <span className='text-[#4FA969]'>{selectedStation.chargeFastNum} </span>
                                    <span className='text-[#b6b6b6]'>/ {selectedStation.totalFastNum}</span>
                                </p>
                            }
                            {selectedStation.totalMidNum > 0 &&
                                <p className='text-[12px] font-bold'>
                                    <span className='mr-1'>중속</span>
                                    <span className='text-[#4FA969]'>{selectedStation.chargeMidNum} </span>
                                    <span className='text-[#b6b6b6]'>/ {selectedStation.totalMidNum}</span>
                                </p>
                            }
                            {selectedStation.totalSlowNum > 0 &&
                                <p className='text-[12px] font-bold'>
                                    <span className='mr-1'>완속</span>
                                    <span className='text-[#4FA969]'>{selectedStation.chargeSlowNum} </span>
                                    <span className='text-[#b6b6b6]'>/ {selectedStation.totalSlowNum}</span>
                                </p>
                            }
                        </div> */}
                        {/* <div className='flex justify-center items-center gap-5'>
                            <button>
                                길찾기
                            </button> */}
                        {viewMode !== 'reserv'
                            ? <button className='flex justify-center items-center gap-2 border border-[#afafaf] text-[#666] hover:bg-[#f2f2f2] rounded py-1.5 cursor-pointer'
                                onClick={() => handleModeReserv()}>
                                <IoCalendarClearOutline size={15} className='mb-1' />
                                예약
                            </button>
                            : <button className='flex justify-center items-center gap-2 border border-[#afafaf] text-[#666] hover:bg-[#f2f2f2] rounded py-1.5 cursor-pointer'
                                onClick={() => handleModeReserv()}>
                                <FiZap size={15} className='mb-1' />
                                실시간 충전현황
                            </button>
                        }
                        {/* </div> */}
                    </header>
                    {/* 실시간 충전현황 */}
                    {viewMode !== 'reserv'
                        ? (
                            <div className='flex-1 overflow-y-auto px-6'>
                                <h4 className="font-semibold text-gray-800 mb-3">실시간 충전현황</h4>
                                <div className='grid grid-cols-1 gap-2'>
                                    {Object.entries(groupedAndSortedChargers).map(
                                        ([type, chargers]) => (
                                            <div key={type} className='mb-5'>
                                                <h5 className='font-medium text-[13px] text-[#666] mb-2 flex'>
                                                    {type.split('+').map((part, idx, arr) => (
                                                        <React.Fragment key={idx}>
                                                            <span>{part}</span>
                                                            {idx < arr.length - 1 && (
                                                                <span className='text-[#afafaf] mt-1'><LuDot /></span>
                                                            )}
                                                        </React.Fragment>
                                                    ))}
                                                </h5>
                                                <div className='grid grid-cols-1 gap-2'>
                                                    {chargers.map((charger) => {
                                                        const statusInfo = getChargerStatusInfo(charger.stat);
                                                        const isCharging = charger.stat === '3'; // '충전중'상태인지 별도로 확인
                                                        const isCanUse = charger.stat === '2'; // '충전대기'

                                                        return (
                                                            <div
                                                                key={charger.chgerId}
                                                                // onClick={()=>handleChargerReservation(charger)} //📅예약
                                                                // disabled={!statusInfo.available}                //📅예약
                                                                className={`p-3 border rounded text-left transitions-colors
                                                            ${isCanUse
                                                                        ? 'border-[#4FA969] bg-green-50 '
                                                                        : `border-gray-300 ${isCharging ? 'bg-white' : 'bg-[#f2f2f2]'}`   //📅예약
                                                                    }`}
                                                            >
                                                                <div className='flex justify-between items-center mb-2'>
                                                                    <div className='flex items-center gap-2'>
                                                                        {/* <span className={``}>{statusInfo.icon}</span> */}
                                                                        <span className={`font-bold ${isCanUse ? 'text-[#4FA969]' : 'text-[#666]'}`}>
                                                                            {statusInfo.text}
                                                                        </span>
                                                                    </div>
                                                                    <span className={`font-bold ${isCanUse ? 'text-[#4FA969]' : 'text-[#666]'}`}>{charger.chgerId}</span>
                                                                </div>
                                                                {/* <p className="text-sm text-gray-600 mb-1">
                                                            {charger.output}kW
                                                        </p> */}
                                                                <p className="text-xs text-gray-500">
                                                                    {getTimeAgo(charger.lastTsdt)}
                                                                </p>
                                                            </div>
                                                        )
                                                    })}

                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        )
                        : (
                            <div className='flex-1 overflow-y-auto px-6'>
                                <h4 className="font-semibold text-gray-800 mb-3">충전 예약하기</h4>
                                {/* <p className='text-[13px] text-gray-500'>충전기를 선택해주세요</p> */}
                                <div className='grid grid-cols-1 gap-2'>
                                    {Object.entries(groupedAndSortedChargers).map(
                                        ([type, chargers]) => (
                                            <div key={type} className='mb-5'>
                                                <h5 className='font-medium text-[13px] text-[#666] mb-2 flex'>
                                                    {type.split('+').map((part, idx, arr) => (
                                                        <React.Fragment key={idx}>
                                                            <span>{part}</span>
                                                            {idx < arr.length - 1 && (
                                                                <span className='text-[#afafaf] mt-1'><LuDot /></span>
                                                            )}
                                                        </React.Fragment>
                                                    ))}
                                                </h5>
                                                <div className='grid grid-cols-1 gap-2'>
                                                    {chargers.map((charger) => {
                                                        const statusInfo = getChargerStatusInfo(charger.stat);
                                                        const isCharging = charger.stat === '3'; // '충전중'상태인지 별도로 확인
                                                        const isCanUse = charger.stat === '2'; // '충전대기'

                                                        return (
                                                            <button
                                                                key={charger.chgerId}
                                                                onClick={() => handleChargerReservation(charger)}
                                                                disabled={!statusInfo.available}
                                                                className={`p-3 border rounded text-left transitions-colors
                                                            ${isCanUse || isCharging
                                                                        ? 'bg-white border-[#cef0d7] drop-shadow-md focus:bg-green-50 hover:bg-green-50 focus:border-[#4FA969] hover:border-[#4FA969] cursor-pointer'
                                                                        : `border-gray-300 bg-[#f2f2f2] cursor-not-allowed`  //📅예약
                                                                    }`}
                                                            >
                                                                <div className='flex justify-between items-center mb-2'>
                                                                    <div className='flex items-center gap-2'>
                                                                        {/* <span className={``}>{statusInfo.icon}</span> */}
                                                                        <span className={`font-bold ${isCanUse || isCharging ? '' : 'text-[#666]'}`}>
                                                                            {statusInfo.text}
                                                                        </span>
                                                                    </div>
                                                                    <span className={`font-bold text-[#666]`}>{charger.chgerId}</span>
                                                                </div>
                                                                <p className="text-sm text-gray-600 mb-1">
                                                                    {/* <span className='text-gray-900 font-medium mr-4 w-15'>충전용량</span> */}
                                                                    {charger.output}kW
                                                                </p>
                                                                {/* <p className="text-xs text-gray-500">
                                                            {getTimeAgo(charger.lastTsdt)}
                                                        </p> */}
                                                            </button>
                                                        )
                                                    })}

                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        )
                    }
                    {showReserv && selectedCharger && (
                        <ReservationPanel
                            charger={selectedCharger}
                            onClose={handleCloseReservation}
                            onOpenConfirm={handleOpenConfirmModal}
                            onCancel={onCancelConrirmModal}
                            onSetToastmsg={handleToastmsg}
                        />
                    )}
                </div>
            </div>
        </>
    )
}
