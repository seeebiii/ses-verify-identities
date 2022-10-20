import { RemovalPolicy } from 'aws-cdk-lib';
import { AwsCustomResource, PhysicalResourceId } from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';
import { generateSesPolicyForCustomResource } from './helper';

/**
 * @struct
 */
export interface IVerifySesEmailAddressProps {
  /**
   * The email address to be verified, e.g. 'hello@example.org'.
   */
  readonly emailAddress: string;
  /**
   * An optional AWS region to validate the email address.
   * @default The custom resource will be created in the stack region
   */
  readonly region?: string;
  /**
   * Whether to DESTROY or RETAIN the email address on removal.
   *
   * @default RETAIN
   */
  readonly removalPolicy?: RemovalPolicy;
}

/**
 * A construct to verify an SES email address identity. It initiates a verification so that SES sends a verification email to the desired email address. This means the owner of the email address still needs to act by clicking the link in the verification email.
 *
 * @example
 *
 * new VerifySesEmailAddress(this, 'SesEmailVerification', {
 *   emailAddress: 'hello@example.org'
 * });
 *
 */
export class VerifySesEmailAddress extends Construct {
  constructor(parent: Construct, name: string, props: IVerifySesEmailAddressProps) {
    super(parent, name);

    const emailAddress = props.emailAddress;
    const region = props.region;
    const removalPolicy = props.removalPolicy;

    new AwsCustomResource(this, 'VerifyEmailIdentity' + emailAddress, {
      onCreate: {
        service: 'SES',
        action: 'verifyEmailIdentity',
        parameters: {
          EmailAddress: emailAddress,
        },
        physicalResourceId: PhysicalResourceId.of('verify-' + emailAddress),
        region,
      },
      onDelete: RemovalPolicy.DESTROY == removalPolicy ? {
        service: 'SES',
        action: 'deleteIdentity',
        parameters: {
          Identity: emailAddress,
        },
        region,
      } : undefined,
      policy: generateSesPolicyForCustomResource('VerifyEmailIdentity', 'DeleteIdentity'),
    });
  }
}
