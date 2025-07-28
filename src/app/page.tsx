'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import axios from "axios";
import { isEqual } from "lodash";

import ChargingMap from "@/components/Home/ChargingMap";
import StationListPanel from "@/components/Home/StationListPanel/StationListPanel";
import {ChargingStationResponseDto, ChargingStationRequestDto} from '../types/dto';
import {ChargingStationPredictionRequestDto, ChargingStationPredictionResponseDto} from '../types/dto';
import { StationListItem } from "../types/dto";
import nmToid from '../db/busi_id.json'
import Image from "next/image";
import style from './home.module.css'
import statResp from '../db/ChargingStatRespDto.json'
import statPredictResp from '../db/PredictChargingStatRespDto.json'

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

function CompNmToIds(selectedNm: string[]):string[]{
  return nmToid.filter(company => selectedNm.includes(company.busi_nm))
              .map(company => company.busi_id);
}

export default function Home() {
  const ongoing = useRef<AbortController | null>(null); // 1) AbortController 로 이전 요청 취소
  const[chgerData, setChgerData] = useState<ChargingStationResponseDto[]>([]);  // resp
  const [currentFilter, setCurrentFilter] = useState<Filters>({                 // req에 담을 정보
      lat: 0,
      lon: 0,
      radius: 2000,
      canUse: false,
      parkingFree: false,
      limitYn: false,
      chargerTypes: [],
      chargerComps: [],
      outputMin: 0,
      outputMax: 300, 
      keyWord: '',
  });
  const [myPos, setMyPos] = useState<[number, number] | null >(null);           // 맵에 쓰일 현재위치 _ 반경표시
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);    // 맵의 중심  // 초기값설정해두면 fetch가 두번 반복되기 때문에 맵에 그려질 수도 있고 아닐 때도 있는거
  const [selectedStation, setSelectedStation] = useState<StationListItem | null >(null);     // 선택된 충전소
  const [selectionSource, setSelectionSource] = useState<'list'| 'map'| null>(null);   // 선택이 어디서왔는지(list/map)

  const [viewMode, setViewMode] = useState<'current' | 'prediction'>('current'); // 현재모드 관리
  const [predictionHours, setPredictionHours] = useState<number>(0);             // 몇시간 후 예측인지
  const [predictChgerDt, setPredictChgerDt] = useState<ChargingStationPredictionResponseDto[] | null >(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 1. 충전소 정보 가져오기
  const fetchStations = useCallback(async (filtersToApply: Filters) => {
    console.log('[Home] 1. 충전소 정보요청')
    ongoing.current?.abort();                   // 직전 요청 취소
    const controller = new AbortController();   // 새 컨트롤러
    ongoing.current = controller;

    
    // API 요청 DTO에 맞게 필터 객체 구성
    const requestBody: ChargingStationRequestDto = {
      "coorDinatesDto" : {
        lat: filtersToApply.lat,
        lon: filtersToApply.lon,
        radius: filtersToApply.radius,
      },
      "mapQueryDto":{
        useMap: true,
        canUse: filtersToApply.canUse,
        parkingFree: filtersToApply.parkingFree,
        limitYn: filtersToApply.limitYn,
        chgerType: filtersToApply.chargerTypes.length > 0 ? filtersToApply.chargerTypes : [], // 빈 배열일 때 undefined로 보내는 등 백엔드에 맞게 조정
        busiId: filtersToApply.chargerComps.length > 0 ? CompNmToIds(filtersToApply.chargerComps) : [],
        outputMin: filtersToApply.outputMin,
        outputMax: filtersToApply.outputMax,
        keyWord: filtersToApply.keyWord
      }
    };

    console.log("API 요청 보낼 필터:", requestBody);

    try {
      const res = await axios.post<ChargingStationResponseDto[]>(
        `http://${process.env.NEXT_PUBLIC_BACKIP}:8080/map/post/stations`,
        requestBody,
        { signal: controller.signal } 
      );
      const data = Array.isArray(res.data) ? res.data : [];
      return data;
      // return statResp;  //🍕 위에주석풀기
    } catch (err) {
      if (axios.isCancel(err)) return;            // “정상 취소”는 무시
      console.error("fetchStations error: ", err);
      return [];
    }
  }, []); 

  // 받은 chgerData markers에 넣기(지도)
  const markers = useMemo(() => {
    console.log('[Home] -  Memo: marker 재생성')  

    // 보여줄 기준데이터 선택
    const baseData = predictChgerDt || chgerData;

    // 현재데이터를 쉽게 찾기위해 Map형태로 변환
    const currentDataMap = new Map(chgerData.map(station => [station.statId, station]))

    return baseData.map((stat) => {
      const currentStation = currentDataMap.get(stat.statId);
      let changeStatus: 'increase' | 'decrease' | 'same' | 'none' = 'none';

      // 예측 모드이고, 현재 데이터가 있을 때만 비교
      if (predictChgerDt && currentStation) {
          if (stat.chargeNum > currentStation.chargeNum) {
              changeStatus = 'increase';
          } else if (stat.chargeNum < currentStation.chargeNum) {
              changeStatus = 'decrease';
          } else {
              changeStatus = 'same';
          }
      }
      
      return {
        id: stat.statId,
        name: stat.statNm,
        lat: stat.lat,
        lng: stat.lng,
        availableCnt: stat.chargeNum,
        changeStatus: changeStatus,
        chargerTypes: {
          fastCount: stat.chargeFastNum,
          fastTotal: stat.totalFastNum,
          midCount: stat.chargeMidNum,
          midTotal: stat.totalMidNum,
          slowCount: stat.chargeSlowNum,
          slowTotal: stat.totalSlowNum,
        }, 
      }
    });
  }, [chgerData, predictChgerDt]);

  // 받은 chgerData listItems에 넣기(리스트)
  const listItems = useMemo<StationListItem[]>(() => {
    console.log('[Home] - Memo: listItems 재생성');
    const baseData = predictChgerDt || chgerData;
    
    // changeStatus만들기위해 현재 데이터 Map
    const currentDataMap = new Map(chgerData.map(station => [station.statId, station.chargeNum]));

    // chgerData형태로 통일
    const unifiedList = baseData.map((stat)=>{
      // - 데이터 형태 통일
      let stationDto: ChargingStationResponseDto; // 최종적으로 통일될 변수

      if('totalNacsNum' in stat){
        const {totalNacsNum, chargingDemand, ...rest} = stat as ChargingStationPredictionResponseDto; // 예측dt에서 해당속성제거
        stationDto = rest;
      } else {
        stationDto = stationDto;
      }

      // - changeStatus 속성 추가
      const currentStation = currentDataMap.get(stat.statId);
      let changeStatus: 'increase' | 'decrease' | 'same' | 'none' = 'none';

      // 예측모드일때만 계산
      if (predictChgerDt && currentStation) {
          if (stat.chargeNum > currentStation) {
              changeStatus = 'increase';
          } else if (stat.chargeNum < currentStation) {
              changeStatus = 'decrease';
          } else {
              changeStatus = 'same';
          }
      }

      return{
        ...stationDto, // 통일된 기본정보
        changeStatus
      }
    })

    return unifiedList;
  },[chgerData, predictChgerDt]);

  // 10. n시간 후 충전소 상태
  const fetchStationPrediction = useCallback(async(filtersToApply: Filters, nHours:number) => {
    console.log('[Home] 10. n시간후 충전소 정보요청')
    const requestBody: ChargingStationPredictionRequestDto = {
      "coorDinatesDto" : {
        lat: filtersToApply.lat,
        lon: filtersToApply.lon,
        radius: filtersToApply.radius,
      },
      "mapQueryDto":{
        useMap: true,
        canUse: filtersToApply.canUse,
        parkingFree: filtersToApply.parkingFree,
        limitYn: filtersToApply.limitYn,
        chgerType: filtersToApply.chargerTypes.length > 0 ? filtersToApply.chargerTypes : [], // 빈 배열일 때 undefined로 보내는 등 백엔드에 맞게 조정
        busiId: filtersToApply.chargerComps.length > 0 ? CompNmToIds(filtersToApply.chargerComps) : [],
        outputMin: filtersToApply.outputMin,
        outputMax: filtersToApply.outputMax,
        keyWord: filtersToApply.keyWord
      },
      time: "2025-07-23T00:31:45.380Z" // kdt, utc 물어보기
    };
    console.log("API 요청 보낼 필터:", requestBody);

    try {
      const res = await axios.post<ChargingStationPredictionResponseDto[]>(
        `http://${process.env.NEXT_PUBLIC_BACKIP}:8080/pred/location`,
        requestBody
      );
      const data = Array.isArray(res.data) ? res.data : [];
      return data;
      // return statPredictResp; //🍕
    } catch(err){
      if(axios.isCancel(err)) return;
      console.error('fetchStationPrediction 오류: ', err);
      return null;
    }
  },[])

  // 2. 현재위치 가져오기
  useEffect(() => {
    console.log('[Home] 2. 현재위치 가져오기')
    navigator.geolocation.getCurrentPosition((position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      setMapCenter([lat, lng]);
      setMyPos([lat, lng]);
    },
    (error) => {
      console.error('위치정보를 가져오지 못했습니다.', error);
      // 위치 못가져오면 부산대역- 디폴트값
      const defaultPos: [number, number] = [35.1795, 129.0756]
      setMapCenter(defaultPos);
      setMyPos(defaultPos);
    }
  )
  }, [])

  // 4. currentFilter 변경 시 충전소 정보 다시 불러오기
  useEffect(()=>{
    // useEffect 내에서 비동기 작업을 처리하기 위해 내부 함수 선언
    const fetchData = async() =>{
      if (!myPos) return; 
      
      console.log(`[Home] 4. ${viewMode} 충전소정보 재요청`);
      setIsLoading(true); // 로딩시작

      const filtersToRequest = {
          ...currentFilter,
          lat: myPos[0], // 위치 정보는 항상 myPos에서 가져옵니다 (Single Source of Truth)
          lon: myPos[1],
      };
      try{
        if (viewMode === 'prediction'){
          // 현재, 예측 동시에
          const [currentResult, predictionResult] = await Promise.all([ //Promise.all**을 사용하면 두 API를 병렬로 호출하여 시간을 절약
            // 결과값을 return 해주어야 Promise.all이 값을 받을 수 있음
            fetchStations(filtersToRequest),
            fetchStationPrediction(filtersToRequest, predictionHours)
          ]);

          setChgerData(currentResult);  
          setPredictChgerDt(predictionResult);
        } else {
          // 현재
          const currentResult = await fetchStations(filtersToRequest);

          setChgerData(currentResult);  
          setPredictChgerDt(null);
        }
      } catch(error){
        console.error('fetchData 에러: ', error);
        setChgerData([]);
        setPredictChgerDt(null);
      } finally{
        setIsLoading(false);
      }
    };
    fetchData()

  },[myPos, currentFilter, predictionHours, fetchStations, fetchStationPrediction])

  // 📍지도관련 함수들
  // 9. 지도 현위치에서 검색
  const handleSearchHere = useCallback((center: {lat: number, lng: number}) =>{
    console.log('[Home] 9. 현지도에서 검색 실행시')
    const lat = center.lat;
    const lng = center.lng;
    console.log('[Home]지도중심 좌표: 9-', lat, lng);
    setMyPos([lat, lng]);
    setMapCenter([lat, lng]);
  },[]) //재생성될 필요가 없으므로

  // 11. predictHours 콜백
  const handlePredictionHours = useCallback((hours: number) => {
    setPredictionHours(hours);
    if(hours > 0){  //PredictionHours은 데이터상태고, ViewMode는 사용자의 의도를 나타냄
      setViewMode('prediction');
    } else {
      setViewMode('current');
    }
  },[])

  // 📍리스트관련 함수들
  // 1. 검색
  const handleSearch = useCallback((keyword: string) => {
    if(!myPos) return;

    setCurrentFilter(prev => ({
      ...prev,
      keyWord: keyword,
    }));
  },[currentFilter, myPos]) 

  // 2. 필터 적용
  const handleFilterChange = useCallback((newFilters: Omit<Filters, 'lat' | 'lon'>) => {
    if(!myPos) return;

    const nextFilter ={
      ...currentFilter,
      ...newFilters
    }
    console.log(nextFilter);
    if(!isEqual(currentFilter, newFilters)){
      setCurrentFilter(nextFilter);
    }
  }, [currentFilter, myPos]) // 해당 디펜던시 값이 변할때 정보 업데이트

  // 3. 충전소 클릭(리스트 -> 마커)
  const handleStationClick = useCallback((station:StationListItem | null)=>{
    console.log('[Home] 3. 리스트에서 충전소 선택:', station);

    if(station) {
      setSelectionSource('list'); // 리스트 선택 표시
      setMapCenter([station.lat, station.lng]);
      setSelectedStation(station);
      console.log('선택한 충전소 정보: ', station);
    } else{
      setSelectedStation(null);
      setSelectionSource(null);
    }

  },[])

  // 3-2. 마커클릭 처리(지도 -> 리스트)
  const handleMapMarkerClick = useCallback((markerId: string) => {
    console.log('[Home] 3. 지도에서 마커 선택', markerId);

    // 해당마커의 상세정보 listItem에서 찾기
    const selectedStationFromList = listItems.find(item => item.statId === markerId);

    if(selectedStationFromList){
      setSelectionSource('map'); // 지도에서 선택 표시
      setSelectedStation(selectedStationFromList);
    }
  },[listItems])


  return (
    <div className={style.mainContainer}>
      <div className="shrink-0 w-[440px] h-full flex flex-col p-7 bg-white z-50 shadow-md">
        <StationListPanel
          // onClose={() => setIsListModalOpen(false)}
          list={listItems}
          currentFilter={currentFilter}
          onFilterChange={handleFilterChange}
          onStationClick={handleStationClick}
          onSearch={handleSearch}
          selectedStation = {selectedStation}
          selectionSource = {selectionSource}
        />
      </div>
      <div className="flex-grow h-full relative ">
        {myPos && mapCenter && markers.length > 0 &&
          <ChargingMap myPos={myPos} 
                      radius={currentFilter.radius} 
                      mapCenter={mapCenter} 
                      markers={markers} 
                      posHere={handleSearchHere}  
                      selectedStationId={selectedStation?.statId}
                      predictHours = {predictionHours} 
                      onHoursChange={handlePredictionHours}
                      onMarkerClick = {handleMapMarkerClick}
                      selectionSource = {selectionSource}
          />
        }
      </div>
    </div>
  );
}
