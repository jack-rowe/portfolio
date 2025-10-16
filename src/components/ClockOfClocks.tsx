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
// Each entry is [character, binary corners: 0b(TL)(TR)(BL)(BR)]
type DigitCell = [string, number];
const numberMap: Record<TDigit, DigitCell[]> = {
  "0": [
    ["┌", 0b1000],
    ["─", 0b1100],
    ["─", 0b1100],
    ["┐", 0b0100],
    ["│", 0b1010],
    ["┌", 0b0111],
    ["┐", 0b1011],
    ["│", 0b0101],
    ["│", 0b1010],
    ["│", 0b0101],
    ["│", 0b1010],
    ["│", 0b0101],
    ["│", 0b1010],
    ["│", 0b0101],
    ["│", 0b1010],
    ["│", 0b0101],
    ["│", 0b1010],
    ["└", 0b1101],
    ["┘", 0b1110],
    ["│", 0b0101],
    ["└", 0b0010],
    ["─", 0b0011],
    ["─", 0b0011],
    ["┘", 0b0001],
  ],
  "1": [
    [" ", 0b0000],
    ["┌", 0b1000],
    ["─", 0b1100],
    ["┐", 0b0100],
    [" ", 0b0000],
    ["└", 0b0010],
    ["┐", 0b1011],
    ["│", 0b0101],
    [" ", 0b0000],
    [" ", 0b0000],
    ["│", 0b1010],
    ["│", 0b0101],
    [" ", 0b0000],
    [" ", 0b0000],
    ["│", 0b1010],
    ["│", 0b0101],
    [" ", 0b0000],
    [" ", 0b0000],
    ["│", 0b1010],
    ["│", 0b0101],
    [" ", 0b0000],
    [" ", 0b0000],
    ["└", 0b0010],
    ["┘", 0b0001],
  ],
  "2": [
    ["┌", 0b1000],
    ["─", 0b1100],
    ["─", 0b1100],
    ["┐", 0b0100],
    ["└", 0b0010],
    ["─", 0b0011],
    ["┐", 0b1011],
    ["│", 0b0101],
    ["┌", 0b1000],
    ["─", 0b1100],
    ["┘", 0b1110],
    ["│", 0b0101],
    ["│", 0b1010],
    ["┌", 0b0111],
    ["─", 0b0011],
    ["┘", 0b0001],
    ["│", 0b1010],
    ["└", 0b1101],
    ["─", 0b1100],
    ["┐", 0b0100],
    ["└", 0b0010],
    ["─", 0b0011],
    ["─", 0b0011],
    ["┘", 0b0001],
  ],
  "3": [
    ["┌", 0b1000],
    ["─", 0b1100],
    ["─", 0b1100],
    ["┐", 0b0100],
    ["└", 0b0010],
    ["─", 0b0011],
    ["┐", 0b1011],
    ["│", 0b0101],
    ["┌", 0b1000],
    ["─", 0b1100],
    ["┘", 0b1110],
    ["│", 0b0101],
    ["└", 0b0010],
    ["─", 0b0011],
    ["┐", 0b1011],
    ["│", 0b0101],
    ["┌", 0b1000],
    ["─", 0b1100],
    ["┘", 0b1110],
    ["│", 0b0101],
    ["└", 0b0010],
    ["─", 0b0011],
    ["─", 0b0011],
    ["┘", 0b0001],
  ],
  "4": [
    ["┌", 0b1000],
    ["┐", 0b0100],
    ["┌", 0b1000],
    ["┐", 0b0100],
    ["│", 0b1010],
    ["│", 0b0101],
    ["│", 0b1010],
    ["│", 0b0101],
    ["│", 0b1010],
    ["└", 0b1101],
    ["┘", 0b1110],
    ["│", 0b0101],
    ["└", 0b0010],
    ["─", 0b0011],
    ["┐", 0b1011],
    ["│", 0b0101],
    [" ", 0b0000],
    [" ", 0b0000],
    ["│", 0b1010],
    ["│", 0b0101],
    [" ", 0b0000],
    [" ", 0b0000],
    ["└", 0b0010],
    ["┘", 0b0001],
  ],
  "5": [
    ["┌", 0b1000],
    ["─", 0b1100],
    ["─", 0b1100],
    ["┐", 0b0100],
    ["│", 0b1010],
    ["┌", 0b0111],
    ["─", 0b0011],
    ["┘", 0b0001],
    ["│", 0b1010],
    ["└", 0b1101],
    ["─", 0b1100],
    ["┐", 0b0100],
    ["└", 0b0010],
    ["─", 0b0011],
    ["┐", 0b1011],
    ["│", 0b0101],
    ["┌", 0b1000],
    ["─", 0b1100],
    ["┘", 0b1110],
    ["│", 0b0101],
    ["└", 0b0010],
    ["─", 0b0011],
    ["─", 0b0011],
    ["┘", 0b0001],
  ],
  "6": [
    ["┌", 0b1000],
    ["─", 0b1100],
    ["─", 0b1100],
    ["┐", 0b0100],
    ["│", 0b1010],
    ["┌", 0b0111],
    ["─", 0b0011],
    ["┘", 0b0001],
    ["│", 0b1010],
    ["└", 0b1101],
    ["─", 0b1100],
    ["┐", 0b0100],
    ["│", 0b1010],
    ["┌", 0b0111],
    ["┐", 0b1011],
    ["│", 0b0101],
    ["│", 0b1010],
    ["└", 0b1101],
    ["┘", 0b1110],
    ["│", 0b0101],
    ["└", 0b0010],
    ["─", 0b0011],
    ["─", 0b0011],
    ["┘", 0b0001],
  ],
  "7": [
    ["┌", 0b1000],
    ["─", 0b1100],
    ["─", 0b1100],
    ["┐", 0b0100],
    ["└", 0b0010],
    ["─", 0b0011],
    ["┐", 0b1011],
    ["│", 0b0101],
    [" ", 0b0000],
    [" ", 0b0000],
    ["│", 0b1010],
    ["│", 0b0101],
    [" ", 0b0000],
    [" ", 0b0000],
    ["│", 0b1010],
    ["│", 0b0101],
    [" ", 0b0000],
    [" ", 0b0000],
    ["│", 0b1010],
    ["│", 0b0101],
    [" ", 0b0000],
    [" ", 0b0000],
    ["└", 0b0010],
    ["┘", 0b0001],
  ],
  "8": [
    ["┌", 0b1000],
    ["─", 0b1100],
    ["─", 0b1100],
    ["┐", 0b0100],
    ["│", 0b1010],
    ["┌", 0b0111],
    ["┐", 0b1011],
    ["│", 0b0101],
    ["│", 0b1010],
    ["└", 0b1101],
    ["┘", 0b1110],
    ["│", 0b0101],
    ["│", 0b1010],
    ["┌", 0b0111],
    ["┐", 0b1011],
    ["│", 0b0101],
    ["│", 0b1010],
    ["└", 0b1101],
    ["┘", 0b1110],
    ["│", 0b0101],
    ["└", 0b0010],
    ["─", 0b0011],
    ["─", 0b0011],
    ["┘", 0b0001],
  ],
  "9": [
    ["┌", 0b1000],
    ["─", 0b1100],
    ["─", 0b1100],
    ["┐", 0b0100],
    ["│", 0b1010],
    ["┌", 0b0111],
    ["┐", 0b1011],
    ["│", 0b0101],
    ["│", 0b1010],
    ["└", 0b1101],
    ["┘", 0b1110],
    ["│", 0b0101],
    ["└", 0b0010],
    ["─", 0b0011],
    ["┐", 0b1011],
    ["│", 0b0101],
    [" ", 0b0000],
    [" ", 0b0000],
    ["│", 0b1010],
    ["│", 0b0101],
    [" ", 0b0000],
    [" ", 0b0000],
    ["└", 0b0010],
    ["┘", 0b0001],
  ],
};

