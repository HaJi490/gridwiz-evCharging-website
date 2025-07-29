'use client'
import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation';
import { useAtom } from "jotai";
import { accessTokenAtom, tokenExpireAtAtom } from "@/store/auth";

export default function page() {
    const router = useRouter();
    const [, setToken] = useAtom(accessTokenAtom);
    const [, setTokenExpireAt] = useAtom(tokenExpireAtAtom);
    const fetchJwtToken = async ()=>{
        await fetch(`${process.env.NEXT_PUBLIC_OAUTH2}/api/user`,{
            method:"GET",
            credentials: "include"
        }).then((res)=>{
            const jwtToken = res.headers.get("Authorization");
            
            if(jwtToken){
                console.log("token saved!",jwtToken);
                localStorage.setItem("accessToken",jwtToken);
                const expireAt = Date.now() + 1000 * 60 * 60 * 2; // 2시간 후 만료
                setToken(jwtToken);
                setTokenExpireAt(expireAt);
            }else{
                console.error("Authorization header is missing.");
            }
        });

        router.push('/');
    }
useEffect(()=>{
    fetchJwtToken();
},
[])
  return (
    <></>
  )
}