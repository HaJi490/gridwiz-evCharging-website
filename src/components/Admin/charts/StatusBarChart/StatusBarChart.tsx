'use client'

import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Cell } from 'recharts';
import style from './StatusBarChart.module.css'

// 이 컴포넌트가 받을 props의 타입을 정의합니다.
interface StatusItem {
    status: string;
    cnt: number;
    color: string;
    statIdx: number;
}

interface StatusBarChartProps {
    data: StatusItem[];
}

export default function StatusBarChart({ data }: StatusBarChartProps) {
    if (!data || data.length === 0) {
        return null;
    }

    // 전체 합계 계산
    const total = data.reduce((sum, item) => sum + item.cnt, 0);
    
    // 누적 퍼센트를 포함한 데이터 생성
    let cumulative = 0;
    const chartData = data.map(item => {
        const percentage = (item.cnt / total) * 100;
        const result = {
            ...item,
            percentage,
            cumulative
        };
        cumulative += percentage;
        return result;
    });

    // 단일 행 데이터로 변환 (모든 값을 하나의 객체에)
    const singleRowData = [{
        total: 100,
        ...chartData.reduce((acc, item) => {
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
                    <XAxis type="number" hide />
                    <YAxis type="category" hide />
                    
                    {/* 각 상태별로 Bar 생성 */}
                    {data.map((item, index) => (
                        <Bar 
                            key={item.status}
                            dataKey={item.status}
                            stackId="status"
                            fill={item.color}
                            // 라운드 코너는 CSS로 처리하는 것이 더 안정적
                        />
                    ))}
                </BarChart>
            </ResponsiveContainer>
            
            {/* 범례 */}
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
            
            {/* CSS로 라운드 코너 적용 */}
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