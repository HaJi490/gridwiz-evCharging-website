'use client'

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from 'axios';
import Image from "next/image"
import { useAtom } from "jotai";
import { jwtDecode } from "jwt-decode";
import Toast from "@/components/Toast/Toast";
import Link from "next/link";
import { accessTokenAtom, tokenExpireAtAtom, roleAtom } from "@/store/auth";

/**
 * JWT 페이로드 인터페이스
 * 서버로부터 전달받은 토큰의 내부 데이터 구조를 정의.
 */
interface TokenPayload {
  userId: string;
  role: 'ROLE_MANAGER' | 'ROLE_MEMBER';
  exp: number;  // 만료시간
}

/**
 * 사용자 로그인 페이지
 * 일반 계정 로그인 및 소셜 로그인(OAuth2)을 제공하며, 
 * 인증 성공 시 토큰 파싱을 통해 권한별 라우팅(관리자/사용자)을 수행합니다.
 */
export default function page() {
  const [, setToken] = useAtom(accessTokenAtom);
  const [, setTokenExpireAt] = useAtom(tokenExpireAtAtom);
  const [, setRoleAtom] = useAtom(roleAtom);

  const [toastMsg, setToastMsg] = useState<string>('');
  const [id, setId] = useState('');
  const [pwd, setPwd] = useState('');

  const route = useRouter();

  /**
   * 컴포넌트 마운트 시 URL 쿼리 파라미터를 확인하여 토스트 메시지를 출력합니다.
   * 로그아웃, 회원탈퇴 등 외부 액션 후의 피드백을 처리합니다.
   */
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const toast = searchParams.get('toast');
    if (toast) setToastMsg(toast);
  }, [])


  /**
   * 사용자 인증(로그인)을 요청하고 결과에 따른 상태 업데이트 및 라우팅을 수행합니다.
   * @param {React.FormEvent} e - 폼 제출 이벤트
   * @returns {Promise<void>}
   */
  const login = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await axios.post(`http://${process.env.NEXT_PUBLIC_BACKIP}:8080/login`, {
        username: id,
        password: pwd
      }, {
        withCredentials: true
      })

      setToastMsg('로그인되었습니다.');

      // 헤더에서 Authorization 토큰 추출
      const token = res.headers.authorization;

      // JWT 디코딩을 통한 클라이언트 상태 동기화
      const decode: TokenPayload = jwtDecode(token);
      const userRole = decode.role;
      const expireAt = decode.exp * 1000; // JWT(초) 단위를 JS Date(ms) 단위로 변환

      // 전역 상태(Atom) 업데이트
      setRoleAtom(userRole[0] as 'ROLE_MANAGER' | 'ROLE_MEMBER' | 'ROLE_GUEST');
      setToken(token);
      setTokenExpireAt(expireAt);

      // 권한별 목적지 라우팅
      if (userRole[0] === 'ROLE_MANAGER') {
        route.push('/admin/dashboard');
      } else {
        route.push('/');
      }

    } catch (error: any) {
      console.error("로그인 에러: ", error.response || error)
      if (error.response && error.response.status === 401) {
        setToastMsg("아이디 또는 비밀번호가 일치하지 않습니다.");
      } else {
        setToastMsg(error.response?.data?.message || "다시 로그인을 시도해주세요.")
      }
    }
  }



  return (
    <div className="min-h-screen flex flex-col">
      <Toast message={toastMsg} setMessage={setToastMsg} />
      <main className='w-screen flex-grow flex flex-col justify-center items-center bg-white px-4 pb-[30px]'>
        <form className="w-5/10 max-w-[400px] sm:w-96 px-6" onSubmit={e => login(e)}>
          <h2 className='text-center font-medium text-[28px] tracking-wide mb-6'>로그인</h2>
          <div className="mb-4">
            <label className='block text-[12px] text-[#afafaf] mb-1'>ID</label>
            <input type='text' value={id} onChange={e => setId(e.target.value.trim())} required
              className='w-full px-4 py-3 border border-[#afafaf] focus:ouline-none focus:outline-[#4FA969]' />
          </div>
          <div className="mb-4">
            <label className='block text-[12px] text-[#afafaf] mb-1'>Password</label>
            <input type='password' value={pwd} onChange={e => setPwd(e.target.value.trim())} required
              className='w-full px-4 py-3 border border-[#afafaf] focus:ouline-none focus:outline-[#4FA969]' />
          </div>
          <button type='submit' className='w-full px-4 py-3 bg-[#4FA969] text-white text-center font-semibold mb-4 cursor-pointer'>로그인</button>
        </form>
        <div className='text-[#666] text-[15px] flex gap-3'>
          <Link href="/signup">회원가입</Link>
        </div>
        <div className="flex justify-center my-4">

        </div>
        <div className="flex justify-center gap-6">
          <Link href={`${process.env.NEXT_PUBLIC_OAUTH2}/oauth2/authorization/google`} >
            <Image className="cursor-pointer " src="/Group 57 (1).png" alt='gw57로고' width={40} height={40} priority />
          </Link>
          <Link href={`${process.env.NEXT_PUBLIC_OAUTH2}/oauth2/authorization/naver`} >
            <Image className="cursor-pointer " src="/Group 11.png" alt='gw12로고' width={40} height={40} priority />
          </Link>
          <Link href={`${process.env.NEXT_PUBLIC_OAUTH2}/oauth2/authorization/kakao`}>
            <Image className="cursor-pointer" src="/Group 12.png" alt='gw13로고' width={40} height={40} priority />
          </Link>
          <Link href={`${process.env.NEXT_PUBLIC_OAUTH2}/oauth2/authorization/github`}>
            <Image className="cursor-pointer" src="/Group 13.png" alt='gw14로고' width={40} height={40} priority />
          </Link>
        </div>
      </main>
    </div>
  )
}
