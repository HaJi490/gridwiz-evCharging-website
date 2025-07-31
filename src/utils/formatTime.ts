/**
 * 초(seconds)를 'n시간 n분' 또는 '1분 미만' 형식의 문자열로 변환합니다.
 * @param seconds 변환할 총 초 단위 시간
 * @returns 포맷팅된 문자열
 */
export function formatTime(seconds: number): string {
    // 1. 60초 미만일 경우
    if (seconds < 60) {
        return '1분 미만';
    }

    // 2. 시간과 분 계산
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    // 3. 결과 문자열 조합
    const timeParts: string[] = [];
    if (hours > 0) {
        timeParts.push(`${hours}시간 ${minutes}분`);
    }
    if (minutes > 0) {
        timeParts.push(`${minutes}분`);
    }

    // 만약 1시간 0분일 경우 '1시간'으로만 표시됨.
    // 만약 0시간 5분일 경우 '5분'으로만 표시됨.
    return timeParts.join(' ');
}