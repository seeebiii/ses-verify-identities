import { Capture, countResources, expect as expectCDK, haveResourceLike } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import { VerifySesDomain } from '../lib';

const domain = 'example.org';
const hostedZoneId = '12345';
const zoneName = domain + '.';
VerifySesDomain.prototype.getHostedZone = jest.fn().mockReturnValue({
  HostedZoneId: hostedZoneId,
  zoneName: zoneName
});

describe('SES domain verification', () => {
  it('ensure custom resource exists to initiate domain verification', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');

    new VerifySesDomain(stack, 'VerifyExampleDomain', {
      domainName: domain,
      addTxtRecord: false,
      addMxRecord: false,
      addDkimRecords: false
    });

    expectCDK(stack).to(countResources('Custom::AWS', 3));
    expectCDK(stack).to(
      haveResourceLike('Custom::AWS', {
        Create: {
          service: 'SES',
          action: 'verifyDomainIdentity',
          parameters: {
            Domain: domain
          }
        },
        Delete: {
          service: 'SES',
          action: 'deleteIdentity',
          parameters: {
            Identity: domain
          }
        }
      })
    );
    expectCDK(stack).to(countResources('AWS::SNS::Topic', 1));
    expectCDK(stack).to(countResources('AWS::Route53::RecordSet', 0));
  });

  it('ensure txt record is added', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');
    const domain = 'example.org';

    new VerifySesDomain(stack, 'VerifyExampleDomain', {
      domainName: domain,
      addTxtRecord: true,
      addMxRecord: false,
      addDkimRecords: false
    });

    expectCDK(stack).to(countResources('Custom::AWS', 3));
    expectCDK(stack).to(countResources('AWS::SNS::Topic', 1));
    expectCDK(stack).to(countResources('AWS::Route53::RecordSet', 1));
    expectCDK(stack).to(
      haveResourceLike('AWS::Route53::RecordSet', {
        Type: 'TXT',
        Name: '_amazonses.' + zoneName
      })
    );
  });

  it('ensure mx record is added', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');
    const domain = 'example.org';

    new VerifySesDomain(stack, 'VerifyExampleDomain', {
      domainName: domain,
      addTxtRecord: false,
      addMxRecord: true,
      addDkimRecords: false
    });

    expectCDK(stack).to(countResources('Custom::AWS', 3));
    expectCDK(stack).to(countResources('AWS::SNS::Topic', 1));
    expectCDK(stack).to(countResources('AWS::Route53::RecordSet', 1));
    expectCDK(stack).to(
      haveResourceLike('AWS::Route53::RecordSet', {
        Type: 'MX',
        Name: zoneName
      })
    );
  });

  it('ensure dkim records are added', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');
    const domain = 'example.org';

    new VerifySesDomain(stack, 'VerifyExampleDomain', {
      domainName: domain,
      addTxtRecord: false,
      addMxRecord: false,
      addDkimRecords: true
    });

    expectCDK(stack).to(countResources('Custom::AWS', 4));
    expectCDK(stack).to(countResources('AWS::SNS::Topic', 1));
    expectCDK(stack).to(countResources('AWS::Route53::RecordSet', 3));

    const c = Capture.anyType();
    expectCDK(stack).to(
      haveResourceLike('AWS::Route53::RecordSet', {
        Type: 'CNAME',
        Name: {
          'Fn::Join': ['', c.capture()]
        }
      })
    );

    expect(c.capturedValue).toContain('._domainkey.' + zoneName);
  });

  it('ensure custom topic is used', () => {
    // TODO: write test
  });
});
