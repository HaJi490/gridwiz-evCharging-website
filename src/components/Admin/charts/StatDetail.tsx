import React from 'react'
import { ChargingStationResponseDto } from '@/types/dto'

interface statDetailProps {
    statDetail: ChargingStationResponseDto;
}

const statusMap = {
    '1': {
        text: '통신이상',
        colorlst: { backgroundColor: '#FFE8EC', color: '#CE1C4C' },
        dotColor: '#CE1C4C'
    },
    '2': {
        text: '충전대기',
        colorlst: { backgroundColor: '#D9F7E5', color: '#4FA969' },
        dotColor: '#4FA969'
    },
    '3': {
        text: '충전중',
        colorlst: { backgroundColor: '#FFF4CC', color: '#B3751E' },
        dotColor: '#B3751E'
    },
    '4': {
        text: '운영중지',
        colorlst: { backgroundColor: '#FFE8EC', color: '#CE1C4C' },
        dotColor: '#CE1C4C'
    },
    '5': {
        text: '점검중',
        colorlst: { backgroundColor: '#F3E4FF', color: '#B05DEA' },
        dotColor: '#B05DEA'
    },
    '9': {
        text: '상태미확인',
        colorlst: { backgroundColor: '#FFE8EC', color: '#CE1C4C' },
        dotColor: '#CE1C4C'
    }
} as const;

export default function StatDetail({ statDetail }: statDetailProps) {
    const chargers = Object.values(statDetail.chargerInfo);

    // 각 충전기 개수 계산
    const statusCnt = chargers.reduce((acc, charger) => {
        acc[charger.stat] = (acc[charger.stat] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const getTimeDiffText = (lastUpdDt: string) => {
        if (!lastUpdDt || lastUpdDt.length !== 14) return '정보 없음';

        const year = parseInt(lastUpdDt.substring(0, 4))
        const month = parseInt(lastUpdDt.substring(4, 6)) - 1
        const day = parseInt(lastUpdDt.substring(6, 8))
        const hour = parseInt(lastUpdDt.substring(8, 10))
        const minute = parseInt(lastUpdDt.substring(10, 12))

        const past = new Date(year, month, day, hour, minute);
        const now = new Date();
        const diffMs = now.getTime() - past.getTime();

        const diffSeconds = Math.floor(diffMs / 1000);
        const diffMinutes = Math.floor(diffSeconds / 60);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays >= 1) {
            return `${diffDays}일 전`;
        } else if (diffHours >= 1) {
            return `${diffHours}시간 ${diffMinutes % 60}분 전`
        } else if (diffMinutes >= 1) {
            return `${diffMinutes}분 전`
        } else {
            return '방금 전';
        }

    }

    if (!statDetail) {
        return <div className="p-6">충전소 세부 정보를 불러오는 중입니다...</div>;
    }

    return (
        <div className='flex flex-col h-full'>
            <header className='flex justify-between items-center mb-4'>
                <span className="font-medium">충전소 현황</span>
                <div className='flex gap-5'>
                    {Object.entries(statusCnt).map(([stat, count]) => {
                        if (count === 0) return null;  // 0개는 표시하지않음
                        const statusInfo = statusMap[stat as keyof typeof statusMap];
                        
                        return (
                            <div key={stat} className="flex items-center gap-2">
                                <span className='w-2 h-2 rounded-full' style={{ backgroundColor: statusInfo.dotColor }}></span>
                                <span className='text-sm font-medium' style={{ color: statusInfo.dotColor }}>{count} 대</span>
                            </div>
                        )
                    })}
                </div>
            </header>

            {/* 구분선 */}
            <hr className='border-gray-100 mb-4' />

            {/* 충전기 목록*/}
            <main className='space-y-4 overflow-y-auto flex-1 min-h-0 custom-scrollbar-hide mb-10'>
                {chargers.map(c => {
                    // 충전기 상태정보
                    const statusInfo = statusMap[c.stat as keyof typeof statusMap] || statusMap['9'];

                    return (
                        <div key={c.chgerId} className='grid grid-cols-[1fr_auto_1fr] gap-4 items-center'>
                            <span className='font-mono text-gray-500 w-20'>{c.chgerId}</span>
                            <span className='px-3 py-1 text-xs font-bold rounded-full ' style={ statusInfo.colorlst }>
                                {statusInfo.text}
                            </span>
                            <span className="text-sm text-gray-500 text-right">
                                {getTimeDiffText(c.lastTsdt)}
                            </span>
                        </div>
                    )
                })}
            </main>
        </div>
    )
}
