'use client'

import React, { ReactElement, useState, useEffect } from 'react'
import axios from 'axios';
import { useRouter } from "next/navigation";

import style from '../signup/signup.module.css'
import Toast from '@/components/Toast/Toast';
import { FiEdit } from "react-icons/fi";
import { BiSolidCar } from "react-icons/bi";
import { FiCheckCircle } from "react-icons/fi";

type StepItem = {
    label: string;
    icon: ReactElement;
}

export default function page() {
    const [brand, setBrand] = useState<string>('');
    const [brandDt, setBrandDt] = useState<string[]>();
    const [showBrand, setShowBrand] = useState<boolean>(false);

    const [model, setModel] = useState<string>('');
    const [modelDt, setModelDt] = useState<string[]>();
    const [showModel, setShowModel] = useState<boolean>(false);

    const [toastMsg, setToastMsg] = useState<string>('');
    const route = useRouter();

    
    const steps: StepItem[] = [
            {label: "회원정보", icon: <FiEdit/> },
            {label: "차량정보", icon: <BiSolidCar/> },
            {label: "가입완료", icon: <FiCheckCircle/> }
    ]

    
    const brandResp = async() => {
        try{
            const res = await axios.get(`http://${process.env.NEXT_PUBLIC_BACKIP}:8080/evcar/brand/info`);
            setBrandDt(res.data);
            setShowBrand(true);
        } catch(error){
            console.error("brandResp:: ", error);
        }
    }

    const modelResp = async(brand: string) => {
        setBrand(brand);

        try{
            const res = await axios.get(`http://${process.env.NEXT_PUBLIC_BACKIP}:8080/evcar/brand/model/info?brand=${brand}`, );
            setModelDt(res.data);
            setShowModel(true);
        } catch(error){
            console.error("brandResp:: ", error);
        }
    }

    const submitEV = async() => {
        // 브랜드, 모델 선택 확인 추가🍕
        // userCarId?
        // mainModel을 내가 정하나? 

        if(!brand){
            setToastMsg('브랜드를 입력해주세요.')
        }
        if(!model){
            setToastMsg('모델을 입력해주세요.')
        }
        
        const requestBody = {
            brand: brand,
            userCarId: 0,
            model: model,
            mainModel: true
        }
        try{
            const res = await axios.post(`http://${process.env.NEXT_PUBLIC_BACKIP}:8080/user/car/set`,{
                requestBody,
            });

            //route.push('/');
        } catch(error){
            console.error('submitEv 에러: ', error)
        }
    }



  return (
    <>
        <main className="w-full py-30 flex flex-col justify-center items-center px-4">
            <Toast message={toastMsg} setMessage={setToastMsg}/>
            <h2 className='text-center font-medium text-[28px] tracking-wide mb-15'>차량 등록</h2>
            {/* step UI */}
            <div className="w-7/10 max-w-[1100px] mb-5">
                <h3 className='text-left font-medium text-[28px]'>필수입력 정보</h3>
                <span className="text-left text-[15px] text-[#666] mb-7">필수항목이므로 반드시 입력해 주시기 바랍니다.</span>
                <hr className="border-[#afafaf] border-[1.5px] mb-3"/>
                <div className="grid grid-cols-[1fr_3fr] justify-center items-center gap-4 mb-15">
                    {/* 브랜드 */}
                    <label className=""> 차량브랜드</label>
                    <div className='flex flex-col'>
                        <input type="text" value={brand} className={`${style.inputbox} max-w-[450px]`} onChange={(e) => setBrand(e.target.value.trim())} 
                                onClick={()=>brandResp()}  onBlur={() => setTimeout(() => setShowBrand(false), 100)}/>
                        <div className='flex flex-wrap gap-x-1'>
                            {showBrand && brandDt?.map(item => (
                                <button key={item} className={`border border-[#4FA969] rounded-full px-[14px] py-[4px] text-[#4FA969] mt-2 cursor-pointer
                                                                ${brand === item? 'active' : ''}`}
                                        onMouseDown={() => modelResp(item)}> 
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
                        <input type="text" value={model} className={`${style.inputbox} max-w-[450px]`} 
                                onClick={()=>modelResp(brand)}  onBlur={() => setTimeout(() => setShowBrand(false), 100)}/>
                        <div className='flex flex-wrap gap-x-1'>
                            {showModel && modelDt?.map(m =>(
                                <button key={m} className={`border border-[#4FA969] rounded-full px-[14px] py-[4px] text-[#4FA969] mt-2 cursor-pointer 
                                                            ${model === m? 'active' : ''}`} 
                                        onMouseDown={() => setModel(m)}>
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="col-span-2 border-[0.5px] border-[#f2f2f2]" />
                </div>
                {/* <h3 className='text-left font-medium text-[28px]'>선택입력 정보</h3>
                <hr className="border-[#afafaf] border-[1.5px] mb-3"/>
                <div className="grid grid-cols-[1fr_3fr] gap-4 mb-4 justify-center items-center">
                    <label className=""> 충전선호 시간</label>
                    <div className="flex gap-3 items-center">
                        <input type="text" value={chulgoYear} onChange={(e) => setChulgoYear(e.target.value.trim())} className={`${style.inputbox} max-w-[200px]`} /> ~
                        <input type="text" value={chulgoYear} onChange={(e) => setChulgoYear(e.target.value.trim())} className={`${style.inputbox} max-w-[200px]`} />
                    </div>
                        <div className="col-span-2 border-[0.5px] border-[#f2f2f2]" />
                </div> */}
            </div>
            <div className="flex gap-5">
                <button className={`${style.btn} ${style.cancel}`}>이전</button>
                <button onClick={()=> {submitEV()}} className={`${style.btn} ${style.confirm}`}>등록</button>
            </div>
        </main>
    </>
  )
}
