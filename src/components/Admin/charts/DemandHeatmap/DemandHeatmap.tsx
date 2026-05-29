'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import Map, { MapRef, Source, Layer, Marker, Popup } from 'react-map-gl/mapbox';
import type { HeatmapLayer } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { FeatureCollection, Point } from 'geojson';
import Toast from '@/components/Toast/Toast';
import LottieLoading from '@/components/LottieLoading';
import FilterGroup, { HeatmapFilter } from '../../filters/FilterGroup';
import { FiMapPin, FiFilter } from "react-icons/fi";

/**
 * 부산광역시 행정구역별 지도 초기 좌표 및 줌 레벨 설정 데이터
 */
export const busanDistricts = [
  { name: '금정구', longitude: 129.0921, latitude: 35.2431, zoom: 12 },
  { name: '강서구', longitude: 128.9816, latitude: 35.2132, zoom: 11 },
  { name: '기장군', longitude: 129.2136, latitude: 35.2445, zoom: 11 },
  { name: '남구', longitude: 129.0833, latitude: 35.1365, zoom: 12.5 },
  { name: '동구', longitude: 129.0416, latitude: 35.1296, zoom: 13 },
  { name: '동래구', longitude: 129.0864, latitude: 35.2043, zoom: 12.5 },
  { name: '부산진구', longitude: 129.0556, latitude: 35.1627, zoom: 12.5 },
  { name: '북구', longitude: 129.0153, latitude: 35.1983, zoom: 12 },
  { name: '사상구', longitude: 128.9984, latitude: 35.1524, zoom: 12.5 },
  { name: '사하구', longitude: 128.9734, latitude: 35.1039, zoom: 12 },
  { name: '서구', longitude: 129.0183, latitude: 35.0979, zoom: 13 },
  { name: '수영구', longitude: 129.1121, latitude: 35.1543, zoom: 13.5 },
  { name: '연제구', longitude: 129.0763, latitude: 35.1764, zoom: 13.5 },
  { name: '영도구', longitude: 129.0669, latitude: 35.0911, zoom: 13 },
  { name: '중구', longitude: 129.0333, latitude: 35.101, zoom: 14 },
  { name: '해운대구', longitude: 129.1604, latitude: 35.1631, zoom: 12 },
];

interface DemandHeatmapProps {
  /** 필터 변경 시 부모 컴포넌트로 상태를 전달하는 콜백 함수 */
  onApplyFilter: (filter: HeatmapFilter) => void;
  /** 히트맵 및 마커 표시를 위한 GeoJSON 데이터 */
  pointsDt: FeatureCollection<Point, {
    id: string;
    name: string;
    addr: string;
    busiNm: string;
    demand: number;
  }> | null,
  /** 특정 충전소 선택 시 상세 정보 조회를 요청하는 콜백 함수 */
  onSelectStat: (statId: string) => void;
  /** 초기 필터 설정 값 */
  initialFilters: HeatmapFilter;
}

/**
 * 관리자 대시보드 충전 수요 히트맵 컴포넌트
 * Mapbox GL을 사용하여 부산 지역별 충전 수요 밀집도를 시각화하며,
 * 동적인 히트맵 레이어와 개별 충전소 상세 정보 팝업 기능을 제공합니다.
 */
