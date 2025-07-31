'use client'

import React, {useCallback, useEffect, useState} from 'react';
import axios from 'axios';
import { useAtom } from 'jotai';
import { accessTokenAtom } from '@/store/auth';

import {User, PageInfo, Links , HateoasPageResponse } from '@/types/dto'; 
import BaseDetailModal from '@/components/Admin/detailModal/BaseDetailModal';
import MemberDetailContent from '@/components/Admin/detailModal/MemDetailContent';
import LottieLoading from '@/components/LottieLoading';
import { FiBell } from "react-icons/fi";
import { FiChevronLeft } from "react-icons/fi"; // 이전
import { FiChevronRight } from "react-icons/fi";  // 다음
import { MdFirstPage } from "react-icons/md"; // 처음
import { MdLastPage } from "react-icons/md"; // 마지막

// interface PageInfo {
//   page: number;
//   size: number;
//   totalElements: number;
//   totalPages: number;
// }

interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

export default function page() {
  const [token] = useAtom(accessTokenAtom);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<User | null>(null);

  const [members, setMembers] = useState<User[]>([]);
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null);
  const [links, setLinks] = useState<Links | null>(null); 

  const [currentPage, setCurrentPage] = useState<number>(0); // API는 0부터 시작
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'createAt',
    direction: 'desc',
  });

  const fetchMembers = useCallback(async(url: string) => {  //page: number, sort: SortConfig
    if (!token){
      console.log('토큰없음')
      return;
    } 
      
    setIsLoading(true);
    try{
      const res = await axios.get<HateoasPageResponse<User>>(url,
        { 
          headers: { Authorization: `Bearer ${token}` }, 
        }
      )

      if(res.data && Array.isArray(res.data._embedded.memberDtoList)){
        setMembers(res.data._embedded.memberDtoList);
        setPageInfo(res.data.page);
        setLinks(res.data._links);

        setCurrentPage(res.data.page.number);

      } else {
        console.warn("API 응답에 content 배열이 없습니다.", res.data);
        setMembers([]); 
      }
      console.log(res.data);
    } catch(error) {
      console.error('fetchMembers 에러: ', error);
      setMembers([]);
    }finally {
    setIsLoading(false);
  }
  }, [token]);

  // useEffect(()=>{
  //   getMemberInfo(currentPage, sortConfig);
  // },[currentPage, sortConfig, getMemberInfo]);

  // 페이지나 정렬 상태가 바뀔 때, URL을 '만들어서' 데이터를 요청
  useEffect(() => {
    const sortParam = `${sortConfig.field},${sortConfig.direction}`;
    const url = `http://${process.env.NEXT_PUBLIC_BACKIP}:8080/admin/users/info?page=${currentPage}&size=10&sort=${sortParam}`;
    fetchMembers(url);
  }, [currentPage, sortConfig, fetchMembers]);

  // --- 페이지네이션 핸들러 함수들 ---
  const handleFirstPage = () => {
    if (links?.first) fetchMembers(links.first.href);
  };
  const handleLastPage = () => {
    if (links?.last) fetchMembers(links.last.href);
  };
  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };
  const handleNextPage = () => {
    if (pageInfo && currentPage < pageInfo.totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };


  if(isLoading){
    return <div className='w-full h-full flex justify-center items-center bg-gray-50'><LottieLoading /></div>
  }

  return (
    <div className="w-full bg-gray-50 min-h-screen p-8 pt-15 lg:px-25 md:px-15 font-sans flex flex-col justify-start items-center">
      <header className='w-full flex justify-between items-center mb-10 px-5'>
          <h1 className='text-5xl font bold  text-gray-800'>Members</h1>
          {/* <button className='relative p-2 rounded-full cursor-pointer hover:bg-gray-200'>
              <FiBell size={23} />
              <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-[#ef4444]" />
          </button> */}

          {/* 정렬 필터 UI */}
          <div className='flex gap-5'>
            <button
                onClick={() => {
                    const newDirection = sortConfig.direction === 'asc' ? 'desc' : 'asc';
                    setSortConfig({ ...sortConfig, direction: newDirection });
                    setCurrentPage(0); // 정렬 방향 변경 시 첫 페이지로
                }}
                className="p-2 rounded-md hover:bg-gray-200/50 cursor-pointer"
            >
                {sortConfig.direction === 'desc' ? '내림차순' : '오름차순'}
            </button>
            <select
                value={sortConfig.field}
                onChange={(e) => {
                    setSortConfig({ ...sortConfig, field: e.target.value });
                    setCurrentPage(0); // 정렬 기준 변경 시 첫 페이지로
                }}
                className="p-2 rounded-md border-[#666] cursor-pointer"
            >
                <option value="createAt">가입일</option>
                <option value="username">아이디</option>
                <option value="nickname">닉네임</option>
            </select>
          </div>
      </header>
      {/* 테이블 헤더*/}
      <div className='w-full'>
        <div className='bg-[#232323] w-full grid grid-cols-12
                        px-8 py-4 rounded-full text-white'
          >
          <span className='col-span-3'>
            아이디
          </span>
          <span className='col-span-3'>
            이름
          </span>
          <span className='col-span-2'>
            연락처
          </span>
          <span className='col-span-2'>
            탈퇴여부
          </span>
          <span className='col-span-2'>
            가입날짜
          </span>
        </div>
        {/* 테이블 바디 */}
        <div className='flex flex-col'>
          {members.map(mem => (
              <React.Fragment  key={mem.username}>
                <div 
                  onClick={() => setSelectedMember(mem)}
                  className='grid grid-cols-12 px-8 py-6 cursor-pointer rounded-lg hover:bg-gray-200/50'
                >
                  <span className='col-span-3 font-semibold mr-5 truncate'>
                    {mem.username}
                  </span>
                  <span className='col-span-3 mr-5 truncate'>
                    {mem.nickname}
                  </span>
                  <span className='col-span-2'>
                    {mem.phoneNumber !== '' 
                    ? mem.phoneNumber 
                    :<span className='text-gray-500'> 
                      정보없음
                      </span>
                    }
                  </span>
                  <div className='col-span-2 flex justify-start items-center'>
                    <span className={`rounded-full py-1 px-4 font-medium ${mem.enabled? 'bg-[#D9F7E5] text-[#4FA969]' : 'bg-[#FFE8EC] text-[#CE1C4C]'}`}>
                      {mem.enabled? '사용 중' : '탈퇴'}
                    </span>
                  </div>
                  <span className='col-span-2'>
                    {mem.createAt.slice(0, 10)}
                  </span>
                </div>
                <div className='border-b border-[#afafaf] px-6'></div>
              </React.Fragment>
            ))}
        </div>
      </div>

      {/* 페이지네이션 */}
      {pageInfo && pageInfo.totalPages > 1 && (
        <div className='flex justify-center items-center gap-4 mt-8'>
          {/* 처음으로 */}
          <button
            onClick={handleFirstPage}
            disabled={currentPage === 0}
            className="p-2 rounded disabled:opacity-20 hover:bg-gray-100"
            aria-label="First Page"
          >
            <MdFirstPage size={20} />
          </button>

          <button
            onClick={handlePrevPage}
            disabled={currentPage === 0}
            className='px-4 py-2 rounded disabled:opacity-20 cursor-pointer'
          >
            <FiChevronLeft  size={20}/>
          </button>

          <span className='mb-3 mt-2'>
            <span className='font-extrabold'>{pageInfo.number + 1}</span> / {pageInfo.totalPages}
          </span>

          <button
            onClick={handleNextPage}
            disabled={currentPage >= pageInfo.totalPages - 1}
            className="px-4 py-2 rounded disabled:opacity-20 cursor-pointer"
          >
            <FiChevronRight  size={20}/>
          </button>
          {/* 마지막으로 */}
          <button
            onClick={handleLastPage}
            disabled={currentPage >= pageInfo.totalPages - 1}
            className="p-2 rounded disabled:opacity-20 hover:bg-gray-100"
            aria-label="Last Page"
          >
            <MdLastPage size={20} />
          </button>
        </div>
      )} 
      <BaseDetailModal
        isOpen={!!selectedMember}
        onClose={()=> setSelectedMember(null)} 
        title= '멤버 상세정보'
      >
        {selectedMember && <MemberDetailContent member={selectedMember} />}
      </BaseDetailModal>
    </div>
  )
}
