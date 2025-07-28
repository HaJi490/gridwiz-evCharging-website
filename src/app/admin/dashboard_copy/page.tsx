'use client'

import React, { useCallback, useMemo, useState, useEffect } from 'react'
import axios from 'axios';
import { useAtom } from 'jotai';
import { accessTokenAtom } from '@/store/auth';


import DemandHeatmap from '@/components/Admin/charts/DemandHeatmap/DemandHeatmap';
import ChargingDemandLineChart from '@/components/Admin/charts/ChargingDemandLineChart/ChargingDemandLineChart';
import StatDetail from '@/components/Admin/charts/StatDetail';
import KpiCard from '@/components/Admin/charts/KpiCard/KpiCard';
import FilterGroup, { HeatmapFilter } from '@/components/Admin/filters/FilterGroup';
import { ActualChargingStationData, WeekdayDemand, ChargingStationResponseDto } from '@/types/dto';
import type { FeatureCollection, Point } from 'geojson';
import style from './dashboard.module.css'
import { IoCalendarClearOutline } from "react-icons/io5";
import {FiUser} from 'react-icons/fi'


const statusColorMap = {
    '충전대기': '#4FA969',
    '충전중': '#f59e0b',
    '고장': '#CE1C4C',
    '점검': '#B05DEA'
}


// '실시간 충전소 상태'
const statStatus = [
    { color: '#4FA969', status: '충전대기', cnt: '800', percentage: '65%' },
    { color: '#f59e0b', status: '충전중', cnt: '288', percentage: '20%' },
    { color: '#CE1C4C', status: '고장', cnt: '20', percentage: '5%' },
    { color: '#B05DEA', status: '점검', cnt: '13', percentage: '10%' },
]

// '충전소 현황'
const statNow = {
    waiting: 10,
    charging: 8,
    error: 0,
    inspection: 1,
    chargerInfo: {
        '01': {
            stat: '충전대기',
            lastTsdt: '20250704081739'
        },
        '02': {
            stat: '충전중',
            lastTsdt: '20250727081739'
        },
        '03': {
            stat: '점검',
            lastTsdt: '20250727131739'
        },
        '04': {
            stat: '충전대기',
            lastTsdt: '20250704081739'
        }

    }
}

// 예약, 멤버
const kpiData = [
    {
        title: 'Total Reservation',
        value: 55,
        change: 12,
        changeType: 'down',
        Icon: <IoCalendarClearOutline size={38}/>,
    },
    {
        title: 'All Users',
        value: 230,
        change: 3,
        changeType: 'up',
        Icon: <FiUser size={38}/>,
    },
    {
        title: 'Total EV',
        value: 230,
        change: 3,
        changeType: 'up',
        Icon: <FiUser size={38}/>,
    },

];

// 메인
const DummiesResp = [
    {
        "statNm": "니즈호텔",
        "statId": "CSCS2015",
        "addr": "부산광역시 금정구 팔송로24번길 52",
        "useTime": null,
        "lat": 35.2745,
        "lng": 129.09,
        "parkingFree": true,
        "limitYn": false,
        "totalChargeNum": 0,
        "totalFastNum": 0,
        "totalSlowNum": 0,
        "chargeFastNum": 0,
        "chargeSlowNum": 0,
        "totalMidNum": 0,
        "chargeMidNum": 0,
        "totalNacsNum": 0,
        "chargingDemand": 4.4602054E-20,
        "chargeNum": 1,
        "enabledCharger": null,
        "busiId": "CS",
        "busiNm": "한국EV충전서비스센터",
        "chargerInfo": null
    }
]

const periods = ['Month', 'Week', 'Day'];

