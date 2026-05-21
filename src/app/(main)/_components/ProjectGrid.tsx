"use client";

import { motion } from "motion/react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

import { PORTFOLIO_PROJECTS } from "../projects/_data";

export function ProjectGrid() {
    return (
        <section
            id="projects"
            className="font-clash relative px-8 py-24 md:py-32 border-t border-border/40"
        >
            <div className="max-w-6xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="mb-12"
                >
                    <h2 className="text-4xl md:text-5xl font-bold text-foreground">
                        Projects
                    </h2>
                    <p className="mt-3 text-muted-foreground text-lg">
                        A few things I&apos;ve built.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {PORTFOLIO_PROJECTS.map((project, i) => (
                        <motion.div
                            key={project.slug}
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-80px" }}
                            transition={{
                                duration: 0.5,
                                ease: "easeOut",
                                delay: i * 0.08,
                            }}
                        >
                            <Link
                                href={`/projects/${project.slug}`}
                                className="group relative flex h-full flex-col justify-between rounded-2xl border border-border/60 bg-card/40 overflow-hidden transition-all duration-200 hover:border-primary/60 hover:bg-card/80 hover:-translate-y-1"
                            >
                                {project.cover && (
                                    <div className="relative w-full aspect-video overflow-hidden">
                                        <Image
                                            src={project.cover}
                                            alt={`${project.title} preview`}
                                            fill
                                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                        />
                                    </div>
                                )}
                                <div className="p-6 flex flex-col flex-1 justify-between">
                                    <div>
                                        <div className="flex items-start justify-between gap-4">
                                            <h3 className="text-2xl font-semibold text-foreground group-hover:text-primary transition-colors">
                                                {project.title}
                                            </h3>
                                            <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                                        </div>
                                        <p className="mt-3 text-muted-foreground leading-relaxed">
                                            {project.tagline}
                                        </p>
                                    </div>
                                    <div className="mt-6 flex flex-wrap gap-2">
                                        {project.tech.slice(0, 4).map((t) => (
                                            <span
                                                key={t}
                                                className="rounded-full border border-border/60 px-2.5 py-0.5 text-xs text-muted-foreground"
                                            >
                                                {t}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
