'use client'

import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Cell } from 'recharts';

/**
 * 차트 데이터 아이템 인터페이스
 */
interface StatusItem {
    /** 상태 명칭 (예: 충전중, 고장 등) */
    status: string;
    /** 해당 상태의 장비 수 */
    cnt: number;
    /** 차트에서 사용할 색상 코드 */
    color: string;
    /** 상태 고유 인덱스 */
    statIdx: number;
}

/**
 * StatusBarChart 컴포넌트 Props 인터페이스
 */
interface StatusBarChartProps {
    /** 실시간 상태 통계 데이터 배열 */
    data: StatusItem[];
}

/**
 * 충전기 실시간 상태 분포 바 차트 컴포넌트
 * 장비의 다양한 상태 비중을 단일 수평 스택 바(Stacked Bar) 형태로 시각화하며,
 * 전체 대비 점유율을 직관적으로 제공합니다.
 */
export default function StatusBarChart({ data }: StatusBarChartProps) {
    if (!data || data.length === 0) return null;

    /**
     * 전체 상태의 합계를 계산
     * @returns {number} 총 장비 수
     */
    const total = data.reduce((sum, item) => sum + item.cnt, 0);

    /**
     * Recharts의 Stacked Bar 레이아웃에 적합하도록 
     * 배열 데이터를 단일 행(Single Row) 객체 구조로 변환
     * @returns {Object[]} [{ 상태1: 값, 상태2: 값, ... }] 형식의 배열
     */
    const singleRowData = [{
        total: 100, // 백분율 기준 설정을 위한 베이스 값
        ...data.reduce((acc, item) => {
            acc[item.status] = item.cnt;
            return acc;
        }, {} as Record<string, number>)
    }];

    return (
        <div style={{ width: '100%', height: '40px' }}>
            <ResponsiveContainer>
                <BarChart
                    layout="vertical"
                    data={singleRowData}
                    stackOffset="expand"
                    margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                    barCategoryGap={0}
                >
                    {/* 축 설정: X축을 숫자형, Y축을 카테고리형으로 설정 후 숨김 */}
                    <XAxis type="number" hide />
                    <YAxis type="category" hide />
                    
                    {/* 동적 데이터 바 생성: 각 상태별 세그먼트 렌더링 */}
                    {data.map((item) => (
                        <Bar 
                            key={item.status}
                            dataKey={item.status}
                            stackId="status"
                            fill={item.color}
                        />
                    ))}
                </BarChart>
            </ResponsiveContainer>
            
            {/* {/* 하단 범례 영역 */}
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                gap: '15px', 
                marginTop: '10px',
                fontSize: '12px' 
            }}>
                {data.map((item) => (
                    <div key={item.status} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <div style={{
                            width: '12px',
                            height: '12px',
                            backgroundColor: item.color,
                            borderRadius: '2px'
                        }} />
                        <span>{item.status}: {item.cnt}</span>
                    </div>
                ))}
            </div>
            
            {/* 커스텀 스타일 (양 끝단 라운드 처리) */}
            <style jsx>{`
                .recharts-bar-rectangle:first-child {
                    border-radius: 10px 0 0 10px;
                }
                .recharts-bar-rectangle:last-child {
                    border-radius: 0 10px 10px 0;
                }
            `}</style>
        </div>
    );
}