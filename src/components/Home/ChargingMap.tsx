'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { Map, MapMarker, useKakaoLoader, CustomOverlayMap, Circle, MarkerClusterer } from 'react-kakao-maps-sdk'
import Image from 'next/image';

import TimeFilter from '../Admin/filters/TimeFilter';
import LottieLoading from '../LottieLoading';
import { IoRefreshOutline } from "react-icons/io5";
import { BsExclamation } from "react-icons/bs";


interface ChargingMapProps {
    myPos: [number, number] | null;
    markers: MarkerType[];
    radius: number;
    selectedStationId?: string | null;
    posHere: (center: { lat: number; lng: number }) => void;
    mapCenter: [number, number] | null;
    predictHours: number;
    onHoursChange: React.Dispatch<React.SetStateAction<number>>; // setter 타입
    onMarkerClick: (markerId: string) => void;
    selectionSource : 'list' | 'map' | null;
}

type MarkerType = {
    id: string;
    name: string;
    lat: number;
    lng: number;
    availableCnt: number;
    // changeStatus: 'increase' | 'decrease' | 'same' | 'none';
    chargerTypes: {
            fastCount: number;
            fastTotal: number;
            midCount: number;
            midTotal: number;
            slowCount: number;
            slowTotal: number;
        }, 
    predTag?: string;
    minute?: number;
};

