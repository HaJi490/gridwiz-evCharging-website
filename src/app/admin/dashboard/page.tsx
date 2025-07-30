'use client'

import React, { useCallback, useMemo, useState, useEffect } from 'react'
import axios from 'axios';
import { useAtom } from 'jotai';
import { accessTokenAtom } from '@/store/auth';
import { isEqual } from "lodash";

import StatusBarChart from '@/components/Admin/charts/StatusBarChart/StatusBarChart';
import DemandHeatmap from '@/components/Admin/charts/DemandHeatmap/DemandHeatmap';
import ChargingDemandLineChart from '@/components/Admin/charts/ChargingDemandLineChart/ChargingDemandLineChart';
import StatDetail from '@/components/Admin/charts/StatDetail';
import KpiCard from '@/components/Admin/charts/KpiCard/KpiCard';
import FilterGroup, { HeatmapFilter } from '@/components/Admin/filters/FilterGroup';
import { ActualChargingStationData, WeekdayDemand, ChargingStationResponseDto, ChargerTotalStatusData } from '@/types/dto';
import type { FeatureCollection, Point } from 'geojson';
import style from './dashboard.module.css'
import { IoCalendarClearOutline } from "react-icons/io5";
import { FiUser } from 'react-icons/fi';
import { FiUserMinus } from "react-icons/fi";
import { BiSolidCar } from "react-icons/bi";
import { PiCarSimple } from "react-icons/pi";
import { FiBell } from "react-icons/fi";


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
// const statNow = {
//     waiting: 10,
//     charging: 8,
//     error: 0,
//     inspection: 1,
//     chargerInfo: {
//         '01': {
//             stat: '충전대기',
//             lastTsdt: '20250704081739'
//         },
//         '02': {
//             stat: '충전중',
//             lastTsdt: '20250727081739'
//         },
//         '03': {
//             stat: '점검',
//             lastTsdt: '20250727131739'
//         },
//         '04': {
//             stat: '충전대기',
//             lastTsdt: '20250704081739'
//         }

//     }
// }

// 각 상태에 대한 정의 (이름, 색상, 소스 인덱스)
const STATUS_DEFINITIONS = [
    {
        status: '충전대기',
        color: '#4FA969',
        sourceIndex: 2, // API 응답 stat 배열의 2번 인덱스
    },
    {
        status: '충전중',
        color: '#f59e0b',
        sourceIndex: 3, // stat 배열의 3번 인덱스
    },
    {
        status: '상태이상',
        color: '#CE1C4C', // 대표 색상
        // '상태이상'은 여러 소스를 합치므로 배열로 규칙을 정의
        sourceIndexes: [
            { name: '통신이상', index: 1 },   // stat 배열의 1번 인덱스
            { name: '운영중지', index: 4 },   // stat 배열의 4번 인덱스
            { name: '상태미확인', index: 9 }, // stat 배열의 9번 인덱스
        ],
    },
    {
        status: '점검',
        color: '#B05DEA',
        sourceIndex: 5, // stat 배열의 5번 인덱스
    },
];

