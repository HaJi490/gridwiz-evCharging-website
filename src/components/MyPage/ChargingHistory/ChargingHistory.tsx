import React, {useEffect, useState} from 'react'

import { History } from '@/types/dto';
import chgerCodeNm from '../../../db/chgerType.json'
import style from './ChargingHistory.module.css'
import { PiBatteryPlus } from "react-icons/pi"; // 충전횟수
import { BsLightningCharge } from "react-icons/bs"; // 빈 번개
import { BsLightningChargeFill } from "react-icons/bs"; // 안 빈 번개
import { ImCoinDollar } from "react-icons/im";  // 충전금액
import { LuTimer } from "react-icons/lu";   // 걸린시간

export default function ChargingHistory() {
    const [historyData, setHistoryData] = useState<History>();
    const [selectedHistory, setSelectedHistory] = useState<boolean>(false);

    useEffect(()=> {
        const getHistory = async() => {
            try{
                const history: History ={  // 충전히스토리
                    monthlyChargeCount: 5,      // 월충전횟수
                    monthlyChargeAmount: 300,   // 월 kWh
                    monthlyChargeCost: 50000,   // 월 충전금액
                    chargingHistory: [
                        {
                            statNm: "부산119안전체험관",
                            chgerId: '01',
                            chargeDate: '2025.07.01',   // 충전한 날짜
                            chargeSTime: '14:20',       // 충전시작 시간
                            chargeETime: '15:40',       // 충전완료 시간
                            chargeAmount: 12.5,
                            chargeCost: 3200,
                            chargeDuration: 80, // 충전하는데 걸린 시간(분)
                            isReserved: true,
                            reservedSTime: '13:30', // 예약 시작시간
                            reservedETime: '15:30', // 예약 완료시간
                            chgerType: '06',        // 충전기 종류(급/완)
                            busiNm: '환경부'
                            // 결제수단
                            // 충전기위치
                        }
                    ]}
                setHistoryData(history);
    
            }catch(error) {
    
            }
        }
        getHistory();
    }, [])

    if(!historyData) return <div>Loading..</div>; // data undefined인 경우 대비

     // 충전기id -> 이름
    const chgerCodeToNm = (chgerCode: string) =>{
        const match = chgerCodeNm.find(type => chgerCode.includes(type.code));
        return match?.type || '';
    }
      
  return (
    <div>
        <div className="grid grid-cols-3 gap-6 mb-7">
            <div className="bg-white border-[#f2f2f2] shadow-md rounded-xl p-6">
                <h4 className="text-sm text-[#6B6B6B] flex gap-2 mb-5">
                    <span className='pt-[1px]'><PiBatteryPlus /></span>
                    월 충전횟수
                </h4>
                <p className="text-2xl font-semibold text-[#4FA969]">{historyData.monthlyChargeCount}회</p>
            </div>
            <div className="bg-white border-[#f2f2f2] shadow-md rounded-xl p-6">
                <h4 className="text-sm text-[#6B6B6B] flex gap-2 mb-5">
                    <span className='pt-[1px]'><BsLightningChargeFill /></span>
                    월 충전량
                </h4>
                <p className="text-2xl font-semibold text-[#4FA969]">{historyData.monthlyChargeAmount}kWh</p>
            </div>
            <div className="bg-white border-[#f2f2f2] shadow-md rounded-xl p-6">
                <h4 className="text-sm  text-[#6B6B6B] flex gap-2 mb-5">
                    <span className='pt-[1px]'><ImCoinDollar /></span>
                    월 지출비용
                </h4>
                <p className="text-2xl font-semibold text-[#4FA969]">{historyData.monthlyChargeCost}원</p>
            </div>
        </div>
        {/* 충전목록 */}
        <h4 className='font-bold text-[#6B6B6B] ml-3 mb-2'>나의 충전기록</h4>
        <div className='grid grid-cols-2'>
            {historyData.chargingHistory.map((history, idx) => {
                const chargeInfoList = [
                        {
                            icon: <BsLightningChargeFill />,
                            label: `${history.chargeAmount} kWh`,
                        },
                        {
                            icon: <ImCoinDollar />,
                            label: `${history.chargeCost}원`,
                        },
                        {
                            icon: <LuTimer />,
                            label: `${history.chargeDuration}분`,
                        },
                    ];

                return(
                    <button key={`${idx}-${history.statNm}`} onClick={() => setSelectedHistory(true)}
                            className="bg-white border-[#f2f2f2] rounded-xl shadow-md p-6 w-full text-left focus:outline-none cursor-pointer" >
                        <div className='mb-3'>
                            <p className="text-sm text-[#afafaf]">{history.chargeDate}</p>
                            <h3 className="text-lg font-semibold text-[#2F2F2F]">{history.statNm}</h3>
                        </div>
                        <div className='bg-[#f2f2f2] inline-flex items-center px-3 py-1 rounded-lg'>
                            {chargeInfoList.map((item, i, arr) => (
                                    <React.Fragment key={i}>
                                        <div className='flex items-center'>
                                            <p className='flex items-center p-2 gap-1 text-black text-sm leading-tight'>
                                                <span className='mt-[1px] text-[#6B6B6B]'>{item.icon}</span> 
                                                <span className='whitespace-nowrap'>{item.label}</span>
                                            </p>
                                            { i < arr.length - 1 && (<span className="mx-2 text-[#ccc] text-sm">|</span>)}
                                        </div>
                                    </React.Fragment>
                                )
                            )}
                        </div>
                        {selectedHistory && (
                            <div className="mt-4 p-4 border-t border-[#afafaf]">
                                <h3 className="text-md font-semibold text-[#6B6B6B] mb-3">상세정보</h3>
                                <div className='mb-5'>
                                    <div className={style.historyDetail}>
                                        <span className='text-[#afafaf]'>충전일시</span> 
                                        <span>{`${history.chargeDate}   ${history.chargeSTime}~${history.chargeETime}`}</span>
                                    </div>
                                    <div className={style.historyDetail}>
                                        <span className='text-[#afafaf]'>예약정보</span> 
                                        {history.isReserved ? 
                                        <span><span className='text-[#4FA969]'>예약사용</span>{`(${history.reservedSTime}~${history.reservedETime})`}</span> : <span>현장결제</span>}
                                    </div>
                                    <div className={style.historyDetail}>
                                        <span className='text-[#afafaf]'>충전기종류</span> 
                                        <span>{chgerCodeToNm(history.chgerType)}</span>
                                    </div>
                                    <div className={style.historyDetail}>
                                        <span className='text-[#afafaf]'>운영기관</span> 
                                        <span>{history.busiNm}</span>
                                    </div>
                                </div>
                                <div>
                                    <div className='grid grid-cols-2 gap-2'>
                                        <button
                                            className="px-3 py-2 bg-[#4FA969] text-white rounded-md cursor-pointer"
                                            onClick={() => setSelectedHistory(false)}>
                                            다시 예약
                                        </button>
                                        <button
                                            className="px-3 py-2 bg-[#f2f2f2] text-[#666] rounded-md cursor-pointer"
                                            onClick={() => setSelectedHistory(false)}>
                                            지도로 보기
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </button>
                )
            })}
        </div>
    </div>
  )
}
