'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'

import StationDetailPanal from '../StationDetailPanal/StationDetailPanal';
import FilterModal from '@/components/Filter/FilterModal';
import Toast from '@/components/Toast/Toast';
import { StationListItem } from '@/types/dto';
import { Filters } from '@/types/station/station.type';
import style from './StationListPanel.module.css';
import { FiFilter, FiSearch } from "react-icons/fi";

/**
 * StationListPanel 컴포넌트 Props 인터페이스
 */
interface StationListModalProps {
  /** 검색 결과 충전소 목록 데이터 */
  list: StationListItem[];
  /** 현재 적용 중인 필터 데이터 */
  currentFilter: Filters;
  /** 필터 변경 시 호출되는 콜백 함수 (위경도 제외) */
  onFilterChange: (filters: Omit<Filters, 'lat' | 'lon'>) => void;
  /** 특정 충전소 선택 시 호출되는 콜백 함수 */
  onStationClick: (station: StationListItem | null) => void;
  /** 키워드 검색 시 호출되는 콜백 함수 */
  onSearch: (keyword: string) => void;
  /** 현재 선택된 충전소 정보 */
  selectedStation: StationListItem | null;
  /** 선택이 발생한 소스 (목록 클릭 또는 지도 마커 클릭) */
  selectionSource: 'list' | 'map' | null;
}

/**
 * 충전소 탐색을 위한 사이드 패널 컴포넌트
 * 
 * 주요 기능:
 * 1. 실시간 키워드 검색 및 통합 필터 모달 연동
 * 2. 충전소 목록 렌더링 및 상태(급속/완속 수량) 시각화
 * 3. 지도-목록 간 양방향 인터랙션 (지도 마커 클릭 시 해당 목록 위치로 자동 스크롤)
 * 4. 선택된 충전소의 상세 정보 패널(StationDetailPanel) 제어
 */
export default function StationListPanel({
  list,
  currentFilter,
  onFilterChange,
  onStationClick,
  onSearch,
  selectedStation,
  selectionSource
}: StationListModalProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const searchRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLUListElement>(null);

  /**
  * 입력된 키워드를 바탕으로 검색을 수행
  */
  const handleSearchSubmit = () => {
    const keyword = searchRef.current?.value || '';
    onSearch(keyword);
  }

  /**
   * 필터 모달에서 적용된 설정을 부모 컴포넌트로 전파
   * @param {Omit<Filters, 'lat' | 'lon'>} newFilters - 새로 설정된 필터 객체
   * @param {string} msg - 필터 적용 후 사용자에게 보여줄 안내 메시지
   */
  const handleApplyFilters = (newFilters: Omit<Filters, 'lat' | 'lon'>, msg?: string) => {
    if (msg) setToastMessage(msg);
    setIsFilterOpen(false);
    onFilterChange(newFilters);
  }

  /**
  * 필터 버튼 클릭 시 상세 패널을 닫고 필터 설정창을 엶
  */
  const handleOpenFilter = () => {
    onStationClick(null);
    setIsFilterOpen(true);
  }


  /**
  * 지도 마커 클릭 시 해당 리스트 아이템으로 자동 스크롤되는 로직
  */
  useEffect(() => {
    if (selectedStation && selectionSource === 'map' && listRef.current) {
      // DOM 업데이트 대기 후 스크롤 실행
      setTimeout(() => {
        const selectedElement = listRef.current.querySelector(`[data-station-id="${selectedStation.statId}"]`);
        if (selectedElement) {
          selectedElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [selectedStation, selectionSource])

  return (
    <>
      <Toast message={toastMessage} setMessage={setToastMessage} />
      {/* 모달 컨텐츠 */}
      <aside aria-label="충전소 탐색 패널" className='w-[440px] h-full flex flex-col p-7 bg-white shadow-md overflow-hidden'>
        {/* 검색 및 필터 버튼 */}
        <header className='p-5 border-b border-gray-100 bg-white z-10'>
          <div className='flex gap-3 items-center'>
            <div role='search' className={`${style.searchInput} flex-1`}>
              <input
                type='text'
                aria-label='충전소 검색어 입력'
                ref={searchRef}
                placeholder='충전소 명칭 검색'
                className='outline-none'
                onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
              />
              <button className={`${style.searchBtn}`} onClick={() => { handleSearchSubmit() }}>
                <FiSearch size={20} />
              </button>
            </div>
            <button
              type='button'
              aria-label='검색 실행'
              onClick={handleOpenFilter}
              className={`${style.searchBtn} h-8`}
            >
              <FiFilter size={20} />
            </button>
            <FilterModal
              isOpen={isFilterOpen}
              onClose={() => setIsFilterOpen(false)}
              onApplyFilters={handleApplyFilters}
              initialFilters={currentFilter}
            />
          </div>
        </header>

        {/* 결과 리스트 영역 */}
        <ul role='list' ref={listRef} className='scrollContent'>
          {list.length > 0
            ? list.map((item, idx) => {
              return (
                <li
                  key={`${idx}-${item.statId}`}
                  data-station-id={item.statId}
                  role='listitem'
                  className={`${style.listSection} ${selectedStation?.statId === item.statId ? style.selected : ''}`}
                  onClick={() => onStationClick(item)}
                >
                  <article className='flex flex-col gap-1 w-full'>
                    <div className='flex gap-1 text-[12px]'>
                      <span className={item.parkingFree ? style.badgetrue : style.badgefalse}>
                        {item.parkingFree ? '무료주차' : '유료주차'}
                      </span>
                      <span className={item.limitYn ? style.badgetrue : style.badgefalse}>
                        {item.limitYn ? '개방' : '비개방'}
                      </span>
                    </div>
                    <h2 className=' text-[#232323]'>{item.statNm}</h2>
                    <p className='text-[12px] text-[#666]'>{item.addr}</p>

                    <div aria-label='충전기 현황' className='w-fit bg-[#f2f2f2] px-2 flex gap-1 rounded-md'>
                      {[
                        { label: '급속', total: item.totalFastNum, current: item.chargeFastNum },
                        { label: '중속', total: item.totalMidNum, current: item.chargeMidNum },
                        { label: '완속', total: item.totalSlowNum, current: item.chargeSlowNum }
                      ].map(type => type.total > 0 && (
                        <div className='text-[12px] font-bold'>
                          <span className='mr-1'>{type.label}</span>
                          <span className='text-[#4FA969]'>{type.current} </span>
                          <span className='text-[#b6b6b6]'>/ {type.total}</span>
                        </div>
                      ))}
                    </div>
                  </article>
                </li>
              )
            })
            : <li className="py-20 text-center text-gray-400 text-sm">검색 결과가 없습니다.</li>
          }
        </ul>

        {/* 선택된 충전소 상세 정보 레이어 */}
        {selectedStation && (
          <StationDetailPanal
            selectedStation={selectedStation}
            onClose={() => onStationClick(null)}
            selectionSource={selectionSource}
          />
        )}
      </aside>
    </>
  )
}
