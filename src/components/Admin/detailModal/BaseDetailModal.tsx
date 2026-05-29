'use client'

import React, { useEffect, useCallback } from 'react'
import { IoClose } from "react-icons/io5";

interface BaseDetailModalProps {
  /** 모달의 노출 여부 */
  isOpen: boolean;
  /** 모달을 닫는 콜백 함수 (오버레이 클릭, 닫기 버튼, Esc 키 대응) */
  onClose: () => void;
  /** 모달 상단 헤더에 표시될 제목 */
  title: string;
  /** 모달 내부에 렌더링될 React 노드 */
  children: React.ReactNode;
}

/**
 * 범용 상세 정보 모달 컴포넌트 (Base Layout)
 * 다양한 정보의 상세 내역을 표시하기 위한 오버레이 레이아웃을 제공합니다.
 */
export default function BaseDetailModal({ isOpen, onClose, title, children }: BaseDetailModalProps) {

  /**
   *  Esc 키를 통한 모달 닫기 제어
   */
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleKeyDown]);



  if (!isOpen) return null;

  return (
    <div role='none' onClick={onClose} className="fixed inset-0 bg-black/50 bg-opacity-60 flex justify-center items-center z-50">
      <div
        className='bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg relative animate-fade-in'
        onClick={(e) => e.stopPropagation()}
        role='dialog'
        aria-modal='true'
        aria-labelledby='modal-title'
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition-colors"
          aria-label="close modal"
        >
          <IoClose size={28} />
        </button>
        <header className='mb-6 border-b pb-3'>
          <h2 className="text-2xl font-bold text-gray-800 ">{title}</h2>
        </header>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar-hide">
          {children}
        </div>
      </div>
    </div>
  )
}
