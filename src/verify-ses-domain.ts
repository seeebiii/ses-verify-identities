import { CnameRecord, HostedZone, IHostedZone, MxRecord, TxtRecord } from '@aws-cdk/aws-route53';
import { Topic } from '@aws-cdk/aws-sns';
import { CfnOutput, Construct, Fn } from '@aws-cdk/core';
import { AwsCustomResource, PhysicalResourceId } from '@aws-cdk/custom-resources';
import { EnvironmentPlaceholders } from '@aws-cdk/cx-api';
import { generateSesPolicyForCustomResource } from './helper';

export type NotificationType = 'Bounce' | 'Complaint' | 'Delivery';

export interface IVerifySesDomainProps {
  /**
   * A domain name to be used for the SES domain identity, e.g. 'sub-domain.example.org'
   */
  readonly domainName: string;
  /**
   * A hostedZone name to be matched with Route 53 record. e.g. 'example.org'
   * @default same as domainName
   */
  readonly hostedZoneName?: string;
  /**
   * Whether to automatically add a TXT record to the hosed zone of your domain. This only works if your domain is managed by Route53. Otherwise disable it.
   * @default true
   */
  readonly addTxtRecord?: boolean;
  /**
   * Whether to automatically add a MX record to the hosted zone of your domain. This only works if your domain is managed by Route53. Otherwise disable it.
   * @default true
   */
  readonly addMxRecord?: boolean;
  /**
   * Whether to automatically add DKIM records to the hosted zone of your domain. This only works if your domain is managed by Route53. Otherwise disable it.
   * @default true
   */
  readonly addDkimRecords?: boolean;
  /**
   * An SNS topic where bounces, complaints or delivery notifications can be sent to. If none is provided, a new topic will be created and used for all different notification types.
   * @default new topic will be created
   */
  readonly notificationTopic?: Topic;
  /**
   * Select for which notification types you want to configure a topic.
   * @default [Bounce, Complaint]
   */
  readonly notificationTypes?: NotificationType[];
  /**
   * An optional AWS region to validate the domain name.
   * @default The custom resource will be created in the stack region
   */
  readonly region?: string;
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
export class VerifySesDomain extends Construct {
  private readonly region: string | undefined;

  constructor(parent: Construct, name: string, props: IVerifySesDomainProps) {
    super(parent, name);

    const domainName = props.domainName;
    this.region = props.region;

    const verifyDomainIdentity = this.verifyDomainIdentity(domainName);
    const topic = this.createTopicOrUseExisting(domainName, verifyDomainIdentity, props.notificationTopic);
    this.addTopicToDomainIdentity(domainName, topic, props.notificationTypes);

    const hostedZoneName = props.hostedZoneName ? props.hostedZoneName : domainName;
    const zone = this.getHostedZone(hostedZoneName);

    if (isTrueOrUndefined(props.addTxtRecord)) {
      const txtRecord = this.createTxtRecordLinkingToSes(zone, domainName, verifyDomainIdentity);
      txtRecord.node.addDependency(verifyDomainIdentity);
    }

    if (isTrueOrUndefined(props.addMxRecord)) {
      const mxRecord = this.createMxRecord(zone, domainName);
      mxRecord.node.addDependency(verifyDomainIdentity);
    }

    if (isTrueOrUndefined(props.addDkimRecords)) {
      const verifyDomainDkim = this.initDkimVerification(domainName);
      verifyDomainDkim.node.addDependency(verifyDomainIdentity);
      this.addDkimRecords(verifyDomainDkim, zone, domainName);
    }
  }

  private verifyDomainIdentity(domainName: string): AwsCustomResource {
    return new AwsCustomResource(this, 'VerifyDomainIdentity', {
      onCreate: {
        service: 'SES',
        action: 'verifyDomainIdentity',
        parameters: {
          Domain: domainName,
        },
        physicalResourceId: PhysicalResourceId.fromResponse('VerificationToken'),
        region: this.region,
      },
      onUpdate: {
        service: 'SES',
        action: 'verifyDomainIdentity',
        parameters: {
          Domain: domainName,
        },
        physicalResourceId: PhysicalResourceId.fromResponse('VerificationToken'),
        region: this.region,
      },
      onDelete: {
        service: 'SES',
        action: 'deleteIdentity',
        parameters: {
          Identity: domainName,
        },
        region: this.region,
      },
      policy: generateSesPolicyForCustomResource('VerifyDomainIdentity', 'DeleteIdentity'),
    });
  }

