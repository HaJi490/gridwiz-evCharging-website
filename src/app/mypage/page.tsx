'use client'

import React, {useState, useEffect } from 'react';
import axios from 'axios'
import { useAtom } from 'jotai';
import { accessTokenAtom } from '@/store/auth';
import { useRouter } from 'next/navigation'
import { User } from '@/types/dto';

import ChargingHistory from '@/components/MyPage/ChargingHistory/ChargingHistory'
import VehicleInfo from '@/components/MyPage/VehicleInfo/VehicleInfo'
import QnA from '@/components/MyPage/QnA'
import Settings from '@/components/MyPage/Settings'
// import chgerCodeNm from '@/db/chgerType.json'
import style from './mypage.module.css'
import { FiEdit } from "react-icons/fi";
import { FiSettings } from "react-icons/fi";
import { FiEdit3 } from "react-icons/fi";


const TAB_MENU = [ '차량정보']; //'충전 히스토리', , '문의', '기본설정'

export default function page() {
    const [token] = useAtom(accessTokenAtom);
    const route = useRouter();
    const [activeTab, setActiveTab] = useState<string>('차량정보');
    const [memberDt, setMemberDt] = useState<User>();
    
    useEffect(()=>{
        const getMemberInfo = async () => {
            console.log(token)
            if (!token) {
                console.warn('토큰 없음');
                return;
            }

            try {
                const res = await axios.get(`http://${process.env.NEXT_PUBLIC_BACKIP}:8080/user/info`, 
                    {
                        headers: {
                            Authorization: `Bearer ${token}` 
                        }
                    }
                )
                setMemberDt(res.data);
                console.log(res.data);
            } catch (error) {
                console.error('getMemberInfo: ', error)
            }
        }
        getMemberInfo();

    }, [token])

    const stripBrandFromModel = (brand: string, model: string) => {
        if(!brand) return model.trim();

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

    const handleTabClick = (tabName: string) => {
        setActiveTab(tabName);
        // const ref = sectionRefs[tabName];
        // if(ref && ref.current) {
        //     ref.current.scrollIntoView({behavior:'smooth', block:'start'});
        // }
    }

    // activeTab에 따라 렌더링할 컴포넌트 결정
    const renderTabContent = () => {
        switch(activeTab) {
            // case '충전 히스토리':
            //     return <ChargingHistory/>;
            case '차량정보':
                return <VehicleInfo/>;
            // case '문의':
            //     return <QnA />;
            // case '기본설정':
            //     return <Settings/>
            default:
                return <VehicleInfo/>
        }
    }

  return (
    <div className='mainContainer justify-center bg-[#F7F9FA]'>
        <div className='w-7/10 max-w-[1300px] flex flex-col gap-5 pt-15'>
            <div className='flex gap-3 mx-5'>
                <p className='font-bold text-[19px] ml-3'><span className='text-[#4FA969]'>{memberDt?.username}</span> 님의 마이페이지</p>
                <div className='relative group'>
                    <button onClick={()=>route.push('/mypage/edit-member')} 
                        className='text-gray-400 hover:text-[#4FA969] cursor-pointer hover:bg-gray-100 transition'><FiEdit3 size={20}/></button>
                    <div className='absolute left-full top-1/2 transform -translate-y-1/2 ml-2 px-2 py-1 bg-[#666] text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap'>
                        회원정보 수정
                    </div>
                </div>
            </div>
            {/* 내 정보, 차량 */}
            {/* <div className='w-full flex gap-4 mb-5'>
                <div className='w-full flex justify-between items-center bg-white border-[#f2f2f2] shadow-md rounded-lg px-5 py-6'>
                    <div>
                        <p className='font-bold text-[19px]'><span className='text-[#4FA969]'>{firstResp.username}</span>님의 마이페이지</p>
                    </div>
                    <button onClick={()=>route.push('/mypage/edit-member')} className='text-[20px] text-[#afafaf] bg-[#f2f2f2] p-2 rounded-full cursor-pointer'>
                        <FiEdit />
                    </button>
                </div>
                <div className=' w-full bg-white border  border-[#f2f2f2] shadow-md rounded-lg px-5 py-6' >
                    {firstResp.evCars.map((ev) => (
                        <div key={ev.model}>
                            <p className='text-md font-semibold'>
                                {stripBrandFromModel(ev.brand, ev.model)}
                                {ev.mainModel && <span className='bg-[#EBFAD3] text-[#568811] text-xs rounded-full px-2 py-1 ml-2'>main</span>}
                            </p> 
                            <p className='text-sm text-[#6B6B6B]'>{ev.brand}</ p>
                        </div>
                    ))}
                </div>
            </div> */}
            {/* 아래 */}
            <div className='bg-white border-[#f2f2f2] shadow-md rounded-xl p-6 bg-opacity-50'>
                {/* 마이페이지 탭메뉴 */}
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
                {/* 탭 컨텐츠 렌더링 */}
                <div>
                    {renderTabContent()}
                </div>
                
            </div>
        </div>
    </div>
  )
}
