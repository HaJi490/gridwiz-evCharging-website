'use client'

import React, { useRef, useEffect, useState } from 'react'
import axios from 'axios';
import { useAtom } from 'jotai';
import { accessTokenAtom } from '@/store/auth';
import { addMinutes, format, parse } from 'date-fns';

import Toast from '@/components/Toast/Toast';
import ConfirmModal from '@/components/ConfirmModal/ConfirmModal';
import { ChargerInfoItem, TimeInfo } from '@/types/dto';
import { LuDot } from "react-icons/lu";
import Calender from '@/components/Calender/Calender';
import codeToNm from '../../../db/chgerType.json'

interface ReservationPanelProps {
    charger: ChargerInfoItem,
    onClose: () => void,
    // 예약모달
    onOpenConfirm: (msg: string, submsg: string, confirmAction: () => void) => void;
    onCancel: () => void;   // 예약모달 닫기
    // 토스트
    onSetToastmsg: (msg: string) => void;
}

type DateFormatTp = 'kor' | 'iso'

export default function ReservationPanel({ 
    charger, 
    onClose, 
    onOpenConfirm, 
    onCancel, 
    onSetToastmsg }: ReservationPanelProps) {
    const [token] = useAtom(accessTokenAtom);
    const reservRef = useRef<HTMLDivElement>(null);
    // const [toastMsg, setToastMsg] = useState<string>('');
    // const [confirmMsg, setConfirmMsg] = useState<string>('');
    // const [confSubMsg, setConfSubMsg] = useState<string>('');
    // const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

    const [selectedDate, setSelectedDate] = useState<Date | undefined>();
    const [showDatePicker, setShowDatePicker] = useState<boolean>(true);
    const [selectedTime, setSelectedTime] = useState<string[]>([]);
    const [getTimeslots, setGetTimeslots] = useState<TimeInfo[]>();
    const [timeFilter, setTimeFilter] = useState<string>('AM');
    const [isClosing, setIsClosing] = useState<boolean>(false);

    // 1. 외부 클릭시 닫기 (모달의 이벤트 전파 차단을 위해 capture 단계에서 처리하지 않음)
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (reservRef.current && !reservRef.current.contains(e.target as Node)) {
                onClose();
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose])

    // 패널 닫기 애니메이션 처리
    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
            setIsClosing(false);
        }, 300);
    };

    // 2. 날짜 포맷함수
    const formatDateString = (date: Date, type: DateFormatTp = 'kor') => {
        const WEEKDAY = ['일', '월', '화', '수', '목', '금', '토']
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const weekday = WEEKDAY[date.getDay()];

        if (type === 'kor') {
            return `${year}년 ${month}월 ${day}일 (${weekday})`
        }
        else if (type === 'iso') {
            return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }
        return '';
    }

    // '3:00' 과 같은 시간 문자열을 받아서 '3:29'를 반환하는 함수
    function getEndTime(timeString: string): string {
    // 1. 기준 날짜를 임의로 정하고, 시간 문자열을 Date 객체로 파싱합니다.
    //    'HH:mm'은 '23:59'와 같은 24시간 형식의 시간임을 알려줍니다.
    const date = new Date(); // 기준 날짜는 아무거나 상관없습니다.
    const parsedTime = parse(timeString, 'HH:mm', date);

    // 2. 파싱된 시간에 29분을 더합니다.
    const timeWith29Minutes = addMinutes(parsedTime, 29);

    // 3. 29분이 더해진 Date 객체를 다시 'HH:mm' 형식의 문자열로 변환합니다.
    return format(timeWith29Minutes, 'HH:mm');
    }

    // 충전기 타입 변환
    const typeCodeToNm = (chgerCode: string) => {
        const match = codeToNm.find(type => chgerCode.includes(type.code));
        return match?.type || '';
    }

    // 3. 예약현황 가져오기
    const handleTimeslots = async (date: Date) => {
        setSelectedDate(date);
        setShowDatePicker(false);

        const requestBody = {
            statId: charger.statId,
            chgerId: charger.chgerId,
            date: formatDateString(date, 'iso'),
        }

        try {
            const res = await axios.post<TimeInfo[]>(`http://${process.env.NEXT_PUBLIC_BACKIP}:8080/time/timeslots`,
                requestBody
            )
            setGetTimeslots(res.data);
        } catch (error) {
            console.error('handleTimeslots 에러: ', error);
        }
    }

    // 3-2. 시간대별 필터링
    const amTimes = getTimeslots?.filter(item => {
        const hour = parseInt(item.startTime.slice(0, 2));
        return hour < 12;
    })

    const pmTimes = getTimeslots?.filter(item => {
        const hour = parseInt(item.startTime.slice(0, 2));
        return hour >= 12;
    })

    // 3-3. 시간버튼 렌더링
    const renderTimeButtons = (times: typeof getTimeslots) => {
        return times?.map((item) => {
            const timeStr = item.startTime.slice(0, 5);
            const isSelected = selectedTime.includes(timeStr);
            const isDisabled = !item.enabled;
            const slotClasses = `p-2 text-center rounded-md text-sm cursor-pointer transition
                                ${isDisabled && 'bg-gray-200 text-gray-400 cursor-not-allowed'}
                                ${isSelected && 'bg-[#cef0d7] text-[#4FA969] font-bold '}
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

    // 4. 연속성 검사
    const isConsecutive = (arr: number[]) => {
        if (arr.length <= 1) return true;
        const sorted = [...arr].sort((a, b) => a - b);
        for (let i = 1; i < sorted.length; i++) {
            if (sorted[i] !== sorted[i - 1] + 1) {
                return false;
            }
        }
        return true;
    }

    // 4-2. 시간선택 핸들러
    const handleTimeslotChecked = (value: string, checked: boolean) => {
        const newSelected = checked
            ? [...selectedTime, value]
            : selectedTime.filter((time) => time !== value);

        const selectedTimeIds = getTimeslots?.filter(slot =>
            newSelected.includes(slot.startTime.slice(0, 5))
        ).map(slot => slot.timeId);

        if (!isConsecutive(selectedTimeIds || [])) {
            onSetToastmsg('연속된 시간대만 선택할 수 있습니다.');
            return;
        }
        setSelectedTime(newSelected);
    }

    // 5. 예약 확인
    const handleConfirmReservation = (chger: ChargerInfoItem) => {
        if (!selectedTime?.length) {
            onSetToastmsg('시간대를 선택해주세요.');
            return;
        }

        if (!token) {    // 아래에 알림으로 띄워주기 --  FIXME
            onSetToastmsg('로그인이 필요한 서비스입니다.');
            return;
        }
        
        const lastTime = selectedTime[selectedTime.length-1];
        const msg = '예약 확정하시겠습니까?';
        const subMsg = `충전소: ${chger.statNm}\n주소: ${chger.addr} \n 충전기: ${chger.chgerId} \n날짜: ${formatDateString(selectedDate, 'kor')}\n시간: ${selectedTime[0]}~${getEndTime(lastTime)}\n`;
        onOpenConfirm(msg, subMsg, handleReservation)
    }

    // 6. 예약 확정
    const handleReservation = async () => {
        onCancel()
        console.log('▶▶▶▶▶▶▶▶▶▶예약확정 콘솔')
        const selectedTimeIds = getTimeslots?.filter(slot =>
            selectedTime.includes(slot.startTime.slice(0, 5))
        ).map(slot => slot.timeId);

        try {
            const res = await axios.post(
                `http://${process.env.NEXT_PUBLIC_BACKIP}:8080/reserve/setSlots`,
                { slotIds: selectedTimeIds },
                { headers: { Authorization: `Bearer ${token}` } }
            )
            onSetToastmsg('예약이 완료되었습니다.')
        } catch (error) {
            console.log('handleReservation 에러: ', error);
            onSetToastmsg('예약에 실패하였습니다.')
        }
    }

    return (
        <div className='fixed inset-0 bg-black/30 rounded-lg animate-fadeIn'>
        <div
            ref={reservRef}
            className={`w-full pt-4 border-t fixed bottom-0 left-0 right-0 p-5 bg-white z-20 border-[#f2f2f2] rounded-lg  ${
                    isClosing 
                        ? 'transform translate-y-full opacity-0' 
                        : 'transform translate-y-0 opacity-100 animate-slideInUp'
                }`}
        >
            {/* <Toast message={toastMsg} setMessage={setToastMsg} /> */}
            {/* {showConfirmModal &&
                <ConfirmModal message={confirmMsg} submsg={confSubMsg} onConfirm={() => handleReservation()} onCancel={() => setShowConfirmModal(false)} />
            } */}
            <div className='animate-slideInUp'>
                <p className=' text-gray-900 flex items-center font-medium'>
                    <span className='text-gray-500 font-normal mr-4 w-15 '>충전기</span>
                    {charger.chgerId}
                </p>
                <p className=' text-gray-900 flex items-center font-medium'>
                    <span className='text-gray-500 font-normal mr-4 w-15'>타입</span>
                    {typeCodeToNm(charger.chgerType).split('+').map((part, idx, arr) => (
                        <React.Fragment key={idx}>
                            <span>{part}</span>
                            {idx < arr.length - 1 && (
                                <span className='text-[#afafaf]'><LuDot /></span>
                            )}
                        </React.Fragment>
                    ))}
                </p>
            </div>
            <div className=' text-gray-900 flex items-center font-medium pb-3 mb-4 cursor-pointer border-b border-[#afafaf] ' onClick={() => setShowDatePicker(true)}>
                <span className='text-gray-500 font-normal mr-4 w-15'>날짜</span>
                {selectedDate ? formatDateString(selectedDate, 'kor') : '날짜 선택'}
            </div>
            {showDatePicker
                ? 
                <div className='w-full flex justify-center '>
                <Calender selectedDate={selectedDate} onSelectDate={setSelectedDate} handleTimeslots={handleTimeslots} />
                </div>
                : (
                    <>
                        <div className='mb-3'>
                            <div className='grid grid-cols-2 gap-2 mb-4'>
                                <button
                                    className={`cursor-pointer py-2 rounded focus-none 
                                            ${timeFilter === 'AM' ? 'bg-[#cef0d7] text-[#4FA969] hover:bg-[#d9f3e1] font-bold border-0' : 'hover:bg-[#d9f3e1] bg-gray-100 border-[#afafaf]'}`}
                                    onClick={() => setTimeFilter('AM')}
                                >
                                    오전
                                </button>
                                <button
                                    className={`cursor-pointer py-2 rounded focus-none 
                                            ${timeFilter === 'PM' ? 'bg-[#cef0d7] text-[#4FA969] hover:bg-[#d9f3e1] font-bold border-0' : 'hover:bg-[#d9f3e1] bg-gray-100 border-[#afafaf]'}`}
                                    onClick={() => setTimeFilter('PM')}
                                >
                                    오후
                                </button>
                            </div>
                            <div className='grid grid-cols-4 gap-2'>
                                {timeFilter === 'AM' && renderTimeButtons(amTimes)}
                                {timeFilter === 'PM' && renderTimeButtons(pmTimes)}
                            </div>
                        </div>
                        <button
                            className='w-full py-3 m-2 bg-[#4FA969] text-white rounded cursor-pointer'
                            onClick={()=>handleConfirmReservation(charger)}
                        >
                            예약하기
                        </button>
                    </>
                )
            }
        </div>
        </div>
    )
}
