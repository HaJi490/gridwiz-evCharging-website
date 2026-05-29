/**
@constant CHARGER_CONSTANTS
@description 충전소 도메인에서 공통으로 사용되는 비즈니스 로직 및 UI 상수를 정의
1. CHARGER_STATUS_MAP: 서버 상태 코드와 UI(아이콘, 색상)를 매핑
2. CHARGING_COMPANIES: 서비스 지원 운영기관 리스트
3. CONNECTOR_TYPES: 물리적 커넥터 규격 리스트
*/
import { ChargerStatusInfo } from "@/types/station/station.type";
import { FiBattery, FiBatteryCharging, FiXCircle } from "react-icons/fi";

/**
 * 1. 충전기 상태별 UI 및 속성 정의
 */
export const CHARGER_STATUS_MAP: Record<string, ChargerStatusInfo> = {
    '1': { text: '통신이상', color: 'bg-red-500', available: false, icon: <FiXCircle size={20} className='text-[#666] ' /> },
    '2': { text: '충전대기', color: 'bg-green-500', available: true, icon: <FiBattery size={20} className='text-[#4FA969] ' /> },
    '3': { text: '충전중', color: 'bg-blue-500', available: true, icon: <FiBatteryCharging size={20} className='text-[#666] ' /> },
    '4': { text: '운영중지', color: 'bg-gray-500', available: false, icon: <FiXCircle size={20} className='text-[#666] ' /> },
    '5': { text: '점검중', color: 'bg-yellow-500', available: false, icon: <FiXCircle size={20} className='text-[#666] ' /> },
    '9': { text: '상태미확인', color: 'bg-gray-400', available: false, icon: <FiXCircle size={20} className='text-[#666] ' /> }
} as const;


/**
 * 2. 충전 운영기관 목록
 */
export const CHARGING_COMPANIES: { value: string }[] = [
    { value: "채비" }, { value: "레드이엔지" },
    { value: "스타코프" }, { value: "씨어스" },
    { value: "에버온" }, { value: "이지차저" },
    { value: "이카플러그" }, { value: "제주전기자동차서비스" },
    { value: "GS차지비" }, { value: "차지인" },
    { value: "클린일렉스" }, { value: "타디스테크놀로지" },
    { value: "파워큐브" }, { value: "플러그링크" },
    { value: "한국전력" }, { value: "환경부" },
    { value: "휴맥스이브이" }, { value: "기타" }
]

/**
 * 3. 충전기 커넥터 타입 정의
 */
export const CONNECTOR_TYPES: {value: string; label:string;}[] = [
    { value: 'DC차데모', label: 'DC차데모' },
    { value: 'AC완속', label: 'AC완속' },
    { value: 'DC콤보', label: 'DC콤보' },
    { value: 'AC3상', label: 'AC3상' },
    { value: 'DC콤보(완속)', label: 'DC콤보(완속)' },
    { value: 'NACS', label: 'NACS' },
];
