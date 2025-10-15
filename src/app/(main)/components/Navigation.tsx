import { useEffect, useState } from "react";

export const Navigation = () => {
  const [activeSection, setActiveSection] = useState("home");

  const SECTIONS = ["home", "resume", "stuff"];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (!entry.target.id) return;
            setActiveSection(entry.target.id.toLowerCase());
          }
        });
      },
      {
        rootMargin: "-20% 0px -20% 0px",
        threshold: 0.1,
      }
    );

    const sections = document.querySelectorAll("section");
    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex md:hidden gap-4 backdrop-blur-lg bg-white/10 p-1 rounded-full border border-white/10">
        {SECTIONS.map((section) => (
          <a
            key={section}
            href={`#${section}`}
            className={`px-4 py-2 rounded-full text-sm transition-all ${
              activeSection === section
                ? "bg-emerald-400/20 text-emerald-400"
                : "text-gray-400 hover:bg-white/10"
            }`}
            onClick={(e) => {
              e.preventDefault();
              const target = document.getElementById(section);
              if (target) {
                target.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
                window.history.pushState(null, "", `#${section}`);
              }
            }}
          >
            <span className="capitalize">{section}</span>
          </a>
        ))}
      </div>

      <div className="fixed right-4 top-1/2 -translate-y-1/2 z-50 md:flex flex-col gap-4 hidden ">
        {SECTIONS.map((section) => (
          <a
            key={section}
            href={`#${section}`}
            className={`p-3 rounded-full transition-all flex items-center justify-center ${
              activeSection === section
                ? "bg-emerald-400/20 text-emerald-400"
                : "bg-white/5 hover:bg-white/10 text-gray-400"
            }`}
            onClick={(e) => {
              e.preventDefault();
              const target = document.getElementById(section);
              if (target) {
                target.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
                // Update URL hash without default jump behavior
                window.history.pushState(null, "", `#${section}`);
              }
            }}
          >
            <span className="text-xs capitalize">{section}</span>
          </a>
        ))}
      </div>
    </>
  );
};
