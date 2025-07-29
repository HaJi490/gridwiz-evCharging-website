'use client'

import { useState, useRef } from 'react'
import style from './Slider.module.css'

interface sliderProps{
  min: number;
  max: number;
  setMinMax: (min: number, max: number) => void; 
}
const totalMax = 300
const totalMin = 0

export default function Slider({min, max, setMinMax}: sliderProps) {
  // 1. 핸들 값 업데이트
  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.min(Number(e.target.value), max - 50); //최소간격 확보
    // setMinValue(value);
    setMinMax(value, max); //setMinValue가 비동기함수여서 minValue로 넣으면 적용안될수있음
  }
  
  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(Number(e.target.value), min + 50); //최소간격 확보
    // setMaxValue(value);
    setMinMax(min, value);
  }

  return (
    <div className="w-full px-4">
      
      <div className="relative h-6">
        {/* 트랙 */}
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-300 rounded-full -translate-y-1/2" />
        {/* 선택된 범위 */}
        <div
          className="absolute top-1/2 h-1 bg-[#4FA969] rounded-full -translate-y-1/2"
          style={{
            left: `${(min / totalMax) * 100}%`,
            right: `${100 - (max / totalMax) * 100}%`,
            pointerEvents: 'none', 
          }}
        />
        {/* 슬라이더 입력 */}
        <input
          type="range"
          min={totalMin}
          max={totalMax}
          value={min}
          step="50"
          onChange={handleMinChange}
          className={style.handleChg}
          style={{ zIndex: 3 }}
        />
        <input
          type="range"
          min={totalMin}
          max={totalMax}
          value={max}
          step="50"
          onChange={handleMaxChange}
          className={style.handleChg}
          style={{ zIndex: 2 }}
        />
      </div>
      <div className="flex justify-between text-sm text-gray-600 mb-1">
        <span>완속</span>
        <span>300kW+</span>
      </div>
      <p className="mt-2 text-sm text-gray-500">
        선택 범위: {min === 0 ? '완속' : `${min}kW`} ~{' '}
        {max >= 300 ? '300kW+' : `${max}kW`}
      </p>
    </div>
  )
}
