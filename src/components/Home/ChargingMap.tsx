'use client'

import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { Map, MapMarker, useKakaoLoader, CustomOverlayMap, Circle, MarkerClusterer } from 'react-kakao-maps-sdk'

import { formatToKm } from '@/utils/fomatToKm';
import { formatTime } from '@/utils/formatTime';
import { ChargingStationResponseDto } from '@/types/dto';
import { StationMarker, InfoWindowState } from '@/types/station/station.type';
import TimeFilter from '../Admin/filters/TimeFilter';
import LottieLoading from '../LottieLoading';

// Icons
import { IoRefreshOutline, IoBatteryDeadOutline, IoBatteryFull } from "react-icons/io5";
import { BsExclamation } from "react-icons/bs";
import { AiFillStar, AiOutlineStar } from "react-icons/ai";
import { LuDot } from "react-icons/lu";
import { TbCurrentLocation, TbCurrentLocationOff } from "react-icons/tb";

/**
 * ChargingMap 컴포넌트의 ChargingMapProps 인터페이스
 */
interface ChargingMapProps {
    /** 사용자의 현재 위경도 좌표 */
    myPos: [number, number] | null;
    /** 지도에 렌더링할 마커 리스트 */
    markers: StationMarker[];
    /** 내 위치 기준 탐색 반경 (m) */
    radius: number;
    /** 외부(리스트 등)에서 선택된 충전소 ID */
    selectedStationId?: string | null;
    /** '현 지도에서 검색' 실행 시 중심 좌표를 전달하는 콜백 */
    posHere: (center: { lat: number; lng: number }) => void;
    /** 지도의 중심 좌표 */
    mapCenter: [number, number] | null;
    /** AI 예측 시간 설정 값 (0~24) */
    predictHours: number;
    /** 예측 시간 변경 콜백 */
    onHoursChange: React.Dispatch<React.SetStateAction<number>>;
    /** 마커 클릭 시 ID를 전달하는 콜백 */
    onMarkerClick: (markerId: string) => void;
    /** 데이터 선택 출처 식별자 */
    selectionSource: 'list' | 'map' | null;
    /** 최단거리/최소시간 추천 충전소 데이터 */
    shortest: ChargingStationResponseDto[],
    /** 장기 충전 모드 활성화 여부 */
    isLongCharging: boolean,
    /** 장기 충전 모드 토글 콜백 */
    onLongChargingChange: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * 전기차 충전소 위치 및 상태를 시각화하는 메인 지도 컴포넌트
 * 
 * 주요 기능:
 * 1. 카카오맵 SDK 연동 및 클러스터링을 통한 대량 마커 최적화
 * 2. 충전소 상태(대기/추천/선택)에 따른 동적 마커 에셋 렌더링
 * 3. AI 수요 예측 기반 시간별 충전소 추천 및 가이드 제공
 * 4. 현재 위치 반경 표시 및 최단/최소 경로 충전소 퀵 내비게이션
 * 5. 지도-리스트 간 양방향 인터랙션 (리스트 클릭 시 해당 마커 활성화)
 */
export default function ChargingMap({
    myPos,
    radius,
    mapCenter,
    markers,
    selectedStationId,
    posHere,
    predictHours,
    onHoursChange,
    onMarkerClick,
    selectionSource,
    shortest,
    isLongCharging,
    onLongChargingChange
}: ChargingMapProps) {
    // 지도 상태 관리
    const [map, setMap] = useState<kakao.maps.Map>(null);
    const [infoWindow, setInfoWindow] = useState<InfoWindowState>(null);
    const [currentZoom, setCurrentZoom] = useState(5);

    // 지도제어 도구 상태 관리
    const [isMapMoved, setIsMapMoved] = useState(false);
    const [showPredictBtn, setShowPredictBtn] = useState<boolean>(false);
    const [showRecommend, setShowRecommend] = useState<boolean>(true);
    const [showRadius, setShowRadius] = useState<boolean>(true);

    const MIN_CLUSTER_LEVEL = 6;

    /**
     * SDK 비동기 로드 관리
     */
    const [loading, error] = useKakaoLoader({
        appkey: process.env.NEXT_PUBLIC_KAKAO_JSKEY!,
        libraries: ["clusterer", "services"],
    });

    /**
     * 리스트에서 항목 선택 시 지도 시점 이동 및 정보창 활성화
     */
    useEffect(() => {
        if (!map || !selectedStationId || selectionSource !== 'list') return;

        const selected = markers.find(marker => marker.id === selectedStationId);
        if (selected) {
            const position = new kakao.maps.LatLng(selected.lat, selected.lng);
            map.setLevel(3, { anchor: position });
            map.panTo(position);
            setInfoWindow({
                position: { lat: selected.lat, lng: selected.lng },
                content: selected.name,
                stationId: selected.id,
                chargerTypes: selected.chargerTypes,
            });
        }
    }, [selectedStationId, selectionSource, map, markers]);

    /**
     * 지도 중심 좌표 변경 시 대응하는 로직
     */
    useEffect(() => {
        if (map && mapCenter) {
            map.panTo(new kakao.maps.LatLng(mapCenter[0], mapCenter[1]));
        }
    }, [mapCenter, map])

    /**
     * 현재 지도 시점의 중심을 기준으로 충전소 재검색을 요청하는 핸들러
     */
    const handleSearchHere = () => {
        if (map) {
            const center = map.getCenter();
            posHere({ lat: center.getLat(), lng: center.getLng() });
            onMarkerClick('');
            setInfoWindow(null);
            setIsMapMoved(false);
        }
    };

    /**
     * 마커 클릭 시 상세 정보창을 토글하거나 부모 컴포넌트에 알리는 핸들러
     */
    const handleMarkerClick = (marker: StationMarker) => {
        if (infoWindow?.stationId === marker.id) {
            setInfoWindow(null);
            onMarkerClick('');
        } else {
            setInfoWindow({
                position: { lat: marker.lat, lng: marker.lng },
                content: marker.name,
                stationId: marker.id,
                chargerTypes: marker.chargerTypes,
            });
            onMarkerClick(marker.id);
        }
    }

    /**
     * 마커의 상태별 이미지 설정 로직
     */
    const getMarkerConfig = useCallback((marker: StationMarker) => {
        const isSelected = marker.id === selectedStationId || infoWindow?.stationId === marker.id;
        const isAvailable = marker.availableCnt > 0;
        const isRecommend = !!marker.predTag;

        if (isSelected) return { src: '/isSelected.png', size: { width: 50, height: 50 } };
        if (isRecommend) {
            const recommentAssets: Record<string, string> = {
                '0': '/recommend_1.png',
                '1': '/recommend_1y.png',
                '2': '/recommend_2o.png',
                '3': '/recommend_3r.png',
            };
            const sizes: Record<string, number> = { '0': 35, '1': 32, '2': 20, '3': 20 }
            return {
                src: recommentAssets[marker.predTag!] || 'available.png',
                size: { width: sizes[marker.predTag!] || 32, height: sizes[marker.predTag!] || 32 },
            }
        }
        if (isAvailable) return { src: '/available.png', size: { width: 32, height: 32 } };
        return { src: '/unavailable.png', size: { width: 12, height: 12 } };
    }, [selectedStationId, infoWindow]);

    if (loading) return <div className='w-full h-full flex justify-center items-center bg-gray-50'><LottieLoading /></div>
    if (error) {
        return (
            <section className='w-full h-full gap-5 flex flex-col justify-center items-center bg-[#f2f2f2]'>
                <div className='flex flex-col justify-center items-center gap-2'>
                    <p className='text-xl font-bold text-[#232323]'>지도를 불러오지 못했습니다.</p>
                    <p className='text-lg text-[#666]'>네트워크 상태를 확인하거나 다시 시도해주세요.</p>
                </div>
                <button
                    onClick={() => window.location.reload()}
                    className='confirm px-5 py-2 rounded-lg cursor-pointer hover:bg-green-800 transition'
                >
                    다시시도
                </button>
            </section>
        )
    }

    return (
        <article aria-label="전기차 충전소 분포 지도 (고객용)" className='relative w-full h-full'>
            {/* 지도 영역 */}
            <Map center={mapCenter ? { lat: mapCenter[0], lng: mapCenter[1] } : { lat: 35.1795, lng: 129.0756 }}
                style={{ width: "100%", height: "100%" }}
                level={5}
                onCreate={setMap}
                onIdle={(map) => setCurrentZoom(map.getLevel())}
                onDragStart={() => setIsMapMoved(true)}
            >
                {/* 탐색 반경 가이드라인 */}
                {myPos && showRadius && (
                    <Circle center={{ lat: myPos[0], lng: myPos[1] }}
                        radius={radius}
                        strokeWeight={2}
                        strokeColor={'#4FA969'}
                        strokeOpacity={0.5}
                        fillColor={'#4FA969'}
                        fillOpacity={0.2}
                    />
                )}

                {/* 마커 클러스터러 및 마커 */}
                {map &&
                    <>
                        <MarkerClusterer
                            key={markers.length > 0 ? `${markers.length}-${mapCenter}` : mapCenter?.join('-')}    // FIXME 마커가 바뀔때마다 바뀌는값으로 key값을 주기❗
                            averageCenter={true}
                            minLevel={MIN_CLUSTER_LEVEL}
                            styles={[{
                                width: '50px', height: '50px',
                                background: '#51cf66',
                                borderRadius: '25px', color: '#fff',
                                textAlign: 'center', lineHeight: '50px',
                            }]}
                        >
                            {markers.map((marker, idx) => {
                                const config = getMarkerConfig(marker);
                                return (
                                    <MapMarker
                                        key={`${marker.id}-${idx}`}
                                        position={{ lat: marker.lat, lng: marker.lng }}
                                        image={config}
                                        onClick={() => { handleMarkerClick(marker) }}
                                        zIndex={marker.id === selectedStationId ? 999 : marker.availableCnt > 0 ? 10 : 1}
                                    >
                                    </MapMarker>

                                )
                            })}
                        </MarkerClusterer>

                        {/* 마커 오버레이 (잔여 수량 표시) */}
                        {markers.map((marker: StationMarker) => {
                            // 예측 상태 아님 && 충전가능 && 선택된 마커 아님 && 클러스트링 상태 아님 && 정보창 활성화되지 않음
                            const isVisible = !marker.predTag && marker.availableCnt > 0 && marker.id !== selectedStationId && currentZoom < MIN_CLUSTER_LEVEL && infoWindow?.stationId !== marker.id;
                            return isVisible
                                ? <CustomOverlayMap
                                    key={marker.id}
                                    position={{ lat: marker.lat, lng: marker.lng }}
                                    yAnchor={1.35}
                                    zIndex={11}
                                >
                                    <div className="customoverlay text-white text-[12px] pointer-events-none">
                                        {marker.availableCnt}
                                    </div>
                                </CustomOverlayMap>
                                : null;
                        })}
                    </>
                }

                {/* 선택 마커 상세 정보창 */}
                {infoWindow && currentZoom < MIN_CLUSTER_LEVEL && (
                    <CustomOverlayMap
                        position={infoWindow.position}
                        yAnchor={2.5}
                        zIndex={1000}
                    >
                        <section className='px-5 py-2 flex gap-2 justify-center bg-[#F7FECD] border-[#CACFAC] rounded-full shadow-lg animate-fade-in'>
                            {[
                                { label: '급', total: infoWindow.chargerTypes.fastTotal, current: infoWindow.chargerTypes.fastCount },
                                { label: '중', total: infoWindow.chargerTypes.midTotal, current: infoWindow.chargerTypes.midCount },
                                { label: '완', total: infoWindow.chargerTypes.slowTotal, current: infoWindow.chargerTypes.slowCount }
                            ].map(type => type.total > 0 && (
                                <div key={type.label} className='text-[12px] font-bold'>
                                    <span className='mr-1'>{type.label}</span>
                                    <span>{type.current}</span>
                                    <span className='text-[#6b6b6b]'>/{type.total}</span>
                                </div>
                            ))}
                        </section>
                    </CustomOverlayMap>
                )}
            </Map>

            {/* 지도 제어도구 모음 */}
            {/* 현위치 기준 검색 버튼 */}
            <nav className='absolute z-10 top-5 left-1/2 -translate-x-1/2'>
                {isMapMoved && (
                    <button
                        type='button'
                        onClick={handleSearchHere}
                        className=" flex items-center bg-[#4FA969] px-4 py-2 rounded-full shadow-lg
                            hover:bg-[#5a9c6d] transition-all duration-300 ease-in-out  text-white font-semibold text-[15px] cursor-pointer"
                    >
                        <IoRefreshOutline size={20} className='mb-1 mr-2' />
                        현 지도에서 검색
                    </button>
                )}
            </nav>

            {/* 우측 상단 기능 버튼군(추천 및 반경 제어) */}
            <aside className='absolute top-5 right-5 z-10 flex flex-col justify-center items-end gap-3'>
                <button
                    type='button'
                    aria-label={showRadius ? "탐색 반경 숨기기" : "탐색 반경 표시"}
                    onClick={() => setShowRadius(!showRadius)}
                    className={`p-2 mr-1 border-2  text-[#4FA969] ${showRecommend ? 'bg-[#cdf7d9] border-[#a0e4b4]' : 'bg-white border-gray-50'} rounded-full 
                            z-10 cursor-pointer shadow-lg hover:bg-gray-100 hover:border-gray-100 transition-colors`}
                >
                    {showRadius ? <TbCurrentLocationOff size={20} /> : <TbCurrentLocation size={20} />}
                </button>

                {shortest.length > 0 &&
                    <div className='relative flex flex-col items-end gap-3'>
                        <button
                            type='button'
                            aria-label="추천 충전소 목록 토글"
                            onClick={() => setShowRecommend(!showRecommend)}
                            className={`p-2 mr-1 border-2  text-[#4FA969] rounded-full
                                ${showRecommend ? 'bg-[#cdf7d9] border-[#a0e4b4]' : 'bg-white border-gray-50'} 
                                z-10 cursor-pointer shadow-lg hover:bg-gray-100 hover:border-gray-100 transition-colors`}
                        >
                            {showRecommend ? <AiFillStar size={20} /> : <AiOutlineStar size={20} />}
                        </button>

                        {showRecommend &&
                            <div className="absolute top-[90px] -translate-y-1/2 right-full mr-2
                                p-3 bg-white/90 backdrop-blur-md text-black shadow-lg  rounded-lg 
                                animate-slideInRight whitespace-nowrap flex flex-col"
                            >
                                {shortest.slice(0, 2).map((stat, idx) => (
                                    <button
                                        key={`${idx}_${stat.statId}`}
                                        type='button'
                                        onClick={() => onMarkerClick(stat.statId)}
                                        className='pl-3 pr-10 py-2 flex flex-col gap-1 items-start hover:bg-gray-100 rounded-lg cursor-pointer
                                                first:border-b first:border-gray-200 first:my-2'
                                    >
                                        <p className='text-xs font-bold flex items-center text-[#4FA969] rounded-full '>
                                            {idx === 0 ? '최단 경로' : '최소 시간'}
                                            <LuDot className='text-[#4FA969]/40' />
                                            {idx === 0 ? formatToKm(stat.leastDis) : formatTime(stat.leashTime)}
                                        </p>
                                        <p className=' font-bold'> {stat.statNm} </p>
                                    </button>
                                ))}
                            </div>
                        }

                        {predictHours > 0 &&
                            <button onClick={() => onLongChargingChange(!isLongCharging)}
                                className={`p-2 mr-1 border-2  text-[#4FA969] ${isLongCharging ? 'bg-[#cdf7d9] border-[#a0e4b4]' : 'bg-white border-gray-50'} rounded-full 
                                z-10 cursor-pointer shadow-lg hover:bg-gray-100 hover:border-gray-100 transition-colors`}
                            >
                                {isLongCharging ? <IoBatteryFull /> : <IoBatteryDeadOutline />}
                            </button>
                        }
                    </div>
                }
            </aside>

            {/* 우측 하단 시간 예측 컨트롤러 */}
            <aside className='absolute bottom-5 right-5 z-10 flex flex-col items-end gap-2'>

                {/* 예측 등급 가이드 툴팁 */}
                <div className='relative group/icon'>
                    <div className='p-1 mr-1 border-2 border-none text-white bg-[#4FA969] rounded-full 
                                    z-10 cursor-pointer shadow-lg hover:bg-green-700 transition-colors'
                    >
                        <BsExclamation />
                    </div>
                    <div className="absolute top-[-45px] -translate-y-1/2 right-full mr-2
                        p-5 bg-black/70 text-white text-sm rounded-lg 
                        opacity-0 invisible group-hover/icon:opacity-100 group-hover/icon:visible transition-all whitespace-nowrap">
                        <p className='mb-3 font-bold'>AI 추천 등급 가이드</p>
                        <ul className='grid grid-cols-2 gap-4'>
                            {[
                                { asset: '/recommend_1.png', time: '10분 이내' }, { asset: '/recommend_1y.png', time: '30분 이내' },
                                { asset: '/recommend_2o.png', time: '60분 이내' }, { asset: '/recommend_3r.png', time: '60분 이상' }

                            ].map(item => (
                                <li key={item.time} className='flex items-center gap-2'>
                                    <img src={item.asset} alt={item.time} className='w-6 h-6 flex-shrink-0' />
                                    <span className='text-sm'>{item.time}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* 시간 슬라이더 패널 */}
                <button
                    type='button'
                    onClick={() => setShowPredictBtn(!showPredictBtn)}
                    style={{ width: showPredictBtn ? '320px' : '150px'}}
                    className={`flex items-center  ${showPredictBtn ? 'justify-between' : 'justify-center'}  gap-4
                                bg-white border px-6 py-2 rounded-full shadow-lg  text-[#4FA969] font-bold 
                                hover:bg-gray-100 
                                transition-all duration-300 ease-in-out overflow-hidden`}
                >
                    <span>
                        {predictHours === 0 ? '실시간' : `${predictHours}시간 후`}
                    </span>
                    {showPredictBtn &&
                        <div className='w-[180px] animate-fade-in'>
                            <TimeFilter value={predictHours} onTimeSelect={onHoursChange} showLabel={false} max={24} />
                        </div>
                    }
                </button>
            </aside>
        </article>
    )
}
