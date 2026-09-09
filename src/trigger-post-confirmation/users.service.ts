import { PostConfirmationTriggerEvent } from 'aws-lambda';
import axios from 'axios';

export const handlePostConfirmation = async (event: PostConfirmationTriggerEvent): Promise<void> => {
  const { triggerSource, userPoolId, userName, request } = event;
  const { userAttributes } = request;

  try {
    const response = await axios.post(`${process.env.BACKEND_URL}/api/users/cognito-trigger`, {
      triggerSource,
      userPoolId,
      userName,
      request: {
        userAttributes: {
          sub: userAttributes.sub,
          email: userAttributes.email,
          name: userAttributes.name,
        },
      },
    });

    console.log('Post confirmation forwarded successfully for user:', userName, response.data);
  } catch (error) {
    console.error('Error forwarding post confirmation for user:', userName, error);
    throw error;
  }
};
