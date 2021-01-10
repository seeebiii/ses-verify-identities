import { Construct } from '@aws-cdk/core';
import { AwsCustomResource, PhysicalResourceId } from '@aws-cdk/custom-resources';
import { generateSesPolicyForCustomResource } from './helper';

export interface VerifySesEmailAddressProps {
  /**
   * The email address to be verified.
   */
  emailAddress: string;
}

/**
 * A construct to verify an SES email address identity. It initiates a verification so that SES sends a verification email to the desired email address. This means the owner of the email address still needs to act by clicking the link in the verification email.
 *
 * @example
 *
 * new VerifySesEmailAddress(this, 'SesEmailVerification', {
 *   emailAddress: 'hello@example.org'
 * })
 */
export class VerifySesEmailAddress extends Construct {
  constructor(parent: Construct, name: string, props: VerifySesEmailAddressProps) {
    super(parent, name);

    const emailAddress = props.emailAddress;

    new AwsCustomResource(this, 'VerifyEmailIdentity' + emailAddress, {
      onCreate: {
        service: 'SES',
        action: 'verifyEmailIdentity',
        parameters: {
          EmailAddress: emailAddress
        },
        physicalResourceId: PhysicalResourceId.of('verify-' + emailAddress)
      },
      onDelete: {
        service: 'SES',
        action: 'deleteIdentity',
        parameters: {
          Identity: emailAddress
        }
      },
      policy: generateSesPolicyForCustomResource('VerifyEmailIdentity')
    });
  }
}
