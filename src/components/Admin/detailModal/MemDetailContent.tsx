import React from 'react';
import type { User } from '@/types/dto';

interface MemberDetailContentProps {
  /** 상세 정보를 표시할 회원 데이터 객체 */
  member: User;
}

/**
 * 관리자 페이지 내에서 특정 회원의 상세 인적 사항을 리스트 형식으로 출력하는 컴포넌트
 * 별도의 비즈니스 로직 없이 전달받은 회원 객체의 데이터를 정제하여 화면에 표시하는 순수 UI 역할을 수행합니다.
 */
export default function MemberDetailContent({ member }: MemberDetailContentProps) {
  return (
    <section className="space-y-4">

      <dl className='space-y-4'>
        <div className="flex">
          <dt className="w-24 font-semibold text-gray-600">아이디</dt>
          <dd className="text-gray-800">{member.username}</dd>
        </div>
        <div className="flex">
          <dt className="w-24 font-semibold text-gray-600">이름</dt>
          <dd className="text-gray-800">{member.nickname}</dd>
        </div>
        <div className="flex">
          <dt className="w-24 font-semibold text-gray-600">성별</dt>
          <dd className="text-gray-800">{member.sex || '-'}</dd>
        </div>
        <div className="flex">
          <dt className="w-24 font-semibold text-gray-600">주소</dt>
          <dd className="text-gray-800">{member.roadAddr ||  '-'}</dd>
        </div>
        <div className="flex">
          <dt className="w-24 font-semibold text-gray-600">연락처</dt>
          <dd className="text-gray-800">{member.phoneNumber || '-'}</dd>
        </div>
        <div className="flex">
          <dt className="w-24 font-semibold text-gray-600">이메일</dt>
          <dd className="text-gray-800">{member.email == "" ?  '-' : member.email}</dd>
        </div>
        <div className="flex">
          <dt className="w-24 font-semibold text-gray-600">가입일</dt>
          <dd className="text-gray-800">{new Date(member.createAt).toLocaleString('ko-KR')}</dd>
        </div>
        <div className="flex items-center">
          <dt className="w-24 font-semibold text-gray-600">상태</dt>
          <dd role='status' className={`rounded-full py-1 px-4 font-medium ${member.enabled ? 'bg-[#D9F7E5] text-[#4FA969]' : 'bg-[#FFE8EC] text-[#CE1C4C]'}`}>
            {member.enabled ? '사용 중' : '탈퇴'}
          </dd>
        </div>
      </dl>

    </section>
  );
}