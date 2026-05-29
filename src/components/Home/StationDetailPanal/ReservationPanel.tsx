'use client'

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import axios from 'axios';
import { useAtom } from 'jotai';
import { accessTokenAtom } from '@/store/auth';
import { addMinutes, format, parse } from 'date-fns';
import { ko } from 'date-fns/locale';

import { ChargerInfoItem, TimeInfo } from '@/types/dto';
import { LuDot } from "react-icons/lu";
import Calender from '@/components/Calender/Calendar';
import codeToNm from '../../../db/chgerType.json'

/**
 * ReservationPanel 컴포넌트의 Props 인터페이스
 */
interface ReservationPanelProps {
    /** 예약 대상 충전기 상세 정보 */
    charger: ChargerInfoItem,
    /** 패널 닫기 콜백 함수 */
    onClose: () => void,
    /** 예약 확인 모달 오픈 콜백 함수 */
    onOpenConfirm: (msg: string, submsg: string, confirmAction: () => void) => void;
    /** 예약 확인 모달 닫기 콜백 함수 */
    onCancel: () => void;
    /** 부모 컴포넌트에 토스트 메시지를 설정하는 함수 */
    onSetToastmsg: (msg: string) => void;
}

/**
 * 특정 충전기에 대한 날짜 및 시간별 예약 기능을 제공하는 하단 패널 컴포넌트
 * 
 * 주요 기능:
 * 1. 캘린더를 이용한 예약 날짜 선택
 * 2. 오전/오후 필터링 및 시간 슬롯 선택
 * 3. 선택된 시간 슬롯의 연속성 검증 (예: 1시 선택 후 3시 선택 시 차단)
 * 4. 애니메이션 기반의 패널 노출 및 외부 클릭 시 닫기 제어
 */
