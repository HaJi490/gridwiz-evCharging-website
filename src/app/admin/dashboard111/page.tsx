'use client'

import React, { useCallback, useMemo, useState } from 'react'
import axios from 'axios';
import { useAtom } from 'jotai';
import { accessTokenAtom } from '@/store/auth';

import { ActualChargingStationData } from '@/types/dto';
import style from './dashboard.module.css'

import DemandHeatmap from '@/components/Admin/charts/DemandHeatmap/DemandHeatmap';
import FilterGroup, { HeatmapFilter } from '@/components/Admin/filters/FilterGroup';
import ChargingDemandLineChart from '@/components/Admin/charts/ChargingDemandLineChart/ChargingDemandLineChart';
import DelayStageBarChart from '@/components/Admin/charts/DelayStageBarChart/DelayStageBarChart';
import type { FeatureCollection, Point } from 'geojson';
import { WeekdayDemand } from '@/types/dto';

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

  // '실시간 충전소 상태'
  const statStatus = [
    {color: '#4FA969',status: '충전대기', cnt: '800', percentage: '65%' },
    {color: '#f59e0b',status: '충전중', cnt: '288', percentage: '20%' },
    {color: '#ef4444',status: '고장', cnt: '20', percentage: '5%' },
    {color: '#3b82f6',status: '점검', cnt: '13', percentage: '10%' },
  ]

const forecastData = [
  // { date: '2025-07-21', demand: 120 },
  // { date: '2025-07-22', demand: 135 },
  // { date: '2025-07-23', demand: 110 },
  // { date: '2025-07-24', demand: 98 },
  // { date: '2025-07-25', demand: 115 },
  // { date: '2025-07-26', demand: 140 },
  // { date: '2025-07-27', demand: 162 },
  // { date: '2025-07-28', demand: 180 },
  // { date: '2025-07-29', demand: 167 },
  // { date: '2025-07-30', demand: 148 },
  // { date: '2025-07-31', demand: 145 },
  // { date: '2025-08-01', demand: 140 },
  // { date: '2025-08-02', demand: 134 },
  // { date: '2025-08-03', demand: 122 },
  // { date: '2025-08-04', demand: 108 },
  // { date: '2025-08-05', demand: 122 },
  // { date: '2025-08-06', demand: 107 },
  // { date: '2025-08-07', demand: 124 },
  // { date: '2025-08-08', demand: 131 },
  // { date: '2025-08-09', demand: 113 },
  // { date: '2025-08-10', demand: 94 },
  // { date: '2025-08-11', demand: 90 },
  // { date: '2025-08-12', demand: 90 },
  // { date: '2025-08-13', demand: 90 },
  // { date: '2025-08-14', demand: 102 },
  // { date: '2025-08-15', demand: 120 },
  // { date: '2025-08-16', demand: 101 },
  // { date: '2025-08-17', demand: 116 },
  // { date: '2025-08-18', demand: 108 },
  // { date: '2025-08-19', demand: 122 },
  // { date: '2025-08-20', demand: 128 }
  { chgerId: 'CSCS2015', week: 'Monday', demand: 19.776451612903223 },
  { chgerId: 'CSCS2015', week: 'Tuesday', demand: 27.214499999999994 },
  { chgerId: 'CSCS2015', week: 'Wednesday', demand: 22.267000000000003 },
  { chgerId: 'CSCS2015', week: 'Thursday', demand: 21.98606060606061 },
  { chgerId: 'CSCS2015', week: 'Friday', demand: 23.62666666666667 },
  { chgerId: 'CSCS2015', week: 'Saturday', demand: 22.694242424242432 }
  ];

