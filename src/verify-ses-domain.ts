import { CfnOutput, Fn, RemovalPolicy } from 'aws-cdk-lib';
import { CnameRecord, HostedZone, IHostedZone, MxRecord, TxtRecord } from 'aws-cdk-lib/aws-route53';
import { ITopic, Topic } from 'aws-cdk-lib/aws-sns';
import { AwsCustomResource, PhysicalResourceId } from 'aws-cdk-lib/custom-resources';
import { EnvironmentPlaceholders } from 'aws-cdk-lib/cx-api';
import { Construct } from 'constructs';
import { generateSesPolicyForCustomResource } from './helper';

export type NotificationType = 'Bounce' | 'Complaint' | 'Delivery';

/**
 * @struct
 */
export interface IVerifySesDomainProps {
  /**
   * A domain name to be used for the SES domain identity, e.g. 'sub-domain.example.org'
   */
  readonly domainName: string;
  /**
   * A hosted zone name to be used for retrieving the Route53 hosted zone for adding new record, e.g. 'example.org'.
   * If you also provide hostedZoneId, it is assumed that these values are correct and no lookup happens.
   * @default same as domainName
   */
  readonly hostedZoneName?: string;
  /**
   * Optional: A hosted zone id to be used for retrieving the Route53 hosted zone for adding new records. Providing an
   * id will skip the hosted zone lookup.
   */
  readonly hostedZoneId?: string;
  /**
   * Whether to automatically add a TXT record to the hosed zone of your domain. This only works if your domain is
   * managed by Route53. Otherwise disable it.
   * @default true
   */
  readonly addTxtRecord?: boolean;
  /**
   * Whether to automatically add a MX record to the hosted zone of your domain. This only works if your domain is
   * managed by Route53. Otherwise disable it.
   * @default true
   */
  readonly addMxRecord?: boolean;
  /**
   * Whether to automatically add DKIM records to the hosted zone of your domain. This only works if your domain is
   * managed by Route53. Otherwise disable it.
   * @default true
   */
  readonly addDkimRecords?: boolean;
  /**
   * An SNS topic where bounces, complaints or delivery notifications can be sent to. If none is provided, a new topic
   * will be created and used for all different notification types.
   * @default new topic will be created
   */
  readonly notificationTopic?: ITopic;
  /**
   * Select for which notification types you want to configure a topic.
   * @default [Bounce, Complaint]
   */
  readonly notificationTypes?: NotificationType[];
  /**
   * Whether to DESTROY or RETAIN the domain on removal.
   *
   * @default DESTROY
   */
  readonly removalPolicy?: RemovalPolicy;
}

/**
 * A construct to verify a SES domain identity. It initiates a domain verification and can automatically create
 * appropriate records in Route53 to verify the domain. Also, it's possible to attach a notification topic for bounces,
 * complaints or delivery notifications.
 *
 * @example
 *
 * new VerifySesDomain(this, 'SesDomainVerification', {
 *   domainName: 'example.org'
 * });
 */
export class VerifySesDomain extends Construct {
  /**
   * The SNS topic where bounces, complaints or delivery notifications can be sent to.
   */
  public readonly notificationTopic: ITopic;

  constructor(parent: Construct, name: string, props: IVerifySesDomainProps) {
    super(parent, name);

    const {
      domainName,
      hostedZoneName,
      hostedZoneId,
      notificationTopic,
      notificationTypes,
      addTxtRecord,
      addMxRecord,
      addDkimRecords,
      removalPolicy,
    } = props;

    const verifyDomainIdentity = this.verifyDomainIdentity(domainName, removalPolicy);
    this.notificationTopic = this.createTopicOrUseExisting(domainName, verifyDomainIdentity, notificationTopic);
    this.addTopicToDomainIdentity(domainName, this.notificationTopic, notificationTypes);

    const zone = this.getHostedZone({ name: hostedZoneName || domainName, id: hostedZoneId });
    if (!zone) throw new Error('Can not determine hosted zone. Provide a hostedZoneName or hostedZoneId.');

    if (isTrueOrUndefined(addTxtRecord)) {
      const txtRecord = this.createTxtRecordLinkingToSes(zone, domainName, verifyDomainIdentity);
      txtRecord.node.addDependency(verifyDomainIdentity);
    }

    if (isTrueOrUndefined(addMxRecord)) {
      const mxRecord = this.createMxRecord(zone, domainName);
      mxRecord.node.addDependency(verifyDomainIdentity);
    }

    if (isTrueOrUndefined(addDkimRecords)) {
      const verifyDomainDkim = this.initDkimVerification(domainName);
      verifyDomainDkim.node.addDependency(verifyDomainIdentity);
      this.addDkimRecords(verifyDomainDkim, zone, domainName);
    }
  }

  private verifyDomainIdentity(domainName: string, removalPolicy?: RemovalPolicy): AwsCustomResource {
    return new AwsCustomResource(this, 'VerifyDomainIdentity', {
      onCreate: {
        service: 'SES',
        action: 'verifyDomainIdentity',
        parameters: {
          Domain: domainName,
        },
        physicalResourceId: PhysicalResourceId.fromResponse('VerificationToken'),
      },
      onUpdate: {
        service: 'SES',
        action: 'verifyDomainIdentity',
        parameters: {
          Domain: domainName,
        },
        physicalResourceId: PhysicalResourceId.fromResponse('VerificationToken'),
      },
      onDelete: removalPolicy === RemovalPolicy.RETAIN ? undefined : {
        service: 'SES',
        action: 'deleteIdentity',
        parameters: {
          Identity: domainName,
        },
      },
      policy: generateSesPolicyForCustomResource('VerifyDomainIdentity', 'DeleteIdentity'),
    });
  }

  private getHostedZone({ name, id }: { name?: string; id?: string }): IHostedZone | null {
    // if name and id are available, we can save a lookup call
    if (name && id) return HostedZone.fromHostedZoneAttributes(this, 'Zone', { hostedZoneId: id, zoneName: name });
    if (name) return HostedZone.fromLookup(this, 'Zone', { domainName: name });

    return null;
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
      },
      onUpdate: {
        service: 'SES',
        action: 'verifyDomainDkim',
        parameters: {
          Domain: domainName,
        },
        physicalResourceId: PhysicalResourceId.of(domainName + '-verify-domain-dkim'),
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

  private createTopicOrUseExisting(domainName: string, verifyDomainIdentity: AwsCustomResource, existingTopic?: ITopic): ITopic {
    const topic = existingTopic ?? new Topic(this, 'SesNotificationTopic');
    new CfnOutput(this, domainName + 'SesNotificationTopic', {
      value: topic.topicArn,
      description: 'SES notification topic for ' + domainName,
    });
    topic.node.addDependency(verifyDomainIdentity);
    return topic;
  }

  private addTopicToDomainIdentity(domainName: string, topic: ITopic, notificationTypes?: NotificationType[]) {
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
    notificationTopic: ITopic,
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
      },
      policy: generateSesPolicyForCustomResource('SetIdentityNotificationTopic'),
    });

    addTopic.node.addDependency(notificationTopic);
  }
}

function isTrueOrUndefined(prop?: boolean): boolean {
  return prop === undefined || prop;
}
