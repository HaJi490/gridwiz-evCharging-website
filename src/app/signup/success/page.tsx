'use client'

import React from 'react'
import { FiCheckCircle } from "react-icons/fi";
import { useRouter } from 'next/navigation';

/**
 * 회원가입 완료 안내 페이지
 * 회원가입 절차를 마친 사용자에게 서비스 활용도를 높이기 위한 추가 액션(차량 등록) 또는 메인 화면으로의 이동을 유도합니다.
 */
export default function page() {
  const route = useRouter();

  /**
   * 차량 등록 페이지로 이동합니다.
   * @returns {void}
   */
  const handleGoToVehicleRegistration = () => {
    route.push('/evInfo');
  };

  /**
   * 서비스 메인 화면으로 이동합니다.
   * @returns {void}
   */
  const handleGoToMain = () => {
    route.push('/');
  };


  return (
    <div className='h-screen flex flex-col justify-center items-center gap-5'>
      <span className='bg-[#4FA969]/20 text-[#4FA969] p-3 rounded-full'><FiCheckCircle size={50} /></span>
      <div className='mb-5'>
        <h2 className='text-center font-medium text-[28px] tracking-wide mb-3'>회원가입이 완료되었습니다.</h2>
        <p className='text-gray-500'>차량등록을 하시면 더 많은 서비스를 이용하실 수 있습니다.</p>
      </div>

      {/* 액션 버튼 그룹 */}
      <div className='flex flex-col items-center gap-2'>
        <button className='w-[220px] py-[0.75rem] rounded-md confirm cursor-pointer' onClick={handleGoToVehicleRegistration}>차량 등록</button>
        <button className='w-[220px] py-[0.75rem] rounded-md cancel cursor-pointer' onClick={handleGoToMain}>메인화면 가기</button>
      </div>
    </div>
  )
}
