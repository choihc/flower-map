import type { SpotInsert, SpotRow, SpotUpdate } from '@/lib/types';
import { buildSpotWriteInput } from '@/lib/data/spots';

import { classifyImport } from './classifyImport';
import type { ImportPayload } from './importSchema';

type ExistingSpot = Pick<SpotRow, 'id' | 'slug'>;

type PlanImportWriteOptions = {
  flowerId: string;
  existingSpots: ExistingSpot[];
};

type PlannedSpotUpdate = {
  id: string;
  input: SpotUpdate;
};

type PlanImportWriteResult = {
  toCreate: SpotInsert[];
  toUpdate: PlannedSpotUpdate[];
  errors: string[];
};

export function planImportWrite(payload: ImportPayload, options: PlanImportWriteOptions): PlanImportWriteResult {
  const incomingSpots = 'spot' in payload ? [payload.spot] : payload.spots;
  const classified = classifyImport(incomingSpots, options.existingSpots);

  if (classified.duplicates.length > 0) {
    return {
      toCreate: [],
      toUpdate: [],
      errors: classified.duplicates.map((duplicate) => `${duplicate.slug} slug is duplicated in the import payload`),
    };
  }

  return {
    toCreate: classified.toCreate.map((spot) => buildImportedSpotInput(spot, options.flowerId)),
    toUpdate: classified.toUpdate.map(({ incoming, existing }) => ({
      id: existing.id,
      input: buildImportedSpotInput(incoming, options.flowerId),
    })),
    errors: [],
  };
}

type ImportedSpotInput = Omit<SpotInsert, 'flower_id'>;

function buildImportedSpotInput(spot: ImportedSpotInput, flowerId: string): SpotInsert {
  return buildSpotWriteInput({
    ...spot,
    flower_id: flowerId,
    source_type: 'manual_json',
  });
}
