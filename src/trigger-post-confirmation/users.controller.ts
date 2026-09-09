import { PostConfirmationTriggerEvent } from 'aws-lambda';
import { handlePostConfirmation } from './users.service';

export const postConfirmation = async (
  event: PostConfirmationTriggerEvent,
): Promise<PostConfirmationTriggerEvent> => {
  await handlePostConfirmation(event);
  return event;
};
