import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MonthlyGoalProgress } from "./monthly-goal-progress";
import { Progress } from "./ui/progress";

describe("dashboard goal gradient", () => {
  it.each([0, 1, 25, 50, 75, 100])("uses a green gradient at %s percent without moving it off-screen", value => {
    const html = renderToStaticMarkup(<MonthlyGoalProgress value={value}/>);
    expect(html).toContain(`width:${value}%`);
    expect(html).toContain("linear-gradient(to right, #6ee7b7, #059669)");
    expect(html).not.toContain("translate");
    expect(html).not.toContain("amber");
    expect(html).toContain(`aria-valuenow="${value}"`);
  });
  it.each([[-20, 0], [180, 100], [NaN, 0], [Infinity, 0]])("keeps invalid or out-of-range fill %s within the track", (value, expected) => {
    expect(renderToStaticMarkup(<MonthlyGoalProgress value={value}/>)).toContain(`width:${expected}%`);
  });
  it("does not restyle shared progress bars elsewhere", () => {
    const html = renderToStaticMarkup(<Progress value={50}/>);
    expect(html).toContain("translateX(-50%)");
    expect(html).not.toContain("linear-gradient");
  });
});
