/**
 * @module StationTypes
 * @description 충전소 도메인 내 UI 및 비즈니스 로직에서 공통으로 사용되는 타입 정의
 * 1. Filters: 충전소 검색 필터 인터페이스
 * 2. FilterSettings: 필터 데이터 인터페이스
 * 3. ChargerStatusInfo: 충전기 상태별 UI 속성 (상수 매핑용)
 * 4. MapMarker: 지도에 렌더링될 마커 전용 데이터
 * 5. InfoWindowState: 지도 마커 클릭 시 활성화될 정보창 데이터
 */

/**
 * 1. 필터링 가능한 모든 요소가 포함된 필터 인터페이스
 */
export interface Filters {
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

/**
 * 2. 필터 모달에서 조정되는 필터 데이터 인터페이스
 */
export interface FilterSettings {
    canUse: boolean;
    parkingFree: boolean;
    limitYn: boolean;
    radius: number;
    outputMin: number;
    outputMax: number;
    chargerTypes: string[];
    chargerComps: string[];
}

/**
 * 3. 충전기 상태별 정보 인터페이스 (상수 CHARGER_STATUS_MAP의 타입)
 */
export interface ChargerStatusInfo {
    /** 상태 명칭 */
    readonly text: string;
    /** 예약 가능 여부 */
    readonly available: boolean;
    /** UI 표시용 아이콘 요소 */
    readonly icon: React.ReactNode;
    /** 상태별 강조 색상 (Tailwind 클래스 또는 Hex) */
    readonly color: string;
}

/**
 * 4. 지도 마커 렌더링을 위한 정규화된 데이터 타입
 */
export type StationMarker  = {
    /** 충전소 고유 ID */
    id: string;
    /** 충전소 명칭 */
    name: string;
    /** 위도 */
    lat: number;
    /** 경도 */
    lng: number;
    /** 현재 이용 가능한 충전기 수 */
    availableCnt: number;
    chargerTypes: {
        fastCount: number; fastTotal: number;
        midCount: number; midTotal: number;
        slowCount: number; slowTotal: number;
    }, 
    predTag?: string;
    minute?: number;
};

/**
 * 5. 지도 마커 클릭 시 활성화되는 정보창(InfoWindow) 데이터 타입
 */
export type InfoWindowState = {
    position: { lat: number; lng: number; },
    content: string;
    stationId: string;
    chargerTypes: StationMarker['chargerTypes'];
} | null;