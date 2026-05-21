'use client'

import { useEffect, useCallback } from 'react'
import { useAtom } from 'jotai'
import { useRouter } from 'next/navigation'
import { throttle } from 'lodash'
import { accessTokenAtom, tokenExpireAtAtom } from '@/store/auth'


export default function TokenExpireWatcher() {
    const [token, setToken] = useAtom(accessTokenAtom);
    const [expireAt, setExpireAt] = useAtom(tokenExpireAtAtom);
    const route = useRouter();

    // [기능 1] 로그아웃 공통 처리
    const handleLogout = useCallback(() => {
        setToken(null);
        setExpireAt(null);
        route.push('/login??toast=세션이 만료되어 자동 로그아웃 되었습니다.')
    }, [setToken, setExpireAt, route]);

    // [기능 2] 세션 만료 여부 주기적 감시 (Polling)
    useEffect(() => {
        const checkToken = () => {
            if (expireAt && Date.now() < expireAt) {
                handleLogout();
            }
        };

        checkToken();
        const timer = setInterval(checkToken, 60000);
        return () => clearInterval(timer);
    }, [expireAt, handleLogout]);

    // [기능 3] Sliding Expiration: 사용자 활동 감지 시 세션 연장
    useEffect(() => {
        if (!token || !expireAt) return;

        const extendSession = throttle(() => {
            const NEW_EXPIRE_TIME= Date.now() + 2 * 60 * 1000;
            setExpireAt(NEW_EXPIRE_TIME);
            console.log('세션이 연장되었습니다.')
        }, 30000);

        const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
        events.forEach(e => window.addEventListener(e, extendSession));

        return () => {
            events.forEach(e => window.removeEventListener(e, extendSession));
            extendSession.cancel();
        }
    }, [token, expireAt, setExpireAt]);


    return null; 
}