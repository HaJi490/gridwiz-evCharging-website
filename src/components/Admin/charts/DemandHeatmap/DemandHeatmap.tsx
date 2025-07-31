'use client'

import React,{useState,useRef, useEffect, useCallback} from 'react'
import Map, {MapRef, Source, Layer, Marker,Popup } from 'react-map-gl/mapbox';
import type { HeatmapLayer } from 'mapbox-gl'; 
import 'mapbox-gl/dist/mapbox-gl.css';
import type { FeatureCollection, Point } from 'geojson';
import { WeekdayDemand } from '@/types/dto';
import Toast from '@/components/Toast/Toast';
import LottieLoading from '@/components/LottieLoading';

// import GuSelector, { busanDistricts, type District } from '../ChargingDemandLineChart/GuSelector';
import {HeatmapFeatureCollection} from '../../../../types/geojson'
import { HeatmapFilter } from '../../filters/FilterGroup';
import { FiMapPin } from "react-icons/fi";
import { FiFilter } from "react-icons/fi";
import FilterGroup from '../../filters/FilterGroup';

export const busanDistricts = [
    { name: '금정구', longitude: 129.0921, latitude: 35.2431, zoom: 12 },
    // { name: '부산시 전체', longitude: 129.0756, latitude: 35.1796, zoom: 10 },
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
  onApplyFilter: (filter: HeatmapFilter) => void;
  pointsDt:  FeatureCollection<Point, {
    id: string;
    name: string;
    addr: string;
    busiNm: string;
    demand: number;
  }> | null,
  onSelectStat: (statId: string) => void;
  initialFilters: HeatmapFilter;
}

