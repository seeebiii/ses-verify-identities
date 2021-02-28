import { Construct } from '@aws-cdk/core';
import { IHostedZone } from '@aws-cdk/aws-route53';
import { Topic } from '@aws-cdk/aws-sns';
export declare type NotificationType = 'Bounce' | 'Complaint' | 'Delivery';
export interface VerifySesDomainProps {
    /**
     * A domain name to be used for the SES domain identity, e.g. 'example.org'
     */
    domainName: string;
    /**
     * Whether to automatically add a TXT record to the hosed zone of your domain. This only works if your domain is managed by Route53. Otherwise disable it. Default: true.
     */
    addTxtRecord?: boolean;
    /**
     * Whether to automatically add a MX record to the hosted zone of your domain. This only works if your domain is managed by Route53. Otherwise disable it. Default: true.
     */
    addMxRecord?: boolean;
    /**
     * Whether to automatically add DKIM records to the hosted zone of your domain. This only works if your domain is managed by Route53. Otherwise disable it. Default: true.
     */
    addDkimRecords?: boolean;
    /**
     * An SNS topic where bounces, complaints or delivery notifications can be sent to. If none is provided, a new topic will be created and used for all different notification types.
     */
    notificationTopic?: Topic;
    /**
     * Select for which notification types you want to configure a topic. Default: [Bounce, Complaint].
     */
    notificationTypes?: NotificationType[];
}
/**
 * A construct to verify a SES domain identity. It initiates a domain verification and can automatically create appropriate records in Route53 to verify the domain. Also, it's possible to attach a notification topic for bounces, complaints or delivery notifications.
 *
 * @example
 *
 * new VerifySesDomain(this, 'SesDomainVerification', {
 *   domainName: 'example.org'
 * });
 *
 */
export declare class VerifySesDomain extends Construct {
    constructor(parent: Construct, name: string, props: VerifySesDomainProps);
    private verifyDomainIdentity;
    getHostedZone(domainName: string): IHostedZone;
    private createTxtRecordLinkingToSes;
    private createMxRecord;
    private initDkimVerification;
    private addDkimRecords;
    private createTopicOrUseExisting;
    private addTopicToDomainIdentity;
    private addSesNotificationTopicForIdentity;
}
