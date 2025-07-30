'use client'

import React, { useEffect, useRef } from 'react'
import style from './ConfirmModal.module.css'
import { AiOutlineExclamationCircle } from "react-icons/ai";

interface ConfirmModalProps {
    message: string;
    submsg: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmModal({ message, submsg, onConfirm, onCancel }: ConfirmModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);

    // body 스크롤을 제어
    useEffect(() => {
        // 1. body 스크롤 막기
        document.body.style.overflow = 'hidden';

        // 2. 모달 외부 클릭처리를 위한 이벤트 리스너
        const handleOutsideClick = (e: MouseEvent) => {
            // 모달 내부 클릭이면 무시
            if (modalRef.current && modalRef.current.contains(e.target as Node)) {
                return;
            }

            // 모달 외부클릭시 닫기
            onCancel();
        };

        // 3. ESC 키로 모달 닫기
        const handleEscKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onCancel();
            }
        }

        // 이벤트 리스너 등록(capture 단계이서 처리하여 우선순위 확보)
        document.addEventListener('mousedown', handleOutsideClick, true);
        document.addEventListener('keydown', handleEscKey);
        
        // 컴포넌트가 언마운트시 정리(원래화면으로 되돌아가기)
        return () => {
            document.body.style.overflow = 'unset';
            document.removeEventListener('mousedown', handleOutsideClick, true);
            document.removeEventListener('keydown', handleEscKey);
        };
    }, [onCancel]); // 빈 배열을 전달하여 마운트될 때 한 번만 실행되도록 합니다.

    return (
        <div className="fixed inset-0 bg-black/30 flex justify-center items-center z-60 animate-fadeIn"
        // onClick={(e) => {
        //     // 모달의 회색 배경을 클릭했을 때만 닫히게 하려면 이 로직을 사용합니다.
        //     if (e.target === e.currentTarget) {
        //         onCancel();
        // }}}    
        >
            <div 
                ref = {modalRef}
                className="flex flex-col bg-white rounded-xl p-6 shadow-lg min-w-sm min-h-80 text-center animate-scaleIn"
                onClick={(e) => e.stopPropagation()}  // 하위 요소의 클릭이벤트가 바깥으로 나가지 않도록
            >
                <div className='flex-1 flex flex-col justify-center items-center mb-4'>
                    <span className='text-[#4FA969] bg-[#a2f3b93d] rounded-full p-2 mb-4'><AiOutlineExclamationCircle size={30} /></span>
                    <p className="text-lg font-bold mb-1">{message}</p>
                    <p className="text-sm text-[#666] whitespace-pre-wrap">{submsg}</p>
                    {/* 이 요소 안의 텍스트는 소스 코드에 있는 공백과 줄바꿈 문자를 그대로 유지해서 보여줘. 하지만 원래 너비가 넘어가면 자동으로 줄바꿈도 해줘 */}
                </div>
                <div className="flex bottom-2 justify-center gap-4">
                    <button onClick={onCancel} className="btn cancel cursor-pointer">취소</button>
                    <button onClick={onConfirm} className="btn confirm cursor-pointer">확인</button>
                </div>
            </div>
        </div>
    )
}
