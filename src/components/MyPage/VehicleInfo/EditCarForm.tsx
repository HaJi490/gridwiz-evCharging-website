import React,{useState, useEffect} from 'react';
import axios from 'axios';
import { useAtom } from 'jotai';
import { accessTokenAtom } from '@/store/auth';
import { Cars } from '@/types/dto';
import style from '../../../app/signup/signup.module.css'

interface EditCarFormProps {
  initialData?: Cars | null;  // 수정할 때 받을 초기 데이터 (선택 사항)
  onClose: () => void;         // 모달 닫기 함수
  onSuccess: () => void; // 성공 시 부모에게 알릴 콜백
}

export default function EditCarForm({
    initialData = null,
    onClose,
    onSuccess,
}: EditCarFormProps) {
    const [token] = useAtom(accessTokenAtom);

    // 초기데이터로 세팅
    const [brand, setBrand] = useState(initialData?.brand || '');
    const [model, setModel] = useState(initialData?.model || '');

    const [brandDt, setBrandDt] = useState<string[]>([]);
    const [showBrand, setShowBrand] = useState(false);
    const [modelDt, setModelDt] = useState<string[]>([]);
    const [showModel, setShowModel] = useState(false);
    const [toastMsg, setToastMsg] = useState('');


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
    const submitEditEV = async() => {
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
            userCarId: initialData?.userCarId, // 수정 시에는 userCarId 포함
            brand,
            model,
            mainModel: initialData?.mainModel || false, // 기본값
        };

        console.log('requestBdy: ', requestBody);
        console.log('토큰:', token)
        try{
            // 수정 모드인지 등록 모드인지에 따라 다른 API를 호출
            if(initialData){
                await axios.patch(`http://${process.env.NEXT_PUBLIC_BACKIP}:8080/user/car/edit?userCarId=${initialData.userCarId}`,
                    requestBody,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                setToastMsg('차량수정이 완료되었습니다.');
            } else{
                await axios.post(`http://${process.env.NEXT_PUBLIC_BACKIP}:8080/user/car/set`,
                    requestBody,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setToastMsg('차량등록이 완료되었습니다.')
            }

            onSuccess();
            onClose();           // 모달 닫기
        } catch(error){
            console.error('submitEditEV 에러: ', error);
            setToastMsg('차량수정에 실패했습니다.');
        }
    }



  return (
     // 👇 모달 배경
    <div className="fixed inset-0 bg-black/30 flex justify-center items-center z-50" onClick={onClose}>
        {/* 👇 모달 컨텐츠 (이벤트 버블링 방지) */}
        <div className="bg-white rounded-lg p-8 shadow-xl w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className='text-center font-medium text-2xl mb-6'>
                차량 정보 수정
            </h2>
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
            <div className="flex justify-center gap-5 mt-8">
                <button onClick={onClose} className="btn cancel">취소</button>
                <button onClick={submitEditEV} className="btn confirm">
                    {initialData ? '수정 완료' : '등록'}
                </button>
            </div>
        </div>
    </div>
  )
}
