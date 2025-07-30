'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import Image from 'next/image'
import { useAtom } from 'jotai';


import style from './Nav.module.css'
import { FiUser, FiLogOut } from "react-icons/fi";
import Link from 'next/link';
import { setLazyProp } from 'next/dist/server/api-utils';
import { accessTokenAtom, isLoggedInAtom } from '@/store/auth';


export default function Nav() {
  const route = useRouter();
  const path = usePathname();
  const [token, setToken] = useAtom(accessTokenAtom); // setter로 토큰 직접조작
  const [isLoggedin] = useAtom(isLoggedInAtom);
  const [isScrolled, setIsScrolled] = useState(false);  // 스크롤 상태 추적

  // useEffect(()=> {
  //   const token = localStorage.getItem('accessToken');

  //   if(token) setIsLoggedIn(true);
  //   else setIsLoggedIn(false);
    
  // }, [route.pathname])  // 페이지 이동 시마다 token 검사
  

  // 스크롤 감지하고 상태 업데이트
  useEffect(() => {
    const handleScroll = () => {
      // 50px이상 스크롤 되면 isScrolled이 true, 아니면 false
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    }

    // '/produceComp' 페이지일 때만 스크롤 이벤트 리스너를 추가
    if (path === '/produceComp') {
      handleScroll(); // 페이지 진입시 즉시 실행

      window.addEventListener('scroll', handleScroll);

      // 컴포넌트가 언마운트되거나 경로가 변경될 때 이벤트 리스너를 정리
      return () => {
        window.removeEventListener('scroll', handleScroll);
      };
    } else {
      // 다른 페이지에서는 항상 '스크롤된' 상태(불투명)로 고정
      setIsScrolled(true);
    }
  }, [path]);

  //  3. 투명 상태인지 여부를 결정하는 변수 (코드를 깔끔하게 만들기 위함)
  const isTransparent = path === '/produceComp' && !isScrolled;

  const handleLogout = () => {
    setToken(null);
    // localStorage.removeItem('accessToken');
    route.push('/login?toast=로그아웃 되었습니다.');
  };

  return (
    <div className={`${style.navContainer} ${isTransparent ? 'bg-transparent' : 'bg-white border-b border-[#f2f2f2]'}`}>
      {/* 로고 */}
      <div className={`${style.logoBox} cursor-pointer`} onClick={()=>{route.push('/')}}>
        <Link href="/">
          <Image src="/gwLogo.png" alt='gw로고' width={150} height={80} priority/>
        </Link>
        
      </div>
      {/* 중앙 메뉴 */}
      <ul className={style.menu}>
        <li onClick={()=>{route.push('/produceComp')}} 
          className={`
              ${style['menu-button']} 
              ${isTransparent 
                ?`${style.transparent_mode} text-white hover:bg-white/20`
                : `${path === '/produceComp' && 'text-[#4FA969]'} hover:bg-gray-100/50`}`}
        >
          회사소개
        </li>
        {/* <li className={`
              ${style['menu-button']} 
              ${isTransparent 
                ?`${style.transparent_mode} text-white hover:bg-white/20`
                : `${path === '/dd' && 'text-[#4FA969]'} hover:bg-gray-100/50`}`}
        >
          이용안내
        </li> */}
        <li onClick={()=>{route.push('/')}} 
          className={`
              ${style['menu-button']} 
              ${isTransparent 
                ?`${style.transparent_mode} text-white hover:bg-white/20`
                : `${path === '/' && 'text-[#4FA969]'} hover:bg-gray-100/50`}`}
        >
          충전소 찾기
        </li>
        <li onClick={()=>{route.push('/chg-schedule')}} 
            className= {`
              ${style['menu-button']} 
              ${isTransparent 
                ?`${style.transparent_mode} text-white hover:bg-white/20`
                : `${path === '/chg-schedule' && 'text-[#4FA969]'} hover:bg-gray-100/50`}`}
        >
          나의 예약정보
        </li>
      </ul>
      {/* 우측 버튼 */}
      <div className={style.authBox}>
        {isLoggedin ? 
          <div className='flex gap-3'>
          <button onClick={()=>route.push('/mypage')} className={`cursor-pointer text-[23px] text-[#666] rounded-full p-2 hover:bg-[#f2f2f2] ${isTransparent && 'text-white hover:bg-white/20'}`}><FiUser/></button>
          <button onClick={()=>handleLogout()} className={`cursor-pointer text-[23px] text-[#666] rounded-full p-2 hover:bg-[#f2f2f2] ${isTransparent && 'text-white hover:bg-white/20'}`}><FiLogOut/></button>
          </div>
          : <button onClick={()=>{route.push('/login')}} className={`px-6 py-2 rounded-full  bg-[#4FA969] text-white cursor-pointer ${isTransparent && 'bg-transparent border hover:bg-white/20'}`}>로그인</button>
        }
      </div>
    </div>

  )
}
