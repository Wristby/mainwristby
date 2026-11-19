import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement, ReactNode } from "react";

const harness = vi.hoisted(() => ({
  states: [] as unknown[],
  index: 0,
  brands: ["Rolex", "Omega", "Cartier"],
  collection: [] as any[],
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
  usePersonalCollection: () => ({ data: harness.collection, isLoading: false, isError: false, refetch: vi.fn() }),
  usePersonalCollectionWatch: () => ({ data: null, isLoading: false, isError: false }),
  useCreatePersonalCollectionWatch: () => ({ isPending: false, isSuccess: false, mutateAsync: vi.fn() }),
  useUpdatePersonalCollectionWatch: () => ({ isPending: false, isSuccess: false, mutateAsync: vi.fn() }),
  usePersonalCollectionValuations: () => ({ data: [] }),
  useCreatePersonalCollectionValuation: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useUpdatePersonalCollectionValuation: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useDeletePersonalCollectionWatch: () => ({ isPending: false, mutateAsync: vi.fn() }),
}));

import PersonalCollection, { PersonalCollectionFormPage } from "./personal-collection";

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
    harness.collection = [];
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
    expect(text(tree)).not.toContain("Sub-model");
    expect(text(tree)).not.toContain("Condition grade");

    const conditionSelect = nodes(tree).find((node) =>
      node.type === "select" &&
      nodes(node).some((option) => option.type === "option" && (option.props.value ?? option.props.children) === "Not graded"),
    );
    expect(conditionSelect).toBeDefined();
    expect(nodes(conditionSelect).filter((option) => option.type === "option").map((option) => option.props.value ?? option.props.children))
      .toEqual(["Not graded", "Mint", "Excellent", "Very Good", "Good", "Fair", "Poor"]);
  });

  it("shows total investment from purchase prices and intake fees, not current estimates", () => {
    harness.collection = [{
      id: 1,
      manufacturer: "Rolex",
      model: "Submariner",
      referenceNumber: "126610LN",
      purchasePrice: 200_000,
      estimatedValue: 500_000,
      intakeFees: [{ label: "Service", amount: 15_000 }],
    }];

    const tree = PersonalCollection();
    const investmentCard = nodes(tree).find((node) =>
      node.type === "div" &&
      node.props.className === "pc-stat" &&
      text(node).includes("TOTAL INVESTMENT"),
    );
    const content = text(investmentCard ?? null);

    expect(investmentCard).toBeDefined();
    expect(content).not.toContain("Recorded purchase price + fees");
    expect(content).toContain("2.150,00\u00a0€");
    expect(content).not.toContain("5.000,00\u00a0€");
  });
});
