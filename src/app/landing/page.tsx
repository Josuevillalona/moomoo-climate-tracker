"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();

  const handleClick = () => {
    router.push('/dashboard');
  };

  return (
    <div 
      className="w-screen h-screen relative overflow-hidden cursor-pointer"
      onClick={handleClick}
    >
      <Image
        src="/moomoo-climate-cow.gif"
        alt="Moo Climate Cow Animation"
        fill
        className="object-cover"
        unoptimized
        priority
      />
    </div>
  );
}
