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
import { HeatmapFilter } from '@/components/Admin/filters/FilterGroup';
import { ActualChargingStationData, WeekdayDemand, ChargingStationResponseDto, ChargerTotalStatusData } from '@/types/dto';
import type { FeatureCollection, Point } from 'geojson';
import style from './dashboard.module.css'

// Icons
import { IoCalendarClearOutline } from "react-icons/io5";
import { FiUser, FiUserMinus, FiBell } from 'react-icons/fi';
import { PiCarSimple } from "react-icons/pi";


/**
 * 충전기 상태별 색상 매핑 및 대시보드 정의 상수
 */
const STATUS_DEFINITIONS = [
    {
        status: '충전대기',
        color: '#4FA969',
        sourceIndex: 2,
    },
    {
        status: '충전중',
        color: '#f59e0b',
        sourceIndex: 3,
    },
    {
        status: '상태이상',
        color: '#CE1C4C',

        sourceIndexes: [
            { name: '통신이상', index: 1 },
            { name: '운영중지', index: 4 },
            { name: '상태미확인', index: 9 },
        ],
    },
    {
        status: '점검',
        color: '#B05DEA',
        sourceIndex: 5,
    },
];

const KPI_DEFINITIONS = [
    {
        title: 'Total Reservation',
        Icon: <IoCalendarClearOutline size={38} />,
    },
    {
        title: 'Total EV',
        Icon: <PiCarSimple size={38} />,
    },
    {
        title: 'All Users',
        Icon: <FiUser size={38} />,
    },
    {
        title: 'Withdraw Users',
        Icon: <FiUserMinus size={38} />,
    },
];

