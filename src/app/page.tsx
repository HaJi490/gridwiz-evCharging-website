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
import { ChargingStationResponseDto, ChargingStationRequestDto } from '../types/dto';
import { ChargingStationPredictionRequestDto, RecommendedStationDto } from '../types/dto';
import { Filters } from '../types/station/station.type'
import { StationListItem } from "../types/dto";
import nmToid from '../db/busi_id.json'
import style from './home.module.css'


/**
 * 선택된 충전 사업자 명칭을 기반으로 해당 사업자의 고유 ID 목록을 추출
 * @param {string[]} selectedNm - 사용자가 선택한 사업자 명칭 배열
 * @returns {string[]} 필터링된 사업자 고유 ID(busi_id) 배열
 */
function CompNmToIds(selectedNm: string[]): string[] {
  return nmToid.filter(company => selectedNm.includes(company.busi_nm))
    .map(company => company.busi_id);
}

/**
 * 메인 충전소 탐색 및 개인화 추천 페이지
 * 지도(Map)와 리스트(Panel) 인터페이스를 통해 실시간 충전소 상태 정보를 제공하며,
 * AI 기반의 수요 예측 및 사용자 차량 맞춤형 추천 서비스를 지원합니다.
 */
export default function Home() {
  // 요청 최적화를 위한 AbortController 레퍼런스
  const ongoing = useRef<AbortController | null>(null);

  // 데이터 상태 관리
  const [chgerData, setChgerData] = useState<ChargingStationResponseDto[]>([]);
  const [currentFilter, setCurrentFilter] = useState<Filters>({
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

  // 위치 및 선택 상태
  const [myPos, setMyPos] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [selectedStation, setSelectedStation] = useState<StationListItem | null>(null);
  const [selectionSource, setSelectionSource] = useState<'list' | 'map' | null>(null);

  // 예측 및 추천 모드 상태
  const [viewMode, setViewMode] = useState<'current' | 'prediction'>('current');
  const [predictionHours, setPredictionHours] = useState<number>(0);
  const [recommendedChgerDt, setRecommendedChgerDt] = useState<RecommendedStationDto[] | null>(null);

  // 경로 및 특수 필터 상태
  const [shortest, setShortest] = useState<ChargingStationResponseDto[] | null>(null);
  const [isLongCharging, setIsLongCharging] = useState<boolean>(false);
  const [isLongChargingDt, setIsLongChargingDt] = useState<ChargingStationResponseDto[] | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [token] = useAtom(accessTokenAtom);
  const [toastMsg, setToastMsg] = useState('');
  const route = useRouter();

  // 차량 등록 확인용 모달 상태
  const [modalInfo, setModalInfo] = useState<{
    show: boolean;
    message: string;
    submessage: string;
  }>({
    show: false,
    message: '',
    submessage: '',
  });

  /**
   * 필터 조건에 부합하는 일반 충전소 목록을 서버로부터 조회 요청
   * @param {Filters} filtersToApply - 조회에 적용할 필터 객체
   * @returns {Promise<ChargingStationResponseDto[]>} 충전소 응답 데이터 배열
   */
  const fetchStations = useCallback(async (filtersToApply: Filters) => {
    ongoing.current?.abort();
    const controller = new AbortController();
    ongoing.current = controller;

    const requestBody: ChargingStationRequestDto = {
      "coorDinatesDto": {
        lat: filtersToApply.lat,
        lon: filtersToApply.lon,
        radius: filtersToApply.radius,
      },
      "mapQueryDto": {
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

    try {
      const res = await axios.post<ChargingStationResponseDto[]>(`http://${process.env.NEXT_PUBLIC_BACKIP}:8080/map/post/stations`, requestBody);
      return Array.isArray(res.data) ? res.data : [];

    } catch (err) {
      if (!axios.isCancel(err)) console.error("fetchStations error: ", err);
      return [];
    }
  }, []);

  /**
   * 현재 위치에서 최단 거리 및 최소 시간에 도달 가능한 충전소 정보를 조회 요청
   * @param {Filters} filtersToApply - 현재 위치 및 검색 필터 정보
   * @returns {Promise<ChargingStationResponseDto[]>} 인접 충전소 데이터 배열
   */
  const fetchShortest = useCallback(async (filtersToApply: Filters): Promise<ChargingStationResponseDto[]> => {
    ongoing.current?.abort();
    const controller = new AbortController();
    ongoing.current = controller;

    const requestBody: ChargingStationRequestDto = {
      "coorDinatesDto": {
        lat: filtersToApply.lat,
        lon: filtersToApply.lon,
        radius: filtersToApply.radius,
      },
      "mapQueryDto": {
        useMap: true,
        canUse: filtersToApply.canUse,
        parkingFree: filtersToApply.parkingFree,
        limitYn: filtersToApply.limitYn,
        chgerType: filtersToApply.chargerTypes.length > 0 ? filtersToApply.chargerTypes : [],
        busiId: filtersToApply.chargerComps.length > 0 ? CompNmToIds(filtersToApply.chargerComps) : [],
        outputMin: filtersToApply.outputMin,
        outputMax: filtersToApply.outputMax,
        keyWord: filtersToApply.keyWord
      }
    };

    try {
      const res =
        await axios.post<ChargingStationResponseDto[]>(`http://${process.env.NEXT_PUBLIC_BACKIP}:8080/map/get/near`, requestBody);
      return Array.isArray(res.data) ? res.data : [];

    } catch (err) {
      console.error("fetchShortest 에러: ", err);
      return [];
    }
  }, []);

  /**
   * AI 모델을 통해 사용자의 차량 정보 및 예측 시간을 고려한 추천 충전소 정보를 조회 요청
   * @param {Filters} filtersToApply - 필터 조건
   * @param {number} nHours - 추천 기준 시간 (24시간 형식)
   * @returns {Promise<RecommendedStationDto[] | null>} 추천 충전소 리스트
   */
  const fetchStationRecommended = useCallback(async (filtersToApply: Filters, nHours: number): Promise<RecommendedStationDto[] | null> => {
    const requestDate = new Date();
    requestDate.setHours(nHours, 0, 0, 0);

    const requestBody: ChargingStationPredictionRequestDto = {
      "coorDinatesDto": {
        lat: filtersToApply.lat,
        lon: filtersToApply.lon,
        radius: filtersToApply.radius,
      },
      "mapQueryDto": {
        useMap: true,
        canUse: filtersToApply.canUse,
        parkingFree: filtersToApply.parkingFree,
        limitYn: filtersToApply.limitYn,
        chgerType: filtersToApply.chargerTypes.length > 0 ? filtersToApply.chargerTypes : [],
        busiId: filtersToApply.chargerComps.length > 0 ? CompNmToIds(filtersToApply.chargerComps) : [],
        outputMin: filtersToApply.outputMin,
        outputMax: filtersToApply.outputMax,
        keyWord: filtersToApply.keyWord
      },
      time: requestDate
    };

    try {
      const res = await axios.post<RecommendedStationDto[]>(
        `http://${process.env.NEXT_PUBLIC_BACKIP}:8080/recommend/car`, requestBody);
      return Array.isArray(res.data) ? res.data : [];
    } catch (err) {
      console.error('fetchStationRecommended 오류: ', err);
      return null;
    }
  }, [])

  /**
   * 장기 주차 및 완속 충전이 가능한 충전소 정보를 예측 데이터를 기반으로 조회
   * @param {Filters} filtersToApply - 필터 조건
   * @param {number} nHours - 예측 시간
   * @returns {Promise<ChargingStationResponseDto[] | null>} 장기 충전 가능 충전소 리스트
   */
  const fetchLongCharging = useCallback(async (filtersToApply: Filters, nHours: number) => {
    const requestDate = new Date();
    requestDate.setHours(nHours, 0, 0, 0);

    const requestBody: ChargingStationPredictionRequestDto = {
      "coorDinatesDto": {
        lat: filtersToApply.lat,
        lon: filtersToApply.lon,
        radius: filtersToApply.radius,
      },
      "mapQueryDto": {
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
      time: requestDate
    };

    try {
      const res = await axios.post<ChargingStationResponseDto[]>(
        `http://${process.env.NEXT_PUBLIC_BACKIP}:8080/map/get/longUse`,
        requestBody,
      )
      return Array.isArray(res.data) ? res.data : [];
    } catch (err) {
      if (axios.isCancel(err)) return;
      console.error('fetchStationRecommended 오류: ', err);
      return null;
    }
  }, [])


  /**
   * Geolocation API를 사용하여 사용자의 현재 브라우저 위치를 획득하고 맵을 초기화
   */
  useEffect(() => {
    const getLocation = async () => {
      const isDevelopment = process.env.NODE_ENV === 'development' ||
        window.location.hostname === 'localhost' ||
        window.location.protocol === 'http:';
      if (isDevelopment) {
        const defaultPos: [number, number] = [35.2300, 129.0880]; // 부산대 과학기술연구동
        setMapCenter(defaultPos);
        setMyPos(defaultPos);
        return;
      }

      if (!navigator.geolocation) {
        const defaultPos: [number, number] = [35.2300, 129.0880];
        setMapCenter(defaultPos);
        setMyPos(defaultPos);
        return;
      }

      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            resolve,
            reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000
          }
          );
        });

        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setMapCenter([lat, lng]);
        setMyPos([lat, lng]);

      } catch (error) {
        console.error('2 - 위치정보 획득 실패:', error);

        if (error instanceof GeolocationPositionError) {
          switch (error.code) {
            case error.PERMISSION_DENIED:
              console.error('위치 정보 권한이 거부됨');
              break;
            case error.POSITION_UNAVAILABLE:
              console.error('위치 정보를 사용할 수 없음');
              break;
            case error.TIMEOUT:
              console.error('위치 정보 요청 시간 초과');
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
  }, []);


  /**
   * 위치 또는 필터 조건 변경 시, 현재 뷰 모드(현재/예측)에 적합한 API들을 병렬로 호출하여 데이터를 갱신
   */
  useEffect(() => {
    const fetchData = async () => {
      if (!myPos) return;

      setIsLoading(true);
      ongoing.current?.abort();
      const controller = new AbortController();
      ongoing.current = controller;

      const filtersToRequest = { ...currentFilter, lat: myPos[0], lon: myPos[1] };

      try {
        if (viewMode === 'prediction') {
          if (isLongCharging) {
            const [shortestResult, isLongChargingResult] = await Promise.all([
              fetchShortest(filtersToRequest),
              fetchLongCharging(filtersToRequest, predictionHours)
            ]);

            setShortest(shortestResult);
            setIsLongChargingDt(isLongChargingResult);

          } else {
            const [currentResult, shortestResult, recommendedResult] = await Promise.all([
              fetchStations(filtersToRequest),
              fetchShortest(filtersToRequest),
              fetchStationRecommended(filtersToRequest, predictionHours)
            ]);
            setChgerData(currentResult);
            setShortest(shortestResult);
            setRecommendedChgerDt(recommendedResult);
          }
        } else {
          const [currentResult, shortestResult] = await Promise.all([
            fetchStations(filtersToRequest),
            fetchShortest(filtersToRequest),
          ]);
          setChgerData(currentResult);
          setShortest(shortestResult);
          setRecommendedChgerDt(null);
        }
      } catch (error) {
        if (axios.isCancel(error)) {
        } else {
          console.error('fetchData 에러: ', error);
          setChgerData([]);
          setShortest(null);
          setRecommendedChgerDt(null);
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchData()

  }, [myPos, currentFilter, viewMode, predictionHours, fetchStations, fetchStationRecommended, fetchShortest]);

  /**
   * 지도 데이터를 기반으로 가공된 마커(Marker) 리스트를 생성
   * 추천 데이터가 있을 경우 추천 우선으로 마커를 구성합니다.
   * @returns {Array} 가공된 지도 마커 데이터
   */
  const markers = useMemo(() => {
    const baseData = recommendedChgerDt || chgerData;
    return baseData.map((stat) => ({
      id: stat.statId,
      name: stat.statNm,
      lat: stat.lat,
      lng: stat.lng,
      availableCnt: stat.chargeNum,
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
    }));
  }, [chgerData, recommendedChgerDt]);

  /**
   * 리스트 패널에 표시할 충전소 아이템 목록을 생성
   * @returns {StationListItem[]} 가공된 리스트 아이템 배열
   */
  const listItems = useMemo<StationListItem[]>(() => {
    const baseData = recommendedChgerDt || chgerData;
    return baseData.map((stat) => {
      let stationDto: ChargingStationResponseDto;
      let additionalInfo: { predTag?: string; minute?: number } = {};

      if ('predTag' in stat && 'minute' in stat) {
        const { predTag, minute, ...rest } = stat as RecommendedStationDto;
        stationDto = rest;
        additionalInfo = { predTag, minute };
      } else {
        stationDto = stat;
      }

      return { ...stationDto, predTag: additionalInfo.predTag, minute: additionalInfo.minute }
    });
  }, [chgerData, recommendedChgerDt]);

  /**
   * 지도 상의 특정 좌표를 기준으로 주변 충전소를 재검색
   * @param {Object} center - 새로운 지도 중심 좌표 {lat, lng}
   */
  const handleSearchHere = useCallback((center: { lat: number, lng: number }) => {
    const lat = center.lat;
    const lng = center.lng;
    setMyPos([lat, lng]);
    setMapCenter([lat, lng]);
  }, []);

  /**
   * 예측 시간을 변경하고 그에 따라 뷰 모드를 전환
   * @param {number} hours - 설정할 예측 시간 (0~23)
   */
  const handlePredictionHours = useCallback((hours: number) => {
    setPredictionHours(hours);
    setViewMode(hours > 0 ? 'prediction' : 'current');
  }, []);

  /**
   * 키워드 기반의 충전소 명칭 검색을 수행
   * @param {string} keyword - 검색 키워드
   */
  const handleSearch = useCallback((keyword: string) => {
    if (!myPos) return;

    setCurrentFilter(prev => ({ ...prev, keyWord: keyword }));
  }, [currentFilter, myPos])

  /**
   * 상세 필터 조건(주차 여부, 충전기 타입 등)을 변경하고 데이터를 갱신
   * @param {Omit<Filters, 'lat' | 'lon'>} newFilters - 변경된 필터 정보
   */
  const handleFilterChange = useCallback((newFilters: Omit<Filters, 'lat' | 'lon'>) => {
    if (!myPos) return;

    const nextFilter = { ...currentFilter, ...newFilters };

    if (!isEqual(currentFilter, newFilters)) {
      setCurrentFilter(nextFilter);
    }
  }, [currentFilter, myPos]);

  /**
   * 리스트 아이템 클릭 시 해당 충전소를 지도 상에 표시하고 중심을 이동(리스트 -> 지도)
   * @param {StationListItem | null} station - 선택된 충전소 정보
   */
  const handleStationClick = useCallback((station: StationListItem | null) => {
    if (station) {
      setSelectionSource('list');
      setMapCenter([station.lat, station.lng]);
      setSelectedStation(station);
    } else {
      setSelectedStation(null);
      setSelectionSource(null);
    }

  }, [])

  /**
   * 지도 마커 클릭 시 해당 마커의 상세 정보를 리스트 패널과 동기화(지도 -> 리스트)
   * @param {string} markerId - 클릭된 마커의 고유 ID
   */
  const handleMapMarkerClick = useCallback((markerId: string) => {
    if (markerId === '') {
      setSelectedStation(null);
      setSelectionSource(null);
      return;
    }

    const selectedStationFromList = listItems.find(item => String(item.statId) === String(markerId));

    if (selectedStationFromList) {
      setSelectionSource('map');
      setSelectedStation({ ...selectedStationFromList });
    }
  }, [listItems])

  /**
   * 로그인하고 진입 시 서버에서 차량 등록 여부를 확인 후, 미등록 시 차량 등록 모달 띄움
   */
  useEffect(() => {
    if (!token) return;

    const userCar = async () => {
      try {
        const res = await axios.get(`http://${process.env.NEXT_PUBLIC_BACKIP}:8080/user/car/info`, {
          headers: { Authorization: `Bearer ${token}` }
        })

        if (Array.isArray(res.data) && res.data.length === 0) {
          setModalInfo({
            show: true,
            message: '차량등록을 하시겠습니까?',
            submessage: '더 많은 서비스를 즐기실 수 있습니다.'
          })
        }
      } catch (error) {
        console.error('등록차량확인 에러: ', error);
      }
    }
    userCar();
  }, []);

  // 차량 등록 모달 확인버튼
  const onConfirm = () => {
    setModalInfo({
      message: '',
      submessage: '',
      show: false,
    });
    route.push('/evInfo');
  }



  // 차량 등록 모달 닫기
  const onCancelConrirmModal = () => {
    setModalInfo({
      message: '',
      submessage: '',
      show: false,
    });
  }

  return (
    <div className={`${style.mainContainer} relative `}>
      <Toast message={toastMsg} setMessage={setToastMsg} />
      {modalInfo.show &&
        <ConfirmModal message={modalInfo.message} submsg={modalInfo.submessage} onConfirm={onConfirm} onCancel={onCancelConrirmModal} />
      }
      <div className="shrink-0 z-50 ">
        <StationListPanel
          list={listItems}
          currentFilter={currentFilter}
          onFilterChange={handleFilterChange}
          onStationClick={handleStationClick}
          onSearch={handleSearch}
          selectedStation={selectedStation}
          selectionSource={selectionSource}
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
            predictHours={predictionHours}
            onHoursChange={handlePredictionHours}
            onMarkerClick={handleMapMarkerClick}
            selectionSource={selectionSource}
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
