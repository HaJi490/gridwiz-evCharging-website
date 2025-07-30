'use client'

import React, { ReactElement, useState, useEffect } from 'react'
import axios from 'axios';
import { useRouter } from "next/navigation";
import { useAtom } from 'jotai';

import style from '../signup/signup.module.css'
import Toast from '@/components/Toast/Toast';
import { accessTokenAtom } from '@/store/auth';

export default function page() {
    const [token] = useAtom(accessTokenAtom);

    const [brand, setBrand] = useState<string>('');
    const [brandDt, setBrandDt] = useState<string[]>();
    const [showBrand, setShowBrand] = useState<boolean>(false);

    const [model, setModel] = useState<string>('');
    const [modelDt, setModelDt] = useState<string[]>();
    const [showModel, setShowModel] = useState<boolean>(false);

    const [toastMsg, setToastMsg] = useState<string>('');
    const route = useRouter();

    // 브랜드 요청
    const brandResp = async() => {
        try{
            const res = await axios.get(`http://${process.env.NEXT_PUBLIC_BACKIP}:8080/evcar/brand/info`);
            setBrandDt(res.data);
            setShowBrand(true);
        } catch(error){
            console.error("brandResp:: ", error);
        }
    }

    // 모델 요청
    const modelResp = async(brand: string) => {
        if (!brand) {
            setToastMsg('차량 브랜드를 먼저 선택해주세요.');
            return; // 브랜드가 없으면 함수를 즉시 종료
        }
        setBrand(brand);

        try{
            const res = await axios.get(`http://${process.env.NEXT_PUBLIC_BACKIP}:8080/evcar/brand/model/info?brand=${brand}`, );
            setModelDt(res.data);
            setShowModel(true);

        } catch(error){
            console.error("modelResp:: ", error);
        }
    }

    // 차량정보 제출
    const submitEV = async() => {
        if(!token){
            setToastMsg('로그인 후에 다시 시도해주세요');
            return;
        }
        if(!brand){
            setToastMsg('브랜드를 선택해주세요.')
            return;
        }
        if(!model){
            setToastMsg('모델을 선택해주세요.')
            return;
        }
        
        const requestBody = {
            brand: brand,
            model: model,
            mainModel: true
        }

        console.log('requestBdy: ', requestBody);
        try{
            const res = await axios.post(`http://${process.env.NEXT_PUBLIC_BACKIP}:8080/user/car/set`,
                requestBody,
                { headers: { Authorization: `Bearer ${token}` } }
            
            );

            setToastMsg('차량등록이 완료되었습니다.')
            route.back();
        } catch(error){
            console.error('submitEv 에러: ', error)
        }
    }



  return (
    <>
        <main className="w-full pt-50 flex flex-col justify-center items-center px-4">
            <Toast message={toastMsg} setMessage={setToastMsg}/>
            <h2 className='text-center font-medium text-[28px] tracking-wide mb-15'>차량 등록</h2>
            {/* step UI */}
            <div className="w-7/10 max-w-[800px] ">
                {/* <h3 className='text-left font-medium text-[28px]'>필수입력 정보</h3>
                <span className="text-left text-[15px] text-[#666] mb-7">필수항목이므로 반드시 입력해 주시기 바랍니다.</span> */}
                <hr className="border-[#afafaf] border-[1.5px] mb-3"/>
                <div className="grid grid-cols-[1fr_3fr] justify-center items-center gap-6 mb-15">
                    {/* 브랜드 */}
                    <label className=""> 차량브랜드</label>
                    <div className='flex flex-col'>
                        <input 
                            type="text" 
                            value={brand} 
                            className={`${style.inputbox} max-w-[450px]`} 
                            onChange={(e) => setBrand(e.target.value.trim())} 
                            onClick={()=>brandResp()}  
                            onBlur={() => setTimeout(() => setShowBrand(false), 150)}
                            readOnly // 사용자 입력불가
                        />
                        <div className='flex flex-wrap gap-x-1'>
                            {showBrand && brandDt?.map(item => (
                                <button key={item} className={`border border-[#4FA969] rounded-full px-[14px] py-[4px] text-[#4FA969] mt-2 cursor-pointer transition-all ease-in-out
                                                                ${brand === item? 'bg-[#4FA969] text-white ' : ''}`}
                                        onClick={() => modelResp(item)}> 
                                        {/* onClick={(e) => setBrand(brand)}  */}
                                    {item}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="col-span-2 border-[0.5px] border-[#f2f2f2]" />
                    {/* 모델 */}
                    <label className=""> 차량모델</label>
                    <div className='flex flex-col'>
                        <input 
                            type="text" 
                            value={model} 
                            className={`${style.inputbox} max-w-[450px]`} 
                            onClick={()=>modelResp(brand)}  
                            onBlur={() => setTimeout(() => setShowModel(false), 150)}
                            readOnly
                        />
                        <div className='flex flex-wrap gap-x-1'>
                            {showModel && modelDt?.map(m =>(
                                <button key={m} className={`border border-[#4FA969] rounded-full px-[14px] py-[4px] text-[#4FA969] mt-2 cursor-pointer 
                                                            ${model === m? 'bg-[#4FA969] text-white ' : ''}`} 
                                        onClick={() => setModel(m)}>
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="col-span-2 border-[0.5px] border-[#f2f2f2]" />
                </div>
            </div>
            <div className="flex gap-5">
                <button onClick={() => route.back()} className={`${style.btn} ${style.cancel}`}>이전</button>
                <button onClick={()=> {submitEV()}} className={`${style.btn} ${style.confirm}`}>등록</button>
            </div>
        </main>
    </>
  )
}
