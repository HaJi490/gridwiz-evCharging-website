'use client'

import React from 'react'

interface TooltipProps {
    content: Record<string, number>;    // { '통신이상': 20, '운영중지': 42, ... } 형태의 객체
    position: { top: number; left: number };
}

export default function Tooltip({ content, position }: TooltipProps) {
    if (!position.top && !position.left) {
        return null;
    }

    return (
        <div
            className="absolute bg-gray-800 text-white text-xs rounded-md p-3 shadow-lg z-50 transition-opacity duration-200 pointer-events-none"
            // position state로부터 위치를 받아와 style을 적용
            style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
            }}
        >
            <ul className="space-y-1">
                {/* content 객체를 배열로 변환하여 각 항목을 렌더링 */}
                {Object.entries(content).map(([key, value]) => (
                    <li key={key} className="flex justify-between">
                        <span>{key}</span>
                        <span className="font-semibold ml-4">{value} 대</span>
                    </li>
                ))}
            </ul>
        </div>
    )
}
