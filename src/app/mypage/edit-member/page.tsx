'use client'

import React, {useState, useEffect} from 'react'
import axios from 'axios'
import { useAtom } from 'jotai';
import { useRouter } from 'next/navigation';

import { User } from '@/types/dto';
import style from '../mypage.module.css';
import { accessTokenAtom } from '@/store/auth';

export default function page() {
    const [token] = useAtom(accessTokenAtom);
    const route = useRouter();

    const [memberDt, setMemberDt] = useState<User>();
    const [nickname, setNickname] = useState<string>();
    const [phone, setPhone] = useState<string>();
    const [email, setEmail] = useState<string>();
    const [domainOpt, setDomainOpt] = useState<string>('직접입력');
    const [customDomain, setCustomDomain] = useState<string>();
    

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

    // 초기값 연결
    useEffect(()=>{
        setNickname(memberDt?.nickname);
        setPhone(memberDt?.phoneNumber);
        setEmail(memberDt?.email?.split('@')[0]);
        setCustomDomain(memberDt?.email?.split('@')[1]);
    }, [memberDt])

    // 이메일 선택
    const handleDomainChg = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setDomainOpt(value);
        if(value !== '직접입력'){
            setCustomDomain(value);
        }else{
            setCustomDomain('');    // 직접입력이면 초기화
        }
    }

    // date format
    const formatDateString = (date: string | undefined) => {
        console.log(date);
        return date ? date.split('T')[0].replaceAll('-', '.') : '';
    }

    // 회원 탈퇴
    const withdrawMember = async() => {
        if (!token) {
            console.warn('토큰 없음');
            return;
        }

        try{
            await axios.delete(`http://${process.env.NEXT_PUBLIC_BACKIP}:8080/user/withdraw`,
                {headers: {
                    Authorization:`Bearer ${token}`
                }}
            )
            route.push('/login?toast=회원탈퇴가 완료되었습니다.');
        }catch(error){
            console.log('withdrawMember 에러: ', error);
        }
    }

    return (
        <div className='w-7/10 max-w-[1300px] py-25 '>
            <h3 className='text-left font-medium text-[28px] '>회원정보 수정</h3>
            {/* <span className="text-left text-[15px] text-[#666] mb-7">회원정보를 수정해주세요.</span> */}
            <hr className="border-[#afafaf] border-[1.5px] mb-3"/>
            <div className="grid grid-cols-[1fr_3fr] justify-center items-center gap-4 mb-5">
                {/* 이름 */}
                <label className=""> 이름</label>
                <input type="text" value={memberDt?.nickname} onChange={(e) => setNickname(e.target.value.trim())} className={`${style.inputbox} max-w-[450px]`} />
                <div className="col-span-2 border-[0.5px] border-[#f2f2f2]" />
                {/* 가입날짜 */}
                <label className=""> 가입날짜</label>
                <input type="text" readOnly disabled value={formatDateString(memberDt?.createAt)} className={`${style.noneInput} max-w-[450px]`} />
                <div className="col-span-2 border-[0.5px] border-[#f2f2f2]" />
                {/* 아이디 */}
                <label className="">아이디</label>
                <div className="flex gap-2 items-start">
                    <div className="w-full max-w-[450px]">
                        <input type='text' readOnly disabled value={memberDt?.username} className={`${style.noneInput} max-w-[450px]`} />
                    </div>
                </div> 
                <div className="col-span-2 border-[0.5px] border-[#f2f2f2]" />
                {/* 비밀번호 */}
                {/* <label>비밀번호</label>
                <div className="w-full max-w-[450px]">
                    <input type="password" value={memberDt?.password} onChange={(e) => setPwd(e.target.value.trim())} 
                            onFocus={()=>setShowPwdCondition(true)} onBlur={(e) => {setShowPwdCondition(false)}}className={`${style.inputbox} max-w-[450px]`} />
                    {!isPwdValid && <p className='text-[12px] mt-1 text-[#D42D2D]'>비밀번호는 8자 이상, 소문자, 숫자, 특수문자 각각 하나 이상 포함해야합니다.</p>}
                </div>
                <div className="col-span-2 border-[0.5px] border-[#f2f2f2]" />
                <label>비밀번호 확인</label>
                <div>
                    <input type="password" value={pwdConfirm} onChange={(e) => {setPwdConfirm(e.target.value.trim()); checkPasswordConfirm(e.target.value.trim());}} 
                            onBlur={() => setPwdConfirmMsg(null)} className={`${style.inputbox} max-w-[450px] `} /> 
                    {pwdConfirmMsg && <p className={`text-[12px] mt-1 ${isPwdConfirmValid? 'text-[#4FA969]' : 'text-[#D42D2D]'}`} >{pwdConfirmMsg}</p>}
                </div>
                <div className="col-span-2 border-[0.5px] border-[#f2f2f2]" /> */}
                {/* 휴대폰번호 */}
                <label>휴대폰 번호</label>
                <div>
                    <input type="text" placeholder='' value={memberDt?.phoneNumber} onChange={(e) => setPhone(e.target.value.trim())} className={`${style.inputbox} max-w-[450px] text-left`}/> 
                    {/* &ensp;-&ensp;
                    <input type="text" className={`${style.inputbox} max-w-[150px]`}/>&ensp;-&ensp;
                    <input type="text" className={`${style.inputbox} max-w-[150px]`}/> */}
                </div>
                <div className="col-span-2 border-[0.5px] border-[#f2f2f2]" />
                {/* 이메일 */}
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
            <button onClick={()=>{withdrawMember()}} className='text-right text-[#666] border-b border-[#666] cursor-pointer '> 
                회원 탈퇴하기 
            </button>
            <div className="flex gap-5 justify-center">
                <button className={'btn cancel cursor-pointer'}>취소</button>
                <button className={'btn confirm cursor-pointer'}>수정</button>
            </div>
        </div>
    )
}

