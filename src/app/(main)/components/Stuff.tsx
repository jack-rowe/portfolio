import { ClockOfClocks } from "@/components/ClockOfClocks";

export const Stuff = () => {
  return (
    <section id="stuff" className="min-h-screen py-20 relative md:px-20">
      <div className="container mx-auto px-4 relative z-10">
        <div className="w-full flex items-center justify-between flex-col gap-4 mb-4 sm:mb-12 sm:flex-row">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Stuff.
          </h2>
        </div>

        <ClockOfClocks />
      </div>
    </section>
  );
};
