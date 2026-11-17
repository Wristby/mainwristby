import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement, ReactNode } from "react";

const harness = vi.hoisted(() => ({
  states: [] as unknown[],
  index: 0,
  brands: ["Rolex", "Omega", "Cartier"],
}));

vi.mock("react", async (importOriginal) => ({
  ...await importOriginal<typeof import("react")>(),
  useState: (initial: unknown) => {
    const index = harness.index++;
    if (!(index in harness.states)) {
      harness.states[index] = typeof initial === "function" ? (initial as () => unknown)() : initial;
    }
    return [harness.states[index], (value: unknown) => { harness.states[index] = value; }];
  },
  useEffect: () => {},
  useMemo: (callback: () => unknown) => callback(),
}));

vi.mock("wouter", () => ({
  Link: "a",
  useLocation: () => ["/personal-collection/new", vi.fn()],
  useParams: () => ({ id: "0" }),
}));

vi.mock("@/hooks/use-settings", () => ({
  useSettings: () => ({ settings: { watch_brands: harness.brands } }),
}));

vi.mock("@/hooks/use-personal-collection", () => ({
  usePersonalCollectionWatch: () => ({ data: null, isLoading: false, isError: false }),
  useCreatePersonalCollectionWatch: () => ({ isPending: false, isSuccess: false, mutateAsync: vi.fn() }),
  useUpdatePersonalCollectionWatch: () => ({ isPending: false, isSuccess: false, mutateAsync: vi.fn() }),
  usePersonalCollectionValuations: () => ({ data: [] }),
  useCreatePersonalCollectionValuation: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useUpdatePersonalCollectionValuation: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useDeletePersonalCollectionWatch: () => ({ isPending: false, mutateAsync: vi.fn() }),
}));

import { PersonalCollectionFormPage } from "./personal-collection";

function nodes(node: ReactNode): ReactElement<any>[] {
  if (Array.isArray(node)) return node.flatMap(nodes);
  if (!node || typeof node !== "object" || !("props" in node)) return [];
  const element = node as ReactElement<any>;
  return [element, ...nodes(element.props.children)];
}

function text(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(text).join(" ");
  if (node && typeof node === "object" && "props" in node) {
    return text((node as ReactElement<any>).props.children);
  }
  return "";
}

describe("personal collection intake", () => {
  beforeEach(() => {
    harness.states = [];
    harness.index = 0;
  });

  it("uses the Settings brand list and omits the wholesale-box checkbox", () => {
    const tree = PersonalCollectionFormPage({ edit: false });
    const brandSelect = nodes(tree).find((node) =>
      node.type === "select" &&
      node.props.className === "pc-select" &&
      nodes(node).some((option) => option.type === "option" && option.props.value === "Rolex"),
    );

    expect(brandSelect).toBeDefined();
    expect(nodes(brandSelect).filter((option) => option.type === "option").map((option) => option.props.value))
      .toEqual(["", ...harness.brands]);
    expect(text(tree)).not.toContain("Box for wholesale");
  });
});
