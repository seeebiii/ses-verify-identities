import * as cdk from 'aws-cdk-lib';
import { RemovalPolicy } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { VerifySesEmailAddress } from '../src';

describe('verify-ses-email-address', () => {

  test('ensure custom resource exists to verify email address', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');
    const emailAddress = 'hello@example.org';

    new VerifySesEmailAddress(stack, 'VerifyExampleEmail', {
      emailAddress: emailAddress,
    });

    // Then
    const template = Template.fromStack(stack);
    template.resourceCountIs('Custom::AWS', 1);

    // ensure properties are as expected
    template.hasResourceProperties('Custom::AWS', {
      Create: Match.serializedJson(Match.objectLike({
        service: 'SES',
        action: 'verifyEmailIdentity',
        parameters: {
          EmailAddress: emailAddress,
        },
      })),
      Delete: Match.serializedJson({
        service: 'SES',
        action: 'deleteIdentity',
        parameters: {
          Identity: emailAddress,
        },
      }),
    });
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

    // Then
    const template = Template.fromStack(stack);
    template.resourceCountIs('Custom::AWS', 1);

    // ensure properties are as expected
    template.hasResourceProperties('Custom::AWS', {
      Create: Match.serializedJson(Match.objectLike({
        service: 'SES',
        action: 'verifyEmailIdentity',
        parameters: {
          EmailAddress: emailAddress,
        },
        region,
      })),
      Delete: Match.serializedJson({
        service: 'SES',
        action: 'deleteIdentity',
        parameters: {
          Identity: emailAddress,
        },
        region,
      }),
    });
  });


  test('ensure custom resource is retained if removal policy is set', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');
    const emailAddress = 'hello@example.org';

    new VerifySesEmailAddress(stack, 'VerifyExampleEmail', {
      emailAddress: emailAddress,
      removalPolicy: RemovalPolicy.RETAIN,
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
    });
  });

  test('ensure matches snapshot', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');
    const emailAddress = 'hello@example.org';

    new VerifySesEmailAddress(stack, 'VerifyExampleEmail', {
      emailAddress: emailAddress,
    });

    const template = Template.fromStack(stack);
    expect(template).toMatchSnapshot();
  });

  test('ensure matches snapshot with removal policy', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');
    const emailAddress = 'hello@example.org';

    new VerifySesEmailAddress(stack, 'VerifyExampleEmail', {
      emailAddress: emailAddress,
      removalPolicy: RemovalPolicy.RETAIN,
    });

    const template = Template.fromStack(stack);
    expect(template).toMatchSnapshot();
  });
});
