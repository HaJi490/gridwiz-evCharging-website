'use client'

import React, {useState, useEffect} from 'react'
import axios from 'axios'
import { useAtom } from 'jotai';
import { useRouter } from 'next/navigation';

import { User } from '@/types/dto';
import style from '../mypage.module.css';
import { accessTokenAtom } from '@/store/auth';


/**
 * 사용자 정보 수정 및 회원 탈퇴 페이지
 * JWT 인증을 기반으로 기존 회원 정보를 조회하여 폼 데이터와 동기화하며,
 * 정보 수정 및 서비스 탈퇴 기능을 제공합니다.
 */
export default function page() {
    const [token] = useAtom(accessTokenAtom);
    const route = useRouter();

    // 회원 데이터 및 폼 상태 관리
    const [memberDt, setMemberDt] = useState<User>();
    const [nickname, setNickname] = useState<string>();
    const [phone, setPhone] = useState<string>();
    const [email, setEmail] = useState<string>();
    const [domainOpt, setDomainOpt] = useState<string>('직접입력');
    const [customDomain, setCustomDomain] = useState<string>();
    
    /**
     * 서버로부터 현재 로그인된 사용자의 상세 정보를 조회 요청
     * @returns {Promise<void>}
     */
    useEffect(()=>{
        const getMemberInfo = async () => {
            if (!token) return;

            try {
                const res = await axios.get(`http://${process.env.NEXT_PUBLIC_BACKIP}:8080/user/info`, {
                        headers: {Authorization: `Bearer ${token}`}
                    });
                setMemberDt(res.data);
            } catch (error) {
                console.error('getMemberInfo: ', error)
            }
        }
        getMemberInfo();
    }, [token])

    /**
     * API로부터 받은 회원 정보를 로컬 폼 상태(닉네임, 연락처, 이메일 분리 등)로 동기화
     */
    useEffect(()=>{
        setNickname(memberDt?.nickname);
        setPhone(memberDt?.phoneNumber);

        // 이메일 주소를 ID와 도메인으로 분리하여 상태 저장
        setEmail(memberDt?.email?.split('@')[0]);
        setCustomDomain(memberDt?.email?.split('@')[1]);
    }, [memberDt])

    /**
     * 이메일 도메인 선택 변경 시 호출, ('직접입력' 여부에 따라 도메인 상태를 업데이트)
     * @param {React.ChangeEvent<HTMLSelectElement>} e - 셀렉트 박스 변경 이벤트
     */
    const handleDomainChg = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setDomainOpt(value);
        if(value !== '직접입력'){
            setCustomDomain(value);
        }else{
            setCustomDomain(''); 
        }
    }

    /**
     * 날짜 문자열을 시각적 포맷(YYYY.MM.DD)으로 변환.
     * @param {string | undefined} date - 변환할 ISO 날짜 문자열
     * @returns {string} 포맷팅된 날짜 문자열
     */
    const formatDateString = (date: string | undefined) => {
        return date ? date.split('T')[0].replaceAll('-', '.') : '';
    }

    /**
     * 사용자의 계정 탈퇴(Delete) 요청
     * 성공 시 로그인 페이지로 이동하며 피드백 메시지를 전달합니다.
     * @returns {Promise<void>}
     */
    const withdrawMember = async() => {
        if (!token) return;

        try{
            await axios.delete(`http://${process.env.NEXT_PUBLIC_BACKIP}:8080/user/withdraw`, {
                headers: { Authorization:`Bearer ${token}`}
            });
            route.push('/login?toast=회원탈퇴가 완료되었습니다.');
        }catch(error){
            console.error('withdrawMember 에러: ', error);
        }
    }


    return (
        <div className='mainContainer justify-center'>
            <div className='w-7/10 max-w-[1100px] pt-15 '>
                <h3 className='text-left font-medium text-[28px] mb-5 '>회원정보 수정</h3>
                <hr className="border-[#afafaf] border-[1.5px] mb-3"/>
                <div className="grid grid-cols-[1fr_3fr] justify-center items-center gap-4 mb-5">
                    
                    {/* 이름 수정 */}
                    <label className=""> 이름</label>
                    <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value.trim())} className={`${style.inputbox} max-w-[450px]`} />
                    <div className="col-span-2 border-[0.5px] border-[#f2f2f2]" />

                    {/* 가입 날짜 (조회 전용) */}
                    <label className=""> 가입날짜</label>
                    <input type="text" readOnly disabled value={formatDateString(memberDt?.createAt)} className={`${style.noneInput} max-w-[450px]`} />
                    <div className="col-span-2 border-[0.5px] border-[#f2f2f2]" />

                    {/* 계정 아이디 (조회 전용) */}
                    <label className="">아이디</label>
                    <div className="flex gap-2 items-start">
                        <div className="w-full max-w-[450px]">
                            <input type='text' readOnly disabled value={memberDt?.username} className={`${style.noneInput} max-w-[450px]`} />
                        </div>
                    </div> 
                    <div className="col-span-2 border-[0.5px] border-[#f2f2f2]" />

                    {/* 연락처 수정 */}
                    <label>휴대폰 번호</label>
                    <div>
                        <input type="text" placeholder='' value={phone} onChange={(e) => setPhone(e.target.value.trim())} className={`${style.inputbox} max-w-[450px] text-left`}/> 
                    </div>
                    <div className="col-span-2 border-[0.5px] border-[#f2f2f2]" />
                    
                    {/* 이메일 수정 (ID/도메인 결합 구조) */}
                    <label>이메일</label>
                    <div className="flex gap-2 items-center">
                        <input type="text" value={email} onChange={(e) => setEmail(e.target.value.trim())} className={`${style.inputbox} max-w-[200px]`}/> &ensp;@&ensp;
                        <input type="text" value={customDomain} onChange={(e) => setCustomDomain(e.target.value.trim())} className={`${style.inputbox} max-w-[200px]`}/>
                        <select onChange={(e)=>handleDomainChg(e)} value={domainOpt} className={`${style.inputbox} max-w-[200px]`}>
                            <option>직접입력</option>
                            <option>naver.com</option>
                            <option>google.com</option>
                        </select>
                    </div>
                    <div className="col-span-2 border-[0.5px] border-[#f2f2f2]" />

                    {/* 성별 정보 (조회 전용) */}
                    <label > 성별</label>
                    <div className="flex items-center gap-7">
                        <label>
                            <input type="radio" value='male' checked={memberDt?.sex === "male"} readOnly disabled/> 남성
                        </label>
                        <label  >
                            <input type="radio" value='female' checked={memberDt?.sex === "female"} readOnly disabled/> 여성 
                        </label>
                    </div>
                    <div className="col-span-2 border-[0.5px] border-[#f2f2f2]" />
                </div>
                
                {/* 회원 탈퇴 액션*/}
                <button onClick={()=>{withdrawMember()}} className='text-right text-[#666] border-b border-[#666] cursor-pointer '> 
                    회원 탈퇴하기 
                </button>

                {/* 하단 제어 버튼 */}
                <div className="flex gap-5 justify-center">
                    <button onClick={()=>route.back()} className={'btn cancel cursor-pointer'}>취소</button>
                    <button className={'btn confirm cursor-pointer'}>수정</button>
                </div>
            </div>
        </div>
    )
}

