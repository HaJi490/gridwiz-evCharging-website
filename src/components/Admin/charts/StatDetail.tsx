import { useMemo } from 'react'
import { ChargingStationResponseDto } from '@/types/dto'

interface StatDetailProps {
    statDetail: ChargingStationResponseDto;
}

/** 
 * 충전기 상태 코드별 UI 매핑 정보 (텍스트, 배경색, 폰트색, 포인트색)
 */
const STATUS_UI_MAP = {
    '1': { text: '통신이상', colorlst: { backgroundColor: '#FFE8EC', color: '#CE1C4C' }, dotColor: '#CE1C4C' },
    '2': { text: '충전대기', colorlst: { backgroundColor: '#D9F7E5', color: '#4FA969' }, dotColor: '#4FA969' },
    '3': { text: '충전중', colorlst: { backgroundColor: '#FFF4CC', color: '#B3751E' }, dotColor: '#B3751E' },
    '4': { text: '운영중지', colorlst: { backgroundColor: '#FFE8EC', color: '#CE1C4C' }, dotColor: '#CE1C4C' },
    '5': { text: '점검중', colorlst: { backgroundColor: '#F3E4FF', color: '#B05DEA' }, dotColor: '#B05DEA' },
    '9': { text: '상태미확인', colorlst: { backgroundColor: '#FFE8EC', color: '#CE1C4C' }, dotColor: '#CE1C4C' }
} as const;

/**
 * 충전소 개별 충전기 상세 현황 컴포넌트
 * 특정 충전소에 소속된 모든 충전기의 실시간 상태를 집계하여 요약 정보를 제공하고,
 * 각 장비별 마지막 통신 시간을 계산하여 리스트 형식으로 출력합니다.
 */
export default function StatDetail({ statDetail }: StatDetailProps) {
    /**
     * 충전기 목록 추출
     */
    const chargers = useMemo(() => Object.values(statDetail?.chargerInfo || {}), [statDetail])

    /** 
     * 실시간 충전기 상태별 수량 집계 
     * @returns {Record<string, number>} 키:상태 코드, 값: 개수인 객체
     */
    const statusCnt = useMemo(() => {
        return chargers.reduce((acc, charger) => {
            acc[charger.stat] = (acc[charger.stat] || 0) + 1;
            return acc;
        }, {} as Record<string, number>)
    }, [chargers]);

    /**
     * 서버로부터 받은 14자리 날짜 문자열(YYYYMMDDHHmmss)을 파싱하여 현재 시간과의 차이를 계산
     * @param {string} lastUpdDt - 마지막 업데이트 일시 문자열
     * @returns {string} 경과 시간 텍스트 (예: "3시간 전", "방금 전")
     */
    const getTimeDiffText = (lastUpdDt: string) => {
        if (!lastUpdDt || lastUpdDt.length !== 14) return '정보 없음';

        const year = parseInt(lastUpdDt.substring(0, 4));
        const month = parseInt(lastUpdDt.substring(4, 6)) - 1;
        const day = parseInt(lastUpdDt.substring(6, 8));
        const hour = parseInt(lastUpdDt.substring(8, 10));
        const minute = parseInt(lastUpdDt.substring(10, 12));

        const past = new Date(year, month, day, hour, minute);
        const now = new Date();
        const diffMs = now.getTime() - past.getTime();

        const diffSeconds = Math.floor(diffMs / 1000);
        const diffMinutes = Math.floor(diffSeconds / 60);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays >= 1) return `${diffDays}일 전`;
        if (diffHours >= 1) return `${diffHours}시간 ${diffMinutes % 60}분 전`
        if (diffMinutes >= 1) return `${diffMinutes}분 전`
        return '방금 전';
    }


    if (!statDetail) return <div className="p-6">충전소 세부 정보를 불러오는 중입니다...</div>

    return (
        <article className='flex flex-col h-full'>
            {/* 충전소 요약 정보 */}
            <header className='flex justify-between items-center mb-4'>
                <h3 className="font-medium">충전소 현황</h3>
                <div className='flex gap-5' role='status' aria-label='충전기 상태 요약'>
                    {Object.entries(statusCnt).map(([stat, count]) => {
                        if (count === 0) return null; 
                        const statusInfo = STATUS_UI_MAP[stat as keyof typeof STATUS_UI_MAP];
                        return (
                            <div key={stat} className="flex items-center gap-2">
                                <span className='w-2 h-2 rounded-full' style={{ backgroundColor: statusInfo.dotColor }}></span>
                                <span className='text-sm font-medium' style={{ color: statusInfo.dotColor }}>{count} 대</span>
                            </div>
                        )
                    })}
                </div>
            </header>

            <hr className='border-gray-100 mb-4' />

            {/* 개별 충전기 상세 리스트 */}
            <ul className='space-y-4 overflow-y-auto flex-1 min-h-0 custom-scrollbar-hide mb-10'>
                {chargers.map(c => {
                    const statusInfo = STATUS_UI_MAP[c.stat as keyof typeof STATUS_UI_MAP] || STATUS_UI_MAP['9'];
                    return (
                        <li key={c.chgerId} className='grid grid-cols-[1fr_auto_1fr] gap-4 items-center'>
                            <span className='font-mono text-gray-500 w-20'>{c.chgerId}</span>
                            <span className='px-3 py-1 text-xs font-bold rounded-full ' style={statusInfo.colorlst}>
                                {statusInfo.text}
                            </span>
                            <span className="text-sm text-gray-500 text-right">
                                {getTimeDiffText(c.lastTsdt)}
                            </span>
                        </li>
                    )
                })}
            </ul>
        </article>
    )
}
