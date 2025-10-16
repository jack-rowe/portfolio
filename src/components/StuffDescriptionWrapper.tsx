"use client";

import { useState } from "react";
import { Collapsible, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

export function StuffDescriptionWrapper({
  children,
  title,
  description,
}: {
  children: React.ReactNode;
  title?: string;
  description?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const shouldTruncate = description && description.length > 500;

  return (
    <div className="w-full space-y-4">
      {title && (
        <h3 className="text-2xl font-semibold text-emerald-400">{title}</h3>
      )}

      {description && (
        <>
          {shouldTruncate ? (
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
              <p className="text-gray-300 leading-relaxed inline">
                {isOpen ? description : `${description.slice(0, 500)}...`}{" "}
                <CollapsibleTrigger className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-emerald-400 transition-colors">
                  <span>{isOpen ? "See less" : "See more"}</span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </CollapsibleTrigger>
              </p>
            </Collapsible>
          ) : (
            <p className="text-gray-300 leading-relaxed">{description}</p>
          )}
        </>
      )}

      <div className="w-full flex items-center justify-center">{children}</div>
    </div>
  );
}
