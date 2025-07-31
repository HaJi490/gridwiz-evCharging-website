'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import axios from "axios";
import { isEqual } from "lodash";
import { useAtom } from "jotai";
import { accessTokenAtom } from '@/store/auth';
import { useRouter } from "next/navigation";

import LottieLoading from "@/components/LottieLoading";
import ChargingMap from "@/components/Home/ChargingMap";
import StationListPanel from "@/components/Home/StationListPanel/StationListPanel";
import ConfirmModal from "@/components/ConfirmModal/ConfirmModal";
import Toast from "@/components/Toast/Toast";
import {ChargingStationResponseDto, ChargingStationRequestDto} from '../types/dto';
import {ChargingStationPredictionRequestDto, ChargingStationPredictionResponseDto, RecommendedStationDto} from '../types/dto';
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
  const [recommendedChgerDt, setRecommendedChgerDt] = useState<RecommendedStationDto[] | null>(null);
  
  const [shortest, setShortest] = useState<ChargingStationResponseDto[] | null>(null);
  const [isLongCharging, setIsLongCharging] = useState<boolean>(false); // 장기충전가능
  const [isLongChargingDt, setIsLongChargingDt] = useState<ChargingStationResponseDto[] | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [token] = useAtom(accessTokenAtom) ;
  // 차량확인 모달
  const [modalInfo, setModalInfo] = useState<{
      show: boolean;
      message: string;
      submessage: string;
  }>({
      show: false,
      message: '',
      submessage: '',
  });
  const route = useRouter();
  const [toastMsg, setToastMsg] = useState('');

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
        // { signal } 
      );
      const data = Array.isArray(res.data) ? res.data : [];
      console.log(data);
      return data;
      // return statResp;  //🍕 위에주석풀기
    } catch (err) {
      if (axios.isCancel(err)) return [];            // “정상 취소”는 무시
      console.error("fetchStations error: ", err);
      return [];
    }
  }, []); 

  // 최단거리, 최소시간 요청
  const fetchShortest = useCallback(async(filtersToApply: Filters)=>{ //, signal: AbortSignal
    console.log('[Home] 13. 최단최소 정보요청')
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

    console.log("API 최단요청 보낼 필터:", requestBody);
    try {
      const res =
        await axios.post<ChargingStationResponseDto[]>(
          `http://${process.env.NEXT_PUBLIC_BACKIP}:8080/map/get/near`,
          requestBody,
          // { signal} 
        )

      const data = Array.isArray(res.data) ? res.data : [];
      console.log(data);
      return data;
    } catch (err) {
      if (axios.isCancel(err)) return;            // “정상 취소”는 무시
      console.error("fetchShortest 에러: ", err);
      return [];
    }
  },[])

  // 받은 chgerData markers에 넣기(지도)
  const markers = useMemo(() => {
    console.log('[Home] -  Memo: marker 재생성')  

    // 보여줄 기준데이터 선택
    const baseData = recommendedChgerDt  || chgerData;

    // 현재데이터를 쉽게 찾기위해 Map형태로 변환
    // const currentDataMap = new Map(chgerData.map(station => [station.statId, station]))

    return baseData.map((stat) => {
      // const currentStation = currentDataMap.get(stat.statId);
      // let changeStatus: 'increase' | 'decrease' | 'same' | 'none' = 'none';

      // // 예측 모드이고, 현재 데이터가 있을 때만 비교
      // if (predictChgerDt && currentStation) {
      //     if (stat.chargeNum > currentStation.chargeNum) {
      //         changeStatus = 'increase';
      //     } else if (stat.chargeNum < currentStation.chargeNum) {
      //         changeStatus = 'decrease';
      //     } else {
      //         changeStatus = 'same';
      //     }
      // }
      
      return {
        id: stat.statId,
        name: stat.statNm,
        lat: stat.lat,
        lng: stat.lng,
        availableCnt: stat.chargeNum,
        // changeStatus: changeStatus,
        chargerTypes: {
          fastCount: stat.chargeFastNum,
          fastTotal: stat.totalFastNum,
          midCount: stat.chargeMidNum,
          midTotal: stat.totalMidNum,
          slowCount: stat.chargeSlowNum,
          slowTotal: stat.totalSlowNum,
        }, 
        ...(recommendedChgerDt && 'predTag' in stat && {
          predTag: (stat as RecommendedStationDto).predTag,
          minute: (stat as RecommendedStationDto).minute,
        })
      }
    });
  }, [chgerData, recommendedChgerDt]);

  // 받은 chgerData listItems에 넣기(리스트)
  const listItems = useMemo<StationListItem[]>(() => {
    console.log('[Home] - Memo: listItems 재생성');
    const baseData = recommendedChgerDt || chgerData;
    
    // changeStatus만들기위해 현재 데이터 Map
    const currentDataMap = new Map(chgerData.map(station => [station.statId, station.chargeNum]));

    // chgerData형태로 통일
    const unifiedList = baseData.map((stat)=>{
      // - 데이터 형태 통일
      let stationDto: ChargingStationResponseDto; // 최종적으로 통일될 변수
      let additionalInfo: { predTag?: string; minute?: number } = {};

      if('predTag' in stat && 'minute' in stat){
        // RecommendedStationDto인 경우
        const { predTag, minute, ...rest } = stat as RecommendedStationDto;
        stationDto = rest;
        additionalInfo = { predTag, minute };
      } else{
        stationDto = stat;
      }
      
      // if('totalNacsNum' in stat){
      //   const {totalNacsNum, chargingDemand, ...rest} = stat as ChargingStationPredictionResponseDto; // 예측dt에서 해당속성제거
      //   stationDto = rest;
      // } else {
      //   stationDto = stat;
      // }

      // - changeStatus 속성 추가
      // const currentStation = currentDataMap.get(stat.statId);
      // let changeStatus: 'increase' | 'decrease' | 'same' | 'none' = 'none';

      // // 예측모드일때만 계산
      // if (recommendedChgerDt) {
      //     if (stat.chargeNum > currentStation) {
      //         changeStatus = 'increase';
      //     } else if (stat.chargeNum < currentStation) {
      //         changeStatus = 'decrease';
      //     } else {
      //         changeStatus = 'same';
      //     }
      // }
      
      // if (predictChgerDt && currentStation) {
      //     if (stat.chargeNum > currentStation) {
      //         changeStatus = 'increase';
      //     } else if (stat.chargeNum < currentStation) {
      //         changeStatus = 'decrease';
      //     } else {
      //         changeStatus = 'same';
      //     }
      // }

      return{
        ...stationDto, // 통일된 기본정보
        predTag: additionalInfo.predTag,
        minute: additionalInfo.minute,
      }
    })

    return unifiedList;
  },[chgerData, recommendedChgerDt]);

  // 10. n시간 후 충전소 상태
  const fetchStationPrediction = useCallback(async(filtersToApply: Filters, nHours:number) => {
    if(!token) {
      setToastMsg('로그인이 필요한 서비스입니다.');
    }

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
        requestBody,
        {headers: { Authorization: `Bearer ${token}`}}
      );
      const data = Array.isArray(res.data) ? res.data : [];
      return data;
      // return statPredictResp; //🍕
    } catch(err){
      if(axios.isCancel(err)) return;
      console.error('fetchStationPrediction 오류: ', err);
      return null;
    }
  },[]);

  // 11. 충전소 추천 정보요청(장기충전 선택x, 예측)
  const fetchStationRecommended = useCallback(async(filtersToApply: Filters, nHours:number) => {
    console.log('[Home] 11. 충전소 추천 정보요청');

    // 시간 포맷팅
    const requestDate = new Date();
    requestDate.setHours(nHours, 0, 0, 0);
    console.log('포맷팅한 시간: ', requestDate);
    console.log('최종요청 시간: ', requestDate);
    
    // const requestBody = {
    //   "coorDinatesDto" : {
    //     lat: filtersToApply.lat,
    //     lon: filtersToApply.lon,
    //     radius: filtersToApply.radius,
    //   },
    //   // time: "2025-07-23T00:31:45.380Z", //🥕🥕수정
    // };
    const requestBody = {
      lat: filtersToApply.lat,
      lon: filtersToApply.lon,
      radius: filtersToApply.radius,
    };
    console.log('추천충전소 요청 필터: ', requestBody);

    try{
      const res = await axios.post<RecommendedStationDto[]>(
        `http://${process.env.NEXT_PUBLIC_BACKIP}:8080/recommend/car`,
        requestBody,
        // {headers: { Authorization: `Bearer ${token}`}}
      );
      const data = Array.isArray(res.data) ? res.data : [];
      return data;
    } catch(err){
      if(axios.isCancel(err)) return;
      console.error('fetchStationRecommended 오류: ', err);
      return null;
    }
  },[])

  // 14. 장기충전요청, 예측
  const fetchLongCharging = useCallback(async(filtersToApply: Filters, nHours:number)=>{
    console.log('[Home] 14. 장기충전가능 요청');

    const requestDate = new Date();
    requestDate.setHours(nHours, 0, 0, 0);
    console.log('포맷팅한 시간: ', requestDate);
    console.log('최종요청 시간: ', requestDate);

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

    console.log('장기충전요청 필터: ', requestBody);
    try{
      const res = await axios.post<ChargingStationResponseDto[]>(
        `http://${process.env.NEXT_PUBLIC_BACKIP}:8080/map/get/longUse`,
        requestBody,
      )
      const data = Array.isArray(res.data) ? res.data : [];
      console.log(data);
      return data;
    } catch(err){
      if(axios.isCancel(err)) return;
      console.error('fetchStationRecommended 오류: ', err);
      return null;
    }
  },[])

  // 2. 현재위치 가져오기
  useEffect(() => {
    console.log('[Home] 2. 현재위치 가져오기');

    const getLocation = async() =>{
      const isDevelopment = process.env.NODE_ENV === 'development' ||
                            window.location.hostname === 'localhost' ||
                            window. location.protocol === 'http:';
      if(isDevelopment){
        console.log('2 - 개발 환경 - 기본 위치 사용');
        // 부산대 과학기술연구동
        const defaultPos: [number, number] = [35.2300, 129.0880];
        setMapCenter(defaultPos);
        setMyPos(defaultPos);
        return;
      }
  
      // HTTPS 환경에서 실제 위치 정보 사용
      if (!navigator.geolocation) {
        console.log('2 - Geolocation API를 지원하지 않음');
        const defaultPos: [number, number] = [35.2300, 129.0880];
        setMapCenter(defaultPos);
        setMyPos(defaultPos);
        return;
      }

      try{
        console.log('2 - 실제위치 요청...');

        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            resolve,
            reject,{
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 300000 // 5분 캐시
            }
          );
        });

        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        console.log('2 - 위치 정보 획득:', { lat, lng });
        setMapCenter([lat, lng]);
        setMyPos([lat, lng]);

      } catch (error) {
        console.error('2 - 위치정보 획득 실패:', error);

        // 에러타입에 따른 처리
        if(error instanceof GeolocationPositionError){
          switch (error.code) {
            case error.PERMISSION_DENIED:
              console.log('위치 정보 권한이 거부됨');
              break;
            case error.POSITION_UNAVAILABLE:
              console.log('위치 정보를 사용할 수 없음');
              break;
            case error.TIMEOUT:
              console.log('위치 정보 요청 시간 초과');
              break;
          }
        }
        // 기본 위치설정
        const defaultPos: [number, number] = [35.2300, 129.0880];
        setMapCenter(defaultPos);
        setMyPos(defaultPos);
      }
    }
    getLocation();

  //   navigator.geolocation.getCurrentPosition((position) => {
  //     const lat = position.coords.latitude;
  //     const lng = position.coords.longitude;
  //     setMapCenter([lat, lng]);
  //     setMyPos([lat, lng]);
  //   },
  //   (error) => {
  //     console.error('위치정보를 가져오지 못했습니다.', error);
  //     // 위치 못가져오면 부산대역- 디폴트값
  //     // 1. 부산대 과학기술연구동
  //     // 35.2300°N, 129.0880°E
      
  //     // 2. 부산대역
  //     // 위도: 35.229927
  //     // 경도: 129.089364 
  //     const defaultPos: [number, number] = [35.2300, 129.0880]
  //     setMapCenter(defaultPos);
  //     setMyPos(defaultPos);
  //   }
  // )
  }, [])

  // 4. currentFilter 변경 시 충전소 정보 다시 불러오기
  useEffect(()=>{
    // useEffect 내에서 비동기 작업을 처리하기 위해 내부 함수 선언
    const fetchData = async() =>{
      if (!myPos) return; 
      
      console.log(`[Home] 4. ${viewMode} 충전소정보 재요청`);
      setIsLoading(true); // 로딩시작

      // AbortController를 여기서 생성
      // ongoing.current?.abort();
      // const controller = new AbortController();
      // ongoing.current = controller;
      
      const filtersToRequest = {
          ...currentFilter,
          lat: myPos[0], // 위치 정보는 항상 myPos에서 가져옵니다 (Single Source of Truth)
          lon: myPos[1],
      };
      try{
        // const currentResult = await fetchStations(filtersToRequest);
        //     console.log('✅ 테스트 결과:', currentResult); // 결과가 잘 오는지 확인

        //     setChgerData(currentResult || []); // 항상 배열이 되도록 보장
        if (viewMode === 'prediction'){
          if(isLongCharging){
            const [shortestResult, isLongChargingResult] = await Promise.all([
              fetchShortest(filtersToRequest),
              fetchLongCharging(filtersToRequest, predictionHours)
            ]);

            setShortest(shortestResult);
            setIsLongChargingDt(isLongChargingResult);

          } else {
            const [currentResult, shortestResult, recommendedResult] = await Promise.all([ //Promise.all**을 사용하면 두 API를 병렬로 호출하여 시간을 절약
              // 결과값을 return 해주어야 Promise.all이 값을 받을 수 있음
              fetchStations(filtersToRequest),  //, controller.signal
              fetchShortest(filtersToRequest),
              // fetchStationPrediction(filtersToRequest, predictionHours)
              fetchStationRecommended(filtersToRequest, predictionHours)
            ]);

            console.log('✅ 현재 데이터:', currentResult?.length || 0, '개');
            console.log('✅ 추천 데이터:', recommendedResult?.length || 0, '개');

            setChgerData(currentResult);
            setShortest(shortestResult);  
            // setPredictChgerDt(predictionResult);
            setRecommendedChgerDt(recommendedResult);
          }
        } else {
          // 현재
          const [currentResult, shortestResult] = await Promise.all([ //Promise.all**을 사용하면 두 API를 병렬로 호출하여 시간을 절약
            // 결과값을 return 해주어야 Promise.all이 값을 받을 수 있음
            fetchStations(filtersToRequest ),
            fetchShortest(filtersToRequest),
            // fetchStationPrediction(filtersToRequest, predictionHours)
          ]);

          setChgerData(currentResult);
          setShortest(shortestResult);  
          setRecommendedChgerDt(null);
        }
      } catch(error){
        if (axios.isCancel(error)) {
            console.log('Request canceled');
        } else {
            console.error('fetchData 에러: ', error);
            setChgerData([]);
            setShortest(null);
            setRecommendedChgerDt(null);
        }
      } finally{
        // ongoing.current가 현재 컨트롤러와 같을 때만 로딩 종료 (새 요청이 시작되지 않았을 경우)
            setIsLoading(false);
      }
    };
    fetchData()

  },[myPos, currentFilter, viewMode, predictionHours, fetchStations, fetchStationRecommended, fetchShortest])

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
    console.log('[Home] 3. 리스트에서 충전소 선택:', station?.statNm || 'null');

    if(station) {
      setSelectionSource('list'); // 리스트 선택 표시
      setMapCenter([station.lat, station.lng]);
      setSelectedStation(station);
      console.log('선택한 충전소 정보: ', station);
    } else{
      console.log('🔄 충전소 선택 해제');
      setSelectedStation(null);
      setSelectionSource(null);
    }

  },[])

  // 3-2. 마커클릭 처리(지도 -> 리스트)
  const handleMapMarkerClick = useCallback((markerId: string) => {
    console.log('[Home] 3. 지도에서 마커 선택', markerId);

    if (markerId === '') {
        console.log('🔄 지도에서 충전소 선택 해제');
        setSelectedStation(null);
        setSelectionSource(null);
        return;
    }

    // 해당마커의 상세정보 listItem에서 찾기
    const selectedStationFromList = listItems.find(item => String(item.statId) === String(markerId));

    if(selectedStationFromList){
      console.log('✅ 지도에서 충전소 찾음:', selectedStationFromList.statNm);
      
      setSelectionSource('map'); // 지도에서 선택 표시
      setSelectedStation({ ...selectedStationFromList });
    }else {
      console.log('해당 마커 ID를 listItems에서 찾을 수 없음:', markerId);
      console.log('현재 listItems:', listItems.map(item => item.statId));
    }
  },[listItems])

  // 차량등록 모달 띄우기
  useEffect(()=> {
    if(!token) return;

    const userCar = async() => {
      try{
        const res = await axios.get(`http://${process.env.NEXT_PUBLIC_BACKIP}:8080/user/car/info`,
          {headers: { Authorization: `Bearer ${token}`}}
        )

        if(Array.isArray(res.data) && res.data.length === 0){
          console.log('등록차량 없음');

          setModalInfo({
            show: true,
            message: '차량등록을 하시겠습니까?',
            submessage: '더 많은 서비스를 즐기실 수 있습니다.'
          })
        }

      } catch(error){
        console.error('등록차량확인 에러: ', error);
      }
    }
    userCar();
  },[])

  // 모달 확인버튼
  const onConfirm = () => {
    setModalInfo({
        message: '',
        submessage: '',
        show: false,
    });
    route.push('/evInfo');
  }



  // 모달 닫기
  const onCancelConrirmModal = () => {
    setModalInfo({
        message: '',
        submessage: '',
        show: false,
    });
    }

  // if(isLoading || !myPos){
  //   return <div className="w-full h-screen flex justify-center items-center bg-black/10"><LottieLoading /></div>
  // }


  return (
    <div className={`${style.mainContainer} relative `}>
      <Toast message={toastMsg} setMessage={setToastMsg}/>
      {modalInfo.show &&
        <ConfirmModal message={modalInfo.message} submsg={modalInfo.submessage} onConfirm={onConfirm} onCancel={onCancelConrirmModal} />
      }
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
        {myPos && mapCenter &&  markers.length > 0 &&
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
                      shortest={shortest}
                      isLongCharging={isLongCharging}
                      onLongChargingChange={setIsLongCharging}
          />
        }
      </div>
      {(isLoading || !myPos) && (
        <div className="absolute inset-0 w-full h-full flex justify-center items-center bg-black/50 z-50">
            <LottieLoading />
        </div>
      )}
    </div>
  );
}
