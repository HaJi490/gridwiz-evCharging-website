'use client'

import React, { ReactElement, useEffect, useState } from "react";
import Nav from "@/components/Nav/Nav";
import Script from "next/script";
import axios, { AxiosError } from "axios";
import { useRouter } from "next/navigation";


import {SignupRequest} from '../../types/dto'
import style from './signup.module.css'
import { FiEdit } from "react-icons/fi";
import { BiSolidCar } from "react-icons/bi";
import { FiCheckCircle } from "react-icons/fi";
import { AiOutlineExclamationCircle } from "react-icons/ai";
import { HiOutlineCheckCircle } from "react-icons/hi2";

declare global {
  interface Window {
    daum: any;
  }
}

type StepItem = {
    label: string;
    icon: ReactElement;
}

export default function signup() {
    const route = useRouter();

    const [username, setUsername] = useState<string>('');
    const [id, setId] = useState<string>('');
    const [isIdValid, setIsIdValid] = useState<boolean | null >(false);
    const [validMsg, setValidMsg] = useState<string | null >(null);

    const [pwd, setPwd] = useState<string>('');
    const [isPwdValid, setIsPwdValid] = useState<boolean | null>(false);
    const [showPwdCondition, setShowPwdCondition] = useState<boolean>(false);   // 메시지 표시여부
    
    const [pwdConfirm, setPwdConfirm] = useState<string>('');
    const [pwdConfirmMsg, setPwdConfirmMsg] = useState<string | null>(null);
    const [isPwdConfirmValid, setIsPwdConfirmValid] = useState<boolean | null>(null);

    const [phone, setPhone] = useState<string>('');
    const [phoneMiddle, setPhoneMiddle] = useState<string>('');
    const [phoneLast, setPhoneLast] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [domainOpt, setDomainOpt] = useState<string>('직접입력');
    const [customDomain, setCustomDomain] = useState<string>('');

    const [gender, setGender] = useState<'male' | 'female' | undefined>();
    const [zoneCode, setZoneCode] = useState('');
    const [roadAddress, setRoadAddress] = useState('');
    const [detailAddress, setDetailAddress] = useState('');
    const [addr, setAddr] = useState<string>('');

    const MIN_ID_LENGTH = 4 ;      // 아이디 최소 4자
    const MIN_PW_LENGTH = 8;       // 비밀번호 최소 8자
    const MIN_NAME_LENGTH = 2;     // 이름 최소 2자

    const router = useRouter()

    const steps: StepItem[] = [
        {label: "회원정보", icon: <FiEdit/> },
        {label: "가입완료", icon: <FiCheckCircle/> }
    ]

    // id 중복확인
    const checkValid = async() => {
        console.log({username: id});
        setIsIdValid(false)
        if(id == null || id === "" || id.length < 5){
            setValidMsg("아이디는 5자 이상이어야 합니다.")
            return;
        }
        const pattern1 = /[^a-zA-Z0-9]/
        if(pattern1.test(id)){
            setValidMsg("아이디는 영문대소문자 숫자만 가능합니다.")
            return
        }

        try{
            const res = await axios.post(`http://${process.env.NEXT_PUBLIC_BACKIP}:8080/user/join/valid`, 
                                        {username: id,password : "temp"},{headers:{'Content-Type': 'application/json'}});
            setIsIdValid(true);
            setValidMsg(res.data);
        } catch (error){
            const err= error as AxiosError;
            console.error("checkValid error: ", error);
            const msg = (err.response?.data as any)?.errors?.[0] || '오류가 발생했습니다.';
            setIsIdValid(false);
            setValidMsg(msg);
        }
    }

    // 비밀번호 확인
    function isValidPassword(ePwd: string) {
    // 8자 이상, 소문자, 숫자, 특수문자 각각 하나 이상 포함
    const lengthCheck = ePwd.length >= MIN_PW_LENGTH;
    const lowerCheck = /[a-z]/.test(ePwd);
    const numberCheck = /[0-9]/.test(ePwd);
    const specialCheck = /[!@#$%^&*(),.?":{}|<>_\-\\[\]\/~`+=;]/.test(ePwd);
    
    // setPwd(ePwd);

    if (ePwd.length === 0) {
        setIsPwdValid(false); // 입력값이 없으면 상태를 초기화
        return null;
    }

    if (!lengthCheck || !lowerCheck || !numberCheck || !specialCheck) {
        setIsPwdValid(false);
        return; // 하나라도 실패하면 false로 설정하고 함수 종료
    }

    // if (!lengthCheck) {
    //     setIsPwdValid(false);
    //     return; //`비밀번호는 ${MIN_PW_LENGTH}자 이상이어야 합니다.`;
    // }
    // if (!lowerCheck) {
    //     setIsPwdValid(false);
    //     return ; //'비밀번호는 소문자를 포함해야 합니다.';
    // }
    // if (!numberCheck) {
    //     setIsPwdValid(false);
    //     return ; //'비밀번호는 숫자를 포함해야 합니다.';
    // }
    // if (!specialCheck) {
    //     setIsPwdValid(false);
    //     // return '비밀번호는 특수문자를 포함해야 합니다.';
    // }

    setIsPwdValid(true);
    return '사용 가능한 비밀번호입니다.';
    
    // return lengthCheck && upperCheck && lowerCheck && numberCheck && specialCheck
    }

    useEffect(()=>{  
        isValidPassword(pwd)
    },[pwd]);

    // 비밀번호 확인
    const checkPasswordConfirm = (confirmPwd: string) => {
        if (confirmPwd.length === 0) {
            setIsPwdConfirmValid(null);
            setPwdConfirmMsg(null); // 메시지도 초기화
            return;
        }

        if (confirmPwd === pwd) {
            setIsPwdConfirmValid(true);
            setPwdConfirmMsg('비밀번호가 일치합니다.');
        } else {
            setIsPwdConfirmValid(false);
            setPwdConfirmMsg('비밀번호가 일치하지 않습니다.');
        }
    };

    // 폰 형식
    const formatPhoneNumber = (value: string) => {
        const digits = value.replace(/\D/g, '');
        let formatted = digits;

        if (digits.length > 7)
            formatted = digits.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
        else if (digits.length > 3 && digits.length <= 7)
            formatted = digits.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
        return formatted;
    };

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

    // 다음 우편번호 검색
    const openDaumPostcode = () => {
    new window.daum.Postcode({
        oncomplete: function (data: any) {
            setZoneCode(data.zonecode); // 우편번호
            setRoadAddress(data.roadAddress); // 도로명 주소
            setAddr('');    //상세주소 초기화
        },
    }).open();
    };

    // 회원정보 등록
    const submitMember = async() => {
        // 필수 필드 유효성 검사
        let isValidForm = true;
        let errorMessage = '';

        // 이름 검사
        if (username.length < MIN_NAME_LENGTH) {
            isValidForm = false;
            errorMessage += `이름은 ${MIN_NAME_LENGTH}자 이상이어야 합니다.\n`;
        }

        // 아이디 검사
        if (!id || !isIdValid) { // isIdValid가 false거나 null인 경우 포함
            isValidForm = false;
            errorMessage += '아이디를 올바르게 입력하고 중복 확인을 해주세요.\n';
        }

        // 비밀번호 검사
        if (!pwd || !isPwdValid) { // isPwdValid가 false거나 null인 경우 포함
            isValidForm = false;
            errorMessage += '비밀번호를 올바른 형식으로 입력해주세요.\n';
        }

        // 비밀번호 확인 검사
        if (!pwdConfirm || !isPwdConfirmValid) { // isPwdConfirmValid가 false거나 null인 경우 포함
            isValidForm = false;
            errorMessage += '비밀번호 확인이 일치하지 않습니다.\n';
        }

        // // 전화번호 검사 (간단한 길이 확인)
        // if (phone.replace(/-/g, '').length < 10) { // 하이픈 제거 후 최소 10자리
        //     isValidForm = false;
        //     errorMessage += '유효한 휴대폰 번호를 입력해주세요.\n';
        // }

        // 이메일 검사 (간단한 유효성)
        if (!email || !customDomain || !email.includes('@') && customDomain === '직접입력') { // @ 포함 여부는 email 상태에 직접 확인, customDomain이 직접입력이 아닌 경우만 유효성 검사
            // 이메일 주소의 기본 유효성 검사 (아주 기본적인 예시)
            const fullEmail = `${email}@${customDomain}`;
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(fullEmail)) {
                isValidForm = false;
                errorMessage += '유효한 이메일 주소를 입력해주세요.\n';
            }
        }

        if (!isValidForm) {
            alert(errorMessage);
            return; // 유효성 검사 실패 시 함수 종료
        }
        const requestBody: SignupRequest = {
            username: id,
            nickname: username,
            password: pwd,
            phoneNumber: formatPhoneNumber(phone + phoneMiddle + phoneLast),
            email: `${email}@${customDomain}`,
            sex: gender,
            zipcode: zoneCode,
            roadAddr: roadAddress,
            detailAddr : detailAddress,
            createAt: new Date(),
            ...(addr && {address: `${roadAddress} ${addr}`}),
        }

        try{
            console.log(requestBody);
            const resp = await axios.post(`http://${process.env.NEXT_PUBLIC_BACKIP}:8080/user/join`,requestBody);
            //정상이면 가입완료 페이지로
            console.log(resp)
            // router.push('success')
            if(resp['status'] === 200){
                router.push('/signup/success')
            }
        } catch(error){
            alert("필수입력 정보를 확인바랍니다.")
            console.error('submitMember: ', error);
        }

        route.push('/signup/success');
    }


  return (
        <main className="w-full py-30 flex flex-col justify-center items-center px-4">
            <h2 className='text-center font-medium text-[28px] tracking-wide mb-15'>회원가입</h2>
            {/* step UI */}
            {/* <div className="flex justify-center items-center gap-8 mb-10 text-[#afafaf]">
                {steps.map((step, i, arr) => (
                    <React.Fragment key={i}>
                        <div className="flex flex-col items-center text-center">
                            <div className="font-semibold text-[15px]">
                                0{i + 1}
                            </div>
                            <span className= {`text-[24px] my-2 ${i === 0 ? 'text-[#4FA969]' : ''}`}>{step.icon}</span>
                            <p className="text-[15px]">{step.label}</p>
                        </div>
                        /마지막이 아닌 경우에만 선 추가
                        { i < arr.length - 1 && (
                            <hr className="w-8 border-[#f2f2f2] "/>
                        )}
                    </React.Fragment>
                ))}

            </div> */}

            {/* 필수입력 */}
            <div className="w-7/10 max-w-[1100px] mb-5">
                <h3 className='text-left font-medium text-[28px]'>필수입력 정보</h3>
                <span className="text-left text-[15px] text-[#666] mb-7">필수항목이므로 반드시 입력해 주시기 바랍니다.</span>
                <hr className="border-[#afafaf] border-[1.5px] mb-3"/>
                <div className="grid grid-cols-[1fr_3fr] justify-center items-center gap-4 mb-15">
                    {/* 이름 */}
                    <label className=""> 이름</label>
                    <input type="text" value={username} onChange={(e) => setUsername(e.target.value.trim())} className={`${style.inputbox} max-w-[450px]`} />
                    <div className="col-span-2 border-[0.5px] border-[#f2f2f2]" />
                    {/* 아이디 */}
                    <label className="">아이디</label>
                    <div className="flex gap-2 items-start">
                        <div className="w-full max-w-[450px]">
                            <input type='text' value={id} onChange={(e) => setId(e.target.value.trim())} className={`${style.inputbox} max-w-[450px]`} />
                            {validMsg && <p className={`text-[12px] mt-1 ${isIdValid ? 'text-[#4FA969]' : 'text-[#D42D2D]'}`} >{validMsg}</p>}
                        </div>
                        <button type="button" onClick={()=>{checkValid()} }className="h-[50px] border border-[#afafaf] rounded text-[#666666] px-4 py-3 ml-4 cursor-pointer"> 중복확인</button>
                    </div> 
                    <div className="col-span-2 border-[0.5px] border-[#f2f2f2]" />
                    {/* 비밀번호 */}
                    <label>비밀번호</label>
                    <div className="w-full max-w-[450px]">
                        <input type="password" value={pwd} onChange={(e) => setPwd(e.target.value.trim())} 
                                onFocus={()=>setShowPwdCondition(true)} onBlur={(e) => {setShowPwdCondition(false)}}className={`${style.inputbox} max-w-[450px]`} />
                        {!isPwdValid && <p className='text-[12px] mt-1 text-[#D42D2D]'>비밀번호는 8자 이상, 소문자, 숫자, 특수문자 각각 하나 이상 포함해야합니다.</p>}
                    </div>
                    <div className="col-span-2 border-[0.5px] border-[#f2f2f2]" />
                    <label>비밀번호 확인</label>
                    <div>
                        <input type="password" value={pwdConfirm} onChange={(e) => {setPwdConfirm(e.target.value.trim()); checkPasswordConfirm(e.target.value.trim());}} 
                                onBlur={() => setPwdConfirmMsg(null)} className={`${style.inputbox} max-w-[450px] `} /> 
                                {/*🍕 {...isValid? '' : 'disabled readOnly'} 비밀번호 유효하지않으면 못쓰게 */}
                        {pwdConfirmMsg && <p className={`text-[12px] mt-1 ${isPwdConfirmValid? 'text-[#4FA969]' : 'text-[#D42D2D]'}`} >{pwdConfirmMsg}</p>}
                    </div>
                    <div className="col-span-2 border-[0.5px] border-[#f2f2f2]" />
                    {/* 휴대폰번호 */}
                    <label>휴대폰 번호</label>
                    <div>
                        <input type="text" placeholder='' value={phone} onChange={(e) => e.target.value.trim().length < 4 ? setPhone(e.target.value.trim()) : ""} className={`${style.inputbox} max-w-[200px] text-center`}/>&ensp;-&ensp; 
                        <input type="text" placeholder='' value={phoneMiddle} onChange={(e) => e.target.value.trim().length < 5 ? setPhoneMiddle(e.target.value.trim()) : ""} className={`${style.inputbox} max-w-[200px] text-center`}/>&ensp;-&ensp; 
                        <input type="text" placeholder='' value={phoneLast} onChange={(e) => e.target.value.trim().length < 5 ? setPhoneLast(e.target.value.trim()) : ""} className={`${style.inputbox} max-w-[200px] text-center`}/>
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
                            <input type="radio" value='male' checked={gender === "male"} onChange={(e) => setGender(e.target.value as 'male' | 'female')}/> 남성
                        </label>
                        <label  >
                            <input type="radio" value='female' checked={gender === "female"} onChange={(e) => setGender(e.target.value as 'male' | 'female')}/> 여성 
                        </label>
                    </div>
                    <div className="col-span-2 border-[0.5px] border-[#f2f2f2]" />
                </div>

                {/* 선택입력 정보 */}
                <h3 className='text-left font-medium text-[28px]'>선택입력 정보</h3>
                <hr className="border-[#afafaf] border-[1.5px] mb-3"/>
                <div className="grid grid-cols-[1fr_3fr] gap-4 mb-4 justify-center">
                    <label>주소</label>
                    <div className="flex flex-col gap-4">
                        <div>
                            <input type="text" value={zoneCode} onChange={(e) => setZoneCode(e.target.value)} readOnly className={`${style.inputbox} max-w-[200px]`}/>
                            <button type="button" onClick={openDaumPostcode} className="border border-[#afafaf] text-[#666666] rounded px-4 py-3 ml-4 cursor-pointer">우편번호 검색</button>
                        </div>
                        <input type="text" value={roadAddress} onChange={(e) => setZoneCode(e.target.value)} readOnly className={style.inputbox}/>
                        <input type="text" value={detailAddress} placeholder="상세주소를 입력해주세요" onChange={(e)=> setDetailAddress(e.target.value)} className={style.inputbox}/>
                    </div>
                    <div className="col-span-2 border-[0.5px] border-[#f2f2f2]" />
                </div>
            </div>
            <div className="flex gap-5">
                <button onClick={() => router.back()} className={`${style.btn} ${style.cancel} cursor-pointer`}>취소</button>
                <button onClick={()=>{submitMember()}} className={`${style.btn} ${style.confirm} cursor-pointer`}>가입</button>
            </div>
        </main>
  )
}
