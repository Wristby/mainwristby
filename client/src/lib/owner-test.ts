import { it as vitestIt } from "vitest";
import { runWithOwner } from "../../../server/tenant";

const TEST_OWNER_ID = "owner-a";
type TestBody = (...args: any[]) => unknown;

export const ownerIt = Object.assign(
  (name: string, body: TestBody, timeout?: number) =>
    vitestIt(name, async (...args: any[]) => {
      await runWithOwner(TEST_OWNER_ID, async () => { await body(...args); });
    }, timeout),
  {
    each: (cases: any[]) => (name: string, body: TestBody, timeout?: number) =>
      vitestIt.each(cases)(name, async (...args: any[]) => {
        await runWithOwner(TEST_OWNER_ID, async () => { await body(...args); });
      }, timeout),
  },
) as typeof vitestIt;