// 예약, 멤버
const KPI_DEFINITIONS = [
    {
        title: 'Total Reservation',
        // value: 55,
        Icon: <IoCalendarClearOutline size={38} />,
    },
    {
        title: 'Total EV',
        // value: 230,
        Icon: <PiCarSimple size={38} />,
    },
    {
        title: 'All Users',
        // value: 230,
        Icon: <FiUser size={38} />,
    },
    {
        title: 'Withdraw Users',
        // value: 230,
        Icon: <FiUserMinus size={38} />,
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
    const [currentFilter, setCurrentFilter] = useState<HeatmapFilter>({
        time: 6,
        region: '금정구',
        date:  new Date('2025-08-02T13:00:00+09:00'),
    });
    const [heatmapDt, setHeatmapDt] = useState<ActualChargingStationData[] | null>(null);
    const [totalStatDt, setTotalStatDt] = useState<ChargerTotalStatusData>(null);
    const [statGraphDt, setStatGraphDt] = useState<WeekdayDemand[] | null>(null);
    const [statDetailDt, setStatDetailDt] = useState<ChargingStationResponseDto | null>(null);
    const [selectedPeriod, setSelectedPeriod] = useState('Week');
    const [isLoadingStationDetail, setIsLoadingStationDetail] = useState(false);    //데이터 로딩상태관리

    const [totalInfo, setTotalInfo] = useState<{
        reserv: number,
        car: number,
        user: number,
        // withdraw: number,
    }>(null);


    // 1. 히트맵 데이터 요청(초기값 필요)
    const getHeatmapData = useCallback(async () => {
        // 함수 초입에서 토큰 존재 여부 확인
        if (!token) {
            console.log('[Dashboard] 히트맵 정보 요청 중단: 토큰 없음');
            return;
        }
        console.log('[Dashboard] 1. 히트맵 정보요청');


        // 시간 포맷팅
        const requestDate = new Date(currentFilter.date);
        requestDate.setHours(currentFilter.time, 0, 0, 0);
        console.log('포맷팅한 시간: ', requestDate);

        const requestBody = {
            local: currentFilter.region,
            time: requestDate.toISOString(),   //'2025-07-26T06:00:00.000Z'
        }


        console.log('히트맵 요청: ', requestBody);
        console.log('토큰: ')
        try {
            const res = await axios.post<ActualChargingStationData[]>(`http://${process.env.NEXT_PUBLIC_BACKIP}:8080/pred/location`,
                requestBody,
                { headers: { Authorization: `Bearer ${token}` }}
            )
            
            setHeatmapDt(res.data); //🍕 res.data로 변경
            console.log('히트맵 요청: ', res.data);
        } catch (error) {
            console.error('getHeatmapData 에러: ', error)
        }
    }, [currentFilter, token])

    // 2. 충전기상태 데이터 요청
    const getTotalStatDt = useCallback(async () => {
        if (!token) {
            console.log('[Dashboard] 충전소 상태 요청 중단: 토큰 없음');
            return;
        }

        console.log('[Dashboard] 2. 충전소 상태요청: ', currentFilter.region);

        try {
            const res = await axios.get<ChargerTotalStatusData>(
                `http://${process.env.NEXT_PUBLIC_BACKIP}:8080/static/idle?local=${currentFilter.region}`,
                { headers: { Authorization: `Bearer ${token}` }}
            )
            setTotalStatDt(res.data);
            console.log(res.data);

        } catch (error) {
            console.error('getStatDt 에러: ', error);
        }
    }, [currentFilter, token])


    // 히트맵 데이터 로드
    useEffect(() => {
        getHeatmapData();
    }, [currentFilter, getHeatmapData, token])

    // 지역 충전소 상태데이터 로드
    useEffect(() => {
  
        getTotalStatDt();
    }, [currentFilter.region, getTotalStatDt, token])


    // 필터 적용
    const handleFilterChange = useCallback((newFilter: HeatmapFilter) => {
        const nextFilter = {
            ...currentFilter,
            ...newFilter
        }

        if (!isEqual(currentFilter, newFilter)) {
            setCurrentFilter(nextFilter);
        }
    }, [currentFilter])


    // 1-2. 히트맵 데이터 가공
    const points = useMemo(() => {
        if (!heatmapDt || heatmapDt.length === 0) {
            return null;
        }
        // 작은 값이 오니까 정규화해서 제대로 보여주기!
        // 1. 모든 chargingDemand 값 추출
        const demandValues = heatmapDt.map(stat => stat.chargingDemand || 0);
        
        // 2. 최솟값과 최댓값 구하기
        const minDemand = Math.min(...demandValues);
        const maxDemand = Math.max(...demandValues);
        
        // 3. 정규화 함수 (0~1 범위로 변환)
        const normalizeDemand = (value: number): number => {
            if (maxDemand === minDemand) return 0.5; // 모든 값이 같으면 중간값
            return (value - minDemand) / (maxDemand - minDemand);
        };

        const features = heatmapDt.map((stat) => {  
            const normalizedIntensity = normalizeDemand(stat.chargingDemand || 0);
            
            return{
                type: 'Feature' as const,
                geometry: { type: 'Point' as const, coordinates: [stat.lng, stat.lat] as [number, number] },
                properties: {
                    intensity: normalizedIntensity, // 0~1 사이의 정규화된 값
    
                    id: stat.statId,
                    name: stat.statNm,
                    addr: stat.addr,
                    busiNm: stat.busiNm,
                    demand: stat.chargingDemand
                }
            }
        }
        );

        const featureCollection: FeatureCollection<Point, { id: string; name: string; addr: string; busiNm: string; demand: number; }> = {
            type: 'FeatureCollection',
            features: features
        }

        return featureCollection;
    }, [heatmapDt]);


    // 2-2. 충전소상태 데이터 가공
    const statStatus = useMemo(() => {
        if (!totalStatDt) return null;

        const statCounts = totalStatDt.stat //.slice(0,6); // 배열에 필요한 앞 6개만 자름

        const combinedData = STATUS_DEFINITIONS.map((def, idx) => {
            // 여러 항목을 묶는경우(상태이상)
            if (def.sourceIndexes) {
                // reduce를 사용해 정의된 모든 항목 합계 계산
                const totalCnt = def.sourceIndexes.reduce((sum, source) => {
                    // statCounts 배열에서 해당 인덱스 값을 가져와 더함
                    return sum + (statCounts[source.index] || 0);
                }, 0);

                // 개별값 저장
                const details = def.sourceIndexes.reduce((obj, source) => {
                    obj[source.name] = statCounts[source.index] || 0;
                    return obj;
                }, {})

                return {
                    status: def.status,
                    color: def.color,
                    cnt: totalCnt,
                    details: details, // 상세 내역
                };
            }

            else {
                return {
                    status: def.status,
                    color: def.color,
                    cnt: statCounts[def.sourceIndex] || 0,
                };
            }

            // status: def.status,
            // color:def.color,
            // cnt: statCounts[idx] || 0, // 잘라낸 배열에서 값을 가져옴
            // statIdx: def.sourceIndex,
        });

        console.log('충전소 상태데이터: ', combinedData);

        // 최종
        const dt = {
            total: totalStatDt.totalCharger,
            stat: combinedData
        }

        console.log(dt);
        return dt;
    }, [totalStatDt])

    // 3. 하단 정보가져오기
    const getTotalInfo = async() => {
        if(!token) {
            console.log('토큰 없음');
            return ;
        }

        console.log('(하단정보) 토큰있음: ', token)

        try{
            const [reservRes, carRes, userAllRes, userDisabled] = await Promise.all([
                // 전체예약
                axios.get<number>(`http://${process.env.NEXT_PUBLIC_BACKIP}:8080/static/reserveTotal`,
                    { headers: { Authorization: `Bearer ${token}` } }
                ),
                // 전체 차량
                axios.get<number>(`http://${process.env.NEXT_PUBLIC_BACKIP}:8080/static/carTotal`,
                    { headers: { Authorization: `Bearer ${token}` } }
                ),
                // 전체 회원
                axios.get<number>(`http://${process.env.NEXT_PUBLIC_BACKIP}:8080/static/userTotal`,
                    { headers: { Authorization: `Bearer ${token}` } }
                ),
                // 탈퇴 회원
                axios.get<number>(`http://${process.env.NEXT_PUBLIC_BACKIP}:8080/static/userDisableTotal`,
                    { headers: { Authorization: `Bearer ${token}` } }
                ),
            ]);

            setTotalInfo({
                reserv: reservRes.data,
                car: carRes.data,
                user: userAllRes.data,
            })
        } catch(error) {
            console.error('getTotalInfo 에러: ', error);
        }
    }

    useEffect(()=>{
        getTotalInfo();
    },[token])

    // 3-2. 하단정보 가공
    const kpiData = useMemo(()=>{
        if(!totalInfo) return [];

        const values = [
            totalInfo.reserv,
            totalInfo.car,
            totalInfo.user,
        ]

        const conbinded =  KPI_DEFINITIONS.map((def, idx) => ({
            ...def,
            value: values[idx],
        }));

        console.log('kpi합성데이터: ', conbinded);
        return conbinded;

    },[totalInfo])



    // 4. 라인그래프(충전소) 데이터
    const getStatGraphData = useCallback(async (statId: string) => {
        if(!token) {
            console.log('토큰 없음');
            return ;
        }
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
        } finally {
            setIsLoadingStationDetail(false);
        }
    }, [token]);

    return (
        <div className="bg-gray-50 min-h-screen p-8 font-sans">
            {/* 헤더 */}
            <header className='flex justify-between items-center mb-8 mx-5'>
                <h1 className='text-4xl font bold  text-gray-800'>Dashboard</h1>
                <button className='relative p-2 rounded-full cursor-pointer hover:bg-gray-200'>
                    <FiBell size={20} />
                    <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-[#ef4444]" />
                </button>
            </header>
            {/* 메인 그리드 */}
            <div className={style.dashboard_grid}>
                {/* 실시간 충전소 상태 */}
                <div className={`${style.card} lg:col-span-3 md:col-span-6 p-10 flex flex-col`}>
                    
                    <h2><span className='border-b '>{currentFilter.region}</span> 실시간 상태</h2>
                    <div className='w-full flex h-2 rounded-full overflow-hidden mb-10'>
                        <StatusBarChart data={statStatus?.stat} />
                    </div>
                    <ul className='space-y-5'>
                        <li className='flex justify-between items-center border-b border-[#f2f2f2] last:border-b-0 pb-4 
                                        font-semibold text-gray-600 text-sm text-right'>
                            <span>{`All (${statStatus?.total} 대)`}</span>

                        </li>
                        {statStatus?.stat.map(item => (
                            <li key={item.status} className={`flex justify-between items-center  group relative
                                                    border-b border-[#f2f2f2] last:border-b-0 pb-4
                                                    ${item.status === '상태이상' && item.details && 'cursor-pointer' }
                                                    `}>
                                <div className='flex items-center'>
                                    <span className='w-2.5 h-2.5 rounded-full mr-3' style={{ backgroundColor: item.color }}></span>
                                    <span className='text-gray-600'>{item.status}</span>
                                </div>
                                <span className='font-semibold text-gray-800'>{item.cnt} 대</span>
                                {item.status === '상태이상' && item.details && (
                                    <div
                                        className="absolute bottom-2/3 left-1/2 mr-5 -translate-y-1/2 ml-4
                                                    w-max p-3 bg-gray-800 text-white text-xs rounded-md shadow-lg 
                                                    opacity-0 invisible group-hover:opacity-100 group-hover:visible 
                                                    transition-all duration-300 z-10"
                                    >
                                        {/* 3. 툴팁 내용을 동적으로 생성합니다. */}
                                        <ul className="space-y-1">
                                            {Object.entries(item.details).map(([key, value]) => (
                                                <li key={key} className="flex justify-between">
                                                    <span>{key}</span>
                                                    <span className="font-semibold ml-4">{value} 대</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* 히트맵 */}
                <div className={`${style.card} lg:col-span-9 md:col-span-6 md:h-[500px] rounded-2xl flex flex-col`}>
                    <div className='flex-1 min-h-0'>
                        <DemandHeatmap onApplyFilter={handleFilterChange} pointsDt={points} onSelectStat={getStatGraphData} initialFilters={currentFilter} />
                    </div>
                </div>


                {statGraphDt && (
                    <>
                        {/* 충전소 수요그래프 */}
                        <div className={`${style.card} p-[30px] lg:col-span-8 md:col-span-6 `}>
                            <div className='flex justify-between items-center mb-3'>
                                <h3 className='text-lg font-medium overflow-hidden'>
                                    <span className='font-mono border-b'>
                                        {statGraphDt[0].stationLocation}:{statDetailDt.statNm}
                                    </span> 
                                    &nbsp; 수요예측 
                                </h3>
                                <div className='flex gap-2'>
                                    <button className='px-2 text-sm rounded-full transition-colors duration-200 bg-[#4FA969]/20 text-[#4FA969] '>
                                        week
                                    </button>
                                    
                                    {/* {periods.map(period => (
                                        <button
                                            key={period}
                                            onClick={() => setSelectedPeriod(period)}
                                            className={`px-2 text-sm  rounded-full transition-colors duration-200
                                                    ${selectedPeriod === period
                                                    ? 'bg-[#4FA969]/20 text-[#4FA969] ' // 활성화 상태 스타일
                                                    : 'text-gray-500 hover:bg-gray-200'    // 비활성화 상태 스타일
                                                }
                                                `}
                                        >
                                            {period}
                                        </button>
                                    ))} */}
                                </div>
                            </div>

                            <div className='flex flex-col items-center justify-center'>
                                <ChargingDemandLineChart statData={statGraphDt} />
                            </div>
                        </div>

                        {/* 충전소 상세 */}
                        <div className={`${style.card} p-[30px] lg:col-span-4 md:col-span-6 h-[470px]`}>
                            <h2>충전소 상세</h2>
                            <StatDetail statDetail={statDetailDt} />
                        </div>
                    </>
                )
                }

                {kpiData && kpiData.map(item => (
                    <div key={item.title} className={`${style.card} lg:col-span-3 md:col-span-3 p-[30px] min-h-[230px]`}>
                        <KpiCard item={item} />
                    </div>
                ))}

            </div>
        </div>
    )
}