export default function page() {
  const [token] = useAtom(accessTokenAtom);
  const [heatmapDt, setHeatmapDt] = useState<ActualChargingStationData[] | null>(null);
  const [statGraphDt, setStatGraphDt] = useState<WeekdayDemand[] | null>(null);
  


  // 1. 히트맵 데이터 요청(초기값 필요)
  const getHeatmapData = useCallback(async(filter: HeatmapFilter) => {
    console.log('[Dashboard] 1. 히트맵 정보요청')
    const requestBody = {
      local: '금정구',
      time: '2025-07-26T06:00:00.000Z',
    }

    console.log('히트맵 요청: ', requestBody);
    try{
      const res = await axios.post<ActualChargingStationData[]>(`http://${process.env.NEXT_PUBLIC_BACKIP}:8080/pred/location`,
        requestBody,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      setHeatmapDt(res.data); //🍕 res.data로 변경
    } catch(error) {
      console.error('getHeatmapData 에러: ', error)
    }
  },[])


  // 1-2. 히트맵 데이터 가공
  const points = useMemo(()=>{
    if (!heatmapDt || heatmapDt.length === 0) {
      return null;
    }
    
    const features = DummiesResp.map((stat)=>({  //🍕 heatmapDt로 변경
          type: 'Feature'as const,
          geometry: {type: 'Point'as const, coordinates: [stat.lng, stat.lat] as [number, number]},
          properties: {
            id: stat.statId,
            name: stat.statNm,
            addr: stat.addr,
            busiNm: stat.busiNm,
            demand: stat.chargingDemand
          }
        }
    ));

    const featureCollection: FeatureCollection<Point, {id: string; name: string; addr: string; busiNm: string; demand: number;}> = {
      type: 'FeatureCollection',
      features: features
    }

    return featureCollection;
  }, [heatmapDt]);


  // 2. 라인그래프(충전소) 데이터
  const getStatGraphData = async(statId: string) => {
    
    try{
      const res = await axios.post<WeekdayDemand[]>(`http://${process.env.NEXT_PUBLIC_BACKIP}:8080/static/weekdays?statId=${statId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      setStatGraphDt(res.data); //res.data
      console.log(res.data);
    } catch(error) {
      console.error('getStatData 에러: ', error)
    }
  }
  
  // 2-1. 라인그래프 데이터 가공
  
  console.log('getStatGraphData is a:', typeof getStatGraphData);

  return (
    <div className={style.dashboard_page}>
      {/* 대시보드 헤더 */}
      <div className={style.dashboard_header}>
        <div className={`${style.stat_card}`}>
          <h2 className={style.stat_value}>Dashboard</h2>
          <p className={style.stat_label}>June 25 - July 29, 2025</p>
        </div>
        {/* 상단 통계 */}
          <div className={style.stat_grid}>
            <div className={` ${style.stat_card}`}>
              <h2 className={style.stat_value}>7062</h2>
              <p className={style.stat_label}>전체 충전소 수</p>
            </div>
            <div className={` ${style.stat_card}`}>
              <h2 className={style.stat_value}>34</h2>
              <p className={style.stat_label}>사용중</p>
            </div>
            <div className={` ${style.stat_card}`}>
              <h2 className={style.stat_value}>2</h2>
              <p className={style.stat_label}>고장</p>
            </div>
            <div className={` ${style.stat_card}`}>
              <h2 className={style.stat_value}>34</h2>
              <p className={style.stat_label}>평균혼잡도</p>
            </div>
          </div>
      </div>
      {/* 메인 그리드 */}
      <main className={`${style.dashboard_grid} min-h-screen`}>
        {/* Map Preview */}
        <div className={`${style.nocard} col-span-3 lg:col-span-6]`}>
          <h2 className=''>실시간 충전소 상태</h2>
          <ul className='space-y-4 '>
            {statStatus.map((item, arr) => (
              <li className='grid grid-cols-2 text-[19px] pl-5
                            border-b border-[#f2f2f2] last:border-b-0 pb-4'>
                <div className='flex items-center '>
                  <div className={`w-2 h-2 rounded-full mr-3`} style={{backgroundColor: item.color}}></div>
                  <span>{item.status}</span>
                </div>
                <div className=' font-semibold text-right'>{item.cnt}대</div>
              </li>
            ))}
          </ul>

        </div>
        {/* <div className={`${style.card} relative z-20 col-span-4`}>
          <h2 className='mb-4'>충전소 혼잡도</h2>
          <div className={`text-[#718096] h-[450px] w-full flex  gap-8`}>
              <FilterGroup onFilterChange={getHeatmapData}/>
          </div>
        </div> */}

        <div className={`${style.card} col-span-9 lg:col-span-6 flex flex-col`}>
          <div className='flex-1 min-h-0'>
            <DemandHeatmap pointsDt={points} onSelectStat={getStatGraphData}/>
          </div>
        </div>

        <div className={`${style.card} ${style.card_borrowers}`}>
          <h2>충전소 수요예측</h2>
          <div className={`${style.card_content}`}>
            {/* <GuSelector/> */}
            <ChargingDemandLineChart />
          </div>
        </div>

        {/* Details (가로로 긴 카드) */}
        <div className={`${style.card} ${style.card_details} `}>
          <h2>충전후 출발지연 5단계</h2>
          <div className={`${style.card_content}`}>
            <DelayStageBarChart/>
          </div>
        </div>

        {/* New Request Trend */}
        <div className={`${style.card} ${style.card_trend} `}>
          <h2>New Request Trend</h2>
          <div className={`${style.card_content}`}>...차트 구현...</div>
        </div>
      </main>
    </div>
  )
}
