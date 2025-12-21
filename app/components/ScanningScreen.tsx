import React from 'react';

import { X } from 'lucide-react';

const ScanningScreen = () => {

  return (

    <div className="flex items-center justify-center min-h-screen bg-gray-200 p-4">

      {/* Mobile Frame Simulation */}

      <div className="relative w-[340px] h-[680px] bg-[#F8F8F8] rounded-[45px] shadow-2xl overflow-hidden border-[7px] border-black flex flex-col font-sans">

        

        {/* Header: Time & Settings */}

        <div className="flex justify-between items-start p-8 pt-12">

          <div className="flex flex-col leading-tight">

            <span className="text-[#E34141] font-bold text-sm">12:00</span>

            <span className="text-[#E34141] text-[11px] opacity-90">Jean Pierre</span>

          </div>

          <button className="bg-[#E34141] text-white text-[10px] px-4 py-1.5 rounded-full font-medium active:scale-95 transition-transform">

            Test settings

          </button>

        </div>

        {/* Main Scanning Section */}

        <div className="flex-1 flex flex-col items-center justify-center -mt-16">

          <h1 className="text-[#E34141] text-2xl font-normal tracking-wide mb-14">Scanning</h1>

          

          <div className="relative flex items-center justify-center">

            {/* Animated Outer Ring (Spinning) */}

            <div className="absolute w-[230px] h-[230px] rounded-full border-[5px] border-[#E34141] border-t-transparent animate-spin duration-[3000ms]"></div>

            

            {/* Static Inner Ring */}

            <div className="w-[220px] h-[220px] rounded-full border-[5px] border-[#E34141] flex items-center justify-center bg-white shadow-inner">

              

              {/* Device Graphic Container */}

              <div className="relative w-32 h-32 bg-[#F0F0F0] rounded-full flex items-center justify-center overflow-hidden">

                {/* The Sensor/Pen */}

                <div className="w-5 h-24 bg-white border border-gray-200 rounded-full rotate-[35deg] flex flex-col items-center py-2 relative shadow-sm">

                    {/* Pulsing LED light */}

                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 absolute top-2 animate-pulse shadow-[0_0_8px_rgba(250,204,21,0.8)]"></div>

                    <div className="w-1.5 h-12 bg-gray-50 rounded-full mt-5"></div>

                </div>

              </div>

            </div>

          </div>

          <div className="mt-10 text-[#E34141] text-3xl font-light tabular-nums">0:00</div>

        </div>

        {/* Bottom Actions & Branding */}

        <div className="pb-10 flex flex-col items-center gap-14">

          {/* Close Button */}

          <button className="w-12 h-12 rounded-full border-[1.5px] border-[#E34141] flex items-center justify-center text-[#E34141] hover:bg-red-50 active:bg-red-100 transition-colors">

            <X size={24} strokeWidth={2} />

          </button>

          {/* Footer Branding */}

          <div className="text-center space-y-0.5 select-none">

            <div className="text-[10px] font-bold tracking-[0.1em] uppercase">

              <span className="text-[#A78BB5]">Functional</span>{' '}

              <span className="text-[#B5C875]">Materials</span>

            </div>

            <div className="text-[10px] font-bold tracking-[0.1em] uppercase flex items-center justify-center gap-1">

               <span className="text-[#E9B65C]">and</span>

               <span className="text-[#E34141]">Microsystems</span>

            </div>

          </div>

        </div>

      </div>

    </div>

  );

};

export default ScanningScreen;