export default function DemandHeatmap({onApplyFilter, pointsDt, onSelectStat, initialFilters}: DemandHeatmapProps) {
  const [toastMsg, setToastMsg] = useState<string>('');
  const [viewState, setViewState] = useState({    // 지도의 상태를 state로 관리(초기값은 부산시 전체)
    longitude: busanDistricts[0].longitude,
    latitude: busanDistricts[0].latitude,
    zoom: busanDistricts[0].zoom,
  });
  const [showMarker, setShowMarker] = useState<boolean>(false);
  const [selectedMarker, setSelectedMarker] = useState(null);

  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [currentFilter, setCurrentFilter] = useState<HeatmapFilter>(initialFilters);

  const mapRef = useRef<MapRef | null>(null); // Map 인스턴스를 저장할 ref
  const containerRef = useRef<HTMLDivElement | null>(null); // 지도의 부모 div를 가리킬 ref

  // 3. ResizeObserver를 설정하는 useEffect를 추가합니다.
  useEffect(() => {
    const observer = new ResizeObserver(() => {
        // 🚨 핵심 해결책: setTimeout으로 감싸줍니다.
        setTimeout(() => {
            mapRef.current?.resize();
        }, 0);
    });

    if (containerRef.current) {
        observer.observe(containerRef.current);
    }

    return () => {
        if (containerRef.current) {
            observer.unobserve(containerRef.current);
        }
    };
}, []);

  // 히트맵 레이어의 스타일을 객체로 정의
  const heatmapLayerStyle : HeatmapLayer = {
    id:'heatmap',
    type: 'heatmap',
    source: 'my-heatmap-data', // 사용할 Source의 id
    // maxzoom: 15,
    paint: {
      // 이 속성을 사용하려면 GeoJSON의 properties에 'intensity'가 있어야 합니다.
      'heatmap-weight': [
        'interpolate', ['linear'], ['get', 'intensity'],
        0, 0,
        1, 1
      ],
      // 히트맵의 가중치(강도): 각 점의 'intensity' 속성을 사용하도록 설정
      'heatmap-intensity': [
        'interpolate', ['linear'], ['zoom'],
        0, 1,
        15, 3
      ],
      // 히트맵 색상: 밀집도에 따라 색이 변하도록 설정
      'heatmap-color' : [
        'interpolate', ['linear'], ['heatmap-density'],
        0, 'rgba(33,102,172,0)',
        0.2, 'rgb(103,169,207)',
        0.4, 'rgb(209,229,240)',
        0.6, 'rgb(253,219,199)',
        0.8, 'rgb(239,138,98)',
        1, 'rgb(178,24,43)'
      ],
      // 각 점의 영향 반경(radius)
      'heatmap-radius': [
        'interpolate', ['linear'], ['zoom'],
        0, 2,
        15, 20
      ],
       // 줌 레벨이 높아지면 히트맵을 서서히 투명하게 만듦
      // 'heatmap-opacity': [
      //   'interpolate', ['linear'], ['zoom'],
      //   10, 1,
      //   15, 0
      // ],
    }
  }

  // 2. 필터변경 - 부모로전달
  const handleFilterChange = (filter: HeatmapFilter) =>{
    console.log('[Heatmap] 필터 적용 요청:', filter);
    onApplyFilter(filter);
    setCurrentFilter(filter)
    setShowFilter(false);
  }

   // 부모의 필터가 변경되면 동기화
  useEffect(() => {
    setCurrentFilter(initialFilters);
  }, [initialFilters]);


  // 3. 마커 클릭시
  const handleMarkerClick =(e: React.MouseEvent, feature: any) => {
    console.log('마커클릭⭐⭐⭐⭐')
    
    e.stopPropagation();                      // React 이벤트 전파 중단
    e.nativeEvent.stopImmediatePropagation(); // DOM 이벤트 전파도 중단
    setSelectedMarker(feature);

    //같은 마커를 클릭한 경우 팝업 토글
    if(selectedMarker && selectedMarker.properties.id === feature.properties.id){
      setSelectedMarker(null);
    } else {
      setSelectedMarker(feature);
    }
  }

  // 다른마커 클릭시
  React.useEffect(() => {
    console.log('selectedMarker 바뀜:', selectedMarker);
  }, [selectedMarker]);

  // 지도클릭시 팝업 닫기
  const handleMapClick = (e:any) => {
    setSelectedMarker(null);
    console.log('팝업닫기');
  }

  // 마커 클릭영역 개선(최소 16px, 호버시 125% 확대)
  const getMarkerSize = () =>{
    const baseSize = 8 ;  // 기본크기
    const zoomFactor = Math.max(0.5, viewState.zoom / 15 ); // 줌이 높을수록 큰마커
    return Math.max(baseSize, baseSize * zoomFactor)
  }

  const handleShowDetail = () => {
    if(!selectedMarker){
      setToastMsg('충전소를 선택해주세요.');
      return; // 컴포넌트 렌더링 조직이 아니므로 null을 반환하는것은 의미가 없음
    }
    onSelectStat(selectedMarker.properties.id);
  }

  if(!pointsDt) {
    return <div className='w-full h-full flex justify-center items-center bg-gray-50 text-2xl font-bold text-gray-400'><LottieLoading/></div>
  }

  return (
    <div className='relative w-full h-full'>
      <Toast message={toastMsg} setMessage={setToastMsg}/>
      <Map mapboxAccessToken={`${process.env.NEXT_PUBLIC_MAPBOX}`}
          // 초기 지도 위치설정
          {...viewState}
          // 지도를 담을 div의 스타일
          style={{width: '100%', height: '100%'}}
          onMove={evt => setViewState(evt.viewState)} // 사용자가 지도를 움직여도 state가 업데이트되도록 함
          onClick={handleMapClick} // 지도의 빈곳을 클릭했을때
          // Mapbox에서 제공하는 기본 지도 스타일
          mapStyle="mapbox://styles/mapbox/light-v11"
      >
        <Source id="my-heatmap-data" type="geojson" data={pointsDt}>
          <Layer {...heatmapLayerStyle} />
        </Source>

        {showMarker && pointsDt && (
          pointsDt?.features.map((f => {
            const markerSize = getMarkerSize();
            const isSelected = selectedMarker && selectedMarker.properties.id === f.properties.id;

            return(
              <Marker
                key={f.properties.id}
                longitude={f.geometry.coordinates[0]}
                latitude={f.geometry.coordinates[1]}
              >
                <div className={`rounded-full cursor-pointer transition-all duration-200 hover:scale-125 relative
                                  ${
                                    isSelected
                                    ? 'bg-[#4FA969] ring-8 ring-[#4FA969]/20 ring-opacity-50 z-10'
                                    : 'bg-gray-500 hover:bg-gray-600 z-1'
                                  }
                              `}
                    style={{
                      width: `${markerSize}px`,
                      height: `${markerSize}px`,
                      minWidth: '16px',
                      minHeight: '16px'
                    }}
                    onClick={(e) => handleMarkerClick(e, f)}
                ></div>
              </Marker>
            )
          }))
        )
        }
        
        {/* 클릭 외부영역으로 닫기 방지 */}
        {selectedMarker &&
          <Popup
            longitude = {selectedMarker.geometry.coordinates[0]}
            latitude = {selectedMarker.geometry.coordinates[1]}
            onClose = {()=>setSelectedMarker(null)}
            anchor='bottom' // 마커의 어느방향
            focusAfterOpen={true} // 팝업닫힐때 포커스로 지도로 보낼지
            closeOnClick={false}  //Map의 onClick으로 제어
            // closeButton={true}
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
                  <span className='textlst title'>수요</span> 
                  {selectedMarker.properties.demand.toPrecision(4)}
                </p>
              </div>
              <button onClick={handleShowDetail} className='w-full rounded-sm bg-black text-white py-1 hover:bg-gray-800 transition-colors cursor-pointer'>
                자세히보기
              </button> 
            </div>
          </Popup>
        }
      </Map>

      {/* 적용한 필터 */}
      <div className='absolute top-3 left-3 px-3 py-2 rounded-full bg-[#232323]/45 text-xs text-white '>
        {currentFilter.region} / {currentFilter.date.toLocaleDateString()} / {currentFilter.time}:00
      </div>

      {/* 필터/마커 */}
      <div className='absolute top-3 right-3 flex flex-col gap-2'>
        <div className='relative group'>
          <button className={` p-2 rounded-full cursor-pointer ${showFilter ? 'bg-[#4FA969]/20 text-[#4FA969]' : 'bg-[#232323]/20 text-[#232323]'}`} 
                  onClick={() => setShowFilter((prev) => !prev)}>
            <FiFilter size={20} />
          </button>
          {showFilter 
          ? (
            <div className='absolute right-full top-0 transform rounded-md mr-2 bg-black/50 py-3 px-4'>
              <FilterGroup onFilterChange={handleFilterChange} initialFilter={initialFilters}/>
            </div>
          )
          : (
            <div className='absolute right-full top-1/2 transform -translate-y-1/2 mr-2 px-2 py-1 bg-black text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap'>
              필터
            </div>
          )
          }
        </div>
        <div className='relative group'>
          <button className={`p-2 rounded-full cursor-pointer ${showMarker ? 'bg-[#4FA969]/20 text-[#4FA969]' : 'bg-[#232323]/20 text-[#232323]' }`} onClick={() => setShowMarker((prev) => !prev)}>
              <FiMapPin size={20} />
          </button>
          <div className='absolute right-full top-1/2 transform -translate-y-1/2 mr-2 px-2 py-1 bg-black text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap'>
            {showMarker ? '마커 끄기' : '마커 켜기'}
          </div>
        </div>
      </div>
    </div>
  )
}
