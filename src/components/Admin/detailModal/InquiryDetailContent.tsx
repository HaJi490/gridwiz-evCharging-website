'use client'

import React, { useState } from 'react'
import axios from 'axios';
import { useAtom } from 'jotai';
import { accessTokenAtom } from '@/store/auth';
import { useRouter } from 'next/router';

import { InquiryBoard } from '@/types/dto'
import Toast from '@/components/Toast/Toast'

interface InquiryDetailContentProps {
    /** 상세 조회를 수행할 문의 게시글 객체 */
    inquiry: InquiryBoard;
    /** 응답 등록 성공 시 호출될 콜백 함수 (예: 목록 새로고침) */
    onSuccess?: () => void;
}

/**
 * 문의 사항 상세 정보 및 관리자 응답 작성 컴포넌트
 * 
 */
export default function InquiryDetailContent({ inquiry, onSuccess }: InquiryDetailContentProps) {
    const [token] = useAtom(accessTokenAtom);
    const route = useRouter();

    // 상태 관리
    const [responseText, setResponseText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [toastMsg, setToastMsg] = useState('');

    /**
     * 관리자가 작성한 응답 내용을 서버에 저장 요청
     * @returns {Promise<void>}
     */
    const handleSubmit = async () => {
        if (!responseText.trim()) {
            setToastMsg('응답내용을 입력해주세요.');
            return;
        }

        if (!token) {
            setToastMsg('인증토큰이 없습니다. 다시 로그인해주세요.');
            route.push('/login');
        }

        setIsLoading(true);
        try {
            // FIXME. API 엔드포인트 및 DTO 구조에 맞게 구현 예정
            // await axios.post(`/api/inquiry/${inquiry.id}/response`, 
            // { content: responseText }, 
            // { headers: { Authorization: `Bearer ${token}` }
            // });
            setToastMsg('응답이 성공적으로 등록되었습니다.');
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error('handleSubmir Error', error);
            setToastMsg('응답 등록 중 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <article className="space-y-4">
            <Toast message={toastMsg} setMessage={setToastMsg} />

            {/* 문의 상세 정보 영역 */}
            <dl className='space-y-4'>
                <div className='flex'>
                    <dt className="w-24 font-semibold text-gray-600">제목</dt>
                    <dd className="text-gray-800">{inquiry.title}</dd>
                </div>
                <div className='flex'>
                    <dt className="w-24 font-semibold text-gray-600">작성자</dt>
                    <dd className="text-gray-800">{inquiry.memberUsername}</dd>
                </div>
                <div className='flex'>
                    <dt className="w-24 font-semibold text-gray-600">작성일</dt>
                    <dd className="text-gray-800">
                        {inquiry.createdAt !== null ? new Date(inquiry.createdAt).toLocaleString('ko-KR') : '-'}
                    </dd>
                </div>
                <div className="flex items-center">
                    <dt className="w-24 font-semibold text-gray-600">상태</dt>
                    <dd className={`font-medium ${inquiry.enabled ? 'text-gray-800' : 'text-[#CE1C4C]'}`}>
                        {inquiry.enabled ? '유효' : '삭제됨'}
                    </dd>
                </div>
                <div className='flex '>
                    <dt className="w-24 font-semibold text-gray-600">문의내용</dt>
                    <dd className="text-gray-800">{inquiry.content}</dd>
                </div>
            </dl>

            {/* 관리자 응답 작성 영역 */}
            <section className='flex flex-col gap-3'>
                <label id="response-label" htmlFor="admin-response" className="w-24 font-semibold text-gray-600 ">
                    문의응답
                </label>
                <textarea
                    id='admin-response'
                    onChange={e => setResponseText(e.target.value)}
                    placeholder='문의에 대한 답변을 입력해주세요.'
                    disabled={isLoading || !inquiry.enabled}
                    className='border h-30 rounded-lg border-gray-500 p-5'
                />
            </section>
            <dl className='flex'>
                <dt className="w-24 font-semibold text-gray-600">업데이트일</dt>
                <dd className="text-gray-800">
                    {inquiry.updatedAt !== null ? new Date(inquiry.updatedAt).toLocaleString('ko-KR') : '-'}
                </dd>
            </dl>

            {/* 하단 제어 버튼 */}
            <div className='w-full flex justify-end'>
                <button
                    onClick={handleSubmit}
                    disabled={isLoading || !inquiry.enabled}
                    className='px-8 py-2 rounded-full bg-[#4FA969] text-white font-medium cursor-pointer'
                >
                    {isLoading ? '전송 중...' : '응답 등록'}
                </button>
            </div>
        </article>
    )
}
