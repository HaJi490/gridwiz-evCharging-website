'use client'

import React, {useState, useRef, useEffect} from 'react'

// import FilterModal from '../Filter/FilterModal';
import StationDetailPanal from '../StationDetailPanal/StationDetailPanal';
import FilterModal from '@/components/Filter/FilterModal';
import Toast from '@/components/Toast/Toast';
import { StationListItem } from '@/types/dto';
import nmToid from '../../../db/busi_id.json';
import style from './StationListPanel.module.css';
import { FiFilter } from "react-icons/fi";
import { TfiFilter } from "react-icons/tfi";
import { HiOutlineAdjustmentsHorizontal } from "react-icons/hi2";
import { FiSearch } from "react-icons/fi"; // 더짧고 굵음

interface Filters {
  lat: number;
  lon: number;
  radius: number;
  canUse: boolean;
  parkingFree: boolean;
  limitYn: boolean;
  chargerTypes: string[];
  chargerComps: string[];
  outputMin: number;
  outputMax: number;
  keyWord?: string;
}

interface StationListModalProps {
  // onClose: () => void;
  list: StationListItem[] ;
  currentFilter: Filters;
  onFilterChange: (filters: Omit<Filters, 'lat' | 'lon'>) => void;
  onStationClick: (station: StationListItem | null) => void;
  onSearch: (keyword: string) => void;
  selectedStation : StationListItem | null;
  selectionSource : 'list' | 'map' | null;
}

export default function StationListPanel({
  // onClose,
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
  const closeDetailRef = useRef<HTMLButtonElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null >(null);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  const listRef = useRef<HTMLUListElement>(null); // 리스트 스크롤

  // 1. 검색
  const searchPlaces = () => {
    const keyword = searchRef.current?.value || '';
    onSearch(keyword);
  }

  // 2. 필터적용
  const handleApplyFilters = (newFilters:  Omit<Filters , 'lat' | 'lon' >, msg?: string) =>{
    if(msg){
      setToastMessage(msg);
    }
    setIsFilterOpen(false);
    onFilterChange(newFilters);
  }

  // 필터 열기 핸들러
  const handleOpenFilter = () => {
    // 상세패널 먼저 닫기
    onStationClick(null);
    setIsFilterOpen(true);
  }

  // 3. 충전소 클릭
  const handleStationClick = (station: StationListItem) => {
    // setSelectedStation(station);
    onStationClick(station);
  }

  // 3-2. 지도에서 선택됐을때 해당 리스트아이템으로 스크롤
  useEffect(() => {
    if(selectedStation && selectionSource === 'map' && listRef.current){
       // 약간의 지연을 두고 스크롤 (DOM 업데이트 대기)
      setTimeout(() => {
      const selectedElement = listRef.current.querySelector(`[data-station-id="${selectedStation.statId}"]`);
      if(selectedElement){
        selectedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      } else {
        console.log('해당 ID의 엘리먼트를 찾을 수 없음:', selectedStation.statId);
      }
    }, 100);
  }
  },[selectedStation, selectionSource])

  // 4. 상세정보 패널 닫기
  const handleCloseDetailPanel = () => {
    onStationClick(null); // 중앙화
  }

  return (
    <>
    <Toast message={toastMessage} setMessage={setToastMessage}/>
      {/* 모달 컨텐츠 */}
      <header className=' '>
        {/* 검색 */}
        <div className='pb-4 border-b border-[#f2f2f2] flex gap-3 items-center '>
          <div className={`${style.searchInput} flex-1`}>
            <input
              type='text'
              ref={searchRef}
              placeholder='충전소 검색'
              className='outline-none'
              onKeyDown={(e) => e.key === 'Enter' && searchPlaces()}
            />
            <button className={`${style.searchBtn}`} onClick={()=>{searchPlaces()}}>
              <FiSearch size={20} />
            </button>
          </div>
          <button ref={closeDetailRef} onClick={handleOpenFilter}
                className={`${style.searchBtn} h-8`}>
              <FiFilter size={20}/>
          </button>
          <FilterModal
            isOpen={isFilterOpen} 
            onClose={() => setIsFilterOpen(false)}
            onApplyFilters={handleApplyFilters}
            initialFilters={currentFilter} 
          />
        </div>
      </header>
        {/* {isSearchOpen 
        ?<div className='flex gap-2'>
          <div className='flex-1 border-[#4FA969] h-10 justify-between'>
            <input  type="text" placeholder='충전소를 검색하세요'  className="outline-none" />
            <button className={`${style.searchBtn} h-8`} onClick={()=>{searchPlaces()}}><FiSearch size={20} /></button>
          </div>
          <span className={`${style.searchBtn} h-8`}><FiFilter size={20}/></span>
        </div>
        :<div className='flex gap-2'>
          <button className={`${style.searchBtn} h-8`}  onClick={()=>setIsSearchOpen(!isSearchOpen)}><FiSearch size={20} /></button>
        
        </div>
        } */}
        {/* 충전소 목록 */}
        <ul className='scrollContent' ref={listRef}>
          {list.map((item, idx) => {

            return(
            <li
              key={`${idx}-${item.statId}`}
              data-station-id={item.statId} // 스크롤용 데이터 속성추가
              className={`${style.listSection} 
                          ${selectedStation?.statId === item.statId ? style.selected : ''} 
                        `}  // 선택상태 스타일 추가
              onClick={()=>handleStationClick(item)}
            >
              
              <div className='flex gap-1 text-[12px]'>
                {item.parkingFree 
                  ?<span className={style.badgetrue}>
                    무료주차
                  </span>
                  :<span className={style.badgefalse}>
                    유료주차
                  </span>
                }
                {item.limitYn 
                  ?<span className={style.badgetrue}>
                    개방
                  </span>
                  :<span className={style.badgefalse}>
                    비개방
                  </span>
                }
              </div>
              <h2 className=' text-[#232323]'>{item.statNm}</h2>
              <p className='text-[12px] text-[#666]'>{item.addr}</p>
              <div className='w-fit bg-[#f2f2f2] px-2 flex gap-1 rounded-md'>
                {item.totalFastNum > 0 &&
                  <p className='text-[12px] font-bold'>
                    <span className='mr-1'>급속</span>
                    <span className='text-[#4FA969]'>{item.chargeFastNum} </span>
                    <span className='text-[#b6b6b6]'>/ {item.totalFastNum}</span>
                  </p>
                }
                {item.totalMidNum > 0 &&
                  <p className='text-[12px] font-bold'>
                    <span className='mr-1'>중속</span>
                    <span className='text-[#4FA969]'>{item.chargeMidNum} </span>
                    <span className='text-[#b6b6b6]'>/ {item.totalMidNum}</span>
                  </p>
                }
                {item.totalSlowNum > 0 &&
                  <p className='text-[12px] font-bold'>
                    <span className='mr-1'>완속</span>
                    <span className='text-[#4FA969]'>{item.chargeSlowNum} </span>
                    <span className='text-[#b6b6b6]'>/ {item.totalSlowNum}</span>
                  </p>
                }
              </div>
            </li>
          )})}
        </ul>
        {/* 패널 클릭시 이벤트 전파 차단 */}
        {/* <div onClick={e => e.stopPropagation()}>   */}
          {/* 상세정보 패널 */}
          {selectedStation &&(
            <StationDetailPanal 
              selectedStation = {selectedStation}
              onClose={handleCloseDetailPanel}
              // closeDetailRef = {closeDetailRef}
              selectionSource = {selectionSource}
            />
          )}
        {/* </div> */}
    </>
      
  )
}
