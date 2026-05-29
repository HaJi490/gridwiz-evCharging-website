'use client'

import { useEffect } from 'react';
import style from './Toast.module.css'; // 아래 CSS를 포함하는 파일

/**
 * Toast 컴포넌트 Props 인터페이스
 */
interface ToastProps {
    /** 화면에 표시할 메시지 내용 */
    message: string;
    /** 메시지 상태를 변경(초기화)하기 위한 상태 변경 함수 */
    setMessage: React.Dispatch<React.SetStateAction<string>>;
}

/**
 * 전역 알림(Toast) 컴포넌트입니다.
 * 
 * 주요 기능:
 * 1. 메시지 존재 시 화면 상단에 플로팅 레이어로 노출
 * 2. 3초 후 자동으로 메시지를 초기화하며 사라짐
 * 3. 웹 표준 접근성(ARIA)을 준수하여 화면 읽기 도구에 실시간 알림 제공
 */
export default function Toast({ message, setMessage }: ToastProps) {
    /** 
     * 메시지가 발생할 때마다 3초의 타이머를 가동하여 자동으로 닫히도록 제어
     */
    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => {
                setMessage('');
            }, 3000);

            // 컴포넌트 언마운트 혹은 메시지 변경 시 기존 타이머를 제거하여 메모리 누수를 방지
            return () => clearTimeout(timer);
        }
    }, [message, setMessage]);

    if (!message) return null;

    return (
        <div
            role='status'
            aria-live="polite" 
            aria-atomic="true"
            className={style.toast}
        >
            <p>{message}</p>
        </div>
    );
}
