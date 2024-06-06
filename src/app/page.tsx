import { Button } from "@/components/UI/button";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-8 ">
      <section className="text-center mt-[15vh]">
        <h1 className="text-4xl md:text-6xl font-bold">
          {"Hi, I'm Jack Rowe"}
        </h1>
        <p className="mt-4 text-lg md:text-2xl ">
          a software engineer passionate about creating impactful solutions.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/projects">
            <Button className="px-6 py-3 hover:bg-secondary font-semibold rounded-md bg-backgroundAlt text-text transition duration-300">
              View My Projects
            </Button>
          </Link>
          <Link href="/contact">
            <Button className="px-6 py-3 hover:bg-secondary font-semibold rounded-md bg-backgroundAlt text-text transition duration-300">
              Get in Touch
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
}
