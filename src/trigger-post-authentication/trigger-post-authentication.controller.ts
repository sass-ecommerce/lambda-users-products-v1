import { PostAuthenticationTriggerEvent } from 'aws-lambda';
import axios from 'axios';

const isNativeUsername = (username: string, email: string): boolean =>
  username.toLowerCase() === email.toLowerCase();

interface CognitoTriggerResponseBody {
  code: number;
  message: string;
  data: {
    id: string;
    sub: string | null;
    email: string;
    firstName: string | null;
    lastName: string | null;
    isActive: boolean;
  };
}

const syncUserWithBackend = async (event: PostAuthenticationTriggerEvent): Promise<void> => {
  try {
    const response = await axios.post<CognitoTriggerResponseBody>(
      `${process.env.BACKEND_URL}/api/users/cognito-trigger`,
      event,
    );

    console.log(
      'Post authentication sync forwarded successfully for user:',
      event.userName,
      response.data,
    );
  } catch (error) {
    // Non-blocking: this runs on every login, so a backend hiccup must not lock the user out.
    console.error('Error forwarding post authentication sync for user:', event.userName, error);
  }
};

export const postAuthentication = async (
  event: PostAuthenticationTriggerEvent,
): Promise<PostAuthenticationTriggerEvent> => {
  console.log('Post authentication event received:', event);
  const { email, 'custom:id': dbId } = event.request.userAttributes;
  const isFederatedUser = Boolean(email) && !isNativeUsername(event.userName, email);

  if (isFederatedUser && !dbId) {
    await syncUserWithBackend(event);
  }

  return event;
};
