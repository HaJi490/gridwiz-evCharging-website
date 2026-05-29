'use client'

import React, { useEffect, useState } from "react";
import axios, { AxiosError } from "axios";
import { useRouter } from "next/navigation";

import { SignupRequest } from '../../types/dto'
import style from './signup.module.css'



/**
 * 전역 Window 인터페이스 확장
 * 다음(Daum) 주소 검색 API 스크립트 로드를 위한 정의입니다.
 */
declare global {
    interface Window {
        daum: any;
    }
}

/**
 * 회원가입 페이지
 * 사용자 정보 입력, 아이디 중복 확인, 비밀번호 복잡도 검사 및 주소 검색 기능을 제공합니다.
 * 최종적으로 입력된 데이터를 SignupRequest DTO 규격에 맞춰 서버에 전송합니다.
 */
export default function signup() {
    const route = useRouter();

    // 회원 기본 정보 상태
    const [username, setUsername] = useState<string>('');
    const [id, setId] = useState<string>('');
    const [pwd, setPwd] = useState<string>('');
    const [pwdConfirm, setPwdConfirm] = useState<string>('');
    const [gender, setGender] = useState<'male' | 'female' | undefined>();

    // 유효성 검사 상태
    const [isIdValid, setIsIdValid] = useState<boolean | null>(false);
    const [validMsg, setValidMsg] = useState<string | null>(null);
    const [isPwdValid, setIsPwdValid] = useState<boolean | null>(false);
    const [pwdConfirmMsg, setPwdConfirmMsg] = useState<string | null>(null);
    const [isPwdConfirmValid, setIsPwdConfirmValid] = useState<boolean | null>(null);

    // 연락처 및 이메일 상태
    const [phone, setPhone] = useState<string>('');
    const [phoneMiddle, setPhoneMiddle] = useState<string>('');
    const [phoneLast, setPhoneLast] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [domainOpt, setDomainOpt] = useState<string>('직접입력');
    const [customDomain, setCustomDomain] = useState<string>('');

    // 주소 정보 상태
    const [zoneCode, setZoneCode] = useState('');
    const [roadAddress, setRoadAddress] = useState('');
    const [detailAddress, setDetailAddress] = useState('');

    // 유효성 검사 기준 상수
    const MIN_PW_LENGTH = 8;
    const MIN_NAME_LENGTH = 2;



    /**
     * 입력된 아이디의 중복 여부를 서버에 확인 요청
     * @returns {Promise<void>}
     */
    const checkValid = async () => {
        setIsIdValid(false)
        if (id == null || id === "" || id.length < 5) {
            setValidMsg("아이디는 5자 이상이어야 합니다.")
            return;
        }
        const pattern1 = /[^a-zA-Z0-9]/
        if (pattern1.test(id)) {
            setValidMsg("아이디는 영문대소문자 숫자만 가능합니다.")
            return
        }

        try {
            const res = await axios.post(`http://${process.env.NEXT_PUBLIC_BACKIP}:8080/user/join/valid`,
                { username: id, password: "temp" },
                { headers: { 'Content-Type': 'application/json' } }
            );
            setIsIdValid(true);
            setValidMsg(res.data);
        } catch (error) {
            const err = error as AxiosError;
            console.error("checkValid error: ", error);
            const msg = (err.response?.data as any)?.errors?.[0] || '오류가 발생했습니다.';
            setIsIdValid(false);
            setValidMsg(msg);
        }
    }

    /**
     * 비밀번호: 복잡도 규정 준수 여부를 검사 (8자 이상, 소문자, 숫자, 특수문자 포함)
     * @param {string} ePwd - 검사할 비밀번호 문자열
     * @returns {void}
     */
    function isValidPassword(ePwd: string) {
        const lengthCheck = ePwd.length >= MIN_PW_LENGTH;
        const lowerCheck = /[a-z]/.test(ePwd);
        const numberCheck = /[0-9]/.test(ePwd);
        const specialCheck = /[!@#$%^&*(),.?":{}|<>_\-\\[\]\/~`+=;]/.test(ePwd);

        if (ePwd.length === 0) {
            setIsPwdValid(false);
            return;
        }

        if (!lengthCheck || !lowerCheck || !numberCheck || !specialCheck) {
            setIsPwdValid(false);
            return;
        }

        setIsPwdValid(true);
        return '사용 가능한 비밀번호입니다.';

    }

    useEffect(() => {
        isValidPassword(pwd)
    }, [pwd]);

    /**
     * 비밀번호 확인: 입력값과 원본 비밀번호의 일치 여부를 검사
     * @param {string} confirmPwd - 확인용 비밀번호 입력값
     */
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

    /**
     * 전화번호: 분리된 전화번호 입력값을 규격화된 형식으로 변환
     * @param {string} value - 숫자 문자열 결합값
     * @returns {string} 010-0000-0000 형식의 문자열
     */
    const formatPhoneNumber = (value: string) => {
        const digits = value.replace(/\D/g, '');
        let formatted = digits;

        if (digits.length > 7)
            formatted = digits.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
        else if (digits.length > 3 && digits.length <= 7)
            formatted = digits.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
        return formatted;
    };

    /**
     * 이메일: 도메인 선택 변경 시 선택된 값을 도메인 상태에 반영
     * @param {React.ChangeEvent<HTMLSelectElement>} e - 도메인 셀렉트 박스 이벤트
     */
    const handleDomainChg = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setDomainOpt(value);
        setCustomDomain(value !== '직접입력' ? value : '');
    }

    /**
     * 주소: Daum 우편번호 서비스 팝업을 호출하여 주소 정보를 검색하고 상태에 저장
     */
    const openDaumPostcode = () => {
        new window.daum.Postcode({
            oncomplete: function (data: any) {
                setZoneCode(data.zonecode);
                setRoadAddress(data.roadAddress);
            },
        }).open();
    };

    /**
     * 최종 유효성 검사를 실시한 후 회원가입 API를 호출
     * @returns {Promise<void>}
     */
    const submitMember = async () => {
        let isValidForm = true;
        let errorMessage = '';

        if (username.length < MIN_NAME_LENGTH) {
            isValidForm = false;
            errorMessage += `이름은 ${MIN_NAME_LENGTH}자 이상이어야 합니다.\n`;
        }

        if (!id || !isIdValid) {
            isValidForm = false;
            errorMessage += '아이디를 올바르게 입력하고 중복 확인을 해주세요.\n';
        }

        if (!pwd || !isPwdValid) {
            isValidForm = false;
            errorMessage += '비밀번호를 올바른 형식으로 입력해주세요.\n';
        }

        if (!pwdConfirm || !isPwdConfirmValid) {
            isValidForm = false;
            errorMessage += '비밀번호 확인이 일치하지 않습니다.\n';
        }

        if (!email || !customDomain || !email.includes('@') && customDomain === '직접입력') {
            const fullEmail = `${email}@${customDomain}`;
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(fullEmail)) {
                isValidForm = false;
                errorMessage += '유효한 이메일 주소를 입력해주세요.\n';
            }
        }

        if (!isValidForm) {
            alert(errorMessage);
            return;
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
            detailAddr: detailAddress,
            createAt: new Date(),
        }

        try {
            const resp = await axios.post(`http://${process.env.NEXT_PUBLIC_BACKIP}:8080/user/join`, requestBody);
            if (resp['status'] === 200) {
                route.push('/signup/success')
            }
        } catch (error) {
            alert("회원가입 처리 중 오류가 발생했습니다. 필수 입력 항목을 확인해주세요.")
            console.error('submitMember: ', error);
        }
    }


    return (
        <main className="w-full py-30 flex flex-col justify-center items-center px-4">
            <h2 className='text-center font-medium text-[28px] tracking-wide mb-15'>회원가입</h2>

            <div className="w-7/10 max-w-[1100px] mb-5">
                <h3 className='text-left font-medium text-[28px]'>필수입력 정보</h3>
                <span className="text-left text-[15px] text-[#666] mb-7">필수항목이므로 반드시 입력해 주시기 바랍니다.</span>
                <hr className="border-[#afafaf] border-[1.5px] mb-3" />
                <div className="grid grid-cols-[1fr_3fr] justify-center items-center gap-4 mb-15">
                    {/* 이름 입력*/}
                    <label className=""> 이름</label>
                    <input type="text" value={username} onChange={(e) => setUsername(e.target.value.trim())} className={`${style.inputbox} max-w-[450px]`} />
                    <div className="col-span-2 border-[0.5px] border-[#f2f2f2]" />
                    
                    {/* 아이디 중복 확인*/}
                    <label className="">아이디</label>
                    <div className="flex gap-2 items-start">
                        <div className="w-full max-w-[450px]">
                            <input type='text' value={id} onChange={(e) => setId(e.target.value.trim())} className={`${style.inputbox} max-w-[450px]`} />
                            {validMsg && <p className={`text-[12px] mt-1 ${isIdValid ? 'text-[#4FA969]' : 'text-[#D42D2D]'}`} >{validMsg}</p>}
                        </div>
                        <button type="button" onClick={() => { checkValid() }} className="h-[50px] border border-[#afafaf] rounded text-[#666666] px-4 py-3 ml-4 cursor-pointer"> 중복확인</button>
                    </div>
                    <div className="col-span-2 border-[0.5px] border-[#f2f2f2]" />
                    
                    {/* 비밀번호 */}
                    <label>비밀번호</label>
                    <div className="w-full max-w-[450px]">
                        <input type="password" value={pwd} onChange={(e) => setPwd(e.target.value.trim())}
                            className={`${style.inputbox} max-w-[450px]`} />
                        {!isPwdValid && <p className='text-[12px] mt-1 text-[#D42D2D]'>비밀번호는 8자 이상, 소문자, 숫자, 특수문자 각각 하나 이상 포함해야합니다.</p>}
                    </div>
                    <div className="col-span-2 border-[0.5px] border-[#f2f2f2]" />
                    
                    {/* 비밀번호 확인 */}
                    <label>비밀번호 확인</label>
                    <div>
                        <input type="password" value={pwdConfirm} onChange={(e) => { setPwdConfirm(e.target.value.trim()); checkPasswordConfirm(e.target.value.trim()); }}
                            onBlur={() => setPwdConfirmMsg(null)} className={`${style.inputbox} max-w-[450px] `} />
                        {pwdConfirmMsg && <p className={`text-[12px] mt-1 ${isPwdConfirmValid ? 'text-[#4FA969]' : 'text-[#D42D2D]'}`} >{pwdConfirmMsg}</p>}
                    </div>
                    <div className="col-span-2 border-[0.5px] border-[#f2f2f2]" />
                    
                    {/* 휴대폰번호 */}
                    <label>휴대폰 번호</label>
                    <div>
                        <input type="text" placeholder='' value={phone} onChange={(e) => e.target.value.trim().length < 4 ? setPhone(e.target.value.trim()) : ""} className={`${style.inputbox} max-w-[200px] text-center`} />&ensp;-&ensp;
                        <input type="text" placeholder='' value={phoneMiddle} onChange={(e) => e.target.value.trim().length < 5 ? setPhoneMiddle(e.target.value.trim()) : ""} className={`${style.inputbox} max-w-[200px] text-center`} />&ensp;-&ensp;
                        <input type="text" placeholder='' value={phoneLast} onChange={(e) => e.target.value.trim().length < 5 ? setPhoneLast(e.target.value.trim()) : ""} className={`${style.inputbox} max-w-[200px] text-center`} />
                    </div>
                    <div className="col-span-2 border-[0.5px] border-[#f2f2f2]" />
                    
                    {/* 이메일 */}
                    <label>이메일</label>
                    <div className="flex gap-2 items-center">
                        <input type="text" value={email} onChange={(e) => setEmail(e.target.value.trim())} className={`${style.inputbox} max-w-[200px]`} /> &ensp;@&ensp;
                        <input type="text" value={customDomain} onChange={(e) => setCustomDomain(e.target.value.trim())} className={`${style.inputbox} max-w-[200px]`} />
                        <select onChange={(e) => handleDomainChg(e)} value={domainOpt} className={`${style.inputbox} max-w-[200px]`}>
                            <option>직접입력</option>
                            <option>naver.com</option>
                            <option>google.com</option>
                        </select>
                    </div>
                    <div className="col-span-2 border-[0.5px] border-[#f2f2f2]" />
                    
                    {/* 성별 */}
                    <label > 성별</label>
                    <div className="flex items-center gap-7">
                        <label>
                            <input type="radio" value='male' checked={gender === "male"} onChange={(e) => setGender(e.target.value as 'male' | 'female')} /> 남성
                        </label>
                        <label  >
                            <input type="radio" value='female' checked={gender === "female"} onChange={(e) => setGender(e.target.value as 'male' | 'female')} /> 여성
                        </label>
                    </div>
                    <div className="col-span-2 border-[0.5px] border-[#f2f2f2]" />
                </div>

                {/* 선택 정보(주소) */}
                <h3 className='text-left font-medium text-[28px]'>선택입력 정보</h3>
                <hr className="border-[#afafaf] border-[1.5px] mb-3" />
                <div className="grid grid-cols-[1fr_3fr] gap-4 mb-4 justify-center">
                    <label>주소</label>
                    <div className="flex flex-col gap-4">
                        <div>
                            <input type="text" value={zoneCode} onChange={(e) => setZoneCode(e.target.value)} readOnly className={`${style.inputbox} max-w-[200px]`} />
                            <button type="button" onClick={openDaumPostcode} className="border border-[#afafaf] text-[#666666] rounded px-4 py-3 ml-4 cursor-pointer">우편번호 검색</button>
                        </div>
                        <input type="text" value={roadAddress} onChange={(e) => setZoneCode(e.target.value)} readOnly className={style.inputbox} />
                        <input type="text" value={detailAddress} placeholder="상세주소를 입력해주세요" onChange={(e) => setDetailAddress(e.target.value)} className={style.inputbox} />
                    </div>
                    <div className="col-span-2 border-[0.5px] border-[#f2f2f2]" />
                </div>
            </div>
            
            {/* 하단 제어 버튼 */}
            <div className="flex gap-5">
                <button onClick={() => route.back()} className={`${style.btn} ${style.cancel} cursor-pointer`}>취소</button>
                <button onClick={() => { submitMember() }} className={`${style.btn} ${style.confirm} cursor-pointer`}>가입</button>
            </div>
        </main>
    )
}
