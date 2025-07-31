'use client'

import React, {useState} from 'react'
import axios from 'axios';
import { useAtom } from 'jotai';
import { accessTokenAtom } from '@/store/auth';
import { useRouter } from 'next/router';

import { InquiryBoard } from '@/types/dto'
import Toast from '@/components/Toast/Toast'

interface InquiryDetailContentProps {
    inquiry: InquiryBoard
    onSuccess: () => void;
}

export default function InquiryDetailContent({inquiry} : InquiryDetailContentProps) {
    // const [token] = useAtom(accessTokenAtom);
    // const route = useRouter();
    
    // // 2. 응답 내용을 저장할 state를 만듭니다.
    // const [responseText, setResponseText] = useState('');
    // const [isLoading, setIsLoading] = useState(false);
    // const [toastMsg, setToastMsg] = useState('');

    // // 응답저장
    // const handleSubmit = async () => {
    //     if(!responseText.trim()){
    //         setToastMsg('응답내용을 입력해주세요.');
    //         return;
    //     }

    //     if(!token) {
    //         setToastMsg('인증토큰이 없습니다. 다시 로그인해주세요.');
    //         route.push('/login');
    //     }

    //     setIsLoading(true);

    //     try{

    //     }
    // }

  return (
    <div className="space-y-4">
        {/* <Toast message={toastMsg} setMessage={setToastMsg} /> */}
        <div className='flex'>
            <span className="w-24 font-semibold text-gray-600">제목</span>
            <span className="text-gray-800">{inquiry.title}</span>
        </div>
        <div className='flex'>
            <span className="w-24 font-semibold text-gray-600">작성자</span>
            <span className="text-gray-800">{inquiry.memberUsername}</span>
        </div>
        <div className='flex'>
            <span className="w-24 font-semibold text-gray-600">작성일</span>
            <span className="text-gray-800">
                {inquiry.createdAt !== null ? new Date(inquiry.createdAt).toLocaleString('ko-KR') : '-'}
            </span>
        </div>
        
        <div className="flex items-center">
            <span className="w-24 font-semibold text-gray-600">상태</span>
            <span className={`font-medium ${inquiry.enabled ? 'text-gray-800' : 'text-[#CE1C4C]'}`}>
            {inquiry.enabled ? '유효' : '삭제됨'}
            </span>
        </div>
        <div className='flex '>
            <span className="w-24 font-semibold text-gray-600">문의내용</span>
            <span className="text-gray-800">{inquiry.content}</span>
        </div>
        <div className='flex flex-col gap-3'>
            <span className="w-24 font-semibold text-gray-600 ">문의응답</span>
            <textarea className='border h-30 rounded-lg border-gray-500 p-5'></textarea>
        </div>
        <div className='flex'>
            <span className="w-24 font-semibold text-gray-600">업데이트일</span>
            <span className="text-gray-800">
                {inquiry.updatedAt !== null ? new Date(inquiry.updatedAt).toLocaleString('ko-KR') : '-'}
            </span>
        </div>
        <div className='w-full flex justify-end'>
            <button className='px-8 py-2 rounded-full bg-[#4FA969] text-white font-medium cursor-pointer'>응답하기</button>
        </div>
    </div>
  )
}
