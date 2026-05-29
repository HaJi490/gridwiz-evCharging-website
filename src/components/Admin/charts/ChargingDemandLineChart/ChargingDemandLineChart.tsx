'use client'

import {useMemo} from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

import { WeekdayDemand } from '@/types/dto';
import style from './ChargingDemandLineChart.module.css'

/**
* 영문 요일 명칭을 한글 약어로 매핑하는 객체
*/
const DAY_KOR_MAP = {
  Sunday: '일',
  Monday: '월',
  Tuesday: '화',
  Wednesday: '수',
  Thursday: '목',
  Friday: '금',
  Saturday: '토',
};

/**
 * 차트 출력 시 요일별 정렬 순서를 정의하는 상수 (일요일부터 토요일 순)
 */
const KOR_DAY_ORDER = ['일', '월', '화', '수', '목', '금', '토'];


/**
 * 차트 마우스 오버 시 노출되는 커스텀 툴팁 컴포넌트
 * @param {boolean} active - 툴팁 활성화 여부
 * @param {any[]} payload - 현재 포인트의 데이터 세트
 * @param {string} label - 현재 포인트의 X축 레이블(요일)
 */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className={style.custom_tooltip}>
        <p className={style.custom_label}>{`수요량: ${payload[0].value.toFixed(3)} kWh`}</p>
        <p className={style.custom_intro}>{`요일: ${label}요일`}</p>
      </div>
    );
  }
  return null;
};

interface ChargingDemandLineChartProps {
  /** 충전소별 요일별 수요 예측 데이터 배열 */
  statData: WeekdayDemand[]
}


/**
 * 충전소 수요 예측 라인(영역) 차트 컴포넌트
 * 특정 충전소의 주간 수요 패턴을 시각화하며, 데이터 클릭 및 호버 인터랙션을 제공합니다.
 */
export default function ChargingDemandLineChart({ statData }: ChargingDemandLineChartProps) {

  /**
   * 차트의 데이터 포인트를 클릭했을 때 상세 정보를 처리하는 핸들러
   * @param {any} chartState - Recharts에서 전달하는 클릭 시점의 상태 객체
   */
  const handleChartClick = (chartState: any) => {
    if (chartState && chartState.activePayload && chartState.activePayload.length > 0) {
      const clickedData = chartState.activePayload[0].payload;
      alert(`선택된 날짜: ${clickedData.date}, 수요량: ${clickedData.demand}`);
    }
  };

  /**
   * 서버로부터 받은 데이터를 차트 표시에 적합하도록 한글화 및 정렬 수행
   * @returns {Array} 요일 순서로 정렬된 차트용 데이터 배열
   */
  const processedData = useMemo(() => {
        if (!statData) return [];

        return statData
            .map(item => ({
                ...item,
                dayOfWeek: DAY_KOR_MAP[item.dayOfWeek] || item.dayOfWeek,
            }))
            .sort((a, b) => KOR_DAY_ORDER.indexOf(a.dayOfWeek) - KOR_DAY_ORDER.indexOf(b.dayOfWeek));
    }, [statData]);


  return (
    <div className='w-full h-[350px]'>
      <ResponsiveContainer>
        <AreaChart 
          data={processedData} 
          onClick={handleChartClick}
          margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
        >

          {/* 그라데이션 정의 */}
          <defs>
            <linearGradient id='colorDemand' x1='0' y1='0' x2='0' y2='1'>
              <stop offset='5%' stopColor='#4FA969' stopOpacity={0.8} />
              <stop offset='95%' stopColor='#4FA969' stopOpacity={0} />
            </linearGradient>
          </defs>

          {/* 그리드 설정 */}
          <CartesianGrid strokeDasharray={'3 3'} vertical={false} />

          {/* X축: 요일 정보 */}
          <XAxis dataKey='dayOfWeek'
            tick={{ fill: '#888888' }} fontSize={12} dy={10} />

          {/* Y축: kWh 수요량 */}
          <YAxis tick={{ fill: '#888888' }} fontSize={12} />


          {/* 인터랙티브 요소 */}
          <Tooltip content={<CustomTooltip />} />

          {/* 데이터 시각화 */}
          <Area type='monotone'
            dataKey='kwhRequest'
            stroke='#4FA969'
            strokeWidth={3}
            fillOpacity={1}
            fill='url(#colorDemand)'
            activeDot={{ r: 8, stroke: '#fff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
