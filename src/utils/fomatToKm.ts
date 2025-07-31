/**
 * 단위를 km로 변환하는 함수
 * @param value 거리 숫자 (단위: m 또는 cm)
 * @param unit 'm' | 'cm'
 * @returns 변환된 문자열 (예: "0.29km", "0.01km 이하")
 */
export function formatToKm(value: number, unit: 'm' | 'cm' = 'm'): string {
  let meter = unit === 'cm' ? value / 100 : value;
  let km = meter / 1000;
  let roundedKm = Math.floor(km * 100) / 100;

  if (roundedKm <= 0.01) {
    return '0.01km 이하';
  } else {
    return `${roundedKm.toFixed(2)}km`;
  }
}