export default function page() {
    const [token] = useAtom(accessTokenAtom);
    const [currentFilter] = useState<HeatmapFilter>({
        time: 6,
        region: '금정구',
        date: new Date(),
    });
    const [heatmapDt, setHeatmapDt] = useState<ActualChargingStationData[] | null>(null);
    const [statGraphDt, setStatGraphDt] = useState<WeekdayDemand[] | null>(null);
    const [statDetailDt, setStatDetailDt] = useState<ChargingStationResponseDto|null>(null);
    const [selectedPeriod, setSelectedPeriod] = useState('Week');
    const [isLoadingStationDetail, setIsLoadingStationDetail] = useState(false);    //데이터 로딩상태관리
    

    // 1. 히트맵 데이터 요청(초기값 필요)
    const getHeatmapData = useCallback(async (filter?: HeatmapFilter) => {
        console.log('[Dashboard] 1. 히트맵 정보요청')

        const filterToUse: HeatmapFilter = filter || currentFilter

        // 시간 포맷팅
        const requestDate = new Date(filterToUse.date);
        requestDate.setHours(filterToUse.time, 0, 0, 0);
        console.log('포맷팅한 시간: ', requestDate);

        const requestBody = {
            local: filterToUse.region,
            time: requestDate.toISOString(),   //'2025-07-26T06:00:00.000Z'
        }

        console.log('히트맵 요청: ', requestBody);
        try {
            // const res = await axios.post<ActualChargingStationData[]>(`http://${process.env.NEXT_PUBLIC_BACKIP}:8080/pred/location`,
            //     requestBody,
            //     { headers: { Authorization: `Bearer ${token}` } }
            // )

            setHeatmapDt(DummiesResp); //🍕 res.data로 변경
        } catch (error) {
            console.error('getHeatmapData 에러: ', error)
        }
    }, [currentFilter])

    // 초기데이터 로드
    useEffect(()=>{
        getHeatmapData();
    }, [])


    // 1-2. 히트맵 데이터 가공
    const points = useMemo(() => {
        if (!heatmapDt || heatmapDt.length === 0) {
            return null;
        }

        const features = heatmapDt.map((stat) => ({  //🍕 heatmapDt로 변경
            type: 'Feature' as const,
            geometry: { type: 'Point' as const, coordinates: [stat.lng, stat.lat] as [number, number] },
            properties: {
                id: stat.statId,
                name: stat.statNm,
                addr: stat.addr,
                busiNm: stat.busiNm,
                demand: stat.chargingDemand
            }
        }
        ));

        const featureCollection: FeatureCollection<Point, { id: string; name: string; addr: string; busiNm: string; demand: number; }> = {
            type: 'FeatureCollection',
            features: features
        }

        return featureCollection;
    }, [heatmapDt]);

    // 2. 라인그래프(충전소) 데이터
    const getStatGraphData = async (statId: string) => {
        setIsLoadingStationDetail(true);

        try {
            const [statDemandRes, currentStatRes] = await Promise.all([
                // 수요 데이터
                axios.get<WeekdayDemand[]>(`http://${process.env.NEXT_PUBLIC_BACKIP}:8080/static/weekdays?statId=${statId}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                ),

                // 충전기 상태
                axios.get<ChargingStationResponseDto>(`http://${process.env.NEXT_PUBLIC_BACKIP}:8080/map/get/getbystatId?statId=${statId}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                ),
            ]);


            setStatGraphDt(statDemandRes.data);
            console.log('statDemandRes: ', statDemandRes.data);
            
            setStatDetailDt(currentStatRes.data);
            console.log('currentStatRes', currentStatRes.data);
            // const res = await axios.get<WeekdayDemand[]>(`http://${process.env.NEXT_PUBLIC_BACKIP}:8080/static/weekdays?statId=${statId}`,
            //     { headers: { Authorization: `Bearer ${token}` } }
            // )

        } catch (error) {
            console.error('getStatData 에러: ', error)
        } finally{
            setIsLoadingStationDetail(false);
        }
    }

    return (
        <div className="bg-gray-50 min-h-screen p-8 font-sans">
            {/* 헤더 */}
            <header className='flex justify-between items-center mb-8'>
                <h1 className='text-4xl font bold  text-gray-800'>Dashboard</h1>
                <button className='relative p-2 rounded-full cursor-pointer hover:bg-gray-200'>
                    <IoCalendarClearOutline size={20} />
                    <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-[#ef4444]" />
                </button>
            </header>
            {/* 메인 그리드 */}
            <div className={style.dashboard_grid}>
                {/* 실시간 충전소 상태 */}
                <div className={`${style.card} lg:col-span-3 md:col-span-6 p-10 flex flex-col justify-center h-[500px] `}>
                    <h2>실시간 충전소 상태</h2>
                    <div className='w-full flex h-2 rounded-full overflow-hidden mb-18'>
                        {statStatus.map(item => (
                            <div key={item.status} style={{ width: item.percentage, backgroundColor: item.color }} />
                        ))}
                    </div>
                    <ul className='space-y-5'>
                        {statStatus.map(item => (
                            <li key={item.status} className='flex justify-between items-center
                                                    border-b border-[#f2f2f2] last:border-b-0 pb-4'>
                                <div className='flex items-center'>
                                    <span className='w-2.5 h-2.5 rounded-full mr-3' style={{ backgroundColor: item.color }}></span>
                                    <span className='text-gray-600'>{item.status}</span>
                                </div>
                                <span className='font-semibold text-gray-800'>{item.cnt} 대</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* 히트맵 */}
                <div className={`${style.card} lg:col-span-9 md:col-span-6 rounded-2xl flex flex-col`}>
                    <div className='flex-1 min-h-0'>
                        <DemandHeatmap onApplyFilter={getHeatmapData} pointsDt={points} onSelectStat={getStatGraphData} initialFilters={currentFilter}/>
                    </div>
                </div>

                
                {statGraphDt && (
                    <>
                        {/* 충전소 수요그래프 */}
                        <div className={`${style.card} p-[30px] lg:col-span-8 md:col-span-6 `}>
                            <div className='flex justify-between'>
                                <h2><span className='font-mono text-[#4FA969]'>{statGraphDt[0].stationLocation}:{statDetailDt.statNm}</span> &ensp; 수요예측 </h2>
                                <div className='flex gap-5'>
                                    {periods.map(period => (
                                        <button
                                            key={period}
                                            onClick={() => setSelectedPeriod(period)}
                                            className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors duration-200
                                                    ${selectedPeriod === period
                                                        ? 'bg-white text-gray-800 shadow-sm' // 활성화 상태 스타일
                                                        : 'text-gray-500 hover:bg-gray-200'    // 비활성화 상태 스타일
                                                    }
                                                `}
                                        >
                                            {period}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            <div className='flex flex-col items-center justify-center'>
                                <ChargingDemandLineChart statData={statGraphDt}/>
                            </div>
                        </div>

                        {/* 충전소 상세 */}
                        <div className={`${style.card} p-[30px] lg:col-span-4 md:col-span-6`}>
                            <h2>충전소 상세</h2>
                            {/* <div>충전기 현황</div>
                            <div>
                                <span className='w-2.5 h-2.5 rounded-full mr-3'></span>
                            </div> */}
                            <StatDetail statDetail={statDetailDt}/>
                        </div>
                    </>
                )
                }

                {kpiData.map(item => (
                    <div key={item.title} className={`${style.card} lg:col-span-3 md:col-span-3 p-[30px] min-h-[230px]`}>
                        <KpiCard item={item} />
                    </div>
                ))}

            </div>
        </div>
    )
}
