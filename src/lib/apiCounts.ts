import { apiClient } from "./apiClient";
import { PaginatedResult } from "./types";

// Cheap way to get just the `total` for a filtered search without
// pulling any rows — every search endpoint already returns
// {items, total, limit, skip} (see enumerations/gaps/deliveries
// .service.ts), so limit: 1 keeps the payload tiny. Shared by every
// page that shows a stat-tile ribbon above its table.
export async function countFor(path: string, params: Record<string, unknown> = {}): Promise<number> {
  const result = await apiClient.get<PaginatedResult<unknown>>(path, { ...params, limit: 1 });
  return result.total;
}
