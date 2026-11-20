import { useId, useRef, type KeyboardEvent, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export type WatchDetailsSection = {
  id: string;
  label: string;
  icon: LucideIcon;
};

type SectionTabsProps = {
  selectedSectionId: string;
  onChange: (sectionId: string) => void;
  sections: readonly WatchDetailsSection[];
  children?: ReactNode;
};

export function getNextWatchDetailsSectionId(
  sectionIds: readonly string[],
  currentSectionId: string,
  key: string,
): string | null {
  const currentIndex = Math.max(0, sectionIds.indexOf(currentSectionId));
  switch (key) {
    case "ArrowRight":
      return sectionIds[(currentIndex + 1) % sectionIds.length] ?? null;
    case "ArrowLeft":
      return sectionIds[(currentIndex - 1 + sectionIds.length) % sectionIds.length] ?? null;
    case "Home":
      return sectionIds[0] ?? null;
    case "End":
      return sectionIds.at(-1) ?? null;
    default:
      return null;
  }
}

/**
 * Controlled section navigation for the Watch Details record.
 * Pass the active section's content as children to place it in the linked tabpanel.
 */
export function SectionTabs({ selectedSectionId, onChange, sections, children }: SectionTabsProps) {
  const instanceId = useId();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selectedIndex = sections.findIndex((section) => section.id === selectedSectionId);
  const activeIndex = selectedIndex >= 0 ? selectedIndex : 0;
  const activeSection = sections[activeIndex];
  const tabId = (sectionId: string) => `${instanceId}-tab-${sectionId}`;
  const panelId = (sectionId: string) => `${instanceId}-panel-${sectionId}`;

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const nextSectionId = getNextWatchDetailsSectionId(
      sections.map((section) => section.id),
      activeSection.id,
      event.key,
    );
    if (!nextSectionId) return;
    const nextIndex = sections.findIndex((section) => section.id === nextSectionId);
    event.preventDefault();
    onChange(nextSectionId);
    tabRefs.current[nextIndex]?.focus();
  };

  return (
    <div className="min-w-0">
      <div
        role="tablist"
        aria-label="Watch record sections"
        aria-orientation="horizontal"
        onKeyDown={handleKeyDown}
        className="-mx-1 mb-6 flex min-w-0 snap-x snap-mandatory gap-1 overflow-x-auto border-b border-[#d8e2dc] px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {sections.map(({ id, label, icon: Icon }, index) => {
          const isSelected = index === activeIndex;
          return (
            <button
              key={id}
              ref={(element) => {
                tabRefs.current[index] = element;
              }}
              id={tabId(id)}
              type="button"
              role="tab"
              aria-selected={isSelected}
              aria-controls={panelId(id)}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => onChange(id)}
              onFocus={(event) => event.currentTarget.scrollIntoView({ block: "nearest", inline: "nearest" })}
              className={`relative inline-flex min-h-12 shrink-0 snap-start items-center gap-2 border-b-2 px-3 text-sm font-medium transition-colors duration-150 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c89b52] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f2f5f0] ${
                isSelected
                  ? "border-[#173c32] text-[#173c32]"
                  : "border-transparent text-[#64736c] hover:border-[#c5d3ca] hover:text-[#253f35]"
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${isSelected ? "text-[#16715a]" : "text-[#788a80]"}`} aria-hidden={true} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {sections.map((section, index) => (
        <div
          key={section.id}
          role="tabpanel"
          id={panelId(section.id)}
          aria-labelledby={tabId(section.id)}
          tabIndex={index === activeIndex ? 0 : -1}
          hidden={index !== activeIndex}
          className="min-w-0 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-[#c89b52] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f2f5f0]"
        >
          {index === activeIndex ? children : null}
        </div>
      ))}
    </div>
  );
}

export default SectionTabs;
