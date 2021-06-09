import { countResources, encodedJson, expect as expectCDK, haveResourceLike, objectLike } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import { VerifySesEmailAddress } from '../src';

test('ensure custom resource exists to verify email address', () => {
  const app = new cdk.App();
  const stack = new cdk.Stack(app, 'TestStack');
  const emailAddress = 'hello@example.org';

  new VerifySesEmailAddress(stack, 'VerifyExampleEmail', {
    emailAddress: emailAddress,
  });

  expectCDK(stack).to(countResources('Custom::AWS', 1));

  // ensure create properties are as expected
  expectCDK(stack).to(
    haveResourceLike('Custom::AWS', {
      Create: encodedJson(objectLike({
        service: 'SES',
        action: 'verifyEmailIdentity',
        parameters: {
          EmailAddress: emailAddress,
        },
      })),
    }),
  );

  // ensure delete properties are as expected
  expectCDK(stack).to(
    haveResourceLike('Custom::AWS', {
      Delete: encodedJson(objectLike({
        service: 'SES',
        action: 'deleteIdentity',
        parameters: {
          Identity: emailAddress,
        },
      })),
    }),
  );
});

test('ensure custom resource exists in a custom region to verify email address', () => {
  const app = new cdk.App();
  const stack = new cdk.Stack(app, 'TestStack');
  const emailAddress = 'hello@example.org';
  const region = 'us-east-1';

  new VerifySesEmailAddress(stack, 'VerifyExampleEmail', {
    emailAddress: emailAddress,
    region,
  });

  expectCDK(stack).to(countResources('Custom::AWS', 1));

  // ensure create properties are as expected
  expectCDK(stack).to(
    haveResourceLike('Custom::AWS', {
      Create: encodedJson(objectLike({
        service: 'SES',
        action: 'verifyEmailIdentity',
        parameters: {
          EmailAddress: emailAddress,
        },
        region,
      })),
    }),
  );

  // ensure delete properties are as expected
  expectCDK(stack).to(
    haveResourceLike('Custom::AWS', {
      Delete: encodedJson(objectLike({
        service: 'SES',
        action: 'deleteIdentity',
        parameters: {
          Identity: emailAddress,
        },
        region,
      })),
    }),
  );
});
