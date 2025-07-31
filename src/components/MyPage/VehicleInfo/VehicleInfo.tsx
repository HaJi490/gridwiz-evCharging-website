import React, {useEffect, useState} from 'react'
import axios from 'axios'
import { useAtom } from 'jotai'
import { accessTokenAtom } from '@/store/auth'
import { useRouter } from 'next/navigation'

import EditCarForm from './EditCarForm'
import Toast from '@/components/Toast/Toast';
import ConfirmModal from '@/components/ConfirmModal/ConfirmModal'
import LottieLoading from '@/components/LottieLoading';
import { Cars } from '@/types/dto';
import { FiXCircle } from "react-icons/fi";
import { FiEdit3 } from "react-icons/fi";
import { FiPlusCircle } from "react-icons/fi";

export default function VehicleInfo() {
  const [token] = useAtom(accessTokenAtom);
  const route = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [carToEdit, setCarToEdit] = useState<Cars | null>(null);

  const [carInfo, setCarInfo] = useState<Cars[]>();
  const [carToDelete, setCarToDelete] = useState<number| null>(null);

  const [toastMsg, setToastMsg] = useState('');
  const [modalInfo, setModalInfo] = useState<{
    show: boolean;
    message: string;
    submessage: string;
  }>({
    show: false,
    message: '',
    submessage: ''
  })
  
  // 1. 차정보 가져오기
  const userCarInfo = async() => {
    try{
      const res = await axios.get<Cars[]>(`http://${process.env.NEXT_PUBLIC_BACKIP}:8080/user/car/info`,
        {headers: {Authorization: `Bearer ${token}`}}
      )
      setCarInfo(res.data);
      console.log(res.data);
    } catch(error) {
      console.error('userCarInfo 에러: ', error);
    } finally{
      setIsLoading(false);
    }
  }

  useEffect(() => {
    userCarInfo();
  }, []);

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

  // 2. 차량 수정
  const handleOpenEditForm = (car: Cars) => {
    setCarToEdit(car);
    setIsFormOpen(true);
  }

  // 2-2. 차량 추가
  const handleOpenNewForm = () =>{
    setCarToEdit(null);   // 수정할 데이터가 없으므로 null
    setIsFormOpen(true);  // 모달을 연다
  }

  const handleFormSuccess = () => {
    // 기존 목록을 업데이트하여 화면에 즉시 반영
    // (이 부분은 백엔드 응답에 맞춰 수정 필요)
    userCarInfo(); // 그냥 데이터를 새로고침하는 것이 가장 간단
  };
  

  // 3. 차량 삭제
  // 확인모달
  const handleConfirmModal = (carId: number) => {
    setCarToDelete(carId);

    setModalInfo({
      show: true,
      message: '차량을 삭제하시겠습니까?',
      submessage: '선택한 내용은 복구할 수 없습니다.'
    });
  }

  // 차량삭제, 모달확인
  const deleteCar = async() => {
    if(!carToDelete) return;

    setModalInfo({
        message: '',
        submessage: '',
        show: false,
    });

    console.log(token);
    try{
      await axios.delete(`http://${process.env.NEXT_PUBLIC_BACKIP}:8080/user/car/delete?userCarId=${carToDelete}`,
        {headers: {Authorization: `Bearer ${token}`}}
      )
      setToastMsg('차량을 삭제하였습니다.');

      //  화면에서도 즉시 삭제된 것처럼 보이게 상태를 업데이트합니다.
      setCarInfo(prevCarInfo => prevCarInfo.filter(car => car.userCarId !== carToDelete));
      
    } catch(error) {
      console.error('deleteCar 에러: ', error);
      setToastMsg('차량 삭제에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setCarToDelete(null);
    }
  }

   // 모달 닫기
  const onCancelConrirmModal = () => {
    setModalInfo({
        message: '',
        submessage: '',
        show: false,
    });
  }

  // 로딩중
  if(isLoading){
    return <div className='w-full h-full flex justify-center items-center'><LottieLoading /></div>
  }

  // 로딩은 끝났지만 데이터가 없을때
  if (!carInfo || carInfo.length === 0) {
    <div className="w-full flex justify-center items-start mt-10 ">
      <div className="text-center">
        <p className="text-xl font-semibold text-gray-700">등록된 차량이 없습니다.</p>
        <p className="text-gray-500 mt-2">차량등록을 하시면 더 많은 서비스를 경험하실 수 있습니다.</p>
        <button onClick={() => route.push('/evInfo')} className="mt-4 px-4 py-2 bg-[#4FA969] text-white rounded-md cursor-pointer">차량등록 하러가기</button>
      </div>
    </div>
  }

  // 로딩끝나고 데이터가 있을때
  return (
    <>
      <Toast message={toastMsg} setMessage={setToastMsg}/>   
      {modalInfo.show &&
        <ConfirmModal message={modalInfo.message} submsg={modalInfo.submessage} onConfirm={deleteCar} onCancel={onCancelConrirmModal} />
      }
      {isFormOpen && (
        <EditCarForm
          initialData={carToEdit}
          onClose={() => setIsFormOpen(false)}
          onSuccess={handleFormSuccess}
        />
      )}
      <div className='grid grid-cols-2 gap-x-2 gap-y-4 mt-7'>
        <h4 className='font-bold text-[#6B6B6B] ml-3 col-span-2'>등록된 차량</h4>
        {carInfo.map( ev  => (
            <div key={ev.userCarId} className='group flex justify-between h-[85px] border bg-white border-[#afafaf] rounded-lg p-4 
                            transition hover:-translate-y-[1px] hover:shadow-[0_5px_15px_rgba(0,0,0,0.08)] '
            >
              <div>
                <p className='text-md font-semibold'> 
                  {stripBrandFromModel(ev.brand, ev.model)}
                  {ev.mainModel && 
                    <span className='bg-[#EBFAD3] text-[#568811] text-xs rounded-full px-2 py-1 ml-2'>
                      main
                    </span>}
                </p>
                <p>{ev.brand}</p>
              </ div>
              <div className='flex items-center gap-3 mr-2 text-gray-400 cursor-pointer 
                              opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
                <div className='relative group/tooltip'>
                  <button onClick={()=>handleConfirmModal(ev.userCarId)}
                          className='p-1 transition hover:bg-red-100  hover:text-red-500 rounded-full cursor-pointer'
                  >
                    <FiXCircle size={18}/>
                  </button>
                  <div className='absolute bottom-full left-1/2 -translate-x-1/2 
                                  px-2 py-1 mb-1 bg-[#666] text-white text-sm rounded opacity-0 
                                  group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap'>
                    차량 삭제
                  </div>
                </div>
                <div className='relative group/tooltip'>
                  <button onClick={()=>handleOpenEditForm(ev)}
                          className='p-1 transition hover:bg-gray-100  hover:text-gray-600 rounded-full cursor-pointer'
                  >
                    <FiEdit3 size={18}/>
                  </button>
                  <div className='absolute bottom-full left-1/2 -translate-x-1/2 
                                  px-2 py-1 mb-1 bg-[#666] text-white text-sm rounded opacity-0 
                                  group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap'>
                    차량 수정
                  </div>
                </div>
              </div>
            </div>
          ))
        }
        <div onClick={handleOpenNewForm} 
            className='group/plus flex justify-center items-center h-[85px] border-[1.5px] border-dashed bg-white border-[#afafaf] rounded-lg p-4 
                            hover:bg-gray-100 hover:border-gray-500 cursor-pointer'>
          <span className='text-[#afafaf] flex gap-2 group-hover/plus:text-gray-500'>차량 추가하기 <FiPlusCircle className='mt-1'/></span>
        </div>
      </div>
    </>
  )
}
