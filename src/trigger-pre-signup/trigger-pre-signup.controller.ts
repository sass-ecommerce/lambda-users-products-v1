import { PreSignUpTriggerEvent } from 'aws-lambda';
import {
  CognitoIdentityProviderClient,
  ListUsersCommand,
  AdminLinkProviderForUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';

const client = new CognitoIdentityProviderClient({});

const findUserByEmail = async (userPoolId: string, email: string) => {
  const { Users } = await client.send(
    new ListUsersCommand({
      UserPoolId: userPoolId,
      Filter: `email = "${email}"`,
      Limit: 5,
    }),
  );

  return Users ?? [];
};

// Native sign-up sets Username to the email itself (see auth.service.ts's
// SignUpCommand), while federated users get "<ProviderName>_<providerUserId>".
const isNativeUsername = (username: string | undefined, email: string): boolean =>
  username?.toLowerCase() === email.toLowerCase();

const handleExternalProvider = async (
  event: PreSignUpTriggerEvent,
): Promise<PreSignUpTriggerEvent> => {
  console.log('Handling external provider sign-up for event:', event);

  const email = event.request.userAttributes.email;
  if (!email) {
    return event;
  }

  const existingUsers = await findUserByEmail(event.userPoolId, email);
  const nativeUser = existingUsers.find((user) => isNativeUsername(user.Username, email));

  if (nativeUser?.Username) {
    console.log(
      `Linking federated user ${event.userName} to existing native user ${nativeUser.Username} for email=${email}`,
    );

    const separatorIndex = event.userName.indexOf('_');
    const providerName = event.userName.slice(0, separatorIndex);
    const providerAttributeValue = event.userName.slice(separatorIndex + 1);

    await client.send(
      new AdminLinkProviderForUserCommand({
        UserPoolId: event.userPoolId,
        DestinationUser: {
          ProviderName: 'Cognito',
          ProviderAttributeValue: nativeUser.Username,
        },
        SourceUser: {
          ProviderName: providerName,
          ProviderAttributeName: 'Cognito_Subject',
          ProviderAttributeValue: providerAttributeValue,
        },
      }),
    );

    console.log(
      `Linked federated user ${event.userName} to existing native user for email=${email}`,
    );
  }

  event.response.autoConfirmUser = true;
  event.response.autoVerifyEmail = true;

  return event;
};

const handleNativeSignUp = async (event: PreSignUpTriggerEvent): Promise<PreSignUpTriggerEvent> => {
  const email = event.request.userAttributes.email;
  if (!email) {
    return event;
  }

  const existingUsers = await findUserByEmail(event.userPoolId, email);
  const hasFederatedUser = existingUsers.some((user) => !isNativeUsername(user.Username, email));

  if (hasFederatedUser) {
    throw new Error(
      'An account with this email already exists via social sign-in. Please sign in with Google instead.',
    );
  }

  return event;
};

export const preSignUp = async (event: PreSignUpTriggerEvent): Promise<PreSignUpTriggerEvent> => {
  if (event.triggerSource === 'PreSignUp_ExternalProvider') {
    return handleExternalProvider(event);
  }

  if (event.triggerSource === 'PreSignUp_SignUp') {
    return handleNativeSignUp(event);
  }

  return event;
};
