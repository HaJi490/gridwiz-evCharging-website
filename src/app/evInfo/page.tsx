'use client'

import React, { useState } from 'react'
import axios from 'axios';
import { useRouter } from "next/navigation";
import { useAtom } from 'jotai';

import style from '../signup/signup.module.css'
import Toast from '@/components/Toast/Toast';
import { accessTokenAtom } from '@/store/auth';

/**
 * 사용자 차량 등록 페이지
 * 서비스 이용을 위한 차량 브랜드 및 모델 정보를 선택하고, 사용자의 대표 차량으로 등록하는 기능을 제공합니다.
 */
export default function page() {
    const [token] = useAtom(accessTokenAtom);

    // 차량 정보 상태 관리
    const [brand, setBrand] = useState<string>('');
    const [brandDt, setBrandDt] = useState<string[]>();
    const [showBrand, setShowBrand] = useState<boolean>(false);

    const [model, setModel] = useState<string>('');
    const [modelDt, setModelDt] = useState<string[]>();
    const [showModel, setShowModel] = useState<boolean>(false);

    const [toastMsg, setToastMsg] = useState<string>('');
    const route = useRouter();

    /**
     * 등록 가능한 전체 차량 브랜드 목록 조회 요청
     * @returns {Promise<void>}
     */
    const brandResp = async () => {
        try {
            const res = await axios.get(`http://${process.env.NEXT_PUBLIC_BACKIP}:8080/evcar/brand/info`);
            setBrandDt(res.data);
            setShowBrand(true);
        } catch (error) {
            console.error("brandResp:: ", error);
        }
    }

    /**
     * 선택된 브랜드에 해당하는 차량 모델 목록 조회 요청
     * @param {string} selectedBrand  사용자가 선택한 차량 브랜드명
     * @returns {Promise<void>}
     */
    const modelResp = async (brand: string) => {
        if (!brand) {
            setToastMsg('차량 브랜드를 먼저 선택해주세요.');
            return;
        }
        setBrand(brand);

        try {
            const res = await axios.get(`http://${process.env.NEXT_PUBLIC_BACKIP}:8080/evcar/brand/model/info?brand=${brand}`,);
            setModelDt(res.data);
            setShowModel(true);

        } catch (error) {
            console.error("modelResp:: ", error);
        }
    }

    /**
     * 선택된 차량 브랜드와 모델을 사용자의 메인 차량으로 등록 요청
     * @returns {Promise<void>}
     */
    const submitEV = async () => {
        if (!token) {
            setToastMsg('로그인 후에 다시 시도해주세요');
            return;
        }
        if (!brand) {
            setToastMsg('브랜드를 선택해주세요.')
            return;
        }
        if (!model) {
            setToastMsg('모델을 선택해주세요.')
            return;
        }

        const requestBody = {
            brand: brand,
            model: model,
            mainModel: true
        }

        try {
            await axios.post(`http://${process.env.NEXT_PUBLIC_BACKIP}:8080/user/car/set`,
                requestBody,
                { headers: { Authorization: `Bearer ${token}` } }

            );

            setToastMsg('차량등록이 완료되었습니다.')
            route.back();
        } catch (error) {
            console.error('submitEv 에러: ', error);
            setToastMsg('등록 중 오류가 발생했습니다. 다시 시도해주세요.');
        }
    }



    return (
        <>
            <main className="w-full pt-50 flex flex-col justify-center items-center px-4">
                <Toast message={toastMsg} setMessage={setToastMsg} />
                <h2 className='text-center font-medium text-[28px] tracking-wide mb-15'>차량 등록</h2>
                
                <div className="w-7/10 max-w-[800px] ">
                    <hr className="border-[#afafaf] border-[1.5px] mb-3" />
                    <div className="grid grid-cols-[1fr_3fr] justify-center items-center gap-6 mb-15">
                        {/* 차량 브랜드 선택 섹션 */}
                        <label className=""> 차량브랜드</label>
                        <div className='flex flex-col'>
                            <input
                                type="text"
                                value={brand}
                                className={`${style.inputbox} max-w-[450px]`}
                                onChange={(e) => setBrand(e.target.value.trim())}
                                onClick={() => brandResp()}
                                onBlur={() => setTimeout(() => setShowBrand(false), 150)}
                                readOnly 
                            />
                            <div className='flex flex-wrap gap-x-1'>
                                {showBrand && brandDt?.map(item => (
                                    <button key={item} className={`border border-[#4FA969] rounded-full px-[14px] py-[4px] text-[#4FA969] mt-2 cursor-pointer transition-all ease-in-out
                                                                ${brand === item ? 'bg-[#4FA969] text-white ' : ''}`}
                                        onClick={() => modelResp(item)}>
                                        {item}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="col-span-2 border-[0.5px] border-[#f2f2f2]" />
                        
                        {/* 차량 모델 선택 섹션 */}
                        <label className=""> 차량모델</label>
                        <div className='flex flex-col'>
                            <input
                                type="text"
                                value={model}
                                className={`${style.inputbox} max-w-[450px]`}
                                onClick={() => modelResp(brand)}
                                onBlur={() => setTimeout(() => setShowModel(false), 150)}
                                readOnly
                            />
                            <div className='flex flex-wrap gap-x-1'>
                                {showModel && modelDt?.map(m => (
                                    <button key={m} className={`border border-[#4FA969] rounded-full px-[14px] py-[4px] text-[#4FA969] mt-2 cursor-pointer 
                                                            ${model === m ? 'bg-[#4FA969] text-white ' : ''}`}
                                        onClick={() => setModel(m)}>
                                        {m}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="col-span-2 border-[0.5px] border-[#f2f2f2]" />
                    </div>
                </div>
                
                {/* 하단 제어 버튼 */}
                <div className="flex gap-5">
                    <button onClick={() => route.back()} className={`${style.btn} ${style.cancel}`}>이전</button>
                    <button onClick={() => { submitEV() }} className={`${style.btn} ${style.confirm}`}>등록</button>
                </div>
            </main>
        </>
    )
}
