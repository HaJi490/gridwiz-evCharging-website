'use client'

import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import axios from 'axios';
import { useAtom } from 'jotai';
import { useRouter } from 'next/navigation';

import LottieLoading from '@/components/LottieLoading';
import Toast from '@/components/Toast/Toast';
import ConfirmModal from '@/components/ConfirmModal/ConfirmModal';
import Calender from '@/components/Calender/Calendar';
import { MyReservationDto, Reservation, TimeInfo } from '@/types/dto';
import { IoCalendarClearOutline } from "react-icons/io5";

// Icons
import { accessTokenAtom } from '@/store/auth';


// 새로 선택한 슬롯 정보
interface SelectionSlot {
  timeId: number;
  startTime: string;
  endTime: string;
}

/**
 * 내 예약 관리 페이지
 * 사용자의 예약 내역 조회, 취소, 수정 기능을 제공합니다.
 * REST API 응답 구조를 활용하며, 다양한 예약 상태를 관리합니다.
 */
export default function page() {
  const [token] = useAtom(accessTokenAtom);
  const [authChecked, setAuthChecked] = useState(false);
  const route = useRouter();

  const [myReserv, setMyReserv] = useState<MyReservationDto>();
  const [viewMode, setViewMode] = useState<'예약완료' | '예약취소'>('예약완료');

  // 예약 수정 패널 상태
  const [showEditPanel, setShowEditPanel] = useState<boolean>(false);
  const [reservationToEdit, setReservationToEdit] = useState<Reservation | null>(null);
  const [availableTimeslots, setAvailableTimeslots] = useState<TimeInfo[]>();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [currentSelection, setCurrentSelection] = useState<SelectionSlot[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  // Toast 및 Confirm Modal 상태
  const [toastMsg, setToastMsg] = useState<string>('');
  const [confirmMsg, setConfirmMsg] = useState<string>('');
  const [cofirmSubmsg, setConfirmSubmsg] = useState<string>('');
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [reserveIdsToCancel, setReserveIdsToCancel] = useState<number | null>();



  /**
   * 사용자 예약 정보 요청
   */
  const getMyReservation = useCallback(async () => {
    try {
      if (!token) return;

      const res = await axios.get(`http://${process.env.NEXT_PUBLIC_BACKIP}:8080/reserve/getSlots`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setMyReserv(res.data);
    } catch (error) {
      console.error('getMyReservation 에러: ', error)
    }
  }, [token]);

  /**
   * 인증 상태 확인 및 초기 데이터 로딩
   */
  useEffect(() => {
    if (token === null) {
      setAuthChecked(true);
    } else if (token) {
      getMyReservation();
      setAuthChecked(true);
    }
  }, [token, getMyReservation]);


  /**
   * myReserv 데이터 변경 시, viewMode에 따라 예약을 그룹화하고 필터링
   */
  const filteredReservations = useMemo(() => {
    if (!myReserv || !Array.isArray(myReserv)) return {};

    const grouped = myReserv.reduce((acc, reservation) => {
      const date = reservation.slot[0]?.date;

      if (!date || reservation.reseverState !== viewMode) { return acc; }
      if (!acc[date]) { acc[date] = []; }

      acc[date].push(reservation);
      return acc;
    }, {} as Record<string, Reservation[]>);

    return grouped;
  }, [myReserv, viewMode]);



  /**
   * 예약 취소 확인 모달 오픈
   * @param reserveId 취소할 예약의 ID
   */
  const handleConfirmModal = (reserveId: number) => {
    setShowConfirmModal(true);
    setReserveIdsToCancel(reserveId);
    setConfirmMsg('예약을 취소하시겠습니까?');
    setConfirmSubmsg('선택한 내용은 복구할 수 없습니다.')
  }

  /**
   * 실제 예약 취소 API 호출 및 후처리
   */
  const handleCancelReserv = async () => {
    try {
      if (!token || !reserveIdsToCancel) return;

      setShowConfirmModal(false);
      const res = await axios.post(`http://${process.env.NEXT_PUBLIC_BACKIP}:8080/reserve/setslotsCancel`,
        { reseIds: [reserveIdsToCancel] },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.status === 200) setToastMsg('예약이 취소되었습니다.');

    } catch (error) {
      console.error('handleCancelReserv 에러: ', error)
      setToastMsg('예약취소가 실패하였습니다. 다시 시도해주세요.')
    } finally {
      setReserveIdsToCancel(null);
      await getMyReservation();
    }
  }

  /**
   * 선택한 날짜의 예약 가능 시간 슬롯 요청
   * @param reservEditMode 현재 수정 중인 예약 정보 (날짜, 충전소 ID 등 필요)
   */
  const fetchTimeslotsForEdit = useCallback(async (reserv: Reservation) => {
    const firstSlot = reserv.slot[0];
    if (!firstSlot) return;

    try {
      const res = await axios.post<TimeInfo[]>(`http://${process.env.NEXT_PUBLIC_BACKIP}:8080/time/timeslots`, {
        statId: firstSlot.charger.storeInfo.statId,
        chgerId: firstSlot.charger.chargerId.chgerId,
        date: firstSlot.date,
      });
      setAvailableTimeslots(res.data);

      // 원래 예약되었던 슬롯들을 현재 선택 상태로 설정
      if (reserv) {
        const initialSelection = reserv.slot
          .map(slot => ({
            timeId: slot.timeId,
            startTime: slot.startTime,
            endTime: slot.endTime,
          }));
        setCurrentSelection(initialSelection);
      }
    } catch (error) {
      console.error('fetchTimeslotsForEdit 에러: ', error);
      setToastMsg('예약현황을 불러오는데 실패했습니다.')
    }
  }, []);

  useEffect(() => {
    if (reservationToEdit) {
      fetchTimeslotsForEdit(reservationToEdit);
    }
  }, [reservationToEdit])

  /**
   * 예약 수정 패널을 열고, 초기 데이터 로딩을 트리거
   * @param reservation 수정할 예약 정보
   */
  const handleOpenEditPanel = (reservation: Reservation) => {
    setShowEditPanel(true);
    setReservationToEdit(reservation);
    setSelectedDate(new Date(reservation.slot[0].date));
    fetchTimeslotsForEdit(reservation);
  }

  /**
   * 캘린더에서 날짜가 변경 시 해당 날짜의 시간 슬롯 정보를 새로 요청
   * @param date 새로 선택된 날짜
   */
  const handleDateChange = async (date: Date) => {
    if (!reservationToEdit) return;
    setSelectedDate(date);

    const formattedDate = date.getFullYear() + '-' +
      String(date.getMonth() + 1).padStart(2, '0') + '-' +
      String(date.getDate()).padStart(2, '0');
    const originalDate = reservationToEdit.slot[0].date;

    // 날짜가 변경되었을 경우에만 API 호출, 같은 날짜면 기존 슬롯 그대로 사용
    if (formattedDate === originalDate) {
      fetchTimeslotsForEdit(reservationToEdit);
    } else {
      try {
        const res = await axios.post<TimeInfo[]>(`http://${process.env.NEXT_PUBLIC_BACKIP}:8080/time/timeslots`, {
          statId: reservationToEdit.slot[0].charger.storeInfo.statId,
          chgerId: reservationToEdit.slot[0].charger.chargerId.chgerId,
          date: formattedDate,
        });
        setAvailableTimeslots(res.data);
        setCurrentSelection([]); // 다른 날짜 선택시 기존 선택 해제
      } catch (error) {
        console.error('handleDateChange 에러: ', error);
        setToastMsg('예약현황을 불러오는데 실패했습니다.')
      }
    }
  }

  /**
   * 선택된 시간 슬롯들의 연속성 여부를 검증
   * @param timeIds 검증할 시간 ID 배열
   * @returns 연속성이면 true, 아니면 false
   */
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

  /**
   * 시간 슬롯 선택/해제 핸들러 (연속성 검증을 포함)
   * @param slot 선택/해제할 시간 슬롯 정보
   */
  const handleToggleSlot = (slot: TimeInfo) => {
    const isAlreadySelected = currentSelection.some(s => s.timeId === slot.timeId);
    let potentialSelection: SelectionSlot[];

    if (isAlreadySelected) {
      potentialSelection = currentSelection.filter(s => s.timeId !== slot.timeId);
    } else {
      // 선택 시, 이미 예약된 슬롯이거나 비활성화된 슬롯이라면 (단, 원래 예약이었던 슬롯은 선택 가능)
      const isMyOriginalSlot = reservationToEdit?.slot.some(s => s.timeId === slot.timeId);
      if (!slot.enabled && !isMyOriginalSlot) {
        setToastMsg('이미 예약되었거나 비활성화된 시간입니다.');
        return;
      }
      potentialSelection = [...currentSelection, { timeId: slot.timeId, startTime: slot.startTime, endTime: slot.endTime }];
    }

    const potentialTimeIds = potentialSelection.map(s => s.timeId);
    if (isConsecutive(potentialTimeIds)) {
      setCurrentSelection(potentialSelection.sort((a, b) => a.timeId - b.timeId));
    } else {
      setToastMsg('연속된 시간대만 선택할 수 있습니다.');
    }
  };

  /**
   * 예약 변경 확정 로직
   * 기존 예약 취소 및 새로운 시간 슬롯 예약 요청
   */
  const handleUpdateReservation = async () => {
    if (!reservationToEdit) return;

    const originalTimeIds = reservationToEdit.slot.map(s => s.timeId).sort().join(',');
    const newTimeIds = currentSelection.map(s => s.timeId).sort().join(',');

    // 변경된 내용이 없을 경우
    if (originalTimeIds === newTimeIds) {
      setToastMsg("변경된 내용이 없습니다.");
      return;
    }

    // 예약 변경
    try {
      await axios.patch(`http://${process.env.NEXT_PUBLIC_BACKIP}:8080/reserve/update`,
        {
          slotIds: currentSelection.map(s => s.timeId),  // 신규 예약
          reseIds: [reservationToEdit.reserveId],       // 기존 예약 취소
        },
        { headers: { Authorization: `Bearer ${token}` } });

      setToastMsg('예약이 성공적으로 변경되었습니다.');
      setShowEditPanel(false);
      await getMyReservation();// 변경 후 목록 새로고침

    } catch (error) {
      console.error('[예약변경 실패]handleUpdateReservation 에러 : ', error);
      setToastMsg('예약 변경 중 오류가 발생했습니다.');
      await getMyReservation();
    }
  }

  // 예약 수정 패널 열릴 시 스크롤 막기/해제
  useEffect(() => {
    document.body.style.overflow = showEditPanel ? 'hidden' : 'unset';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showEditPanel]);

  // 예약 수정 패널 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setShowEditPanel(false);
        setReservationToEdit(null); // 패널 닫을 때 초기화
      }
    };
    if (showEditPanel) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEditPanel]);



  // 인증이 완료되지 않았다면 로딩 표시
  if (!authChecked) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LottieLoading />
      </div>
    );
  }

  // 비로그인 상태라면 로그인 페이지 안내
  if (!token) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <p className="text-xl font-semibold text-gray-700">로그인이 필요한 페이지입니다.</p>
          <p className="text-gray-500 mt-2">로그인 후 내 예약 내역을 확인해 보세요.</p>
          <button onClick={() => route.push('/login')} className="mt-4 px-4 py-2 bg-[#4FA969] text-white rounded-md cursor-pointer">로그인 하러 가기</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={'mainContainer w-full bg-[#F7F9FA] flex justify-center items-start p-4 md:p-8'}>
        <Toast message={toastMsg} setMessage={setToastMsg} />
        {showConfirmModal &&
          <ConfirmModal message={confirmMsg} submsg={cofirmSubmsg} onConfirm={() => handleCancelReserv()} onCancel={() => setShowConfirmModal(false)} />
        }
        <div className={`w-full  ${showEditPanel ? 'px-10 pl-50' : 'max-w-[1300px]'}`}>

          {/* 예약 목록 섹션 */}
          <div className={`w-full transition-all duration-500 ${showEditPanel ? 'pr-[30rem]' : 'pr-0'}`}>
            <div className='flex-1 flex flex-col'>
              <header className="flex p-4 gap-2">
                <button
                  onClick={() => setViewMode('예약완료')}
                  className={`px-4 py-2 text-sm font-semibold rounded-full transition cursor-pointer ${viewMode === '예약완료'
                    ? 'bg-green-600 text-white shadow'
                    : 'bg-white text-gray-700 border'
                    }`}
                >
                  예약 완료
                </button>
                <button
                  onClick={() => setViewMode('예약취소')}
                  className={`px-4 py-2 text-sm font-semibold rounded-full transition cursor-pointer ${viewMode === '예약취소'
                    ? 'bg-green-600 text-white shadow'
                    : 'bg-white text-gray-700 border'
                    }`}
                >
                  취소한 예약
                </button>
              </header>

              {/* 예약 카드 UI */}
              {filteredReservations && Object.entries(filteredReservations).map(([date, reservationList]) => {
                {
                  Object.keys(filteredReservations).length === 0 && (
                    <p className="text-center text-gray-400 mt-20">예약 내역이 없습니다.</p>
                  )
                }

                return (
                  <React.Fragment key={date}>
                    <h3 className='mb-3 mt-4 font-medium text-lg text-gray-400'>{date}</h3>
                    {(reservationList as Reservation[]).map((r) => {
                      const firstSlot = r.slot[0];
                      const lastSlot = r.slot[r.slot.length - 1];
                      const chargerInfo = firstSlot.charger;
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const reservationDate = new Date(date);
                      const isPast = reservationDate < today;
                      const isCanceled = viewMode === '예약취소';

                      return (
                        <div key={r.reserveId} className={`relative group flex ${!isPast && !isCanceled ? 'bg-white border-green-500' : 'bg-gray-300 border-gray-500'} border-l-4  rounded-lg shadow-md mb-4 p-5 w-full cursor-pointer transition hover:shadow-lg`}>

                          <div className='flex flex-col items-center justify-center pr-5 mr-5 border-r border-gray-200'>
                            <p className='text-lg font-semibold text-gray-800'>{firstSlot.startTime.slice(0, 5)}</p>
                            <p className='text-sm text-gray-400'>~{lastSlot.endTime.slice(0, 5)}</p>
                          </div>

                          <div className='flex-1 flex flex-col gap-3'>

                            <div className='flex justify-between items-start'>
                              <h3 className='text-xl font-bold text-gray-800'>{chargerInfo.storeInfo.statNm}</h3>
                            </div>

                            <div className='flex flex-col gap-2'>
                              <p className='text-sm text-gray-500 flex items-center'>
                                <span className='text-gray-900 font-medium mr-4 w-12'>주소</span>
                                {chargerInfo.storeInfo.addr}
                              </p>
                              <p className='text-sm text-gray-500 flex items-center'>
                                <span className='text-gray-900 font-medium mr-4 w-12'>타입</span>
                                <span className='flex items-center'>
                                  {chargerInfo.storeInfo.enabledCharger.join(', ')}
                                </span>
                              </p>
                            </div>

                            <div className='flex justify-end items-center mt-2'>
                              <div className='flex items-center gap-3 text-gray-400 cursor-pointer'>
                                <button onClick={() => handleOpenEditPanel(r)} className='inline-flex items-center justify-center cursor-pointer p-2 rounded-full hover:bg-gray-100 transition'>
                                  <IoCalendarClearOutline size={20} className="cursor-pointer hover:text-gray-600 transition" />
                                </button>
                                <button onClick={() => handleConfirmModal(r.reserveId)}
                                  className='cursor-pointer px-4 py-1.5 border border-gray-200 rounded-full text-gray-500 text-xs font-semibold hover:bg-gray-100 hover:text-gray-800 transition'>
                                  예약 취소
                                </button>
                              </div>
                            </div>

                            {isPast && !isCanceled && (
                              <div className="absolute inset-0 bg-black/20 bg-opacity-10 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <button
                                  onClick={() => handleConfirmModal(r.reserveId)}
                                  className="px-4 py-2 bg-[#232323] text-gray-200 text-sm font-semibold rounded-full shadow-lg cursor-pointer"
                                >
                                  기록 삭제
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* 예약 수정 패널 */}
          {showEditPanel && reservationToEdit &&
            <div ref={panelRef}
              className={`fixed top-20 right-0 h-[calc(100vh-80px)] w-[30rem] bg-white shadow-xl z-50 p-6
                transition-transform duration-500 ease-in-out 
                ${showEditPanel ? 'translate-x-0' : 'translate-x-full invisible pointer-events-none'}`} >
              <div className=' h-full overflow-y-auto'>
                <div className='p-6'>
                  <h3 className='text-xl font-bold mb-1'>예약 수정하기</h3>
                  <p className='text-gray-500 mb-4'>
                    {selectedDate?.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
                  </p>
                  <Calender selectedDate={selectedDate} onSelectDate={setSelectedDate} handleTimeslots={handleDateChange} />
                  <hr className='my-6' />

                  <h4 className='text-lg font-semibold mb-3'>시간 선택</h4>
                  <div className='grid grid-cols-4 gap-2'>
                    {!reservationToEdit
                      ? '로딩중...'
                      : availableTimeslots?.map((slot) => {
                        const isSelected = currentSelection.some(s => s.timeId === slot.timeId);
                        const isMyOriginalSlot = reservationToEdit?.slot?.some(s => s.timeId === slot.timeId);
                        const slotClasses = `p-2 text-center rounded-md text-sm cursor-pointer transition 
                                        ${!slot.enabled && !isMyOriginalSlot ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : ''} 
                                        ${(slot.enabled || isMyOriginalSlot) && !isSelected ? 'bg-gray-100 hover:bg-blue-100' : ''} 
                                        ${isSelected ? 'bg-blue-500 text-white font-bold ring-2 ring-blue-300' : ''}`;

                        return (
                          <div key={slot.timeId} className={slotClasses} onClick={() => handleToggleSlot(slot)}>
                            {slot.startTime.slice(0, 5)}
                          </div>
                        );
                      })}
                  </div>
                  {currentSelection.length > 0 && (
                    <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                      <h5 className="font-bold">변경될 예약 정보</h5>
                      <div className='text-sm mt-2'>
                        <p>기존: <span className="font-mono">{reservationToEdit.slot[0].startTime.slice(0, 5)} ~ {reservationToEdit.slot[reservationToEdit.slot.length - 1].endTime.slice(0, 5)}</span></p>
                        <p>변경: <span className="font-mono">{currentSelection[0].startTime.slice(0, 5)} ~ {currentSelection[currentSelection.length - 1].endTime.slice(0, 5)}</span></p>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <button onClick={() => setShowEditPanel(false)} className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-md text-sm">창 닫기</button>
                        <button onClick={handleUpdateReservation} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md text-sm font-semibold">변경 확정</button>
                      </div>
                    </div>
                  )}
                  {currentSelection.length === 0 && (
                    <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                      <p className="text-center text-gray-500">모든 예약을 취소하려면 아래 버튼을 눌러주세요.</p>
                      <button onClick={handleUpdateReservation} className="w-full mt-2 px-4 py-2 bg-red-600 text-white rounded-md text-sm font-semibold">모든 시간 취소</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          }
        </div>
      </div>
    </>
  )
}

