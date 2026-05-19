import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getProject, PORTFOLIO_PROJECTS } from "../_data";
import { ImageGallery } from "../_components/ImageGallery";
import { DEMOS } from "../_demos";

export function generateStaticParams() {
    return PORTFOLIO_PROJECTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const project = getProject(slug);
    if (!project) return { title: "Project not found" };
    return {
        title: `${project.title} — Jack Rowe`,
        description: project.tagline,
    };
}

export default async function ProjectPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const project = getProject(slug);
    if (!project) notFound();

    return (
        <article className="min-h-screen px-6 py-12 md:px-12 md:py-20">
            <div className="max-w-3xl mx-auto">
                <Link
                    href="/#projects"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to projects
                </Link>

                <header className="mt-10 pb-10 border-b border-border/40">
                    <h1 className="font-clash text-5xl md:text-6xl font-bold text-foreground">
                        {project.title}
                    </h1>
                    <p className="mt-4 text-lg text-foreground/70 leading-relaxed">
                        {project.tagline}
                    </p>

                    <div className="mt-6 flex flex-wrap gap-2">
                        {project.tech.map((t) => (
                            <span
                                key={t}
                                className="rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground"
                            >
                                {t}
                            </span>
                        ))}
                    </div>

                    {project.links && project.links.length > 0 && (
                        <div className="mt-6 flex flex-wrap gap-3">
                            {project.links.map((link, i) => (
                                <a
                                    key={link.href}
                                    href={link.href}
                                    target={link.href.startsWith("http") ? "_blank" : undefined}
                                    rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
                                    className={
                                        i === 0
                                            ? "inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
                                            : "inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-card/60 transition-colors"
                                    }
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    {link.label}
                                </a>
                            ))}
                        </div>
                    )}
                </header>

                {project.screenshots && project.screenshots.length > 0 && (
                    <div className="mt-10">
                        <ImageGallery images={project.screenshots} />
                    </div>
                )}

                <div className="mt-14 space-y-14">
                    {project.blog.map((section) => (
                        <section key={section.heading} className="border-l-2 border-primary/40 pl-6">
                            <h2 className="font-clash text-2xl md:text-3xl font-semibold text-foreground">
                                {section.heading}
                            </h2>
                            <p className="mt-4 text-base md:text-lg text-foreground/75 leading-[1.8]">
                                {section.body}
                            </p>
                            {section.images && section.images.length > 0 && (
                                <div className="mt-6">
                                    <ImageGallery images={section.images} />
                                </div>
                            )}
                            {section.demoId && DEMOS[section.demoId] && (() => {
                                const Demo = DEMOS[section.demoId];
                                return <Demo />;
                            })()}
                        </section>
                    ))}
                </div>
            </div>
        </article>
    );
}
