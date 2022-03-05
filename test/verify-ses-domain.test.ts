
import * as cdk from 'aws-cdk-lib';
import { Capture, Match, Template } from 'aws-cdk-lib/assertions';
import { Topic } from 'aws-cdk-lib/aws-sns';
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

    // Then
    const template = Template.fromStack(stack);
    template.resourceCountIs('Custom::AWS', 3);
    template.hasResourceProperties('Custom::AWS', {
      Create: Match.serializedJson(Match.objectLike({
        service: 'SES',
        action: 'verifyDomainIdentity',
        parameters: {
          Domain: domain,
        },
      })),
      Delete: Match.serializedJson(Match.objectLike({
        service: 'SES',
        action: 'deleteIdentity',
        parameters: {
          Identity: domain,
        },
      })),
    },
    );
    template.resourceCountIs('AWS::SNS::Topic', 1);
    template.resourceCountIs('AWS::Route53::RecordSet', 0);
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

    // Then
    const template = Template.fromStack(stack);
    template.resourceCountIs('Custom::AWS', 3);
    template.resourceCountIs('AWS::SNS::Topic', 1);
    template.resourceCountIs('AWS::Route53::RecordSet', 1);
    template.hasResourceProperties('AWS::Route53::RecordSet', {
      Type: 'TXT',
      Name: '_amazonses.' + zoneName,
    },
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

    // Then
    const template = Template.fromStack(stack);
    template.resourceCountIs('Custom::AWS', 3);
    template.resourceCountIs('AWS::SNS::Topic', 1);
    template.resourceCountIs('AWS::Route53::RecordSet', 1);
    template.hasResourceProperties('AWS::Route53::RecordSet', {
      Type: 'MX',
      Name: zoneName,
    },
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

    // Then
    const template = Template.fromStack(stack);
    template.resourceCountIs('Custom::AWS', 4);
    template.resourceCountIs('AWS::SNS::Topic', 1);
    template.resourceCountIs('AWS::Route53::RecordSet', 3);

    const c = new Capture();
    template.hasResourceProperties('AWS::Route53::RecordSet', {
      Type: 'CNAME',
      Name: {
        'Fn::Join': ['', c],
      },
    },
    );

    expect(c.asArray()[1]).toContain('._domainkey.' + zoneName);
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

    // Then
    const template = Template.fromStack(stack);
    template.resourceCountIs('Custom::AWS', 4);
    template.resourceCountIs('AWS::SNS::Topic', 1);
    template.hasResourceProperties('AWS::SNS::Topic', {
      TopicName: 'existing-topic-name',
    });
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

    // Then
    const template = Template.fromStack(stack);
    template.resourceCountIs('Custom::AWS', 3);

    // since we only want to have a notification topic for Bounce, we only expect one custom resource to set a notification topic
    const c = new Capture();
    template.hasResourceProperties('Custom::AWS', {
      ServiceToken: Match.anyValue(),
      Create: Match.objectLike({
        'Fn::Join': Match.arrayWith([
          '',
          [
            c,
            Match.anyValue(),
            Match.anyValue(),
          ],
        ]),
      }),
      InstallLatestAwsSdk: true,
    });

    // now check that the custom resource is configured for 'Bounce'
    expect(c.asString()).toMatch(`{\"service\":\"SES\",\"action\":\"setIdentityNotificationTopic\",\"parameters\":{\"Identity\":\"${domain}\",\"NotificationType\":\"Bounce\"`);
  });

  it('ensure include headers enabled', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');

    new VerifySesDomain(stack, 'VerifyExampleDomain', {
      domainName: domain,
      notificationTypes: ['Bounce'],
      includeOriginalHeaders: true,
      addTxtRecord: false,
      addMxRecord: false,
      addDkimRecords: true,
    });

    // Then
    const template = Template.fromStack(stack);
    template.resourceCountIs('Custom::AWS', 4);

    // headers are enabled for Bounce topic
    template.hasResourceProperties('Custom::AWS', {
      ServiceToken: Match.anyValue(),
      Create: Match.serializedJson(Match.objectLike({
        service: 'SES',
        action: 'setIdentityHeadersInNotificationsEnabled',
        parameters: {
          Enabled: true,
          Identity: domain,
          NotificationType: 'Bounce',
        },
      })),
      InstallLatestAwsSdk: true,
    });
  });

  it('ensure matches snapshot', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');

    new VerifySesDomain(stack, 'VerifyExampleDomain', {
      domainName: domain,
      notificationTypes: ['Bounce'],
      includeOriginalHeaders: true,
      addTxtRecord: false,
      addMxRecord: false,
      addDkimRecords: true,
    });

    // Then
    const template = Template.fromStack(stack);
    expect(template.toJSON()).toMatchSnapshot();
  });
});
