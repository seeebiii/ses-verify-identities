import { Construct } from '@aws-cdk/core';
export interface VerifySesEmailAddressProps {
    /**
     * The email address to be verified, e.g. 'hello@example.org'.
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
export declare class VerifySesEmailAddress extends Construct {
    constructor(parent: Construct, name: string, props: VerifySesEmailAddressProps);
}
