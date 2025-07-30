'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation';
import {format} from 'date-fns'

import { HiArrowLongRight } from "react-icons/hi2";
import { TfiMinus } from "react-icons/tfi";

export default function page() {
    const route = useRouter();
    const [currentDate, setCurrentDate] = useState(new Date());

    const formattedDate = format(currentDate, 'EEE d MMM').toUpperCase();

    return (
    <>
        <div className='w-full h-screen relative'>
            <Image src={'/produceComp_main.jpg'} alt={'mainimg'} fill className='object-cover'/>
            <div className='w-full h-full absolute top-30 right-25 text-white text-right'>
                <h1 className='text-[100px]'>E-Mobility</h1>
                <h1 className='text-[100px]'>Charging Solution</h1>
                <p className='text-xl font-medium mr-2'>전기차 충전에 새로움을 <span className='text-[#4FA969] font-semibold'>PLUS+ </span>하다</p>
            </div>
        </div>

         <div className='mx-[100px] my-30 flex flex-col justify-center items-center'>
            <h3 className='w-fit px-15 py-2 mb-15 shadow-lg border-gray-50 rounded-full text-[#4FA969] text-[19px] font-semibold'>OUR SERVICE</h3>
            <div className='text-[19px] w-235 text-center'>
                <p className='font-bold mb-3 text-[21px]'>
                    지금보다 더 똑똑하고, 더 쉬운 충전
                </p>
                <p>
                    저희는 사용자의 위치, 시간, 수요 데이터를 분석해 대기 없는 충전, 이동 최소화, 최적의 경로를 제공합니다.
                    <br/>
                    충전이 필요한 순간을 예측해 보다 여유롭고 빠르게 이용할 수 있도록 돕습니다.
                    단순한 지도 표시를 넘어서 24시간 수요 예측과 맞춤형 예약 추천으로 누구나 쉽게, 효율적으로 충전할 수 있는 환경을 만들어갑니다.
                </p>
                <p className='mt-3 text-[#6b6b6b] inline-flex items-center cursor-pointer'>
                    <span className='flex justify-center items-center hover:border-b w-fit'>더 알아보기 &ensp; <HiArrowLongRight/></span>
                </p>
            </div>
        </div>

        {/* <div className='mx-[100px] my-30 grid grid-cols-12'>
            <h3 className='col-span-4 text-[#4FA969] text-[29px] font-semibold'>ABOUT US</h3>
            <div className='col-span-8 text-[19px]'>
                <p className='font-bold mb-3 text-[21px]'>
                    데이터와 기술로 에너지 사용의 가치를 확장합니다.
                </p>
                우리는 에너지 소비 방식의 변화를 이끄는
                데이터 중심의 미래형 솔루션을 만듭니다.

                급변하는 전력 환경 속에서
                사람과 기술, 인프라가 더욱 효율적으로 연결될 수 있도록,
                우리는 예측하고 분석하며 새로운 기준을 제시합니다.

                지속 가능한 에너지 활용과
                더 나은 일상의 흐름을 위해,
                우리는 지금도 데이터를 움직이고 있습니다.
            </div>
        </div> */}

        <div className='mx-[100px] my-30 grid grid-cols-12 gap-5'>
            <div className='col-span-4 h-100 bg-gray-100 rounded-3xl'>

            </div>
            <div className='col-span-4 h-100 bg-gray-100 rounded-3xl'>

            </div>
            <div className='relative overflow-hidden col-span-4 h-100 bg-gray-100 rounded-3xl'>
                <Image src={'/aianalyImg.jpg'} alt='aiImg' fill className='object-cover'/>
                {/* 2. 반투명 검정색 오버레이 역할을 할 div */}
                <div className="absolute top-0 left-0 w-full h-full bg-black/40" />
                
                {/* 3. 텍스트나 다른 컨텐츠 (오버레이보다 위에 위치) */}
                <div className="relative z-10 flex flex-col items-center justify-center w-full h-full text-gray-300">
                    <p className="px-5 py-1 border rounded-full bg-black/40 mt-4 text-xl">AI Analysis</p>
                </div>
            </div>
        </div>
       
        <footer className='h-95 pt-10 pb-20 px-[60px] bg-black grid grid-cols-12'>
            <div className='text-white gap-5 col-span-6 flex flex-col'>
                <p>{formattedDate}&ensp;\&ensp;2025</p>
                <div className='relative w-120 h-30 mt-auto'>
                    <Image src='/gwLogo.png' alt='footerLogo' fill style={{ objectFit: 'contain' }}/> 
                </div>
            </div>
            <div className= 'col-span-6 flex flex-col'>
                <div className='text-white text-sm flex gap-5'>
                    <button className='rounded-full px-6 py-2 border border-[#666] hover:bg-[#232323] cursor-pointer'
                        onClick={()=>{route.push('/produceComp')}}    
                    >
                        회사소개
                    </button>
                    <span className='rounded-full px-6 py-2 border border-[#666] hover:bg-[#232323] cursor-pointer'>
                        이용안내
                    </span>
                    <button className='rounded-full px-6 py-2 border border-[#666] hover:bg-[#232323] cursor-pointer'
                        onClick={()=>{route.push('/')}}    
                    >
                        충전소 찾기
                    </button>
                    <button className='rounded-full px-6 py-2 border border-[#666] hover:bg-[#232323] cursor-pointer'
                        onClick={()=>{route.push('/chg-schedule')}}
                    >
                        충전스케줄링
                    </button>
                </div>
                <div className='grid grid-cols-2 gap-y-11 text-[#dadada] mt-auto'>
                    <div>
                        <p className='text-[#666] mb-2'>LOCATION</p>
                        <p>부산 금정구 부산대학로63번길 2</p>
                    </div>
                    <div>
                        <p className='text-[#666] mb-2'>CONTACT US</p>
                        <p>051 . 123 . 4567</p>
                    </div>
                    <div>
                        <p className='text-[#666] flex items-center mb-2'>MO<TfiMinus/>FR</p>
                        <p className='flex items-center'>
                            09.00
                            <span className='text-[#666]'>am</span>
                            <TfiMinus/>06.00
                            <span className='text-[#666]'>pm</span>    
                        </p>
                    </div>
                    <div>
                        <p className='text-[#666] mb-2'>EMAIL</p>
                        <p>hello@gridwiz.com</p>
                    </div>
                </div>
            </div>
        </footer>
    </>
    )
}
