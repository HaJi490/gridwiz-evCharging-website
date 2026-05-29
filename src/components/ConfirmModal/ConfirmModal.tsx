'use client'

import React, { useEffect, useRef } from 'react'
import { AiOutlineExclamationCircle } from "react-icons/ai";

/**
 * ConfirmModal 컴포넌트의 Props 인터페이스
 */
interface ConfirmModalProps {
    /** 모달 중앙에 표시될 핵심 메시지 */
    message: string;
    /** 메시지 하단에 표시될 상세 설명 (줄바꿈 지원) */
    submsg: string;
    /** '확인' 버튼 클릭 시 실행될 콜백 함수 */
    onConfirm: () => void;
    /** '취소' 버튼 클릭 또는 모달 닫기 시 실행될 콜백 함수 */
    onCancel: () => void;
}

/**
 * 사용자에게 특정 작업에 대한 확답을 얻기 위한 확인(Confirmation) 모달 컴포넌트
 * 배경 스크롤 차단 (Body Scroll Lock), 외부 영역 클릭 시 닫기를 수행합니다.
 * Esc 키를 이용한 접근성 대응, WAI-ARIA 표준인 'alertdialog' 역할을 수행하여 스크린 리더 사용자에게 경고 알립니다.
 */
export default function ConfirmModal({ message, submsg, onConfirm, onCancel }: ConfirmModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);

    /**
     * 모달 활성화 시 브라우저 이벤트 및 스타일을 제어하는 이펙트 훅
     */
    useEffect(() => {
        document.body.style.overflow = 'hidden';

        /** 외부 영역 클릭 감지 핸들러 */
        const handleOutsideClick = (e: MouseEvent) => {
            if (modalRef.current && modalRef.current.contains(e.target as Node)) return;
            onCancel();
        };

        /** Esc 키 입력 감지 핸들러 */
        const handleEscKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onCancel();
        }

        document.addEventListener('mousedown', handleOutsideClick, true);
        document.addEventListener('keydown', handleEscKey);

        return () => {
            document.body.style.overflow = 'unset';
            document.removeEventListener('mousedown', handleOutsideClick, true);
            document.removeEventListener('keydown', handleEscKey);
        };
    }, [onCancel])스

    return (
        <div role='none' className="fixed inset-0 bg-black/30 flex justify-center items-center z-60 animate-fadeIn">
            <section
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="confirm-message"
                aria-describedby="confirm-submsg"
                ref={modalRef}
                className="flex flex-col bg-white rounded-xl p-6 shadow-lg min-w-sm min-h-80 text-center animate-scaleIn"
                onClick={(e) => e.stopPropagation()}  // 하위 요소의 클릭이벤트가 바깥으로 나가지 않도록
            >
                <header className='flex-1 flex flex-col justify-center items-center mb-4'>
                    {/* 상단 아이콘 영역 */}
                    <div
                        aria-hidden="true"
                        className='text-[#4FA969] bg-[#a2f3b93d] rounded-full p-2 mb-4'
                    >
                        <AiOutlineExclamationCircle size={30} />
                    </div>
                    {/* 핵심 메시지 영역 */}
                    <h2 className="text-lg font-bold mb-1">{message}</h2>
                </header>

                {/* 상세 설명 영역 */}
                <div>
                    <p className="text-sm text-[#666] whitespace-pre-wrap">
                        {submsg}
                    </p>
                </div>
                
                {/* 하단 제어버튼 영역 */}
                <footer className="flex bottom-2 justify-center gap-4">
                    <button type='button' onClick={onCancel} className="btn cancel cursor-pointer">취소</button>
                    <button type='button' onClick={onConfirm} className="btn confirm cursor-pointer">확인</button>
                </footer>
            </section>
        </div>
    )
}
