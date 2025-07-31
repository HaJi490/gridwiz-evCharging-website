'use client'

import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import axios from 'axios';
import { useAtom } from 'jotai';
import { useRouter } from 'next/navigation';

import LottieLoading from '@/components/LottieLoading';
import Toast from '@/components/Toast/Toast';
import ConfirmModal from '@/components/ConfirmModal/ConfirmModal';
import Calender from '@/components/Calender/Calender';
import { MyReservationDto, Charger, Reservation, Slot, TimeInfo } from '@/types/dto';
import chgerCodeNm from '../../db/chgerType.json';
import { LuDot } from "react-icons/lu";
import { IoCalendarClearOutline } from "react-icons/io5";
import { FiMapPin } from "react-icons/fi";
import { accessTokenAtom } from '@/store/auth';
import { TbWashDryP } from 'react-icons/tb';

// 기존 Reservation + key
// interface MergedReservation {
//   key: string; // React 렌더링을 위한 고유 키
//   startTime: string;
//   endTime: string;
//   charger: Charger; 
//   date: string;
//   timeIds: number[];
//   reserveId: number[];
// }

// 새로 선택한 슬롯 정보
interface SelectionSlot {
  timeId: number;
  startTime: string;
  endTime: string;
}

export default function page() {
  const [token] = useAtom(accessTokenAtom);
  const [authChecked, setAuthChecked ] = useState(false); //인증 상태 확인 추적
  const route = useRouter();
  
  const [myReserv, setMyReserv] = useState<MyReservationDto>();
  const [viewMode, setViewMode] = useState<'예약완료' | '예약취소'>('예약완료');

  const [toastMsg, setToastMsg] = useState<string>('');
  const [confirmMsg, setConfirmMsg] = useState<string>('');
  const [cofirmSubmsg, setConfirmSubmsg] = useState<string>('');
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [reserveIdsToCancel, setReserveIdsToCancel] = useState<number | null>();

  // ❗예약 수정을 위한 상태
  const [showEditPanel, setShowEditPanel] = useState<boolean>(false);
  const [reservationToEdit, setReservationToEdit] = useState<Reservation | null>(null);
  const [availableTimeslots, setAvailableTimeslots] = useState<TimeInfo[]>();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();             
  const [currentSelection, setCurrentSelection] = useState<SelectionSlot[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  // const [selectedTimeIds, setSelectedTimeIds] = useState<number[]>();
  // const [getTimeslots, setGetTimeslots] = useState<TimeInfo[]>();



  // 1. 예약정보 가져오기
  const getMyReservation = useCallback(async () => {
    try {
      if (!token) {
        console.warn('토큰 없음');
        return;
      }
      const res = await axios.get(`http://${process.env.NEXT_PUBLIC_BACKIP}:8080/reserve/getSlots`,
        {headers: {Authorization: `Bearer ${token}`}}
      )
      setMyReserv(res.data);
      console.log(res.data);
    } catch (error) {
      console.log('getMyReservation 에러: ', error)
    }
  }, [token]);

  // useEffect(() => {
  //   getMyReservation();
  // }, [getMyReservation])

  // ✨ 1. 로그인 상태를 먼저 확인하고, 로그인 되어있을 때만 데이터를 가져오는 useEffect
  useEffect(() => {
    if (token === null) { // jotai-persist는 로딩 중일 때 undefined일 수 있으므로 null을 명시적으로 확인
      setAuthChecked(true); // 로딩이 끝났고, 비로그인 상태임을 확인
    } else if (token) {
      getMyReservation();
      setAuthChecked(true); // 로딩이 끝났고, 로그인 상태임을 확인
    }
  }, [token, getMyReservation]);

  // 2. useMemo를 사용해 myReserv 데이터가 바뀔 때만 필터링
  const filteredReservations = useMemo(() => {
    console.log('useMemo 실행: 새로운 그룹핑 시작');

    // myReserv가 아직 없거나 배열이 아니면 빈 객체 반환
    if (!myReserv || !Array.isArray(myReserv)) {
      return {};
    }

    // Array.reduce를 사용하여 배열을 날짜별 그룹 객체로 변환
    const grouped = myReserv.reduce((acc, reservation) => {
      // 2-1. 현재 예약한 날짜(첫번째 슬롯기준)
      const date = reservation.slot[0]?.date;

      // 날짜 정보가 없거나, viewMode와 상태가 다르면 건너뜀
      if (!date || reservation.reseverState !== viewMode) {
        return acc;
      }

      // 2-2. 누적 객체(acc)에 해당 날짜의 키가 없으면, 빈배열로 초기화
      if (!acc[date]) {
        acc[date] = [];
      }

      // 2-3. 해당 날짜의 배열에 현재 에약 객체를 추가
      acc[date].push(reservation);

      // 2-4. 다음 순회를 위해 수정된 누적객체를 반환
      return acc;
    }, {} as Record<string, Reservation[]>); //초기값은 빈객체 {}

    console.log('재배열된 새로운 데이터: ', grouped);
    return grouped;

    // const newFilteredData: Record<string, Reservation[]> = {};
    // if (!myReserv) return newFilteredData;

    // for (const date in myReserv) {
    //   const filteredList = myReserv[date].filter(
    //     (reservation) => reservation.reseverState === viewMode);
    //   if (filteredList.length > 0) {
    //     newFilteredData[date] = filteredList;
    //   }
    // }

    // console.log('필터링된 데이터: ', newFilteredData);
    // return newFilteredData;
  }, [myReserv, viewMode]);


  // 3. 예약취소 함수들
  const handleConfirmModal = (reserveId: number) => { 
    setShowConfirmModal(true);
    setReserveIdsToCancel(reserveId);  
    setConfirmMsg('예약을 취소하시겠습니까?');
    setConfirmSubmsg('선택한 내용은 복구할 수 없습니다.')
  }

  // 예약취소 alert - 확인🍕
  const handleCancelReserv = async () => {
    try {
      if (!token || !reserveIdsToCancel) { 
        console.warn('토큰이 없거나 취소할 reservId없음');
        return;
      }

      setShowConfirmModal(false);
      console.log(reserveIdsToCancel)
      // alert('예약을 취소하시겠습니까/')
      const res = await axios.post(`http://${process.env.NEXT_PUBLIC_BACKIP}:8080/reserve/setslotsCancel`,
        { reseIds: [reserveIdsToCancel] }, 
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )
      if (res.status === 200) setToastMsg('예약이 취소되었습니다.');

    } catch (error) {
      console.log('handleCancelReserv 에러: ', error)
      setToastMsg('예약취소가 실패하였습니다. 다시 시도해주세요.') 
    } finally {
      setReserveIdsToCancel(null);
      await getMyReservation();
    }
  }

  // 4. 예약수정 함수들

  // 4-1. 특정날짜의 타임슬롯 정보 가져오기
  const fetchTimeslotsForEdit = useCallback(async (reserv: Reservation) => { //📍
    const firstSlot = reserv.slot[0];
    if (!firstSlot) return;

    console.log('타임슬롯요청: ', {
      statId: firstSlot.charger.storeInfo.statId,
      chgerId: firstSlot.charger.chargerId.chgerId,
      date: firstSlot.date,
    })


    try {
      const res = await axios.post<TimeInfo[]>(`http://${process.env.NEXT_PUBLIC_BACKIP}:8080/time/timeslots`, {
        statId: firstSlot.charger.storeInfo.statId,
        chgerId: firstSlot.charger.chargerId.chgerId,
        date: firstSlot.date,
      });
      setAvailableTimeslots(res.data);
      // console.log('받은타임슬롯: ', res.data);

      // 날짜를 비교하여 '원래 예약날짜'일 경우에만 초기 선택 상태 설정
      // const originalReservDateString = reservationToEdit ? new Date(reservationToEdit.slot[0].date).toISOString().split('T')[0] : null;
      console.log("응답 : "+res.data)
      if(reserv){ // 첫번째에 정보안나오고 두번째에 정보나오는걸 해결하기위해서 - reservationToEdit (x)
        const initialSelection = reserv.slot
          .map(slot => ({
            timeId: slot.timeId,
            startTime: slot.startTime,
            endTime: slot.endTime,
          }));
        setCurrentSelection(initialSelection);
      } 
      // else {
      //   // 조회한 날짜가 다른날짜면 선택상태 비움
      //   setCurrentSelection([]);
      // }
    } catch (error) {
      console.error('fetchTimeslotsForEdit 에러: ', error);
      setToastMsg('예약현황을 불러오는데 실패했습니다.')
    }
  }, []);

  // 11. fetchTimeslotsForEdit변경 되었을때 호출 -첫번째에 정보안나오고 두번째에 정보나오는걸 해결하기위해서
  useEffect(()=>{
    if(reservationToEdit){
      fetchTimeslotsForEdit(reservationToEdit);
    }
  }, [reservationToEdit])

  // 4-2. 수정패널 열기
  const handleOpenEditPanel = (reservation: Reservation) => {
    setShowEditPanel(true);
    setReservationToEdit(reservation); 
    setSelectedDate(new Date(reservation.slot[0].date)); // 패널에 표시할 날짜 설정
    fetchTimeslotsForEdit(reservation); 
  }

  // 4-3. 캘린더에서 날짜 변경시
  const handleDateChange = async(date: Date) => {
    if (!reservationToEdit) return;
    // 선택된 날짜 업데이트
    setSelectedDate(date);

    // 2. 'YYYY-MM-DD' 형식으로 변환합니다.
    const formattedDate = date.getFullYear() + '-' +
                      String(date.getMonth() + 1).padStart(2, '0') + '-' +
                      String(date.getDate()).padStart(2, '0');
    const originalDate = reservationToEdit.slot[0].date;

    console.log('formattedDate: ', formattedDate);
    console.log('originalDate: ', originalDate);

    // formattedDate가 내 예약 날짜면 fetchTimeslotsForEdit 실행
    if( formattedDate === originalDate){
      fetchTimeslotsForEdit(reservationToEdit);
    } else{
      try {
        const res = await axios.post<TimeInfo[]>(`http://${process.env.NEXT_PUBLIC_BACKIP}:8080/time/timeslots`, {
          statId: reservationToEdit.slot[0].charger.storeInfo.statId,
          chgerId: reservationToEdit.slot[0].charger.chargerId.chgerId,
          date: formattedDate,
        });
        setAvailableTimeslots(res.data);
        setCurrentSelection([]);
      } catch (error){
        console.error('handleDateChange 에러: ', error);
        setToastMsg('예약현황을 불러오는데 실패했습니다.')
      }
    }
  }

  // 4-4. 연속성 검사함수
  const isConsecutive = (arr: number[]) => {
    if(arr.length <= 1) return true;
    const sorted = [...arr].sort((a, b) => a - b);
    for(let i = 1 ; i < sorted.length; i++){
      if(sorted[i] !== sorted[i-1] + 1){
        return false;
      }
    }
    return true;
  }

  // 4-5. 타임슬록 선택/해제 및 연속성 검사 핸들러
  const handleToggleSlot = (slot: TimeInfo) => {
    const isAlreadySelected = currentSelection.some(s => s.timeId === slot.timeId);
    let potentialSelection: SelectionSlot[];

    if (isAlreadySelected) {
      // 선택 해제
      potentialSelection = currentSelection.filter(s => s.timeId !== slot.timeId);
    } else {
      // 새로 선택
      const isMyOriginalSlot = reservationToEdit?.slot.some(s => s.timeId === slot.timeId);
      if (!slot.enabled && !isMyOriginalSlot) {
        setToastMsg('연속된 시간대만 선택할 수 있습니다.');
        return;
      }
      potentialSelection = [...currentSelection, { timeId: slot.timeId, startTime: slot.startTime, endTime: slot.endTime }];
    }
  
    // '만약 이렇게 선택된다면'을 가정하고 연속성 검사
    const potentialTimeIds = potentialSelection.map(s => s.timeId);
    if (isConsecutive(potentialTimeIds)) {
        // 연속이 맞으면 상태 업데이트
        setCurrentSelection(potentialSelection.sort((a, b) => a.timeId - b.timeId));
    } else {
        // 연속이 아니면 에러 메시지 표시하고 상태는 변경하지 않음
        setToastMsg('연속된 시간대만 선택할 수 있습니다.');
    }
  };

  // 4-6. 최적화된 예약변경 확정 로직
  const handleUpdateReservation = async () => {
    if (!reservationToEdit) return;
    console.log('reservationToEdit:', reservationToEdit);

    // 만약 변경된 내용이 없다면 함수 종료
    const originalTimeIds = reservationToEdit.slot.map(s => s.timeId).sort().join(',');
    const newTimeIds = currentSelection.map(s => s.timeId).sort().join(',');
    console.log('originalTimeIds: ', originalTimeIds);
    console.log('newTimeIds: ', newTimeIds);

    console.log('삭제할 요청: ',  [reservationToEdit.reserveId])
    console.log('새로운 예약요청: ', currentSelection.map(s => s.timeId))

    if (originalTimeIds === newTimeIds) {
      setToastMsg("변경된 내용이 없습니다.");
      return;
    }
    console.log('slotIds: ',  currentSelection.map(s => s.timeId))
    console.log('reserveIds: ', [reservationToEdit.reserveId])

    try {
      await axios.patch(`http://${process.env.NEXT_PUBLIC_BACKIP}:8080/reserve/update`,
        { 
          slotIds: currentSelection.map(s => s.timeId),  // 새로운 예약요청
          reseIds: [reservationToEdit.reserveId],       // 기존 예약삭제
        },
        { headers: { Authorization: `Bearer ${token}` } });

      // 새롭게 선택된 슬롯이 있다면 예약
      // if (currentSelection.length > 0) {
      //   await axios.post(`http://${process.env.NEXT_PUBLIC_BACKIP}:8080/reserve/setSlots`,
      //     { slotIds: currentSelection.map(s => s.timeId) },
      //     { headers: { Authorization: `Bearer ${token}` } });
      // }
      setToastMsg('예약이 성공적으로 변경되었습니다.');
      setShowEditPanel(false);
      await getMyReservation();

    } catch (error) {
      console.error('[예약변경 실패]handleUpdateReservation 에러 : ', error);
      setToastMsg('예약 변경 중 오류가 발생했습니다.');
      await getMyReservation();
    }
  }

  // 4-7. 왼쪽패널 true -> 뒤쪽 스크롤막기
  useEffect(() => {
    if (showEditPanel) {
      // 패널이 열리면 body의 스크롤을 막습니다.
      document.body.style.overflow = 'hidden';
    } else {
      // 패널이 닫히면 body의 스크롤을 다시 허용합니다.
      document.body.style.overflow = 'unset'; // 'auto' 또는 'visible'도 가능
    }

    // 컴포넌트가 언마운트될 때(페이지 이동 등) 스타일을 초기화하는 클린업 함수
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showEditPanel]); // 의존성 배열에 showEditPanel을 넣어 상태 변경을 감지

  // 4-8. 바깥 클릭 감지 useEffect 훅
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setShowEditPanel(false);
        setReservationToEdit(null);
      }
    };
    if (showEditPanel) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEditPanel]);

  // ✨ 1. 인증 상태가 확인되기 전에는 로딩 표시
  if (!authChecked) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LottieLoading />
      </div>
    );
  }

  // ✨ 1. 비로그인 상태일 때 보여줄 화면
  if (!token) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <p className="text-xl font-semibold text-gray-700">로그인이 필요한 페이지입니다.</p>
          <p className="text-gray-500 mt-2">로그인 후 내 예약 내역을 확인해 보세요.</p>
          {/* 필요하다면 로그인 페이지로 이동하는 버튼을 추가할 수 있습니다. */}
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
          {/* 1. 왼쪽: 예약 목록 */}
          <div className={`w-full transition-all duration-500 ${showEditPanel ? 'pr-[30rem]' : 'pr-0'}`}>
            <div className='flex-1 flex flex-col'>
              <div className="flex p-4 gap-2">
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
              </div>
              {filteredReservations && Object.entries(filteredReservations).map(([date, reservationList]) => { // 1. [날짜, 안의 배열]를 바로 비구조화 할당
                // console.log(`📅 ${date}:`, reservationList);
                {
                  Object.keys(filteredReservations).length === 0 && (
                    <p className="text-center text-gray-400 mt-20">예약 내역이 없습니다.</p>
                  )
                }

                return (
                  <React.Fragment key={date}>
                    <h3 className='mb-3 mt-4 font-medium text-lg text-gray-400'>{date}</h3>
                    {(reservationList as Reservation[]).map((r) => {
                      // 시작시간과 종료시간, 충전소 정보 slot배열에서 가져오기
                      const firstSlot = r.slot[0];
                      const lastSlot = r.slot[r.slot.length - 1];
                      const chargerInfo = firstSlot.charger;
                      // ✨ 2. 날짜가 지났는지 확인하는 로직 추가
                      const today = new Date();
                      today.setHours(0, 0, 0, 0); // 오늘 날짜의 자정으로 설정
                      const reservationDate = new Date(date);
                      const isPast = reservationDate < today;
                      // 예약취소
                      const isCanceled = viewMode === '예약취소';

                      return (
                        // 예약 카드
                        <div key={r.reserveId} className={`relative group flex ${!isPast && !isCanceled ? 'bg-white border-green-500' : 'bg-gray-300 border-gray-500' } border-l-4  rounded-lg shadow-md mb-4 p-5 w-full cursor-pointer transition hover:shadow-lg`}>

                          {/* 👈 1. 시간 정보를 왼쪽에 배치하되, 레이아웃을 해치지 않도록 개선 */}
                          <div className='flex flex-col items-center justify-center pr-5 mr-5 border-r border-gray-200'>
                            <p className='text-lg font-semibold text-gray-800'>{firstSlot.startTime.slice(0, 5)}</p>
                            <p className='text-sm text-gray-400'>~{lastSlot.endTime.slice(0, 5)}</p>
                          </div>

                          {/* 👈 2. 메인 정보 영역: 모든 정보를 담는 컨테이너. flex-1으로 남은 공간을 모두 차지 */}
                          <div className='flex-1 flex flex-col gap-3'>

                            {/* 카드 헤더: 충전소 이름과 태그 */}
                            <div className='flex justify-between items-start'>
                              <h3 className='text-xl font-bold text-gray-800'>{chargerInfo.storeInfo.statNm}</h3>
                              {/* <div className='text-xs font-semibold rounded-full px-3 py-1 bg-green-100 text-green-700 whitespace-nowrap'>
                                AI 추천
                              </div> */}
                            </div>

                            {/* 카드 본문: 주소 및 충전기 타입 */}
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

                            {/* 👈 3. 카드 푸터: 추가 정보와 액션 버튼 */}
                            <div className='flex justify-end items-center mt-2'>
                              {/* 레퍼런스처럼 연한 회색 아이콘과 버튼으로 변경 */}
                              <div className='flex items-center gap-3 text-gray-400 cursor-pointer'>
                                {/* <span className='inline-flex items-center justify-center cursor-pointer p-2 rounded-full hover:bg-gray-100 transition'>
                                  <FiMapPin size={20} className="cursor-pointer hover:text-gray-600 transition" />
                                </span> */}
                                <button onClick={() => handleOpenEditPanel(r)} className='inline-flex items-center justify-center cursor-pointer p-2 rounded-full hover:bg-gray-100 transition'>
                                  <IoCalendarClearOutline size={20} className="cursor-pointer hover:text-gray-600 transition" />
                                </button>
                                <button onClick={() => handleConfirmModal(r.reserveId)} // 🔥 예약취소를 위해 timeId-> reservId한부분
                                  className='cursor-pointer px-4 py-1.5 border border-gray-200 rounded-full text-gray-500 text-xs font-semibold hover:bg-gray-100 hover:text-gray-800 transition'>
                                  예약 취소
                                </button>
                              </div>
                            </div>

                            {/* ✨ 2. 비활성화된 카드 위에 호버 시 나타나는 삭제 버튼 */}
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
          {/* 2. 오른쪽: 예약 수정패널 */}
          {showEditPanel && reservationToEdit &&
            <div ref={panelRef} // 바깥 클릭 감지를 위해 ref 연결
              className={`fixed top-20 right-0 h-[calc(100vh-80px)] w-[30rem] bg-white shadow-xl z-50 p-6
                transition-transform duration-500 ease-in-out 
                ${showEditPanel ? 'translate-x-0' : 'translate-x-full invisible pointer-events-none'}`} >
              {/* 수평으로 이동(full 자기 크기만큼) */}
              {/* <div className='fixed inset-0 z-40' onClick={()=> setShowEditPanel(false)}></div> */}
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
                      :  availableTimeslots?.map((slot) => {
                      const isSelected = currentSelection.some(s => s.timeId === slot.timeId);
                      const isMyOriginalSlot = reservationToEdit?.slot?.some(s => s.timeId === slot.timeId); // reservationToEdit 있을때 세팅
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