export default function page() {
    const [token] = useAtom(accessTokenAtom);
    const [currentFilter, setCurrentFilter] = useState<HeatmapFilter>({
        time: 6,
        region: '금정구',
        date: new Date('2025-07-31T13:00:00+09:00'),
    });

    // API 데이터 상태
    const [heatmapDt, setHeatmapDt] = useState<ActualChargingStationData[] | null>(null);
    const [totalStatDt, setTotalStatDt] = useState<ChargerTotalStatusData>(null);
    const [statGraphDt, setStatGraphDt] = useState<WeekdayDemand[] | null>(null);
    const [statDetailDt, setStatDetailDt] = useState<ChargingStationResponseDto | null>(null);
    const [isLoadingStationDetail, setIsLoadingStationDetail] = useState(false);
    const [totalInfo, setTotalInfo] = useState<{ reserv: number; car: number; user: number; }>(null);


    /**
     * 필터링된 조건에 따른 히트맵 데이터(수요 예측) 요청
     */
    const getHeatmapData = useCallback(async () => {
        if (!token) return;


        const requestDate = new Date(currentFilter.date);
        requestDate.setHours(currentFilter.time, 0, 0, 0);

        const requestBody = {
            local: currentFilter.region,
            time: requestDate.toISOString(),
        }


        try {
            const res = await axios.post<ActualChargingStationData[]>(`http://${process.env.NEXT_PUBLIC_BACKIP}:8080/pred/location`,
                requestBody,
                { headers: { Authorization: `Bearer ${token}` } }
            )

            setHeatmapDt(res.data);
        } catch (error) {
            console.error('getHeatmapData 에러: ', error)
        }
    }, [currentFilter, token]);


    /**
     * 지역별 전체 충전기 상태 현황 요청
     */
    const getTotalStatDt = useCallback(async () => {
        if (!token) return;

        try {
            const res = await axios.get<ChargerTotalStatusData>(
                `http://${process.env.NEXT_PUBLIC_BACKIP}:8080/static/idle?local=${currentFilter.region}`,
                { headers: { Authorization: `Bearer ${token}` } }
            )
            setTotalStatDt(res.data);
        } catch (error) {
            console.error('getStatDt 에러: ', error);
        }
    }, [currentFilter, token]);

    /**
     * 특정 충전소 선택 시 상세 정보 및 요일별 수요 그래프 데이터 요청
     */
    const getStatGraphData = useCallback(async (statId: string) => {
        if (!token) return;
        setIsLoadingStationDetail(true);

        try {
            const [statDemandRes, currentStatRes] = await Promise.all([
                axios.get<WeekdayDemand[]>(`http://${process.env.NEXT_PUBLIC_BACKIP}:8080/static/weekdays?statId=${statId}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                ),

                axios.get<ChargingStationResponseDto>(`http://${process.env.NEXT_PUBLIC_BACKIP}:8080/map/get/getbystatId?statId=${statId}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                ),
            ]);

            setStatGraphDt(statDemandRes.data);
            setStatDetailDt(currentStatRes.data);
        } catch (error) {
            console.error('getStatData 에러: ', error)
        } finally {
            setIsLoadingStationDetail(false);
        }
    }, [token]);

    useEffect(() => { getHeatmapData(); }, [currentFilter, getHeatmapData, token])
    useEffect(() => { getTotalStatDt(); }, [currentFilter.region, getTotalStatDt, token])


    /**
     * KPI 데이터 요청
     */
    const getTotalInfo = async () => {
        if (!token) return;

        try {
            const [reservRes, carRes, userAllRes, userDisabled] = await Promise.all([
                axios.get<number>(`http://${process.env.NEXT_PUBLIC_BACKIP}:8080/static/reserveTotal`,
                    { headers: { Authorization: `Bearer ${token}` } }
                ),
                axios.get<number>(`http://${process.env.NEXT_PUBLIC_BACKIP}:8080/static/carTotal`,
                    { headers: { Authorization: `Bearer ${token}` } }
                ),
                axios.get<number>(`http://${process.env.NEXT_PUBLIC_BACKIP}:8080/static/userTotal`,
                    { headers: { Authorization: `Bearer ${token}` } }
                ),
                axios.get<number>(`http://${process.env.NEXT_PUBLIC_BACKIP}:8080/static/userDisableTotal`,
                    { headers: { Authorization: `Bearer ${token}` } }
                ),
            ]);

            setTotalInfo({
                reserv: reservRes.data,
                car: carRes.data,
                user: userAllRes.data,
            })
        } catch (error) {
            console.error('getTotalInfo 에러: ', error);
        }
    }

    useEffect(() => { getTotalInfo(); }, [token]);

    /**
     * 히트맵 원본 데이터를 정규화하여 GeoJSON FeatureCollection 형태로 가공
     */
    const points = useMemo(() => {
        if (!heatmapDt || heatmapDt.length === 0) {
            return null;
        }
        const demandValues = heatmapDt.map(stat => stat.chargingDemand || 0);
        const minDemand = Math.min(...demandValues);
        const maxDemand = Math.max(...demandValues);

        const normalizeDemand = (value: number): number => {
            if (maxDemand === minDemand) return 0.5;
            return (value - minDemand) / (maxDemand - minDemand);
        };

        const features = heatmapDt.map((stat) => {
            const normalizedIntensity = normalizeDemand(stat.chargingDemand || 0);

            return {
                type: 'Feature' as const,
                geometry: { type: 'Point' as const, coordinates: [stat.lng, stat.lat] as [number, number] },
                properties: {
                    intensity: normalizedIntensity,
                    id: stat.statId,
                    name: stat.statNm,
                    addr: stat.addr,
                    busiNm: stat.busiNm,
                    demand: stat.chargingDemand
                }
            }
        });

        const featureCollection: FeatureCollection<Point, { id: string; name: string; addr: string; busiNm: string; demand: number; }> = {
            type: 'FeatureCollection',
            features: features
        }

        return featureCollection;
    }, [heatmapDt]);


    /**
     * 충전소 상태 데이터를 UI 정의에 맞춰 상태별로 집계 및 결합
     */
    const statStatus = useMemo(() => {
        if (!totalStatDt) return null;

        const statCounts = totalStatDt.stat

        const combinedData = STATUS_DEFINITIONS.map((def) => {
            if (def.sourceIndexes) {
                const totalCnt = def.sourceIndexes.reduce((sum, source) => { return sum + (statCounts[source.index] || 0); }, 0);
                const details = def.sourceIndexes.reduce((obj, source) => {
                    obj[source.name] = statCounts[source.index] || 0;
                    return obj;
                }, {})

                return {
                    status: def.status,
                    color: def.color,
                    cnt: totalCnt,
                    details: details,
                };
            }

            return {
                status: def.status,
                color: def.color,
                cnt: statCounts[def.sourceIndex] || 0,
            };
        });

        return {
            total: totalStatDt.totalCharger,
            stat: combinedData
        };
    }, [totalStatDt]);


    /**
     * KPI 데이터 합성
     */
    const kpiData = useMemo(() => {
        if (!totalInfo) return [];

        const values = [totalInfo.reserv, totalInfo.car, totalInfo.user]

        const conbinded = KPI_DEFINITIONS.map((def, idx) => ({
            ...def,
            value: values[idx],
        }));

        return conbinded;
    }, [totalInfo])

    /**
     * 필터 변경
     */
    const handleFilterChange = useCallback((newFilter: HeatmapFilter) => {
        const nextFilter = {
            ...currentFilter,
            ...newFilter
        }

        if (!isEqual(currentFilter, newFilter)) {
            setCurrentFilter(nextFilter);
        }
    }, [currentFilter])


    return (
        <div className="bg-gray-50 min-h-screen p-8 font-sans">
            <header className='flex justify-between items-center mb-8 mx-5'>
                <h1 className='text-4xl font bold  text-gray-800'>Dashboard</h1>
                <button className='relative p-2 rounded-full cursor-pointer hover:bg-gray-200'>
                    <FiBell size={20} />
                    <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-[#ef4444]" />
                </button>
            </header>

            <div className={style.dashboard_grid}>
                {/* 실시간 충전소 상태 카드 */}
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
                                                    ${item.status === '상태이상' && item.details && 'cursor-pointer'}
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

                {/* 수요 예측 히트맵 카드 */}
                <div className={`${style.card} lg:col-span-9 md:col-span-6 md:h-[500px] rounded-2xl flex flex-col`}>
                    <div className='flex-1 min-h-0'>
                        <DemandHeatmap onApplyFilter={handleFilterChange} pointsDt={points} onSelectStat={getStatGraphData} initialFilters={currentFilter} />
                    </div>
                </div>

                {/* 상세 그래프 및 정보 카드 (데이터 로드 시 노출) */}
                {statGraphDt && (
                    <>
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
                                </div>
                            </div>
                            <div className='flex flex-col items-center justify-center'>
                                <ChargingDemandLineChart statData={statGraphDt} />
                            </div>
                        </div>

                        <div className={`${style.card} p-[30px] lg:col-span-4 md:col-span-6 h-[470px]`}>
                            <h2>충전소 상세</h2>
                            <StatDetail statDetail={statDetailDt} />
                        </div>
                    </>
                )
                }

                {/* KPI 카드 */}
                {kpiData && kpiData.map(item => (
                    <div key={item.title} className={`${style.card} lg:col-span-3 md:col-span-3 p-[30px] min-h-[230px]`}>
                        <KpiCard item={item} />
                    </div>
                ))}
            </div>
        </div>
    )
}
