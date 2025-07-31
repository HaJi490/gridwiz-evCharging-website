'use client'

import React from 'react'
import { IoClose } from "react-icons/io5";

// 이 모달이 받을 props 타입 정의
interface MemberDetailModalProps {
  isOpen: boolean;      // 모달이 열려있는지 여부
  onClose: () => void;  // 모달을 닫는 함수
  title: string;        // 모달 상단에 표시될 제목
  children: React.ReactNode; // 모달 내부에 표시될 실제 내용 (알맹이)
}

export default function BaseDetailModal({ isOpen, onClose, title, children }: MemberDetailModalProps) {
  if(!isOpen) {
    return null;
  }

  return (
    <div onClick={onClose} className="fixed inset-0 bg-black/50 bg-opacity-60 flex justify-center items-center z-50">
      <div
        className='bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg relative animate-fade-in'
        onClick={(e) => e.stopPropagation()} // 이벤트 버블링 방지! (모달 안을 클릭해도 안 닫힘)
      >
        {/* 닫기 버튼 */}
        {/* <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition-colors"
          aria-label="Close modal"
        >
          <IoClose size={28} />
        </button> */}
        {/* 제목 */}
        <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-3">{title}</h2>
        {/* 들어갈 내용 */}
        <div>
          {children}
        </div>
      </div>
    </div>
  )
}