export const ClockOfClocks = ({ filled }: { filled?: boolean }) => {
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
        {pattern.map(([char, bin], index) => {
          const [hourAngle, minuteAngle] = angleMap[char];
          return (
            <Clock
              key={index}
              hourAngle={hourAngle}
              minuteAngle={minuteAngle}
              bin={filled ? bin : 0b0000}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex items-center justify-center gap-[2vw] w-full">
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
  bin,
}: {
  hourAngle: number;
  minuteAngle: number;
  bin: number;
}) => {
  return (
    <div
      className="relative aspect-square md:border-1 lg:border-2 border-gray-700 overflow-hidden"
      style={{ width: "clamp(8px, 2vw, 48px)" }}
    >
      <div className="grid grid-cols-2 grid-rows-2 w-full h-full absolute top-0 left-0">
        <motion.div
          className="bg-emerald-300"
          initial={{ opacity: 0 }}
          animate={{ opacity: Boolean(bin & 0b0001) ? 1 : 0 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 25,
            mass: 0.8,
          }}
        />
        <motion.div
          className="bg-emerald-300"
          initial={{ opacity: 0 }}
          animate={{ opacity: Boolean(bin & 0b0010) ? 1 : 0 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 25,
            mass: 0.8,
          }}
        />
        <motion.div
          className="bg-emerald-300"
          initial={{ opacity: 0 }}
          animate={{ opacity: Boolean(bin & 0b0100) ? 1 : 0 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 25,
            mass: 0.8,
          }}
        />
        <motion.div
          className="bg-emerald-300"
          initial={{ opacity: 0 }}
          animate={{ opacity: Boolean(bin & 0b1000) ? 1 : 0 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 25,
            mass: 0.8,
          }}
        />
      </div>
      <motion.div
        className="h-0.5 lg:h-1 w-full bg-emerald-300 absolute top-1/2 left-1/2 -translate-y-1/2"
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
        className="h-0.5 lg:h-1 w-full bg-emerald-300 absolute top-1/2 left-1/2 -translate-y-1/2"
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
