'use client'

import React, { useState, useEffect } from 'react';
import axios from 'axios'
import { useAtom } from 'jotai';
import { accessTokenAtom } from '@/store/auth';
import { useRouter } from 'next/navigation'
import { User } from '@/types/dto';

import VehicleInfo from '@/components/MyPage/VehicleInfo/VehicleInfo'
import style from './mypage.module.css'
import { FiEdit3 } from "react-icons/fi";


const TAB_MENU = ['차량정보']; // 향후 '충전 히스토리', '문의', '기본설정' 확장 가능

/**
 * 사용자 마이페이지 대시보드
 * 개인 프로필 요약 정보와 차량 정보를 제공하며, 탭 메뉴를 통해 섹션별 상세 관리 기능을 제공합니다.
 */
export default function page() {
    const [token] = useAtom(accessTokenAtom);
    const route = useRouter();

    const [activeTab, setActiveTab] = useState<string>('차량정보');
    const [memberDt, setMemberDt] = useState<User>();


    /**
     * 현재 로그인된 사용자의 프로필 정보를 조회 요청
     * @returns {Promise<void>}
     */
    useEffect(() => {
        const getMemberInfo = async () => {
            if (!token) return;

            try {
                const res = await axios.get(`http://${process.env.NEXT_PUBLIC_BACKIP}:8080/user/info`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                setMemberDt(res.data);
            } catch (error) {
                console.error('getMemberInfo: ', error)
            }
        }
        getMemberInfo();

    }, [token]);

    /**
     * 차량 모델명에서 중복된 브랜드명을 제거하고 언더스코어(_)를 공백으로 치환하여 포맷팅
     * @param {string} brand - 차량 브랜드 (예: "Tesla")
     * @param {string} model - 차량 모델명 (예: "Tesla_Model_3")
     * @returns {string} 정규화된 모델명 (예: "Model 3")
     */
    const stripBrandFromModel = (brand: string, model: string) => {
        if (!brand) return model.trim();

        // 비교를 위해 소문자, 공백, '_' 제거
        const brandKey = brand.replace(/\s+/g, " ").toLowerCase();

        // 공백 단위로 분리해 브랜드 토큰제외
        const filteredTokens = model
            .split(/\s+/)                        // 공백 기준 분리
            .filter(token => {
                const normalized = token.replace(/_/g, "").toLowerCase();
                return normalized !== brandKey;    // brand와 동일하면 제외
            });

        // 토큰 재조합, 남은 '_' 공백으로
        return filteredTokens
            .join(" ")
            .replace(/_/g, " ")   // 예: "테슬라_모델S" → "테슬라 모델S"
            .replace(/\s+/g, " ") // 여분 공백 제거
            .trim();

    }

    /**
     * 탭 메뉴 클릭 시 활성화된 탭 상태를 업데이트
     * @param {string} tabName - 활성화할 탭 명칭
     */
    const handleTabClick = (tabName: string) => {
        setActiveTab(tabName);
    }

    /**
     * 현재 선택된 탭(activeTab) 상태에 따라 해당되는 서브 컴포넌트를 렌더링
     * @returns {JSX.Element} 탭 컨텐츠 컴포넌트
     */
    const renderTabContent = () => {
        switch (activeTab) {
            case '차량정보':
                return <VehicleInfo />;
            default:
                return <VehicleInfo />
        }
    }

    return (
        <div className='mainContainer justify-center bg-[#F7F9FA]'>
            <div className='w-7/10 max-w-[1300px] flex flex-col gap-5 pt-15'>
                {/* 상단 프로필 헤더 섹션 */}
                <div className='flex gap-3 mx-5'>
                    <p className='font-bold text-[19px] ml-3'>
                        <span className='text-[#4FA969]'>{memberDt?.username}</span> 님의 마이페이지
                    </p>
                    
                    {/* 정보 수정 버튼 및 툴팁 */}
                    <div className='relative group'>
                        <button onClick={() => route.push('/mypage/edit-member')}
                            className='text-gray-400 hover:text-[#4FA969] cursor-pointer hover:bg-gray-100 transition'><FiEdit3 size={20} /></button>
                        <div className='absolute left-full top-1/2 transform -translate-y-1/2 ml-2 px-2 py-1 bg-[#666] text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap'>
                            회원정보 수정
                        </div>
                    </div>
                </div>

                {/* 메인 컨텐츠 영역: 탭 기반 구조 */}
                <div className='bg-white border-[#f2f2f2] shadow-md rounded-xl p-6 bg-opacity-50'>
                    
                    {/* 마이페이지 네비게이션 탭 */}
                    <div className='flex gap-7 font-medium text-[15px] mb-5 border-b '>
                        {TAB_MENU.map((menu) => (
                            <button
                                key={menu}
                                onClick={() => handleTabClick(menu)}
                                className={`${style.filterList} ${activeTab === menu ? style.active : ''}`}>
                                {menu}
                            </button>
                        ))}
                    </div>
                    {/* 활성화 탭 컨텐츠 출력 */}
                    <div>
                        {renderTabContent()}
                    </div>

                </div>
            </div>
        </div>
    )
}
