import { ClockOfClocks } from "@/components/ClockOfClocks";
import { StuffDescriptionWrapper } from "@/components/StuffDescriptionWrapper";
// import { ArrowRight } from "lucide-react";

export const Stuff = () => {
  return (
    <section id="stuff" className="min-h-screen py-20 relative md:px-20">
      <div className="container mx-auto px-4 relative z-10 ">
        <div className="w-full flex items-center justify-between flex-col gap-4 mb-4 sm:mb-12 sm:flex-row">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Stuff.
          </h2>
        </div>
        <div className="flex flex-col gap-8 items-center">
          <StuffDescriptionWrapper
            title="Clock of Clocks"
            description='A digital clock display made entirely of "analog clock" faces. Each segment of every digit is formed by a small clock with its hands positioned to create lines and corners, dynamically updating every second.'
          >
            <div className="flex flex-col gap-8">
              <ClockOfClocks />
              <ClockOfClocks filled />
            </div>
          </StuffDescriptionWrapper>

          {/* View more link - to /stuff */}
          {/* <a
            href="/stuff"
            className="flex w-fit items-center gap-2 bg-emerald-400/10 text-emerald-400 px-6 py-3 rounded-lg hover:bg-emerald-400/20 transition-all"
          >
            View More
            <ArrowRight size={18} />
          </a> */}
        </div>
      </div>
    </section>
  );
};
