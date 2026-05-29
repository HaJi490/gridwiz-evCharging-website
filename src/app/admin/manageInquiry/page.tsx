'use client'

import React, { useCallback, useEffect, useState } from 'react'
import axios from 'axios';
import { useAtom } from 'jotai';
import { accessTokenAtom } from '@/store/auth';

import BaseDetailModal from '@/components/Admin/detailModal/BaseDetailModal';
import InquiryDetailContent from '@/components/Admin/detailModal/InquiryDetailContent';
import LottieLoading from '@/components/LottieLoading';
import { InquiryBoard, PageInfo, Links, HateoasPageResponse } from '@/types/dto';

//Icons
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { MdFirstPage, MdLastPage } from "react-icons/md";

interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

/**
 * 관리자 전용 문의사항 관리 페이지
 * HATEOAS 기반 페이징 및 동적 정렬 기능을 제공합니다.
 */
export default function ManageInquiry() {
  const [token] = useAtom(accessTokenAtom);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInquiry, setSelectedInquiry] = useState<InquiryBoard | null>(null);

  // API 데이터 상태
  const [inquiries, setInquiries] = useState<InquiryBoard[] | null>(null);
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null);
  const [links, setLinks] = useState<Links | null>(null);

  // 페이징 및 정렬 상태
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'createdAt',
    direction: 'desc'
  });

  /**
   * 문의사항 목록 요청 함수
   * @param url 요청할 API 엔드포인트 (HATEOAS 링크 대응)
   */
  const fetchInquiries = useCallback(async (url: string) => {
    if (!token) return;

    setIsLoading(true);
    try {
      const res = await axios.get<HateoasPageResponse<InquiryBoard>>(url,
        { headers: { Authorization: `Bearer ${token}` } },
      )

      if (res.data && Array.isArray(res.data._embedded.inquiryBoardDtoList)) {
        setInquiries(res.data._embedded.inquiryBoardDtoList);
        setPageInfo(res.data.page);
        setLinks(res.data._links);
        setCurrentPage(res.data.page.number);
      } else {
        setInquiries([]);
      }
    } catch (error) {
      console.error('fetchInquiries 에러: ', error);
      setInquiries([]);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  /**
   * 페이지 번호나 정렬 조건 변경 시 데이터를 새로 호출
   */
  useEffect(() => {
    const sortParam = `${sortConfig.field},${sortConfig.direction}`;
    const url = `http://${process.env.NEXT_PUBLIC_BACKIP}:8080/inquiry/get?page=${currentPage}&size=10&sort=${sortParam}`;
    fetchInquiries(url);
  }, [currentPage, sortConfig, fetchInquiries]);

  // 페이지네이션 핸들러
  const handleFirstPage = () => { if (links?.first) fetchInquiries(links.first.href); }
  const handleLastPage = () => { if (links?.last) fetchInquiries(links.last.href); };
  const handlePrevPage = () => { if (currentPage > 0) { setCurrentPage(currentPage - 1); } };
  const handleNextPage = () => { if (pageInfo && currentPage < pageInfo.totalPages - 1) { setCurrentPage(currentPage + 1); } };

  if (isLoading) {
    return (
      <div className='w-full h-full flex justify-center items-center bg-gray-50'>
        <LottieLoading />
      </div>)
  }

  return (
    <div className="w-full bg-gray-50 min-h-screen p-8 pt-15 lg:px-25 md:px-15 font-sans flex flex-col justify-start items-center">
      <header className='w-full flex justify-between items-center mb-10 px-5'>
        <h1 className='text-5xl font bold  text-gray-800'> Inquiries</h1>

        {/* 정렬 컨트롤러 */}
        <div className='flex gap-5'>
          <button
            onClick={() => {
              const newDirection = sortConfig.direction === 'asc' ? 'desc' : 'asc';
              setSortConfig({ ...sortConfig, direction: newDirection });
              setCurrentPage(0);
            }}
            className="p-2 rounded-md hover:bg-gray-200/50 cursor-pointer"
          >
            {sortConfig.direction === 'desc' ? '내림차순' : '오름차순'}
          </button>
          <select
            value={sortConfig.field}
            onChange={(e) => {
              setSortConfig({ ...sortConfig, field: e.target.value });
              setCurrentPage(0);
            }}
            className="p-2 rounded-md border-[#666] cursor-pointer"
          >
            <option value="createAt">등록일</option>
            <option value="username">멤버아이디</option>
            <option value="title">제목</option>
          </select>
        </div>
      </header>
      
      {/* 테이블 헤더 */}
      <div className='w-full'>
        <div className='bg-[#232323] w-full grid grid-cols-12
                        px-8 py-4 rounded-full text-white'
        >
          <span className='col-span-1'> 번호 </span>
          <span className='col-span-3'> 제목 </span>
          <span className='col-span-2'> 작성자 </span>
          <span className='col-span-2'> 등록일 </span>
          <span className='col-span-2'> 업데이트 </span>
          <span className='col-span-2'> 삭제여부 </span>
        </div>

        {/* 테이블 바디 */}
        <div className='flex flex-col'>
          {inquiries.map(i => (
            <React.Fragment key={i.id}>
              <div
                onClick={() => setSelectedInquiry(i)}
                className='grid grid-cols-12 px-8 py-6 cursor-pointer rounded-lg hover:bg-gray-200/50'
              >
                <span className='col-span-1 font-semibold mr-5 truncate'> {i.id} </span>
                <span className='col-span-3 mr-5 truncate'> {i.title} </span>
                <span className='col-span-2 mr-5 truncate'> {i.memberUsername} </span>
                <span className='col-span-2'>{i.createdAt !== null ? i.createdAt.slice(0, 10): '-'}</span>
                <span className='col-span-2'> {i.updatedAt !== null ? i.updatedAt.slice(0, 10) : '-'}</span>
                <div className='col-span-2 flex justify-start items-center'>
                  <span className={`rounded-full py-1 px-4 font-medium ${i.enabled ? 'bg-[#D9F7E5] text-[#4FA969]' : 'bg-[#FFE8EC] text-[#CE1C4C]'}`}>
                    {i.enabled ? '유효' : '삭제됨'}
                  </span>
                </div>
              </div>
              <div className='border-b border-[#afafaf] px-6'></div>
            </React.Fragment>
          ))}

          {/* 페이지네이션 인터페이스*/}
          {pageInfo && pageInfo.totalPages > 1 && (
            <div className='flex justify-center items-center gap-4 mt-8'>
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
                <FiChevronLeft size={20} />
              </button>

              <span className='mb-3 mt-2'>
                <span className='font-extrabold'>{pageInfo.number + 1}</span> / {pageInfo.totalPages}
              </span>

              <button
                onClick={handleNextPage}
                disabled={currentPage >= pageInfo.totalPages - 1}
                className="px-4 py-2 rounded disabled:opacity-20 cursor-pointer"
              >
                <FiChevronRight size={20} />
              </button>
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
        </div>
      </div>

      {/* 싱세 내용 모달 */}
      <BaseDetailModal
        isOpen={!!selectedInquiry}
        onClose={() => setSelectedInquiry(null)}
        title='문의 상세 내용'
      >
        {selectedInquiry && <InquiryDetailContent inquiry={selectedInquiry} />}
      </BaseDetailModal>
    </div>
  )
}
