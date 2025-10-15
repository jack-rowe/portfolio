"use client";

import { motion } from "motion/react";
import { useState, useEffect } from "react";
type TDigit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";
const angleMap: Record<string, [number, number]> = {
  //unicode box-drawing characters for clock faces to make lines and right angles
  "┌": [0, 90], // top-left corner: hour at 9, minute at 12
  "┐": [90, 180], // top-right corner: hour at 12, minute at 3
  "┘": [180, 270], // bottom-right corner: hour at 3, minute at 6
  "└": [0, 270], // bottom-left corner: hour at 6, minute at 9
  "─": [0, 180], // horizontal line: hour at 9, minute at 3
  "│": [90, 270], // vertical line: hour at 12, minute at 6
  " ": [135, 135], // empty: diagonal resting position
};

// draw each digit using a 4x6 grid of angleMap characters
const numberMap: Record<TDigit, string[]> = {
  "0": [
    "┌",
    "─",
    "─",
    "┐",
    "│",
    "┌",
    "┐",
    "│",
    "│",
    "│",
    "│",
    "│",
    "│",
    "│",
    "│",
    "│",
    "│",
    "└",
    "┘",
    "│",
    "└",
    "─",
    "─",
    "┘",
  ],
  "1": [
    " ",
    "┌",
    "─",
    "┐",
    " ",
    "└",
    "┐",
    "│",
    " ",
    " ",
    "│",
    "│",
    " ",
    " ",
    "│",
    "│",
    " ",
    " ",
    "│",
    "│",
    " ",
    " ",
    "└",
    "┘",
  ],
  "2": [
    "┌",
    "─",
    "─",
    "┐",
    "└",
    "─",
    "┐",
    "│",
    "┌",
    "─",
    "┘",
    "│",
    "│",
    "┌",
    "─",
    "┘",
    "│",
    "└",
    "─",
    "┐",
    "└",
    "─",
    "─",
    "┘",
  ],
  "3": [
    "┌",
    "─",
    "─",
    "┐",
    "└",
    "─",
    "┐",
    "│",
    "┌",
    "─",
    "┘",
    "│",
    "└",
    "─",
    "┐",
    "│",
    "┌",
    "─",
    "┘",
    "│",
    "└",
    "─",
    "─",
    "┘",
  ],
  "4": [
    "┌",
    "┐",
    "┌",
    "┐",
    "│",
    "│",
    "│",
    "│",
    "│",
    "└",
    "┘",
    "│",
    "└",
    "─",
    "┐",
    "│",
    " ",
    " ",
    "│",
    "│",
    " ",
    " ",
    "└",
    "┘",
  ],
  "5": [
    "┌",
    "─",
    "─",
    "┐",
    "│",
    "┌",
    "─",
    "┘",
    "│",
    "└",
    "─",
    "┐",
    "└",
    "─",
    "┐",
    "│",
    "┌",
    "─",
    "┘",
    "│",
    "└",
    "─",
    "─",
    "┘",
  ],
  "6": [
    "┌",
    "─",
    "─",
    "┐",
    "│",
    "┌",
    "─",
    "┘",
    "│",
    "└",
    "─",
    "┐",
    "│",
    "┌",
    "┐",
    "│",
    "│",
    "└",
    "┘",
    "│",
    "└",
    "─",
    "─",
    "┘",
  ],
  "7": [
    "┌",
    "─",
    "─",
    "┐",
    "└",
    "─",
    "┐",
    "│",
    " ",
    " ",
    "│",
    "│",
    " ",
    " ",
    "│",
    "│",
    " ",
    " ",
    "│",
    "│",
    " ",
    " ",
    "└",
    "┘",
  ],
  "8": [
    "┌",
    "─",
    "─",
    "┐",
    "│",
    "┌",
    "┐",
    "│",
    "│",
    "└",
    "┘",
    "│",
    "│",
    "┌",
    "┐",
    "│",
    "│",
    "└",
    "┘",
    "│",
    "└",
    "─",
    "─",
    "┘",
  ],
  "9": [
    "┌",
    "─",
    "─",
    "┐",
    "│",
    "┌",
    "┐",
    "│",
    "│",
    "└",
    "┘",
    "│",
    "└",
    "─",
    "┐",
    "│",
    " ",
    " ",
    "│",
    "│",
    " ",
    " ",
    "└",
    "┘",
  ],
};

export const ClockOfClocks = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const hours = String(currentTime.getHours() % 12 || 12).padStart(2, "0");
  const minutes = String(currentTime.getMinutes()).padStart(2, "0");
  const seconds = String(currentTime.getSeconds()).padStart(2, "0");

  // Function to render a single digit
  const renderDigit = (digit: string) => {
    const pattern = numberMap[digit as TDigit] || numberMap["0"];
    return (
      <div className="grid grid-cols-4 grid-rows-6 gap-[0.2vw]">
        {pattern.map((char, index) => {
          const [hourAngle, minuteAngle] = angleMap[char];
          return (
            <Clock
              key={index}
              hourAngle={hourAngle}
              minuteAngle={minuteAngle}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex items-center justify-center gap-[2vw] w-full max-w-[90vw]">
      <div className="flex gap-[0.4vw]">
        {renderDigit(hours[0])}
        {renderDigit(hours[1])}
      </div>
      <div className="flex gap-[0.4vw]">
        {renderDigit(minutes[0])}
        {renderDigit(minutes[1])}
      </div>
      <div className="flex gap-[0.4vw]">
        {renderDigit(seconds[0])}
        {renderDigit(seconds[1])}
      </div>
    </div>
  );
};

const Clock = ({
  hourAngle,
  minuteAngle,
}: {
  hourAngle: number;
  minuteAngle: number;
}) => {
  return (
    <div
      className="relative aspect-square border-2 border-gray-700"
      style={{ width: "clamp(8px, 2vw, 48px)" }}
    >
      <motion.div
        className="h-0.5 lg:h-1 w-1/2 bg-emerald-300 absolute top-1/2 left-1/2 -translate-y-1/2"
        style={{
          transformOrigin: "center left",
          transform: `rotate(${hourAngle}deg)`,
        }}
        //animate the rotation
        animate={{ rotate: hourAngle }}
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 25,
          mass: 0.8,
        }}
      ></motion.div>
      <motion.div
        className="h-0.5 lg:h-1 w-1/2 bg-emerald-300 absolute top-1/2 left-1/2 -translate-y-1/2"
        style={{
          transformOrigin: "center left",
          transform: `rotate(${minuteAngle}deg)`,
        }}
        animate={{ rotate: minuteAngle }}
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 25,
          mass: 0.8,
        }}
      ></motion.div>
    </div>
  );
};
