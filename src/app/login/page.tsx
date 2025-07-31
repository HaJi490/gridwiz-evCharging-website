'use client'

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from 'axios';
import Image from "next/image"
import { useAtom } from "jotai";
import { jwtDecode } from "jwt-decode";
import Toast from "@/components/Toast/Toast";
import { IoMdHome } from "react-icons/io";
import Link from "next/link";
import { accessTokenAtom, tokenExpireAtAtom, roleAtom } from "@/store/auth";

// 토큰 페이로드의 타입 정의
interface TokenPayload {
  userId: string;
  role: 'ROLE_MANAGER' | 'ROLE_MEMBER';
  exp: number;  // 만료시간
}

export default function page() {
  const [, setToken] = useAtom(accessTokenAtom);
  const [, setTokenExpireAt] = useAtom(tokenExpireAtAtom);
  const [, setRoleAtom] = useAtom(roleAtom);
  const [toastMsg, setToastMsg] = useState<string>('');

  const [id, setId] = useState('');
  const [pwd, setPwd] = useState('');
  
  const route = useRouter();

  // 토스트알림_로그아웃, 회원탈퇴 후
  useEffect(()=>{
    const searchParams = new URLSearchParams(window.location.search);
    const toast = searchParams.get('toast');
    if (toast) setToastMsg(toast);
  },[])

  const login = async(e: React.FormEvent) =>{
    e.preventDefault();

    console.log(id, pwd);
    try{
      const res = await axios.post(`http://${process.env.NEXT_PUBLIC_BACKIP}:8080/login`,{
        username: id,
        password: pwd
      },{
        withCredentials: true
      })

      setToastMsg('로그인되었습니다.')
      const token = res.headers.authorization 

      const decode: TokenPayload = jwtDecode(token);
      const userRole = decode.role;
      const expireAt = decode.exp * 1000; // jwt는 초단위이므로, ms단위로 변환 
      // const expireAt = Date.now() + 1000 * 60 * 60 * 2; // 2시간 후 만료

      setRoleAtom(userRole[0] as 'ROLE_MANAGER' | 'ROLE_MEMBER' | 'ROLE_GUEST');
      console.log(roleAtom);
      setToken(token);
      setTokenExpireAt(expireAt);
      
      if(userRole[0] === 'ROLE_MANAGER'){
        route.push('/admin/dashboard');
      } else{
        route.push('/');
      }

    } catch(error: any){
      console.error("로그인 에러: ", error.response || error)
      if (error.response && error.response.status === 401) {
        setToastMsg("아이디 또는 비밀번호가 일치하지 않습니다.");
      } else{
        setToastMsg(error.response?.data?.message || "다시 로그인을 시도해주세요.")
      } 
    }
  }



  return (
    <div className="min-h-screen flex flex-col">
      <Toast message={toastMsg} setMessage={setToastMsg}/>
        {/* <span className="text-[12px] text-[#afafaf] flex"><IoMdHome />&nbsp;{'>'} 로그인</span> */}
        <main className='w-screen flex-grow flex flex-col justify-center items-center bg-white px-4 pb-[30px]'>
          {/* <span className="text-red-500">OR에 border 안생김(크기조정하면 있긴함)</span> */}
          <form className="w-5/10 max-w-[400px] sm:w-96 px-6" onSubmit={e =>  login(e)}>
            <h2 className='text-center font-medium text-[28px] tracking-wide mb-6'>로그인</h2>
            {/* <div className='grid gap-3 justify-center mb-3'> */}
              <div className="mb-4">
                <label className='block text-[12px] text-[#afafaf] mb-1'>ID</label>
                <input type='text' value={id} onChange={e=> setId(e.target.value.trim())} required
                      className='w-full px-4 py-3 border border-[#afafaf] focus:ouline-none focus:outline-[#4FA969]'/>
              </div>
              <div className="mb-4">
                <label className='block text-[12px] text-[#afafaf] mb-1'>Password</label>
                <input type='password' value={pwd} onChange={e=> setPwd(e.target.value.trim())} required  // 사용자가 입력안하면 브라우저가 경고
                      className='w-full px-4 py-3 border border-[#afafaf] focus:ouline-none focus:outline-[#4FA969]'/>
              </div>
                <button type='submit' className='w-full px-4 py-3 bg-[#4FA969] text-white text-center font-semibold mb-4 cursor-pointer'>로그인</button>
            {/* </div> */}
          </form>
          <div className='text-[#666] text-[15px] flex gap-3'>
              <Link href="/signup">회원가입</Link>
              {/* <span>비밀번호찾기</span> */}
          </div>
          <div className="flex justify-center my-4">
            
          </div>
          <div className="flex justify-center gap-6">
            <Link href= {`${process.env.NEXT_PUBLIC_OAUTH2}/oauth2/authorization/google`} >
              <Image className="cursor-pointer " src="/Group 57 (1).png" alt='gw57로고' width={40} height={40} priority/>
            </Link>
            <Link href= {`${process.env.NEXT_PUBLIC_OAUTH2}/oauth2/authorization/naver`} >
              <Image className="cursor-pointer " src="/Group 11.png" alt='gw12로고' width={40} height={40} priority/>
            </Link>
            <Link href={`${process.env.NEXT_PUBLIC_OAUTH2}/oauth2/authorization/kakao`}>
              <Image className="cursor-pointer" src="/Group 12.png" alt='gw13로고' width={40} height={40} priority/>
            </Link>
            <Link href={`${process.env.NEXT_PUBLIC_OAUTH2}/oauth2/authorization/github`}>
              <Image className="cursor-pointer" src="/Group 13.png" alt='gw14로고' width={40} height={40} priority/>
            </Link>
          </div>
              
        </main>
      </div>
  )
}
