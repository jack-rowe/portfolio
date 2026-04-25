"use client";

import { Mail } from "lucide-react";

export default function PortfolioPage() {
  return (
    <div className="font-clash relative min-h-screen flex items-center justify-center px-8">
      <div className="max-w-6xl w-full">
        {/* Main Name Display */}
        <div className="mb-12">
          <h1 className=" text-7xl md:text-8xl lg:text-9xl font-bold">
            <span className="block text-primary">JACK</span>
            <span className="block text-foreground mt-2">ROWE</span>
          </h1>
          <div className="mt-6 text-xl md:text-2xl text-muted-foreground font-light tracking-wide">
            Full Stack Developer
          </div>
        </div>

        {/* Social Links */}
        <div className="flex gap-6 items-center">
          <a
            href="https://github.com/jack-rowe"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors duration-200"
          >
            <svg width="24" height="24" viewBox="0 0 98 96" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 transition-colors duration-200">
              <path d="M41.4395 69.3848C28.8066 67.8535 19.9062 58.7617 19.9062 46.9902C19.9062 42.2051 21.6289 37.0371 24.5 33.5918C23.2559 30.4336 23.4473 23.7344 24.8828 20.959C28.7109 20.4805 33.8789 22.4902 36.9414 25.2656C40.5781 24.1172 44.4062 23.543 49.0957 23.543C53.7852 23.543 57.6133 24.1172 61.0586 25.1699C64.0254 22.4902 69.2891 20.4805 73.1172 20.959C74.457 23.543 74.6484 30.2422 73.4043 33.4961C76.4668 37.1328 78.0937 42.0137 78.0937 46.9902C78.0937 58.7617 69.1934 67.6621 56.3691 69.2891C59.623 71.3945 61.8242 75.9883 61.8242 81.252L61.8242 91.2051C61.8242 94.0762 64.2168 95.7031 67.0879 94.5547C84.4102 87.9512 98 70.6289 98 49.1914C98 22.1074 75.9883 6.69539e-07 48.9043 4.309e-07C21.8203 1.92261e-07 -1.9479e-07 22.1074 -4.3343e-07 49.1914C-6.20631e-07 70.4375 13.4941 88.0469 31.6777 94.6504C34.2617 95.6074 36.75 93.8848 36.75 91.3008L36.75 83.6445C35.4102 84.2188 33.6875 84.6016 32.1562 84.6016C25.8398 84.6016 22.1074 81.1563 19.4277 74.7441C18.375 72.1602 17.2266 70.6289 15.0254 70.3418C13.877 70.2461 13.4941 69.7676 13.4941 69.1934C13.4941 68.0449 15.4082 67.1836 17.3223 67.1836C20.0977 67.1836 22.4902 68.9063 24.9785 72.4473C26.8926 75.2227 28.9023 76.4668 31.2949 76.4668C33.6875 76.4668 35.2187 75.6055 37.4199 73.4043C39.0469 71.7773 40.291 70.3418 41.4395 69.3848Z" />
            </svg>
            <span className="text-sm font-medium">GitHub</span>
          </a>

          <a
            href="https://linkedin.com/in/jackjrowe"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors duration-200"
          >
            <svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" width="24" height="24" className="flex-shrink-0 transition-colors duration-200">
              <path d="M41,4H9C6.24,4,4,6.24,4,9v32c0,2.76,2.24,5,5,5h32c2.76,0,5-2.24,5-5V9C46,6.24,43.76,4,41,4z M17,20v19h-6V20H17z M11,14.47c0-1.4,1.2-2.47,3-2.47s2.93,1.07,3,2.47c0,1.4-1.12,2.53-3,2.53C12.2,17,11,15.87,11,14.47z M39,39h-6c0,0,0-9.26,0-10 c0-2-1-4-3.5-4.04h-0.08C27,24.96,26,27.02,26,29c0,0.91,0,10,0,10h-6V20h6v2.56c0,0,1.93-2.56,5.81-2.56 c3.97,0,7.19,2.73,7.19,8.26V39z" />
            </svg>
            <span className="text-sm font-medium">LinkedIn</span>
          </a>

          <a
            href="mailto:rowejackj@gmail.com"
            className="group flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors duration-200"
          >
            <Mail className="w-6 h-6 flex-shrink-0 transition-colors duration-200" />
            <span className="text-sm font-medium">Email</span>
          </a>
        </div>
      </div>
    </div>
  );
}
