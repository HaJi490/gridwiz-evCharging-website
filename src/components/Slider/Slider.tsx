'use client'

import { useState, useRef } from 'react'
import style from './Slider.module.css'

interface sliderProps{
  setRange: (range: number) => void;
}
const max = 50000
const min = 1000

export default function Slider({setRange}: sliderProps) {
  // const [minValue, setMinValue] = useState<number>(min);
  const [maxValue, setMaxValue] = useState<number>(max);

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(Number(e.target.value), min + 1000); //최소간격 확보
    setMaxValue(value);
    setRange(maxValue);
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
            left: 0, //`${(minValue / max) * 100}%`,
            right: `${100 - (maxValue / max) * 100}%`,
            pointerEvents: 'none', 
          }}
        />
        {/* 슬라이더 입력 */}
        <input
          type="range"
          min={min}
          max={max}
          value={maxValue}
          step="1000"
          onChange={handleMaxChange}
          className={style.handleChg}
          style={{ zIndex: 2 }}
        />
      </div>
      <div className="flex justify-between text-sm text-gray-600 mb-1">
        <span>1km</span>
        <span>50km</span>
        {/* <span>{minValue === 0 ? '완속' : `${minValue}kW`}</span>
        <span>{maxValue >= 300 ? '300kW+' : `${maxValue}kW`}</span> */}
      </div>
      <p className="mt-2 text-sm text-gray-500">
        선택 범위: 
        {/* {minValue === 0 ? '완속' : `${minValue}kW`} ~{' '} */}
        1km~
        {maxValue >= 50000 ? `${maxValue / 1000}km(max)` : `${maxValue / 1000}km`}
      </p>
    </div>
  )
}
