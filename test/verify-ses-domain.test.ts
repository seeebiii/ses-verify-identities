import * as cdk from 'aws-cdk-lib';
import { RemovalPolicy } from 'aws-cdk-lib';
import { Capture, Match, Template } from 'aws-cdk-lib/assertions';
import { HostedZone } from 'aws-cdk-lib/aws-route53';
import { Topic } from 'aws-cdk-lib/aws-sns';
import { VerifySesDomain } from '../src';

const domain = 'sub-domain.example.org';
const hostedZoneName = 'example.org';
const hostedZoneId = '12345';
const zoneName = domain + '.';

const mockLookup = jest.fn().mockReturnValue({
  HostedZoneId: hostedZoneId,
  zoneName: hostedZoneName,
});
HostedZone.fromLookup = mockLookup;
HostedZone.fromHostedZoneAttributes = mockLookup;

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

  it('ensure domain is not removed if removal policy is set to retain', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');

    new VerifySesDomain(stack, 'VerifyExampleDomain', {
      domainName: domain,
      hostedZoneName,
      addTxtRecord: false,
      addMxRecord: false,
      addDkimRecords: false,
      removalPolicy: RemovalPolicy.RETAIN,
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
    });
    template.resourceCountIs('AWS::SNS::Topic', 1);
    template.resourceCountIs('AWS::Route53::RecordSet', 0);
  });

  it('ensure hosted zone is not looked up if id is provided', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');

    new VerifySesDomain(stack, 'VerifyExampleDomain', {
      domainName: domain,
      hostedZoneId: '123',
      addTxtRecord: false,
      addMxRecord: false,
      addDkimRecords: false,
    });

    expect(mockLookup.mock.calls[0][2]).toEqual({ zoneName: domain, hostedZoneId: '123' });
  });

  it('ensure hosted zone is looked up by custom name if provided and id is not set', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');

    new VerifySesDomain(stack, 'VerifyExampleDomain', {
      domainName: domain,
      hostedZoneName: 'foobar',
      addTxtRecord: false,
      addMxRecord: false,
      addDkimRecords: false,
    });

    expect(mockLookup.mock.calls[0][2]).toEqual({ domainName: 'foobar' });
  });

  it('ensure hosted zone look up falls back to domain name', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');

    new VerifySesDomain(stack, 'VerifyExampleDomain', {
      domainName: domain,
      addTxtRecord: false,
      addMxRecord: false,
      addDkimRecords: false,
    });

    expect(mockLookup.mock.calls[0][2]).toEqual({ domainName: domain });
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

    // since we only want to have a notification topic for Bounce, we only expect one custom resource to set a
    // notification topic
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

    expect(c.asString()).toMatch(`{\"service\":\"SES\",\"action\":\"setIdentityNotificationTopic\",\"parameters\":{\"Identity\":\"${domain}\"`);

    // now check that the custom resource is configured for 'Bounce'
    expect(c.asString()).toMatch(`{\"service\":\"SES\",\"action\":\"setIdentityNotificationTopic\",\"parameters\":{\"Identity\":\"${domain}\",\"NotificationType\":\"Bounce\"`);
  });

  it('ensure matches snapshot', () => {
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
    expect(template.toJSON()).toMatchSnapshot();
  });

  it('ensure matches snapshot with removal policy', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');

    new VerifySesDomain(stack, 'VerifyExampleDomain', {
      domainName: domain,
      notificationTypes: ['Bounce'],
      addTxtRecord: false,
      addMxRecord: false,
      addDkimRecords: true,
      removalPolicy: RemovalPolicy.RETAIN,
    });

    // Then
    const template = Template.fromStack(stack);
    expect(template.toJSON()).toMatchSnapshot();
  });
});
