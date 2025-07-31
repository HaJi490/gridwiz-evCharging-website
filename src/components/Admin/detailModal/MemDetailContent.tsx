import React from 'react';
import type { User } from '@/types/dto';

interface MemberDetailContentProps {
  member: User;
}

export default function MemberDetailContent({ member }: MemberDetailContentProps) {
  // 이제 이 컴포넌트는 순수하게 멤버 정보를 보여주는 역할만 합니다.
  return (
    <div className="space-y-4">
      <div className="flex">
        <span className="w-24 font-semibold text-gray-600">아이디</span>
        <span className="text-gray-800">{member.username}</span>
      </div>
      <div className="flex">
        <span className="w-24 font-semibold text-gray-600">이름</span>
        <span className="text-gray-800">{member.nickname}</span>
      </div>
      <div className="flex">
        <span className="w-24 font-semibold text-gray-600">성별</span>
        <span className="text-gray-800">{member.sex || '-'}</span>
      </div>
      <div className="flex">
        <span className="w-24 font-semibold text-gray-600">주소</span>
        <span className="text-gray-800">{member.roadAddr ||  '-'}</span>
      </div>
      <div className="flex">
        <span className="w-24 font-semibold text-gray-600">연락처</span>
        <span className="text-gray-800">{member.phoneNumber || '-'}</span>
      </div>
      <div className="flex">
        <span className="w-24 font-semibold text-gray-600">이메일</span>
        <span className="text-gray-800">{member.email == "" ?  '-' : member.email}</span>
      </div>
      <div className="flex">
        <span className="w-24 font-semibold text-gray-600">가입일</span>
        <span className="text-gray-800">{new Date(member.createAt).toLocaleString('ko-KR')}</span>
      </div>
      <div className="flex items-center">
        <span className="w-24 font-semibold text-gray-600">상태</span>
        <span className={`rounded-full py-1 px-4 font-medium ${member.enabled ? 'bg-[#D9F7E5] text-[#4FA969]' : 'bg-[#FFE8EC] text-[#CE1C4C]'}`}>
          {member.enabled ? '사용 중' : '탈퇴'}
        </span>
      </div>
    </div>
  );
}