'use client'
import React from 'react'
import {
    BarChart,
    Bar,
    XAxis,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import style from './DelayStageBarChart.module.css'



/**
 * 지연 시간 분석을 위한 5단계 샘플 데이터
 * stage: 지연 심각도 단계, count: 해당 단계에 속한 차량 대수
 */
const DELAY_DISTRIBUTION_DATA = [
    { stage: '5', count: 45 },
    { stage: '4', count: 80 },
    { stage: '3', count: 120 },
    { stage: '2', count: 75 },
    { stage: '1', count: 30 },
];

/**
 * 차트의 막대를 둥근 직사각형(Rounded Rectangle)으로 렌더링하기 위한 커스텀 도형 컴포넌트
 * @param {any} props - Recharts에서 전달하는 막대의 위치(x, y), 크기(width, height) 및 색상(fill) 정보
 * @returns {JSX.Element} SVG 기반의 커스텀 렌더링 요소
 */
const RoundedBar = (props: any) => {
    const { x, y, width, height, fill } = props;
    const radius = 12;

    return (
        <g>
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                fill={fill}
                rx={radius}
                ry={radius}
            />
        </g>
    )
};

/**
 * 차트 아이템 호버 시 노출되는 커스텀 툴팁 컴포넌트
 * @param {boolean} active - 툴팁 활성화 여부
 * @param {any[]} payload - 현재 마우스가 위치한 지점의 데이터 배열
 * @returns {JSX.Element | null} 가공된 툴팁 UI 또는 null
 */
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className={style.custom_barchart_tooltip}>
                <p className={style.tooltip_value}>{`${payload[0].value} 대`}</p>
            </div>
        );
    }
    return null;
}

/**
 * 지연 단계별 분포 바 차트 컴포넌트
 * 관리자 대시보드에서 차량 지연 현황을 직관적으로 파악하기 위해 사용되며,
 * 시각적 몰입감을 위해 그라데이션과 커스텀 SVG 쉐이프가 적용되었습니다.
 */
export default function DelayStageBarChart() {
    return (
        <div className='w-full h-[300px]'>
            <ResponsiveContainer>
                <BarChart data={DELAY_DISTRIBUTION_DATA} margin={{ top: 40, right: 20, left: 20, bottom: 5 }}>
                    
                    {/* 그라데이션 정의 */}
                    <defs>
                        <linearGradient id='barGradient' x1='0' y1='0' x2='0' y2='1'>
                            <stop offset='0%' stopColor='#8884d8' stopOpacity={1} />
                            <stop offset='100%' stopColor='#8884d8' stopOpacity={0.01} />
                        </linearGradient>
                    </defs>
                    
                    {/* X축 설정: 단계별 텍스트 출력*/}
                    <XAxis dataKey='stage'
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fill: '#888888' }} fontSize={12}
                    />
                    
                    {/* 인터랙티브 요소 */}
                    <Tooltip content={<CustomTooltip />}
                        cursor={{ fill: 'transparent' }}
                    />
                    {/* 데이터 시각화 */}
                    <Bar dataKey='count'
                        fill='url(#barGradient)'
                        shape={<RoundedBar />}
                        activeBar={<RoundedBar />}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}
