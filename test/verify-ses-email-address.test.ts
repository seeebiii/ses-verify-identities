
import * as cdk from 'aws-cdk-lib';
import { RemovalPolicy } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { VerifySesEmailAddress } from '../src';

test('ensure custom resource exists to verify email address', () => {
  const app = new cdk.App();
  const stack = new cdk.Stack(app, 'TestStack');
  const emailAddress = 'hello@example.org';
  const removalPolicy = RemovalPolicy.DESTROY;

  new VerifySesEmailAddress(stack, 'VerifyExampleEmail', {
    emailAddress: emailAddress,
    removalPolicy,
  });

  // Then
  const template = Template.fromStack(stack);
  template.resourceCountIs('Custom::AWS', 1);

  // ensure create properties are as expected
  template.hasResourceProperties('Custom::AWS', {
    Create: Match.serializedJson(Match.objectLike({
      service: 'SES',
      action: 'verifyEmailIdentity',
      parameters: {
        EmailAddress: emailAddress,
      },
    })),
  },
  );

  // ensure delete properties are as expected
  template.hasResourceProperties('Custom::AWS', {
    Delete: Match.serializedJson({
      service: 'SES',
      action: 'deleteIdentity',
      parameters: {
        Identity: emailAddress,
      },
    }),
  },
  );
});

test('ensure custom resource exists in a custom region to verify email address', () => {
  const app = new cdk.App();
  const stack = new cdk.Stack(app, 'TestStack');
  const emailAddress = 'hello@example.org';
  const region = 'us-east-1';
  const removalPolicy = RemovalPolicy.DESTROY;

  new VerifySesEmailAddress(stack, 'VerifyExampleEmail', {
    emailAddress: emailAddress,
    region,
    removalPolicy,
  });

  // Then
  const template = Template.fromStack(stack);
  template.resourceCountIs('Custom::AWS', 1);

  // ensure create properties are as expected
  template.hasResourceProperties('Custom::AWS', {
    Create: Match.serializedJson(Match.objectLike({
      service: 'SES',
      action: 'verifyEmailIdentity',
      parameters: {
        EmailAddress: emailAddress,
      },
      region,
    })),
  },
  );

  // ensure delete properties are as expected
  template.hasResourceProperties('Custom::AWS', {
    Delete: Match.serializedJson({
      service: 'SES',
      action: 'deleteIdentity',
      parameters: {
        Identity: emailAddress,
      },
      region,
    }),
  },
  );
});
