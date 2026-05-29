import { useState, useEffect, useCallback } from 'react'

/**
 * TimeFilter 컴포넌트의 Props 인터페이스
 */
interface TimeFilterProps {
    /** 부모 컴포넌트에서 관리되는 현재 시간 값 (0~24) */
    value: number;
    /** 슬라이더 조작이 완료되었을 때 호출되는 콜백 함수 */
    onTimeSelect: (time: number) => void;
    /** 상단 레이블(선택된 시간 표시) 노출 여부 */
    showLabel? : boolean;
    /** 슬라이더 최소값 (기본값: 0) */
    min?: number;
    /** 슬라이더 최대값 (기본값: 24) */
    max?: number;
}

/**
 * 시간 선택 레인지 슬라이더 컴포넌트
 * 사용자가 바를 드래그하여 직관적으로 시간을 설정할 수 있습니다.
 */
export default function TimeFilter({
    value, 
    onTimeSelect, 
    showLabel = true,
    min = 0, 
    max = 24
}:TimeFilterProps ) {
    const [localTime, setLocalTime] = useState<number>(value);
    
    /**
     * 부모에서 value가 변경될 시 로컬 상태 동기화
     */
    useEffect(() => {
        setLocalTime(value);
    }, [value]);


    /**
     * 슬라이더 입력 시 로컬 상태를 즉시 업데이트
     * @param {React.ChangeEvent<HTMLInputElement>} event - 입력 이벤트 객체
     */
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setLocalTime(parseInt(event.target.value, 10));
    };
    
    /**
     * 조작 완료 시점을 감지하여 부모에게 값을 전달
     * 마우스 업(MouseUp)뿐만 아니라 키보드 조작(KeyUp)에도 대응합니다.
     */
    const handleMouseUp = () => {
        onTimeSelect(localTime);
    }

    return (
        <section aria-label="시간 선택 필터" className="flex flex-col w-full max-w-sm">
            {showLabel &&
                <label htmlFor="hour-slider" className="mb-2 font-semibold">
                    선택된 시간: {value}시간 후
                </label>
            }
            <div className="relative h-6 flex items-center">
                {/* 전체 트랙 */}
                <div aria-hidden="true" className="absolute w-full h-1 bg-gray-300 rounded-full" />
                
                {/* 선택된 범위 트랙*/}
                <div 
                    className="absolute h-1 bg-[#4FA969] rounded-full"
                    style={{ width: `${(localTime / max) * 100}%` }} // 너비를 동적으로 조절
                />

                <input
                    id="hour-slider"
                    type="range"
                    min={min}
                    max={max }
                    step={1}
                    value={localTime}
                    onChange={handleChange}
                    onMouseUp={handleMouseUp}
                    className={`handleChg`}
                    style={{ zIndex: 2 }}
                    aria-valuemin={min}
                    aria-valuemax={max}
                    aria-valuenow={localTime}
                    aria-valuetext={`${localTime}시`}
                />
            </div>

            {/* 슬라이더 하단 가이드 텍스트 */}
            <div aria-hidden="true" className="flex justify-between text-xs mt-1">
                <span>0:00</span>
                <span>{max/2}:00</span>
                <span>{max}:00</span>
            </div>
        </section>
    )
}
