import {
  anything,
  Capture,
  countResources,
  countResourcesLike,
  deepObjectLike,
  encodedJson,
  expect as expectCDK,
  haveResourceLike,
  stringLike,
} from '@aws-cdk/assert';
import { Topic } from '@aws-cdk/aws-sns';
import * as cdk from '@aws-cdk/core';
import { VerifySesDomain } from '../src';

const domain = 'sub-domain.example.org';
const hostedZoneName = 'example.org';
const hostedZoneId = '12345';
const zoneName = domain + '.';
VerifySesDomain.prototype.getHostedZone = jest.fn().mockReturnValue({
  HostedZoneId: hostedZoneId,
  zoneName: hostedZoneName,
});

describe('SES domain verification', () => {
  it('ensure custom resource exists to initiate domain verification', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');

    new VerifySesDomain(stack, 'VerifyExampleDomain', {
      domainName: domain,
      hostedZoneName,
      addTxtRecord: false,
      addMxRecord: false,
      addDkimRecords: false,
    });

    expectCDK(stack).to(countResources('Custom::AWS', 3));
    expectCDK(stack).to(
      haveResourceLike('Custom::AWS', {
        Create: encodedJson(deepObjectLike({
          service: 'SES',
          action: 'verifyDomainIdentity',
          parameters: {
            Domain: domain,
          },
        })),
        Delete: encodedJson(deepObjectLike({
          service: 'SES',
          action: 'deleteIdentity',
          parameters: {
            Identity: domain,
          },
        })),
      }),
    );
    expectCDK(stack).to(countResources('AWS::SNS::Topic', 1));
    expectCDK(stack).to(countResources('AWS::Route53::RecordSet', 0));
  });

  it('ensure txt record is added', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');

    new VerifySesDomain(stack, 'VerifyExampleDomain', {
      domainName: domain,
      addTxtRecord: true,
      addMxRecord: false,
      addDkimRecords: false,
    });

    expectCDK(stack).to(countResources('Custom::AWS', 3));
    expectCDK(stack).to(countResources('AWS::SNS::Topic', 1));
    expectCDK(stack).to(countResources('AWS::Route53::RecordSet', 1));
    expectCDK(stack).to(
      haveResourceLike('AWS::Route53::RecordSet', {
        Type: 'TXT',
        Name: '_amazonses.' + zoneName,
      }),
    );
  });

  it('ensure mx record is added', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');

    new VerifySesDomain(stack, 'VerifyExampleDomain', {
      domainName: domain,
      addTxtRecord: false,
      addMxRecord: true,
      addDkimRecords: false,
    });

    expectCDK(stack).to(countResources('Custom::AWS', 3));
    expectCDK(stack).to(countResources('AWS::SNS::Topic', 1));
    expectCDK(stack).to(countResources('AWS::Route53::RecordSet', 1));
    expectCDK(stack).to(
      haveResourceLike('AWS::Route53::RecordSet', {
        Type: 'MX',
        Name: zoneName,
      }),
    );
  });

  it('ensure dkim records are added', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');

    new VerifySesDomain(stack, 'VerifyExampleDomain', {
      domainName: domain,
      addTxtRecord: false,
      addMxRecord: false,
      addDkimRecords: true,
    });

    expectCDK(stack).to(countResources('Custom::AWS', 4));
    expectCDK(stack).to(countResources('AWS::SNS::Topic', 1));
    expectCDK(stack).to(countResources('AWS::Route53::RecordSet', 3));

    const c = Capture.anyType();
    expectCDK(stack).to(
      haveResourceLike('AWS::Route53::RecordSet', {
        Type: 'CNAME',
        Name: {
          'Fn::Join': ['', c.capture()],
        },
      }),
    );

    expect(c.capturedValue).toContain('._domainkey.' + zoneName);
  });

  it('ensure custom topic is used', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');

    const topic = new Topic(stack, 'ExistingTopic', {
      topicName: 'existing-topic-name',
    });

    new VerifySesDomain(stack, 'VerifyExampleDomain', {
      domainName: domain,
      notificationTopic: topic,
      addTxtRecord: false,
      addMxRecord: false,
      addDkimRecords: true,
    });

    expectCDK(stack).to(countResources('Custom::AWS', 4));
    expectCDK(stack).to(countResources('AWS::SNS::Topic', 1));
    expectCDK(stack).to(haveResourceLike('AWS::SNS::Topic', {
      TopicName: 'existing-topic-name',
    }));
  });

  it('ensure custom region is used', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');
    const region = 'us-east-1';

    new VerifySesDomain(stack, 'VerifyExampleEmail', {
      domainName: domain,
      hostedZoneName,
      region,
    });

    expectCDK(stack).to(countResources('Custom::AWS', 4));
    expectCDK(stack).to(
      haveResourceLike('Custom::AWS', {
        Create: encodedJson(deepObjectLike({
          service: 'SES',
          action: 'verifyDomainIdentity',
          parameters: {
            Domain: domain,
          },
          region,
        })),
        Update: encodedJson(deepObjectLike({
          service: 'SES',
          action: 'verifyDomainIdentity',
          parameters: {
            Domain: domain,
          },
          region,
        })),
        Delete: encodedJson(deepObjectLike({
          service: 'SES',
          action: 'deleteIdentity',
          parameters: {
            Identity: domain,
          },
          region,
        })),
      }),
    );
    expectCDK(stack).to(
      haveResourceLike('Custom::AWS', {
        Create: encodedJson(deepObjectLike({
          service: 'SES',
          action: 'verifyDomainDkim',
          parameters: {
            Domain: domain,
          },
          region,
        })),
        Update: encodedJson(deepObjectLike({
          service: 'SES',
          action: 'verifyDomainDkim',
          parameters: {
            Domain: domain,
          },
          region,
        })),
      }),
    );
    expectCDK(stack).to(
      haveResourceLike('Custom::AWS', {
        Create: {
          'Fn::Join': [
            '',
            [
              '{"service":"SES","action":"setIdentityNotificationTopic","parameters":{"Identity":"sub-domain.example.org","NotificationType":"Bounce","SnsTopic":"',
              {
                Ref: 'VerifyExampleEmailSesNotificationTopicA0B1D9A8',
              },
              '"},"physicalResourceId":{"id":"sub-domain.example.org-set-Bounce-topic"},"region":"us-east-1"}',
            ],
          ],
        },
      }),
    );
    expectCDK(stack).to(countResources('AWS::SNS::Topic', 1));
    expectCDK(stack).to(countResources('AWS::Route53::RecordSet', 5));
  });

  it('ensure custom notification types are used', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');

    new VerifySesDomain(stack, 'VerifyExampleDomain', {
      domainName: domain,
      notificationTypes: ['Bounce'],
      addTxtRecord: false,
      addMxRecord: false,
      addDkimRecords: true,
    });

    // since we only want to have a notification topic for Bounce, we only expect one custom resource to set a notification topic
    expectCDK(stack).to(countResourcesLike('Custom::AWS', 1, {
      ServiceToken: anything(),
      Create: deepObjectLike({
        'Fn::Join': [
          '', [stringLike(`{\"service\":\"SES\",\"action\":\"setIdentityNotificationTopic\",\"parameters\":{\"Identity\":\"${domain}\"*`), anything(), anything()],
        ],
      }),
      InstallLatestAwsSdk: true,
    }));

    // now check that the custom resource is configured for 'Bounce'
    expectCDK(stack).to(haveResourceLike('Custom::AWS', {
      ServiceToken: anything(),
      Create: deepObjectLike({
        'Fn::Join': [
          '', [
            stringLike(`{\"service\":\"SES\",\"action\":\"setIdentityNotificationTopic\",\"parameters\":{\"Identity\":\"${domain}\",\"NotificationType\":\"Bounce\"*`),
            anything(),
            anything(),
          ],
        ],
      }),
      InstallLatestAwsSdk: true,
    }));
  });
});