// 마커 클릭 시 정보창을 관리하기 위한 상태
type InfoWindowState = {
    position: {
        lat: number;
        lng: number;
    },
    content: string;
    stationId: string;
    chargerTypes: {
            fastCount: number;
            fastTotal: number;
            midCount: number;
            midTotal: number;
            slowCount: number;
            slowTotal: number;
        }
} | null;


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
    selectionSource
}: ChargingMapProps) {
    const [map, setMap] = useState<kakao.maps.Map>(null); // 지도인스턴스 저장
    const [infoWindow, setInfoWindow] = useState<InfoWindowState>(null);
    const [currentZoom, setCurrentZoom] = useState(5);
    
    const [isMapMoved, setIsMapMoved] = useState(false);
    const [showPredictBtn, setShowPredictBtn] = useState<boolean>(false);

    const MIN_CLUSTER_LEVEL = 6; // 클러스터링 최소레벨


    // 1. Hook을 이용하여 Kakao맵 불러오기
    const [loading, error] = useKakaoLoader({
        appkey: process.env.NEXT_PUBLIC_KAKAO_JSKEY!, //non-null 추가
        libraries: ["clusterer", "services"],
    });

    // 2. 선택된 충전소 변경시 지도중심 이동 및 확대- mapCenter(리스트->지도)
    useEffect(() => {
        console.log('[ChargingMap] 2.선택된 충전소 변경시')
        if (!map || !selectedStationId || selectionSource !== 'list') return;

        const selectedMarker = markers.find(marker => marker.id === selectedStationId);

        if (selectedMarker) {
            const position = new kakao.maps.LatLng(selectedMarker.lat, selectedMarker.lng);
            map.setLevel(3, { anchor: position }); // 레벨 3으로 확대
            map.panTo(position); // 부드럽게 이동
        
            // infoWindow열기
            setInfoWindow({
                position: {lat: selectedMarker.lat, lng: selectedMarker.lng},
                content: selectedMarker.name,
                stationId: selectedMarker.id,
                chargerTypes: selectedMarker.chargerTypes,
            })
        }
    }, [selectedStationId, selectionSource, map, markers]);

    // 3. mapCenter prop변경시 지도 중심 이동
    useEffect(() => {
        console.log('[ChargingMap] 3.mapCenter 변경시')
        if (map && mapCenter) {
            console.log('[ChargingMap] 3-', mapCenter);
            // 새로운 좌표객체
            const moveLatLon = new kakao.maps.LatLng(mapCenter[0], mapCenter[1]);

            // 부드럽게 지도 이동
            map.panTo(moveLatLon);
        }
    }, [mapCenter, map])

    // 4. '현지도에서 검색' 핸들러
    const handleSearchHere = () => {
        console.log('[ChargingMap] 4.현지도에서 검색 클릭시');
        if (map) {
            const center = map.getCenter();
            posHere({ lat: center.getLat(), lng: center.getLng() }); // 부모로 전달 
            onMarkerClick(''); // '현지도 검색'했을때 선택된 충전소 삭제 -> 부모
            setInfoWindow(null); 

            setIsMapMoved(false);
        }
    }

    // 5. 마커클릭 핸들러(지도->리스트)
    const handleMarkerClick = (marker: MarkerType) => {
        console.log('[ChargingMap] 5. 마커클릭 시');
        if(infoWindow && infoWindow.stationId === marker.id){
            // 이미 선택된 마커를 다시 클릭하면 정보창 닫기
            setInfoWindow(null); 
            onMarkerClick(''); //빈문자열로 선택해제 알림
        } else{
            // 새로운 마커 클릭시 정보창 열기
            setInfoWindow({
                position: { lat: marker.lat, lng: marker.lng },
                content: marker.name,
                stationId: marker.id,
                chargerTypes: marker.chargerTypes,
            });

            onMarkerClick(marker.id); // 부모에 마커클릭알림
        }
    }

    // 로딩중일때 보여줄 화면
    if (loading) {
        return <div className='w-full h-full flex justify-center items-center bg-gray-50'><LottieLoading /></div>
    }

    // 에러 발생시 보여줄 화면
    if (error) {
        console.log('[지도 불러오기 실패]', error)
        return (
        <div className='w-full h-full gap-5 flex flex-col justify-center items-center bg-[#f2f2f2]'>
            <div className='flex flex-col justify-center items-center gap-2'>
                <p className='text-2xl font-bold text-[#232323]'>지도를 불러오지 못했습니다.</p>    
                <p className='text-lg text-[#666]'>네트워크 상태를 확인하거나 다시 시도해주세요.</p> 
            </div>
            <button
                onClick={retry}
                className='confirm px-5 py-2 rounded-lg cursor-pointer hover:bg-green-800 transition'
            >
                다시시도
            </button>   
        </div>
        )
    }



    // 로딩이 완료되면 지도 렌더링
    return (
        <div className='relative w-full h-full'>
            <Map center={mapCenter ? { lat: mapCenter[0], lng: mapCenter[1] } : { lat: 35.1795, lng: 129.0756 }} // 초기 중심좌표(디폴트: 부산대역)
                style={{ width: "100%", height: "100%" }}
                level={5}
                onCreate={setMap}   // map인스턴스를 저장
                onIdle={(map) => setCurrentZoom(map.getLevel())} // 줌 레벨 변경 시 state 업데이트
                onDragStart={() => setIsMapMoved(true)} // 사용자가 드래그하면
            >
                {/* 내 위치기반 반경 */}
                {myPos && (
                    <Circle center={{ lat: myPos[0], lng: myPos[1] }}
                        radius={radius}
                        strokeWeight={2}
                        strokeColor={'#4FA969'}
                        strokeOpacity={0.5}
                        fillColor={'#4FA969'}
                        fillOpacity={0.2}
                    />
                )}

                {/* 2. 맵객체 확실히 생긴후 클러스터, 마커 생성 */}
                {map && 
                    <>
                        {/* 마커 클러스터러 */}
                        <MarkerClusterer 
                            key={markers.length > 0 ? `${markers.length}-${mapCenter}` : mapCenter?.join('-')}    // 마커가 바뀔때마다 바뀌는값으로 key값을 주기❗
                            averageCenter={true}   // 클러스터 마커를 평균 위치로 설정
                            minLevel={MIN_CLUSTER_LEVEL}    // 클러스터링 최소 레벨
                            // disableDefaultClick={true}
                            styles={[
                                {
                                    width: '50px', height: '50px',
                                    background: '#51cf66',
                                    borderRadius: '25px', color: '#fff',
                                    textAlign: 'center', lineHeight: '50px',
                                }
                            ]}
                        >
                            {markers.map((marker, idx) => {
                                const isSelected = marker.id === selectedStationId;
                                const isAvailable = marker.availableCnt > 0;
                                const isRecommend = !!marker.predTag; // 존재하면 true, undefined이면 false
                                const isInfoWindowOpen = infoWindow && infoWindow.stationId === marker.id;
                                
                                
                                let imgSrc = '/unavailable.png';
                                let imgSize = { width: 12, height: 12 };

                                if (isSelected || isInfoWindowOpen) {
                                    imgSrc = 'isSelected.png'
                                    imgSize = { width: 50, height: 50 };
                                } else if (isRecommend) {
                                    //작은거 20/20/ yanchor=1  //원래 32/32/1.35 //제일 큰거 50/50/1.85
                                    if(marker.predTag){ // predTag가 undefined이 아닐때
                                        if(marker.predTag === '0'){
                                            imgSize = { width: 35, height: 35 };  
                                            imgSrc = '/recommend_1.png';
                                        } else if (marker.predTag === '1'){
                                            imgSize = { width: 32, height: 32 };  
                                            imgSrc = '/recommend_1y.png';
                                        } else if (marker.predTag === '2'){
                                            imgSize = { width: 20, height: 20 };  
                                            imgSrc = '/recommend_2o.png';
                                        } else if (marker.predTag === '3'){
                                            imgSize = { width: 20, height: 20 };  
                                            imgSrc = '/recommend_3r.png';
                                        }
                                    }   
                                    // if(marker.changeStatus === 'increase'){
                                    //     imgSrc = '/available2.png';
                                    // } else if (marker.changeStatus === 'decrease'){
                                    //     imgSrc = '/available2.png';
                                    // } else{
                                    //     imgSrc = '/available.png';
                                    // }
                                } else if (isAvailable) {
                                    imgSize = { width: 32, height: 32 };  
                                    imgSrc = '/available.png';
                                }

                                return (
                                    // <React.Fragment key={`${marker.id}-${marker.lat}-${marker.lng}`}>
                                        <MapMarker 
                                            key={`${marker.id}-${idx}`}
                                            position={{ lat: marker.lat, lng: marker.lng }}
                                            image={{
                                                src: imgSrc,
                                                size: imgSize,
                                            }}
                                            onClick={()=>{
                                                // 이벤트전파 차단
                                                //  if (mouseEvent && mouseEvent.domEvent) {
                                                //     mouseEvent.domEvent.stopPropagation();
                                                // }
                                                handleMarkerClick(marker)}
                                            }
                                            zIndex={isSelected ? 999 : isAvailable ? 10 : 1}
                                        >
                                        </MapMarker>
                                        
                                )
                            })}
                        </MarkerClusterer>
                        {/* 기본 오버레이 */}
                        {markers.map((marker:MarkerType) => {
                            const show = !marker.predTag && marker.availableCnt > 0 && marker.id !== selectedStationId && currentZoom < MIN_CLUSTER_LEVEL  && (!infoWindow || infoWindow.stationId !== marker.id);
                            if(show){
                                return (
                                    <CustomOverlayMap
                                        key={marker.id}
                                        position={{ lat: marker.lat, lng: marker.lng }}
                                        yAnchor={1.35}
                                        zIndex={11}
                                    >
                                        <div className="customoverlay">
                                            <div style={{color: 'white', fontSize: '12px', pointerEvents: 'none'}} >
                                                {marker.availableCnt}
                                            </div>
                                        </div>
                                    </CustomOverlayMap>
                                )
                            } else {
                                return null;
                            }
                        })}
                    </>
                }
                
                {/* 선택된 마커 정보창 */}
                {infoWindow && currentZoom < MIN_CLUSTER_LEVEL && (
                    <CustomOverlayMap 
                        position={infoWindow.position} 
                        yAnchor={2.5}
                        zIndex={1000}    
                    >
                        <div className='px-5 py-2 flex gap-2 justify-center bg-[#F7FECD] border-[#CACFAC] rounded-full shadow-lg'>
                            {/* 충전기 타입별 개수 */}
                            {/* 급속 충전기 */}
                                {infoWindow.chargerTypes.fastTotal > 0 && (
                                    <div className='text-[12px] font-bold'>
                                        <span className='mr-1'>급</span>
                                        {infoWindow.chargerTypes.fastCount}
                                        <span className='text-[#6b6b6b]'>/{infoWindow.chargerTypes.fastTotal}</span>
                                    </div>
                                )}
                                
                                {/* 중속 충전기 */}
                                {infoWindow.chargerTypes.midTotal > 0 && (
                                    <div className='text-[12px] font-bold'>
                                        <span className='mr-1'>중</span>
                                        {infoWindow.chargerTypes.midCount}
                                        <span className='text-[#6b6b6b]'>/{infoWindow.chargerTypes.midTotal}</span>
                                    </div>
                                )}
                                
                                {/* 완속 충전기 */}
                                {infoWindow.chargerTypes.slowTotal > 0 && (
                                    <div className='text-[12px] font-bold'>
                                        <span className='mr-1'>완</span>
                                        {infoWindow.chargerTypes.slowCount}
                                        <span className='text-[#6b6b6b]'>/{infoWindow.chargerTypes.slowTotal}</span>
                                    </div>
                                )}
                        </div>
                    </CustomOverlayMap>
                )}
            </Map>
            {isMapMoved && (
                <button
                    // ✨ 상단 중앙 배치 스타일
                    className="absolute top-5 left-1/2 -translate-x-1/2 flex items-center  bg-[#4FA969] px-4 py-2 rounded-full shadow-lg z-10  
                    hover:bg-[#5a9c6d] transition-all duration-300 ease-in-out  text-white font-semibold text-[15px] cursor-pointer"
                    onClick={handleSearchHere}
                >
                    <span className='mb-1 mr-2'><IoRefreshOutline size={20}/></span>
                    현 지도에서 검색
                </button>
            )}
            
            <div className='absolute bottom-5 right-5 z-10 flex flex-col items-end gap-2'>
                <div className='relative group/icon'>
                    <div className='p-1 mr-1 border-2 border-white text-white bg-[#4FA969] rounded-full 
                                    z-10 cursor-pointer shadow-lg hover:bg-green-700 transition-colors'
                    >
                        <BsExclamation size={20}/>
                    </div>
                    <div className="absolute top-1/2 -translate-y-1/2 right-full mr-2
                        px-2 py-1 bg-black/70 text-white text-sm rounded
                        opacity-0 invisible group-hover/icon:opacity-100 group-hover/icon:visible transition-all whitespace-nowrap">
                        <p>시간을 조정하여 최적의 충전소를 추천해드립니다.</p>
                        <Image src={'/recommended_0.png'} alt='reco0' width={50} height={50}/>
                        <Image src={'/recommended_1y.png'} alt='reco1' width={5} height={5}/>
                        <Image src={'/recommended_2o.png'} alt='reco2' width={5} height={5}/>
                        <Image src={'/recommended_3r.png'} alt='reco3' width={5} height={5}/>
                    </div>
                </div>
                <button
                    className={`
                                flex items-center  ${showPredictBtn ? 'justify-between' : 'justify-center'}  gap-4
                                bg-white border px-6 py-2 rounded-full shadow-lg  text-[#4FA969] font-bold 
                                hover:bg-gray-100 
                                transition-all duration-300 ease-in-out overflow-hidden`}
                    // 2. showPredictBtn 상태에 따라 패딩과 너비를 동적으로 변경
                    style={{ 
                        width: showPredictBtn ? '320px' : '150px' // 확장/축소될 너비 지정
                    }}
                    onClick={()=>setShowPredictBtn(!showPredictBtn)}
                >
                    <span>
                        {predictHours === 0 ? '실시간' : `${predictHours}시간 후`}
                    </span>
                    {showPredictBtn &&
                        <div className={` w-[180px] transition-opacity duration-300 ease-in-out`}>
                            {/* home까지 값이감 */}
                            <TimeFilter value={predictHours} onTimeSelect={onHoursChange} showLabel={false} max={24}/> 
                        </div>
                    }
                </button>
            </div>
            
        </div>
    )
}