  getHostedZone(domainName: string): IHostedZone {
    return HostedZone.fromLookup(this, 'Zone', {
      domainName: domainName,
    });
  }

  private createTxtRecordLinkingToSes(zone: IHostedZone, domainName: string, verifyDomainIdentity: AwsCustomResource) {
    return new TxtRecord(this, 'SesVerificationRecord', {
      zone,
      recordName: `_amazonses.${domainName}`,
      values: [verifyDomainIdentity.getResponseField('VerificationToken')],
    });
  }

  private createMxRecord(zone: IHostedZone, domainName: string) {
    return new MxRecord(this, 'SesMxRecord', {
      zone,
      recordName: domainName,
      values: [
        {
          hostName: Fn.sub(`inbound-smtp.${EnvironmentPlaceholders.CURRENT_REGION}.amazonaws.com`),
          priority: 10,
        },
      ],
    });
  }

  private initDkimVerification(domainName: string) {
    return new AwsCustomResource(this, 'VerifyDomainDkim', {
      onCreate: {
        service: 'SES',
        action: 'verifyDomainDkim',
        parameters: {
          Domain: domainName,
        },
        physicalResourceId: PhysicalResourceId.of(domainName + '-verify-domain-dkim'),
        region: this.region,
      },
      onUpdate: {
        service: 'SES',
        action: 'verifyDomainDkim',
        parameters: {
          Domain: domainName,
        },
        physicalResourceId: PhysicalResourceId.of(domainName + '-verify-domain-dkim'),
        region: this.region,
      },
      policy: generateSesPolicyForCustomResource('VerifyDomainDkim'),
    });
  }

  private addDkimRecords(verifyDomainDkim: AwsCustomResource, zone: IHostedZone, domainName: string) {
    [0, 1, 2].forEach((val) => {
      const dkimToken = verifyDomainDkim.getResponseField(`DkimTokens.${val}`);
      const cnameRecord = new CnameRecord(this, 'SesDkimVerificationRecord' + val, {
        zone,
        recordName: `${dkimToken}._domainkey.${domainName}`,
        domainName: `${dkimToken}.dkim.amazonses.com`,
      });
      cnameRecord.node.addDependency(verifyDomainDkim);
    });
  }

  private createTopicOrUseExisting(domainName: string, verifyDomainIdentity: AwsCustomResource, existingTopic?: Topic) {
    const topic = existingTopic ?? new Topic(this, 'SesNotificationTopic');
    new CfnOutput(this, domainName + 'SesNotificationTopic', {
      value: topic.topicArn,
      description: 'SES notification topic for ' + domainName,
    });
    topic.node.addDependency(verifyDomainIdentity);
    return topic;
  }

  private addTopicToDomainIdentity(domainName: string, topic: Topic, notificationTypes?: NotificationType[]) {
    if (notificationTypes?.length) {
      notificationTypes.forEach((type) => {
        this.addSesNotificationTopicForIdentity(domainName, type, topic);
      });
    } else {
      // by default, notify on errors like a bounce or complaint
      this.addSesNotificationTopicForIdentity(domainName, 'Bounce', topic);
      this.addSesNotificationTopicForIdentity(domainName, 'Complaint', topic);
    }
  }

  private addSesNotificationTopicForIdentity(
    identity: string,
    notificationType: NotificationType,
    notificationTopic: Topic,
  ): void {
    const addTopic = new AwsCustomResource(this, `Add${notificationType}Topic-${identity}`, {
      onCreate: {
        service: 'SES',
        action: 'setIdentityNotificationTopic',
        parameters: {
          Identity: identity,
          NotificationType: notificationType,
          SnsTopic: notificationTopic.topicArn,
        },
        physicalResourceId: PhysicalResourceId.of(`${identity}-set-${notificationType}-topic`),
        region: this.region,
      },
      policy: generateSesPolicyForCustomResource('SetIdentityNotificationTopic'),
    });

    addTopic.node.addDependency(notificationTopic);
  }
}

function isTrueOrUndefined(prop?: boolean): boolean {
  return prop === undefined || prop;
}
