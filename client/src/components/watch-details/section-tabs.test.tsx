import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { getNextWatchDetailsSectionId, SectionTabs } from "./section-tabs";

const TestIcon = () => <svg aria-hidden="true" />;
const sections = [
  { id: "overview", label: "Overview", icon: TestIcon },
  { id: "watch", label: "Watch details", icon: TestIcon },
  { id: "financials", label: "Financials", icon: TestIcon },
  { id: "sale", label: "Sale & coverage", icon: TestIcon },
  { id: "notes", label: "Notes & tools", icon: TestIcon },
] as const;

describe("Watch Details section tabs", () => {
  it("renders linked accessible tabs and only the selected section content", () => {
    const html = renderToStaticMarkup(
      <SectionTabs selectedSectionId="financials" onChange={() => {}} sections={sections}>
        <p>Financial breakdown</p>
      </SectionTabs>,
    );

    expect(html).toContain('role="tablist"');
    expect(html).toContain('aria-label="Watch record sections"');
    expect(html).toContain('role="tab"');
    expect(html).toContain('aria-selected="true"');
    expect(html).toContain('role="tabpanel"');
    expect(html).toContain("Financial breakdown");
    expect(html.match(/role="tabpanel"/g)).toHaveLength(5);
    expect(html).toContain('hidden=""');
  });

  it("supports wrapping arrow navigation and Home/End keyboard shortcuts", () => {
    const ids = sections.map((section) => section.id);
    expect(getNextWatchDetailsSectionId(ids, "overview", "ArrowLeft")).toBe("notes");
    expect(getNextWatchDetailsSectionId(ids, "notes", "ArrowRight")).toBe("overview");
    expect(getNextWatchDetailsSectionId(ids, "financials", "ArrowRight")).toBe("sale");
    expect(getNextWatchDetailsSectionId(ids, "financials", "Home")).toBe("overview");
    expect(getNextWatchDetailsSectionId(ids, "financials", "End")).toBe("notes");
    expect(getNextWatchDetailsSectionId(ids, "overview", "Enter")).toBeNull();
  });
});