export default function DemandHeatmap({ onApplyFilter, pointsDt, onSelectStat, initialFilters }: DemandHeatmapProps) {
  const [toastMsg, setToastMsg] = useState<string>('');
  const [viewState, setViewState] = useState({
    longitude: busanDistricts[0].longitude,
    latitude: busanDistricts[0].latitude,
    zoom: busanDistricts[0].zoom,
  });

  // UI 상태 관리
  const [showMarker, setShowMarker] = useState<boolean>(false);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [currentFilter, setCurrentFilter] = useState<HeatmapFilter>(initialFilters);

  // Mapbox 리사이징 및 인스턴스 제어 Ref
  const mapRef = useRef<MapRef | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  /**
  * 레이아웃 변화에 따른 지도의 크기 재조정을 수행하여 렌더링 깨짐 방지
  */
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      setTimeout(() => {
        mapRef.current?.resize();
      }, 0);
    });

    if (containerRef.current) observer.observe(containerRef.current);
    return () => containerRef.current && observer.unobserve(containerRef.current);
  }, []);

  /**
   * Mapbox 히트맵 레이어의 시각적 스타일을 정의 (가중치(Weight), 강도(Intensity), 밀집도별 색상 매핑)
   */
  const heatmapLayerStyle: HeatmapLayer = {
    id: 'heatmap',
    type: 'heatmap',
    source: 'my-heatmap-data',
    paint: {
      'heatmap-weight': ['interpolate', ['linear'], ['get', 'intensity'], 0, 0, 1, 1],
      'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 15, 3],
      'heatmap-color': [
        'interpolate', ['linear'], ['heatmap-density'],
        0, 'rgba(33,102,172,0)',
        0.2, 'rgb(103,169,207)',
        0.4, 'rgb(209,229,240)',
        0.6, 'rgb(253,219,199)',
        0.8, 'rgb(239,138,98)',
        1, 'rgb(178,24,43)'
      ],
      'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 15, 20],
    }
  }

  /**
   * 필터 조건 변경 시 부모 컴포넌트로 새로운 필터 상태를 전파
   * @param {HeatmapFilter} filter - 적용할 새로운 필터 객체
   */
  const handleFilterChange = (filter: HeatmapFilter) => {
    console.log('[Heatmap] 필터 적용 요청:', filter);
    onApplyFilter(filter);
    setCurrentFilter(filter)
    setShowFilter(false);
  }

  // 부모의 필터가 변경되면 동기화
  useEffect(() => {
    setCurrentFilter(initialFilters);
  }, [initialFilters]);


  /**
   * 지도 마커 클릭 시 해당 위치에 상세 정보 팝업을 표시 및 닫기(이벤트 버블링을 방지)
   * @param {React.MouseEvent} e - 마우스 이벤트 객체
   * @param {any} feature - 클릭된 마커의 GeoJSON 피처 데이터
   */
  const handleMarkerClick = (e: React.MouseEvent, feature: any) => {
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    setSelectedMarker(feature?.properties.id === feature.properties.id ? null : feature);
  }

  /**
   * 지도 클릭 시 팝업 닫기
   * @param e 
   */
  const handleMapClick = (e: any) => {
    setSelectedMarker(null);
  }

  /**
  * 현재 지도의 줌 레벨을 기반으로 마커의 시각적 크기를 계산
  * @returns {number} 동적으로 계산된 마커의 픽셀 크기
  */
  const getMarkerSize = () => {
    const baseSize = 8;  // 기본크기
    const zoomFactor = Math.max(0.5, viewState.zoom / 15); // 줌이 높을수록 큰마커
    return Math.max(baseSize, baseSize * zoomFactor)
  }

  /**
   * 선택된 충전소의 상세 예측 정보를 조회하기 위해 상세 보기 이벤트를 트리거
   */
  const handleShowDetail = () => {
    if (!selectedMarker) {
      setToastMsg('충전소를 선택해주세요.');
      return;
    }
    onSelectStat(selectedMarker.properties.id);
  }

  if (!pointsDt) {
    return <div className='w-full h-full flex justify-center items-center bg-gray-50 text-2xl font-bold text-gray-400'><LottieLoading /></div>
  }

  return (
    <div className='relative w-full h-full'>
      <Toast message={toastMsg} setMessage={setToastMsg} />
      <Map mapboxAccessToken={`${process.env.NEXT_PUBLIC_MAPBOX}`}
        {...viewState}
        style={{ width: '100%', height: '100%' }}
        onMove={evt => setViewState(evt.viewState)}
        onClick={handleMapClick}
        mapStyle="mapbox://styles/mapbox/light-v11"
      >
        {/* 히트맵 데이터 소스 및 레이어 */}
        <Source id="my-heatmap-data" type="geojson" data={pointsDt}>
          <Layer {...heatmapLayerStyle} />
        </Source>

        {/* 개별 충전소 마커 레이어 (조건부 노출) */}
        {showMarker && pointsDt && (
          pointsDt?.features.map((f => {
            const markerSize = getMarkerSize();
            const isSelected = selectedMarker && selectedMarker.properties.id === f.properties.id;
            return (
              <Marker
                key={f.properties.id}
                longitude={f.geometry.coordinates[0]}
                latitude={f.geometry.coordinates[1]}
              >
                <div className={
                    `rounded-full cursor-pointer transition-all duration-200 hover:scale-125 relative
                    ${isSelected
                    ? 'bg-[#4FA969] ring-8 ring-[#4FA969]/20 ring-opacity-50 z-10'
                    : 'bg-gray-500 hover:bg-gray-600 z-1'}`
                  }
                  style={{
                    width: `${markerSize}px`,
                    height: `${markerSize}px`,
                    minWidth: '16px',
                    minHeight: '16px'
                  }}
                  onClick={(e) => handleMarkerClick(e, f)}
                />
              </Marker>
            )
          }))
        )
        }

        {/* 선택된 마커 상세 정보 팝업 */}
        {selectedMarker &&
          <Popup
            longitude={selectedMarker.geometry.coordinates[0]}
            latitude={selectedMarker.geometry.coordinates[1]}
            onClose={() => setSelectedMarker(null)}
            anchor='bottom'
            focusAfterOpen={true}
            closeOnClick={false}
            className='custom-popup'
          >
            <div className='p-2 min-w-[200px]'>
              <h3 className='font-semibold text-gray-800 mb-2'>{selectedMarker.properties.name}</h3>
              <div className='space-y-1 text-sm text-gray-600 mb-3'>
                <p className='textlst outside'>
                  <span className='textlst title'>주소</span>
                  {selectedMarker.properties.addr}
                </p>
                <p className='textlst outside '>
                  <span className='textlst title'>운영기관</span>
                  {selectedMarker.properties.busiNm}
                </p>
                <p className='textlst outside'>
                  <span className='textlst title'>수요 예측</span>
                  {selectedMarker.properties.demand.toPrecision(4)}
                </p>
              </div>
              <button onClick={handleShowDetail} className='w-full rounded-sm bg-black text-white py-1 hover:bg-gray-800 transition-colors cursor-pointer'>
                수요 분석 자세히 보기
              </button>
            </div>
          </Popup>
        }
      </Map>

      {/* 현재 적용된 필터 표시 배지 */}
      <div className='absolute top-3 left-3 px-3 py-2 rounded-full bg-[#232323]/45 text-xs text-white '>
        {currentFilter.region} / {currentFilter.date.toLocaleDateString()} / {currentFilter.time}:00
      </div>

      {/* 지도 컨트롤 도구 (필터/마커 토글) */}
      <div className='absolute top-3 right-3 flex flex-col gap-2'>
        <div className='relative group'>
          <button className={` p-2 rounded-full cursor-pointer ${showFilter ? 'bg-[#4FA969]/20 text-[#4FA969]' : 'bg-[#232323]/20 text-[#232323]'}`}
            onClick={() => setShowFilter((prev) => !prev)}>
            <FiFilter size={20} />
          </button>
          {showFilter
            ?<div className='absolute right-full top-0 transform rounded-md mr-2 bg-black/50 py-3 px-4'>
              <FilterGroup onFilterChange={handleFilterChange} initialFilter={initialFilters} />
            </div>
            
            :<div className='absolute right-full top-1/2 transform -translate-y-1/2 mr-2 px-2 py-1 bg-black text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap'>
              필터
            </div>
          }
        </div>
        <div className='relative group'>
          <button className={`p-2 rounded-full cursor-pointer ${showMarker ? 'bg-[#4FA969]/20 text-[#4FA969]' : 'bg-[#232323]/20 text-[#232323]'}`} onClick={() => setShowMarker((prev) => !prev)}>
            <FiMapPin size={20} />
          </button>
          <div className='absolute right-full top-1/2 transform -translate-y-1/2 mr-2 px-2 py-1 bg-black text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap'>
            {showMarker ? '마커 숨기기' : '충전소 마커 표시'}
          </div>
        </div>
      </div>
    </div>
  )
}
