import React from 'react'
import Lottie from 'lottie-react';
import ani from '../animates/Trail loading.json'

export default function LottieLoading() {
  return (
    <div className="w-[200px]">
    <Lottie animationData={ani} loop={true} />
  </div>
  )
}
