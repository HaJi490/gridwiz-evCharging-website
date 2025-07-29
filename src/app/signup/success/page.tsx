'use client'

import React from 'react'
import { FiEdit } from "react-icons/fi";
import { FiCheckCircle } from "react-icons/fi";
import { HiArrowLongRight } from "react-icons/hi2";
import { useRouter } from 'next/navigation';

type StepItem = {
    label: string;
    icon: React.ReactElement;
}

const steps: StepItem[] = [
      {label: "회원정보", icon: <FiEdit/> },
      {label: "가입완료", icon: <FiCheckCircle/> }
  ]

export default function page() {
  const route = useRouter();

  return (
    <div className='h-screen flex flex-col justify-center items-center gap-5'>
      <span className='bg-[#4FA969]/20 text-[#4FA969] p-3 rounded-full'><FiCheckCircle  size={50}/></span>
      <div className='mb-5'>
        <h2 className='text-center font-medium text-[28px] tracking-wide mb-3'>회원가입이 완료되었습니다.</h2>
        
        <p className='text-gray-500'>차량등록을 하시면 더 많은 서비스를 이용할 수 있어요.</p>
      </div>
      <div className='flex flex-col items-center gap-2'>
        <button className='w-[220px] py-[0.75rem] rounded-md confirm cursor-pointer' onClick={()=>route.push('/evInfo')}>차량 등록</button>
        <button className='w-[220px] py-[0.75rem] rounded-md cancel cursor-pointer' onClick={()=>route.push('/')}>메인화면 가기</button>
      </div>
    </div>
  )
}