export default function ReservationPanel({
    charger,
    onClose,
    onOpenConfirm,
    onCancel,
    onSetToastmsg }: ReservationPanelProps) {
    const [token] = useAtom(accessTokenAtom);
    const reservRef = useRef<HTMLDivElement>(null);

    const [selectedDate, setSelectedDate] = useState<Date | undefined>();
    const [showDatePicker, setShowDatePicker] = useState<boolean>(true);
    const [selectedTime, setSelectedTime] = useState<string[]>([]);
    const [getTimeslots, setGetTimeslots] = useState<TimeInfo[]>();
    const [timeFilter, setTimeFilter] = useState<string>('AM');
    const [isClosing, setIsClosing] = useState<boolean>(false);

    /** 모달 이벤트 리스너 (Esc 키 닫기 및 스크롤 차단) */
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (reservRef.current && !reservRef.current.contains(e.target as Node)) {
                onClose();
            }
        }
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        }

        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('keydown', handleEsc);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('keydown', handleEsc);
        }
    }, [onClose])

    // 패널 닫기 애니메이션 처리
    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
            setIsClosing(false);
        }, 300);
    };

    /**
     * date-fns 라이브러리를 활용한 날짜 포맷팅 최적화
     * @param {Date} date 포맷팅할 날짜 객체
     * @param {'kor' | 'iso'} type 포맷 형식 (한글형/ISO형)
     */
    const formatDateString = useCallback((date: Date, type: 'kor' | 'iso' = 'kor') => {
        if (type === 'kor') return format(date, 'yyyy년 MM월 dd일 (eeee)', { locale: ko });
        return format(date, 'yyyy-MM-dd');
    }, []);

    /**
     * 시작 시간 문자열을 기반으로 30분 단위 종료 시간을 계산
     * @param {string} timeString 'HH:mm' 형식의 시작 시간
     * @returns {string} 'HH:mm' 형식의 종료 시간
     */
    const getEndTime = (timeString: string): string => {
        const parsedTime = parse(timeString, 'HH:mm', new Date());
        return format(addMinutes(parsedTime, 29), 'HH:mm');
    }

    /**
     * 충전기 타입 코드를 가독성 있는 명칭으로 변환
     */
    const getChargerTypeName = (chgerCode: string) => {
        return codeToNm.find(type => chgerCode.includes(type.code))?.type || '';
    }

    /**
     * 선택된 날짜의 예약 가능 시간 슬롯 정보를 서버에서 조회 요청
     */
    const handleTimeslots = async (date: Date) => {
        setSelectedDate(date);
        setShowDatePicker(false);
        setSelectedTime([]);

        try {
            const res = await axios.post<TimeInfo[]>(`http://${process.env.NEXT_PUBLIC_BACKIP}:8080/time/timeslots`, {
                statId: charger.statId,
                chgerId: charger.chgerId,
                date: formatDateString(date, 'iso'),
            });
            setGetTimeslots(res.data);
        } catch (error) {
            console.error('handleTimeslots 에러: ', error);
            onSetToastmsg('예약 현황을 불러오지 못했습니다.');
        }
    }

    /** 오전/오후 시간대 필터링 */
    const { amTimes, pmTimes } = useMemo(() => {
        const am = getTimeslots?.filter(t => parseInt(t.startTime.slice(0, 2)) < 12);
        const pm = getTimeslots?.filter(t => parseInt(t.startTime.slice(0, 2)) >= 12);
        return { amTimes: am, pmTimes: pm };
    }, [getTimeslots])

    // 3-3. 시간버튼 렌더링
    const renderTimeButtons = (times: typeof getTimeslots) => {
        return times?.map((item) => {
            const timeStr = item.startTime.slice(0, 5);
            const isSelected = selectedTime.includes(timeStr);
            const isDisabled = !item.enabled;
            const slotClasses = `p-2 text-center rounded-md text-sm cursor-pointer transition
                                ${isDisabled && 'bg-gray-200 text-gray-400 cursor-not-allowed'}
                                ${isSelected && 'bg-[#cef0d7] text-white font-bold '}
                                ${!isDisabled && !isSelected && 'bg-gray-100 hover:bg-[#cef0d7]'} `

            return (
                <button
                    key={item.timeId}
                    disabled={isDisabled}
                    className={slotClasses}
                    onClick={() => !isDisabled && handleTimeslotChecked(timeStr, !isSelected)}
                >
                    {timeStr}
                </button>
            )
        })
    }

    /**
     * 선택된 슬롯 ID들이 중간에 끊김 없이 연속적인지 검증
     */
    const checkConsecutive = (arr: number[]) => {
        if (arr.length <= 1) return true;
        const sorted = [...arr].sort((a, b) => a - b);
        return sorted.every((val, i) => i === 0 || val === sorted[i - 1] + 1);
    }

    /**
     * 시간 슬롯 선택/해제 핸들러
     */
    const handleTimeslotChecked = (timeStr: string, isChecking: boolean) => {
        const newSelected = isChecking
            ? [...selectedTime, timeStr].sort()
            : selectedTime.filter((time) => time !== timeStr);

        const selectedTimeIds = getTimeslots
            ?.filter(slot => newSelected.includes(slot.startTime.slice(0, 5)))
            .map(slot => slot.timeId) || [];

        if (!checkConsecutive(selectedTimeIds)) {
            onSetToastmsg('연속된 시간대만 선택할 수 있습니다.');
            return;
        }
        setSelectedTime(newSelected);
    }

    /**
     * 예약 확정 전 유효성 검사 및 확인 모달 호출
     */
    const handleConfirmReservation = (chger: ChargerInfoItem) => {
        if (!selectedTime?.length) return onSetToastmsg('시간대를 선택해주세요.');
        if (!token) return onSetToastmsg('로그인이 필요한 서비스입니다.');
        if (!selectedDate) return;

        const subMsg = `
            충전소: ${chger.statNm}
            \n주소: ${chger.addr} 
            \n 충전기: ${chger.chgerId} 
            \n날짜: ${formatDateString(selectedDate, 'kor')}
            \n시간: ${selectedTime[0]}~${getEndTime(selectedTime[selectedTime.length - 1])}\n`;
        onOpenConfirm('예약 확정하시겠습니까?', subMsg, handleReservation)
    }

    /**
     * 최종 예약 API 전송
     */
    const handleReservation = async () => {
        onCancel();
        const selectedTimeIds = getTimeslots
            ?.filter(slot => selectedTime.includes(slot.startTime.slice(0, 5)))
            .map(slot => slot.timeId);

        try {
            await axios.post(`http://${process.env.NEXT_PUBLIC_BACKIP}:8080/reserve/setSlots`,
                { slotIds: selectedTimeIds },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            onSetToastmsg('예약이 완료되었습니다.');
            onClose();
        } catch (error) {
            console.error('handleReservation 에러: ', error);
            onSetToastmsg('예약처리 중 오류가 발생했습니다.')
        }
    }

    return (
        <div role='none' className='fixed inset-0 bg-black/30 rounded-lg animate-fadeIn'>
            <section
                ref={reservRef}
                role="dialog"
                aria-modal="true"
                aria-label="충전기 예약 패널"
                className={`fixed bottom-0 left-0 right-0 w-full pt-4 border-t p-5 bg-white z-20 border-[#f2f2f2] rounded-lg  
                    ${isClosing
                        ? 'transform translate-y-full opacity-0'
                        : 'transform translate-y-0 opacity-100 animate-slideInUp'
                    }`}
            >
                <header className='animate-slideInUp mb-2 space-y-2'>
                    <h2 className="text-xl font-bold text-gray-800">예약 신청</h2>
                    <dl>
                        <div className='flex items-center'>
                            <dt className='text-gray-500 font-normal mr-4 w-15 '>충전기</dt>
                            <dd className='text-gray-900 font-medium'>{charger.chgerId}</dd>
                        </div>
                        <div className='flex items-center'>
                            <dt className='text-gray-500 font-normal mr-4 w-15'>타입</dt>
                            <dd className='text-gray-900 font-medium'>
                                {getChargerTypeName(charger.chgerType).split('+').map((part, idx, arr) => (
                                    <React.Fragment key={idx}>
                                        {part}
                                        {idx < arr.length - 1 && <LuDot className="text-gray-300" />}
                                    </React.Fragment>
                                ))}
                            </dd>
                        </div>
                    </dl>
                </header>

                {/* 날짜 선택 영역 */}
                <nav
                    aria-label='날짜 변경'
                    onClick={() => setShowDatePicker(true)}
                    className=' text-gray-900 flex items-center font-medium pb-3 mb-4 cursor-pointer border-b border-[#afafaf]'
                >
                    <span className='text-gray-500 font-normal mr-4 w-15'>날짜 선택</span>
                    <span className="font-bold text-white">
                        {selectedDate ? formatDateString(selectedDate, 'kor') : '날짜를 선택하세요'}
                    </span>
                </nav>

                {showDatePicker
                    ? <div role='tablist' className='w-full flex justify-center '>
                        <Calender selectedDate={selectedDate} onSelectDate={setSelectedDate} handleTimeslots={handleTimeslots} />
                    </div>
                    : <div className="animate-fade-in">
                            {/* 오전/오후 탭 필터 (Tab List) */}
                            <div role='tablist' className='grid grid-cols-2 gap-2 mb-4'>
                                <button
                                    type="button"
                                    role="tab"
                                    aria-selected={timeFilter === 'AM'}
                                    onClick={() => setTimeFilter('AM')}
                                    className={`cursor-pointer py-2 rounded focus-none 
                                            ${timeFilter === 'AM' ? 'bg-[#cef0d7] text-white hover:bg-[#d9f3e1] font-bold border-0' : 'hover:bg-[#d9f3e1] bg-gray-100 border-[#afafaf]'}`}
                                >
                                    오전
                                </button>
                                <button
                                    onClick={() => setTimeFilter('PM')}
                                    type="button"
                                    role="tab"
                                    aria-selected={timeFilter === 'PM'}
                                    className={`cursor-pointer py-2 rounded focus-none 
                                            ${timeFilter === 'PM' ? 'bg-[#cef0d7] text-white hover:bg-[#d9f3e1] font-bold border-0' : 'hover:bg-[#d9f3e1] bg-gray-100 border-[#afafaf]'}`}
                                >
                                    오후
                                </button>
                            </div>

                            {/* 시간 슬롯 그리드 */}
                            <div className='grid grid-cols-4 gap-2'>
                                {timeFilter === 'AM' && renderTimeButtons(amTimes)}
                                {timeFilter === 'PM' && renderTimeButtons(pmTimes)}
                            </div>
                        <button
                            type="button"
                            className='w-full py-3 m-2 bg-white text-white rounded cursor-pointer'
                            onClick={() => handleConfirmReservation(charger)}
                        >
                            예약하기
                        </button>
                    </div>
                }
            </section>
        </div>
    )
}
