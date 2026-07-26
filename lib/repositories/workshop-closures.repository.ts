/**
 * Facade repository for workshop_closures.
 * Supabase when STORAGE_BACKEND=supabase; otherwise in-memory mock.
 */

import { randomUUID } from "crypto";
import { getStorageBackend } from "@/lib/repositories/backend";
import { supabaseWorkshopClosuresRepository } from "@/lib/repositories/supabase/workshop-closures.repository";
import type {
  CreateWorkshopClosureInput,
  UpdateWorkshopClosureInput,
  WorkshopClosure,
} from "@/lib/types/workshop-closure";

const mockClosures = new Map<string, WorkshopClosure>();

function rangesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
): boolean {
  return aStart <= bEnd && aEnd >= bStart;
}

export const workshopClosuresRepository = {
  async listAll(): Promise<WorkshopClosure[]> {
    if (getStorageBackend() === "supabase") {
      return supabaseWorkshopClosuresRepository.listAll();
    }
    return [...mockClosures.values()].sort((a, b) =>
      a.startDate.localeCompare(b.startDate)
    );
  },

  async listOverlapping(from: string, to: string): Promise<WorkshopClosure[]> {
    if (getStorageBackend() === "supabase") {
      return supabaseWorkshopClosuresRepository.listOverlapping(from, to);
    }
    return [...mockClosures.values()]
      .filter((c) => rangesOverlap(c.startDate, c.endDate, from, to))
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
  },

  async findCoveringDate(date: string): Promise<WorkshopClosure | null> {
    if (getStorageBackend() === "supabase") {
      return supabaseWorkshopClosuresRepository.findCoveringDate(date);
    }
    return (
      [...mockClosures.values()].find(
        (c) => c.startDate <= date && c.endDate >= date
      ) ?? null
    );
  },

  async create(input: CreateWorkshopClosureInput): Promise<WorkshopClosure> {
    if (getStorageBackend() === "supabase") {
      return supabaseWorkshopClosuresRepository.create(input);
    }
    const now = new Date().toISOString();
    const closure: WorkshopClosure = {
      id: randomUUID(),
      startDate: input.startDate,
      endDate: input.endDate,
      reason: input.reason?.trim() || null,
      createdAt: now,
      updatedAt: now,
    };
    mockClosures.set(closure.id, closure);
    return closure;
  },

  async update(
    id: string,
    input: UpdateWorkshopClosureInput
  ): Promise<WorkshopClosure | null> {
    if (getStorageBackend() === "supabase") {
      return supabaseWorkshopClosuresRepository.update(id, input);
    }
    const existing = mockClosures.get(id);
    if (!existing) return null;
    const updated: WorkshopClosure = {
      ...existing,
      startDate: input.startDate ?? existing.startDate,
      endDate: input.endDate ?? existing.endDate,
      reason:
        input.reason !== undefined
          ? input.reason?.trim() || null
          : existing.reason,
      updatedAt: new Date().toISOString(),
    };
    mockClosures.set(id, updated);
    return updated;
  },

  async deleteById(id: string): Promise<boolean> {
    if (getStorageBackend() === "supabase") {
      return supabaseWorkshopClosuresRepository.deleteById(id);
    }
    return mockClosures.delete(id);
  },

  /** Test helper — clear mock store. */
  __clearMock(): void {
    mockClosures.clear();
  },
};
