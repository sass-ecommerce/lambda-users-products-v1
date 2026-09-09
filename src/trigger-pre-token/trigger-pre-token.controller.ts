import { PreTokenGenerationV2TriggerEvent } from 'aws-lambda';

export const preToken = async (
  event: PreTokenGenerationV2TriggerEvent,
): Promise<PreTokenGenerationV2TriggerEvent> => {
  const { 'custom:id': id, 'custom:tenantId': tenantId } = event.request.userAttributes;

  return {
    ...event,
    response: {
      claimsAndScopeOverrideDetails: {
        accessTokenGeneration: {
          claimsToAddOrOverride: { id, tenantId },
        },
      },
    },
  };
};
