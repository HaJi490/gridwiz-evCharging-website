'use client'

import React from 'react'
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

  // 1. 한달 수요 예측 데이터
  const forecastData = [
  { stationLocation: 'CSCS2015', dayOfWeek: 'Monday', kwhRequest: 19.776451612903223 },
  { stationLocation: 'CSCS2015', dayOfWeek: 'Tuesday', kwhRequest: 27.214499999999994 },
  { stationLocation: 'CSCS2015', dayOfWeek: 'Wednesday', kwhRequest: 22.267000000000003 },
  { stationLocation: 'CSCS2015', dayOfWeek: 'Thursday', kwhRequest: 21.98606060606061 },
  { stationLocation: 'CSCS2015', dayOfWeek: 'Friday', kwhRequest: 23.62666666666667 },
  { stationLocation: 'CSCS2015', dayOfWeek: 'Saturday', kwhRequest: 22.694242424242432 }
  ];

  const dayKor = {
    Sunday: '일',
    Monday: '월',
    Tuesday: '화',
    Wednesday: '수',
    Thursday: '목',
    Friday: '금',
    Saturday: '토',
  };

  // 한글 요일 정렬 기준
  const korDayOrder = ['일', '월', '화', '수', '목', '금', '토'];


  // 2. 마우스를 올렸을 때 보여줄 커스텀 툴팁 컴포넌트
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={style.custom_tooltip}>
          <p className={style.custom_label}>{`수요량: ${payload[0].value.toFixed(3)}`}</p>
          <p className={style.custom_intro}>{`요일: ${label}`}</p>
        </div>
      );
    }
    return null;
  };

  interface ChargingDemandLineChartProps {
    statData: WeekdayDemand[]
  }

export default function ChargingDemandLineChart({statData}: ChargingDemandLineChartProps) {

  // 3. 차트 클릭 시 실행될 함수
  const handleChartClick = (chartState: any) => {
    // chartState.activePayload: 클릭된 지점의 데이터가 배열
    if (chartState && chartState.activePayload && chartState.activePayload.length > 0) {  
      // 2. 콘솔에 전체 상태 객체를 찍어 구조를 확인해봅니다.
      console.log("--- Recharts가 전달한 전체 상태 객체 (chartState) ---");
      console.log(chartState);

      const clickedData = chartState.activePayload[0].payload;
      console.log("--- 클릭된 지점의 원본 데이터 (clickedDataPayload) ---");
      console.log('클릭된 데이터:', clickedData);
      
      // 여기에 백엔드로 데이터를 보내는 로직을 추가
      // 예: sendDataToBackend(clickedData);
      alert(`선택된 날짜: ${clickedData.date}, 수요량: ${clickedData.demand}`);
    } else {
      // 빈 공간을 클릭했을 때
      console.log("차트의 데이터 포인트가 아닌 빈 공간이 클릭되었습니다.");
    }
  };

  // 데이터 변환 + 정렬(요일)
  const converted = statData?.map( item => {
    const kor = dayKor[item.dayOfWeek];

    return {
      ...statData,
      dayOfWeek: kor,
    }
  }).sort((a, b) => korDayOrder.indexOf(a.dayOfWeek) - korDayOrder.indexOf(b.dayOfWeek));

  console.log('데이터변환, 정렬: ', converted);


  return (
    <div className='w-full h-[350px]'>
      <ResponsiveContainer>
        <AreaChart data={statData} onClick={handleChartClick} 
                  margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>

          {/* 그라데이션 효과 정의 */}
          <defs>
            <linearGradient id='colorDemand' x1='0' y1='0' x2='0' y2='1'>
              <stop offset='5%' stopColor='#4FA969' stopOpacity={0.8}/>
              <stop offset='95%' stopColor='#4FA969' stopOpacity={0}/>
            </linearGradient>
          </defs>

          {/* X축 (날짜). tickFormatter로 날짜 형식을 보기 좋게 변경 */}
          <XAxis dataKey='dayOfWeek' //tickFormatter={(week)=>dayKor(week)}        // (dateStr) => new Date(dateStr).getDate() + '일'
                tick={{fill: '#888888'}} fontSize={12} dy={10}/>

          {/* y축(수요량) */}
          <YAxis tick={{fill: '#888888'}} fontSize={12}/>

          {/* 배경그리드 */}
          <CartesianGrid strokeDasharray={'3 3'} vertical={false}/>

          {/* 커스텀 툴팁 연결 _ 컴포넌트? */}
          <Tooltip content={<CustomTooltip/>} /> 

          {/* 실제 그래프를 그리는 Area컴포넌트 */}
          <Area type='monotone'
              dataKey='kwhRequest'
              stroke='#4FA969'
              strokeWidth={3}
              fillOpacity={1}
              fill='url(#colorDemand)' // 위에서 정의한 그라데이션 id
              activeDot={{r:8, stroke: '#fff', strokeWidth: 2}} // 활성화된 점 스타일
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
