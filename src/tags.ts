// Celo mainnet attribution (ERC-8021 calldata suffix) for Agents Open for Business.
// Issued on the Loops House event page for Samudra Scout's solo entry.
// Untagged transactions are never credited, and there is no backfill.
import { toDataSuffix, withAttribution } from "@celo/attribution-tags";

export const ATTRIBUTION_CODE = "celo_b60bab126a06" as const;
export const ATTRIBUTION_SUFFIX = toDataSuffix(ATTRIBUTION_CODE);
export { withAttribution };
