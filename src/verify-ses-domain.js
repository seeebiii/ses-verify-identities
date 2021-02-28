"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerifySesDomain = void 0;
const core_1 = require("@aws-cdk/core");
const custom_resources_1 = require("@aws-cdk/custom-resources");
const aws_route53_1 = require("@aws-cdk/aws-route53");
const aws_sns_1 = require("@aws-cdk/aws-sns");
const helper_1 = require("./helper");
const cx_api_1 = require("@aws-cdk/cx-api");
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
class VerifySesDomain extends core_1.Construct {
    constructor(parent, name, props) {
        super(parent, name);
        const domainName = props.domainName;
        const verifyDomainIdentity = this.verifyDomainIdentity(domainName);
        const topic = this.createTopicOrUseExisting(domainName, verifyDomainIdentity, props.notificationTopic);
        this.addTopicToDomainIdentity(domainName, topic, props.notificationTypes);
        const zone = this.getHostedZone(domainName);
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
    verifyDomainIdentity(domainName) {
        return new custom_resources_1.AwsCustomResource(this, 'VerifyDomainIdentity', {
            onCreate: {
                service: 'SES',
                action: 'verifyDomainIdentity',
                parameters: {
                    Domain: domainName
                },
                physicalResourceId: custom_resources_1.PhysicalResourceId.fromResponse('VerificationToken')
            },
            onDelete: {
                service: 'SES',
                action: 'deleteIdentity',
                parameters: {
                    Identity: domainName
                }
            },
            policy: helper_1.generateSesPolicyForCustomResource('VerifyDomainIdentity', 'DeleteIdentity')
        });
    }
    getHostedZone(domainName) {
        return aws_route53_1.HostedZone.fromLookup(this, 'Zone', {
            domainName: domainName
        });
    }
    createTxtRecordLinkingToSes(zone, domainName, verifyDomainIdentity) {
        return new aws_route53_1.TxtRecord(this, 'SesVerificationRecord', {
            zone,
            recordName: `_amazonses.${domainName}`,
            values: [verifyDomainIdentity.getResponseField('VerificationToken')]
        });
    }
    createMxRecord(zone, domainName) {
        return new aws_route53_1.MxRecord(this, 'SesMxRecord', {
            zone,
            recordName: domainName,
            values: [
                {
                    hostName: core_1.Fn.sub(`inbound-smtp.${cx_api_1.EnvironmentPlaceholders.CURRENT_REGION}.amazonaws.com`),
                    priority: 10
                }
            ]
        });
    }
    initDkimVerification(domainName) {
        return new custom_resources_1.AwsCustomResource(this, 'VerifyDomainDkim', {
            onCreate: {
                service: 'SES',
                action: 'verifyDomainDkim',
                parameters: {
                    Domain: domainName
                },
                physicalResourceId: custom_resources_1.PhysicalResourceId.of(domainName + '-verify-domain-dkim')
            },
            policy: helper_1.generateSesPolicyForCustomResource('VerifyDomainDkim')
        });
    }
    addDkimRecords(verifyDomainDkim, zone, domainName) {
        [0, 1, 2].forEach((val) => {
            const dkimToken = verifyDomainDkim.getResponseField(`DkimTokens.${val}`);
            const cnameRecord = new aws_route53_1.CnameRecord(this, 'SesDkimVerificationRecord' + val, {
                zone,
                recordName: `${dkimToken}._domainkey.${domainName}`,
                domainName: `${dkimToken}.dkim.amazonses.com`
            });
            cnameRecord.node.addDependency(verifyDomainDkim);
        });
    }
    createTopicOrUseExisting(domainName, verifyDomainIdentity, existingTopic) {
        const topic = existingTopic !== null && existingTopic !== void 0 ? existingTopic : new aws_sns_1.Topic(this, 'SesNotificationTopic');
        new core_1.CfnOutput(this, domainName + 'SesNotificationTopic', {
            value: topic.topicArn,
            description: 'SES notification topic for ' + domainName
        });
        topic.node.addDependency(verifyDomainIdentity);
        return topic;
    }
    addTopicToDomainIdentity(domainName, topic, notificationTypes) {
        if (notificationTypes === null || notificationTypes === void 0 ? void 0 : notificationTypes.length) {
            notificationTypes.forEach((type) => {
                this.addSesNotificationTopicForIdentity(domainName, type, topic);
            });
        }
        else {
            // by default, notify on errors like a bounce or complaint
            this.addSesNotificationTopicForIdentity(domainName, 'Bounce', topic);
            this.addSesNotificationTopicForIdentity(domainName, 'Complaint', topic);
        }
    }
    addSesNotificationTopicForIdentity(identity, notificationType, notificationTopic) {
        const addTopic = new custom_resources_1.AwsCustomResource(this, `Add${notificationType}Topic-${identity}`, {
            onCreate: {
                service: 'SES',
                action: 'setIdentityNotificationTopic',
                parameters: {
                    Identity: identity,
                    NotificationType: notificationType,
                    SnsTopic: notificationTopic.topicArn
                },
                physicalResourceId: custom_resources_1.PhysicalResourceId.of(`${identity}-set-${notificationType}-topic`)
            },
            policy: helper_1.generateSesPolicyForCustomResource('SetIdentityNotificationTopic')
        });
        addTopic.node.addDependency(notificationTopic);
    }
}
exports.VerifySesDomain = VerifySesDomain;
function isTrueOrUndefined(prop) {
    return prop === undefined || prop;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmVyaWZ5LXNlcy1kb21haW4uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ2ZXJpZnktc2VzLWRvbWFpbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSx3Q0FBeUQ7QUFDekQsZ0VBQWtGO0FBQ2xGLHNEQUFpRztBQUNqRyw4Q0FBeUM7QUFDekMscUNBQThEO0FBQzlELDRDQUEwRDtBQStCMUQ7Ozs7Ozs7OztHQVNHO0FBQ0gsTUFBYSxlQUFnQixTQUFRLGdCQUFTO0lBQzVDLFlBQVksTUFBaUIsRUFBRSxJQUFZLEVBQUUsS0FBMkI7UUFDdEUsS0FBSyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztRQUVwQixNQUFNLFVBQVUsR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDO1FBQ3BDLE1BQU0sb0JBQW9CLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ25FLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxVQUFVLEVBQUUsb0JBQW9CLEVBQUUsS0FBSyxDQUFDLGlCQUFpQixDQUFDLENBQUM7UUFDdkcsSUFBSSxDQUFDLHdCQUF3QixDQUFDLFVBQVUsRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLGlCQUFpQixDQUFDLENBQUM7UUFFMUUsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUU1QyxJQUFJLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsRUFBRTtZQUN6QyxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsMkJBQTJCLENBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO1lBQzNGLFNBQVMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLG9CQUFvQixDQUFDLENBQUM7U0FDcEQ7UUFFRCxJQUFJLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsRUFBRTtZQUN4QyxNQUFNLFFBQVEsR0FB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QUFDO1lBQ25FLENBQUMsQ0FBQyxDQUFDO1NBQ0o7YUFBTTtZQUNMLDBEQUEwRDtZQUMxRCxJQUFJLENBQUMsa0NBQWtDLENBQUMsVUFBVSxFQUFFLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNyRSxJQUFJLENBQUMsa0NBQWtDLENBQUMsVUFBVSxFQUFFLFdBQVcsRUFBRSxLQUFLLENBQUMsQ0FBQztTQUN6RTtJQUNILENBQUM7SUFFTyxrQ0FBa0MsQ0FDeEMsUUFBZ0IsRUFDaEIsZ0JBQWtDLEVBQ2xDLGlCQUF3QjtRQUV4QixNQUFNLFFBQVEsR0FBRyxJQUFJLG9DQUFpQixDQUFDLElBQUksRUFBRSxNQUFNLGdCQUFnQixTQUFTLFFBQVEsRUFBRSxFQUFFO1lBQ3RGLFFBQVEsRUFBRTtnQkFDUixPQUFPLEVBQUUsS0FBSztnQkFDZCxNQUFNLEVBQUUsOEJBQThCO2dCQUN0QyxVQUFVLEVBQUU7b0JBQ1YsUUFBUSxFQUFFLFFBQVE7b0JBQ2xCLGdCQUFnQixFQUFFLGdCQUFnQjtvQkFDbEMsUUFBUSxFQUFFLGlCQUFpQixDQUFDLFFBQVE7aUJBQ3JDO2dCQUNELGtCQUFrQixFQUFFLHFDQUFrQixDQUFDLEVBQUUsQ0FBQyxHQUFHLFFBQVEsUUFBUSxnQkFBZ0IsUUFBUSxDQUFDO2FBQ3ZGO1lBQ0QsTUFBTSxFQUFFLDJDQUFrQyxDQUFDLDhCQUE4QixDQUFDO1NBQzNFLENBQUMsQ0FBQztRQUVILFFBQVEsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLGlCQUFpQixDQUFDLENBQUM7SUFDakQsQ0FBQztDQUNGO0FBakpELDBDQWlKQztBQUVELFNBQVMsaUJBQWlCLENBQUMsSUFBYztJQUN2QyxPQUFPLElBQUksS0FBSyxTQUFTLElBQUksSUFBSSxDQUFDO0FBQ3BDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDZm5PdXRwdXQsIENvbnN0cnVjdCwgRm4gfSBmcm9tICdAYXdzLWNkay9jb3JlJztcbmltcG9ydCB7IEF3c0N1c3RvbVJlc291cmNlLCBQaHlzaWNhbFJlc291cmNlSWQgfSBmcm9tICdAYXdzLWNkay9jdXN0b20tcmVzb3VyY2VzJztcbmltcG9ydCB7IENuYW1lUmVjb3JkLCBIb3N0ZWRab25lLCBJSG9zdGVkWm9uZSwgTXhSZWNvcmQsIFR4dFJlY29yZCB9IGZyb20gJ0Bhd3MtY2RrL2F3cy1yb3V0ZTUzJztcbmltcG9ydCB7IFRvcGljIH0gZnJvbSAnQGF3cy1jZGsvYXdzLXNucyc7XG5pbXBvcnQgeyBnZW5lcmF0ZVNlc1BvbGljeUZvckN1c3RvbVJlc291cmNlIH0gZnJvbSAnLi9oZWxwZXInO1xuaW1wb3J0IHsgRW52aXJvbm1lbnRQbGFjZWhvbGRlcnMgfSBmcm9tICdAYXdzLWNkay9jeC1hcGknO1xuXG5leHBvcnQgdHlwZSBOb3RpZmljYXRpb25UeXBlID0gJ0JvdW5jZScgfCAnQ29tcGxhaW50JyB8ICdEZWxpdmVyeSc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgVmVyaWZ5U2VzRG9tYWluUHJvcHMge1xuICAvKipcbiAgICogQSBkb21haW4gbmFtZSB0byBiZSB1c2VkIGZvciB0aGUgU0VTIGRvbWFpbiBpZGVudGl0eSwgZS5nLiAnZXhhbXBsZS5vcmcnXG4gICAqL1xuICBkb21haW5OYW1lOiBzdHJpbmc7XG4gIC8qKlxuICAgKiBXaGV0aGVyIHRvIGF1dG9tYXRpY2FsbHkgYWRkIGEgVFhUIHJlY29yZCB0byB0aGUgaG9zZWQgem9uZSBvZiB5b3VyIGRvbWFpbi4gVGhpcyBvbmx5IHdvcmtzIGlmIHlvdXIgZG9tYWluIGlzIG1hbmFnZWQgYnkgUm91dGU1My4gT3RoZXJ3aXNlIGRpc2FibGUgaXQuIERlZmF1bHQ6IHRydWUuXG4gICAqL1xuICBhZGRUeHRSZWNvcmQ/OiBib29sZWFuO1xuICAvKipcbiAgICogV2hldGhlciB0byBhdXRvbWF0aWNhbGx5IGFkZCBhIE1YIHJlY29yZCB0byB0aGUgaG9zdGVkIHpvbmUgb2YgeW91ciBkb21haW4uIFRoaXMgb25seSB3b3JrcyBpZiB5b3VyIGRvbWFpbiBpcyBtYW5hZ2VkIGJ5IFJvdXRlNTMuIE90aGVyd2lzZSBkaXNhYmxlIGl0LiBEZWZhdWx0OiB0cnVlLlxuICAgKi9cbiAgYWRkTXhSZWNvcmQ/OiBib29sZWFuO1xuICAvKipcbiAgICogV2hldGhlciB0byBhdXRvbWF0aWNhbGx5IGFkZCBES0lNIHJlY29yZHMgdG8gdGhlIGhvc3RlZCB6b25lIG9mIHlvdXIgZG9tYWluLiBUaGlzIG9ubHkgd29ya3MgaWYgeW91ciBkb21haW4gaXMgbWFuYWdlZCBieSBSb3V0ZTUzLiBPdGhlcndpc2UgZGlzYWJsZSBpdC4gRGVmYXVsdDogdHJ1ZS5cbiAgICovXG4gIGFkZERraW1SZWNvcmRzPzogYm9vbGVhbjtcbiAgLyoqXG4gICAqIEFuIFNOUyB0b3BpYyB3aGVyZSBib3VuY2VzLCBjb21wbGFpbnRzIG9yIGRlbGl2ZXJ5IG5vdGlmaWNhdGlvbnMgY2FuIGJlIHNlbnQgdG8uIElmIG5vbmUgaXMgcHJvdmlkZWQsIGEgbmV3IHRvcGljIHdpbGwgYmUgY3JlYXRlZCBhbmQgdXNlZCBmb3IgYWxsIGRpZmZlcmVudCBub3RpZmljYXRpb24gdHlwZXMuXG4gICAqL1xuICBub3RpZmljYXRpb25Ub3BpYz86IFRvcGljO1xuICAvKipcbiAgICogU2VsZWN0IGZvciB3aGljaCBub3RpZmljYXRpb24gdHlwZXMgeW91IHdhbnQgdG8gY29uZmlndXJlIGEgdG9waWMuIERlZmF1bHQ6IFtCb3VuY2UsIENvbXBsYWludF0uXG4gICAqL1xuICBub3RpZmljYXRpb25UeXBlcz86IE5vdGlmaWNhdGlvblR5cGVbXTtcbn1cblxuLyoqXG4gKiBBIGNvbnN0cnVjdCB0byB2ZXJpZnkgYSBTRVMgZG9tYWluIGlkZW50aXR5LiBJdCBpbml0aWF0ZXMgYSBkb21haW4gdmVyaWZpY2F0aW9uIGFuZCBjYW4gYXV0b21hdGljYWxseSBjcmVhdGUgYXBwcm9wcmlhdGUgcmVjb3JkcyBpbiBSb3V0ZTUzIHRvIHZlcmlmeSB0aGUgZG9tYWluLiBBbHNvLCBpdCdzIHBvc3NpYmxlIHRvIGF0dGFjaCBhIG5vdGlmaWNhdGlvbiB0b3BpYyBmb3IgYm91bmNlcywgY29tcGxhaW50cyBvciBkZWxpdmVyeSBub3RpZmljYXRpb25zLlxuICpcbiAqIEBleGFtcGxlXG4gKlxuICogbmV3IFZlcmlmeVNlc0RvbWFpbih0aGlzLCAnU2VzRG9tYWluVmVyaWZpY2F0aW9uJywge1xuICogICBkb21haW5OYW1lOiAnZXhhbXBsZS5vcmcnXG4gKiB9KTtcbiAqXG4gKi9cbmV4cG9ydCBjbGFzcyBWZXJpZnlTZXNEb21haW4gZXh0ZW5kcyBDb25zdHJ1Y3Qge1xuICBjb25zdHJ1Y3RvcihwYXJlbnQ6IENvbnN0cnVjdCwgbmFtZTogc3RyaW5nLCBwcm9wczogVmVyaWZ5U2VzRG9tYWluUHJvcHMpIHtcbiAgICBzdXBlcihwYXJlbnQsIG5hbWUpO1xuXG4gICAgY29uc3QgZG9tYWluTmFtZSA9IHByb3BzLmRvbWFpbk5hbWU7XG4gICAgY29uc3QgdmVyaWZ5RG9tYWluSWRlbnRpdHkgPSB0aGlzLnZlcmlmeURvbWFpbklkZW50aXR5KGRvbWFpbk5hbWUpO1xuICAgIGNvbnN0IHRvcGljID0gdGhpcy5jcmVhdGVUb3BpY09yVXNlRXhpc3RpbmcoZG9tYWluTmFtZSwgdmVyaWZ5RG9tYWluSWRlbnRpdHksIHByb3BzLm5vdGlmaWNhdGlvblRvcGljKTtcbiAgICB0aGlzLmFkZFRvcGljVG9Eb21haW5JZGVudGl0eShkb21haW5OYW1lLCB0b3BpYywgcHJvcHMubm90aWZpY2F0aW9uVHlwZXMpO1xuXG4gICAgY29uc3Qgem9uZSA9IHRoaXMuZ2V0SG9zdGVkWm9uZShkb21haW5OYW1lKTtcblxuICAgIGlmIChpc1RydWVPclVuZGVmaW5lZChwcm9wcy5hZGRUeHRSZWNvcmQpKSB7XG4gICAgICBjb25zdCB0eHRSZWNvcmQgPSB0aGlzLmNyZWF0ZVR4dFJlY29yZExpbmtpbmdUb1Nlcyh6b25lLCBkb21haW5OYW1lLCB2ZXJpZnlEb21haW5JZGVudGl0eSk7XG4gICAgICB0eHRSZWNvcmQubm9kZS5hZGREZXBlbmRlbmN5KHZlcmlmeURvbWFpbklkZW50aXR5KTtcbiAgICB9XG5cbiAgICBpZiAoaXNUcnVlT3JVbmRlZmluZWQocHJvcHMuYWRkTXhSZWNvcmQpKSB7XG4gICAgICBjb25zdCBteFJlY29yZCA9IHRoaXMuY3JlYXRlTXhSZWNvcmQoem9uZSwgZG9tYWluTmFtZSk7XG4gICAgICBteFJlY29yZC5ub2RlLmFkZERlcGVuZGVuY3kodmVyaWZ5RG9tYWluSWRlbnRpdHkpO1xuICAgIH1cblxuICAgIGlmIChpc1RydWVPclVuZGVmaW5lZChwcm9wcy5hZGREa2ltUmVjb3JkcykpIHtcbiAgICAgIGNvbnN0IHZlcmlmeURvbWFpbkRraW0gPSB0aGlzLmluaXREa2ltVmVyaWZpY2F0aW9uKGRvbWFpbk5hbWUpO1xuICAgICAgdmVyaWZ5RG9tYWluRGtpbS5ub2RlLmFkZERlcGVuZGVuY3kodmVyaWZ5RG9tYWluSWRlbnRpdHkpO1xuICAgICAgdGhpcy5hZGREa2ltUmVjb3Jkcyh2ZXJpZnlEb21haW5Ea2ltLCB6b25lLCBkb21haW5OYW1lKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHZlcmlmeURvbWFpbklkZW50aXR5KGRvbWFpbk5hbWU6IHN0cmluZyk6IEF3c0N1c3RvbVJlc291cmNlIHtcbiAgICByZXR1cm4gbmV3IEF3c0N1c3RvbVJlc291cmNlKHRoaXMsICdWZXJpZnlEb21haW5JZGVudGl0eScsIHtcbiAgICAgIG9uQ3JlYXRlOiB7XG4gICAgICAgIHNlcnZpY2U6ICdTRVMnLFxuICAgICAgICBhY3Rpb246ICd2ZXJpZnlEb21haW5JZGVudGl0eScsXG4gICAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgICBEb21haW46IGRvbWFpbk5hbWVcbiAgICAgICAgfSxcbiAgICAgICAgcGh5c2ljYWxSZXNvdXJjZUlkOiBQaHlzaWNhbFJlc291cmNlSWQuZnJvbVJlc3BvbnNlKCdWZXJpZmljYXRpb25Ub2tlbicpXG4gICAgICB9LFxuICAgICAgb25EZWxldGU6IHtcbiAgICAgICAgc2VydmljZTogJ1NFUycsXG4gICAgICAgIGFjdGlvbjogJ2RlbGV0ZUlkZW50aXR5JyxcbiAgICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICAgIElkZW50aXR5OiBkb21haW5OYW1lXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBwb2xpY3k6IGdlbmVyYXRlU2VzUG9saWN5Rm9yQ3VzdG9tUmVzb3VyY2UoJ1ZlcmlmeURvbWFpbklkZW50aXR5JywgJ0RlbGV0ZUlkZW50aXR5JylcbiAgICB9KTtcbiAgfVxuXG4gIGdldEhvc3RlZFpvbmUoZG9tYWluTmFtZTogc3RyaW5nKTogSUhvc3RlZFpvbmUge1xuICAgIHJldHVybiBIb3N0ZWRab25lLmZyb21Mb29rdXAodGhpcywgJ1pvbmUnLCB7XG4gICAgICBkb21haW5OYW1lOiBkb21haW5OYW1lXG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIGNyZWF0ZVR4dFJlY29yZExpbmtpbmdUb1Nlcyh6b25lOiBJSG9zdGVkWm9uZSwgZG9tYWluTmFtZTogc3RyaW5nLCB2ZXJpZnlEb21haW5JZGVudGl0eTogQXdzQ3VzdG9tUmVzb3VyY2UpIHtcbiAgICByZXR1cm4gbmV3IFR4dFJlY29yZCh0aGlzLCAnU2VzVmVyaWZpY2F0aW9uUmVjb3JkJywge1xuICAgICAgem9uZSxcbiAgICAgIHJlY29yZE5hbWU6IGBfYW1hem9uc2VzLiR7ZG9tYWluTmFtZX1gLFxuICAgICAgdmFsdWVzOiBbdmVyaWZ5RG9tYWluSWRlbnRpdHkuZ2V0UmVzcG9uc2VGaWVsZCgnVmVyaWZpY2F0aW9uVG9rZW4nKV1cbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlTXhSZWNvcmQoem9uZTogSUhvc3RlZFpvbmUsIGRvbWFpbk5hbWU6IHN0cmluZykge1xuICAgIHJldHVybiBuZXcgTXhSZWNvcmQodGhpcywgJ1Nlc014UmVjb3JkJywge1xuICAgICAgem9uZSxcbiAgICAgIHJlY29yZE5hbWU6IGRvbWFpbk5hbWUsXG4gICAgICB2YWx1ZXM6IFtcbiAgICAgICAge1xuICAgICAgICAgIGhvc3ROYW1lOiBGbi5zdWIoYGluYm91bmQtc210cC4ke0Vudmlyb25tZW50UGxhY2Vob2xkZXJzLkNVUlJFTlRfUkVHSU9OfS5hbWF6b25hd3MuY29tYCksXG4gICAgICAgICAgcHJpb3JpdHk6IDEwXG4gICAgICAgIH1cbiAgICAgIF1cbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgaW5pdERraW1WZXJpZmljYXRpb24oZG9tYWluTmFtZTogc3RyaW5nKSB7XG4gICAgcmV0dXJuIG5ldyBBd3NDdXN0b21SZXNvdXJjZSh0aGlzLCAnVmVyaWZ5RG9tYWluRGtpbScsIHtcbiAgICAgIG9uQ3JlYXRlOiB7XG4gICAgICAgIHNlcnZpY2U6ICdTRVMnLFxuICAgICAgICBhY3Rpb246ICd2ZXJpZnlEb21haW5Ea2ltJyxcbiAgICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICAgIERvbWFpbjogZG9tYWluTmFtZVxuICAgICAgICB9LFxuICAgICAgICBwaHlzaWNhbFJlc291cmNlSWQ6IFBoeXNpY2FsUmVzb3VyY2VJZC5vZihkb21haW5OYW1lICsgJy12ZXJpZnktZG9tYWluLWRraW0nKVxuICAgICAgfSxcbiAgICAgIHBvbGljeTogZ2VuZXJhdGVTZXNQb2xpY3lGb3JDdXN0b21SZXNvdXJjZSgnVmVyaWZ5RG9tYWluRGtpbScpXG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIGFkZERraW1SZWNvcmRzKHZlcmlmeURvbWFpbkRraW06IEF3c0N1c3RvbVJlc291cmNlLCB6b25lOiBJSG9zdGVkWm9uZSwgZG9tYWluTmFtZTogc3RyaW5nKSB7XG4gICAgWzAsIDEsIDJdLmZvckVhY2goKHZhbCkgPT4ge1xuICAgICAgY29uc3QgZGtpbVRva2VuID0gdmVyaWZ5RG9tYWluRGtpbS5nZXRSZXNwb25zZUZpZWxkKGBEa2ltVG9rZW5zLiR7dmFsfWApO1xuICAgICAgY29uc3QgY25hbWVSZWNvcmQgPSBuZXcgQ25hbWVSZWNvcmQodGhpcywgJ1Nlc0RraW1WZXJpZmljYXRpb25SZWNvcmQnICsgdmFsLCB7XG4gICAgICAgIHpvbmUsXG4gICAgICAgIHJlY29yZE5hbWU6IGAke2RraW1Ub2tlbn0uX2RvbWFpbmtleS4ke2RvbWFpbk5hbWV9YCxcbiAgICAgICAgZG9tYWluTmFtZTogYCR7ZGtpbVRva2VufS5ka2ltLmFtYXpvbnNlcy5jb21gXG4gICAgICB9KTtcbiAgICAgIGNuYW1lUmVjb3JkLm5vZGUuYWRkRGVwZW5kZW5jeSh2ZXJpZnlEb21haW5Ea2ltKTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlVG9waWNPclVzZUV4aXN0aW5nKGRvbWFpbk5hbWU6IHN0cmluZywgdmVyaWZ5RG9tYWluSWRlbnRpdHk6IEF3c0N1c3RvbVJlc291cmNlLCBleGlzdGluZ1RvcGljPzogVG9waWMpIHtcbiAgICBjb25zdCB0b3BpYyA9IGV4aXN0aW5nVG9waWMgPz8gbmV3IFRvcGljKHRoaXMsICdTZXNOb3RpZmljYXRpb25Ub3BpYycpO1xuICAgIG5ldyBDZm5PdXRwdXQodGhpcywgZG9tYWluTmFtZSArICdTZXNOb3RpZmljYXRpb25Ub3BpYycsIHtcbiAgICAgIHZhbHVlOiB0b3BpYy50b3BpY0FybixcbiAgICAgIGRlc2NyaXB0aW9uOiAnU0VTIG5vdGlmaWNhdGlvbiB0b3BpYyBmb3IgJyArIGRvbWFpbk5hbWVcbiAgICB9KTtcbiAgICB0b3BpYy5ub2RlLmFkZERlcGVuZGVuY3kodmVyaWZ5RG9tYWluSWRlbnRpdHkpO1xuICAgIHJldHVybiB0b3BpYztcbiAgfVxuXG4gIHByaXZhdGUgYWRkVG9waWNUb0RvbWFpbklkZW50aXR5KGRvbWFpbk5hbWU6IHN0cmluZywgdG9waWM6IFRvcGljLCBub3RpZmljYXRpb25UeXBlcz86IE5vdGlmaWNhdGlvblR5cGVbXSkge1xuICAgIGlmIChub3RpZmljYXRpb25UeXBlcz8ubGVuZ3RoKSB7XG4gICAgICBub3RpZmljYXRpb25UeXBlcy5mb3JFYWNoKCh0eXBlKSA9PiB7XG4gICAgICAgIHRoaXMuYWRkU2VzTm90aWZpY2F0aW9uVG9waWNGb3JJZGVudGl0eShkb21haW5OYW1lLCB0eXBlLCB0b3BpYyk7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gYnkgZGVmYXVsdCwgbm90aWZ5IG9uIGVycm9ycyBsaWtlIGEgYm91bmNlIG9yIGNvbXBsYWludFxuICAgICAgdGhpcy5hZGRTZXNOb3RpZmljYXRpb25Ub3BpY0ZvcklkZW50aXR5KGRvbWFpbk5hbWUsICdCb3VuY2UnLCB0b3BpYyk7XG4gICAgICB0aGlzLmFkZFNlc05vdGlmaWNhdGlvblRvcGljRm9ySWRlbnRpdHkoZG9tYWluTmFtZSwgJ0NvbXBsYWludCcsIHRvcGljKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFkZFNlc05vdGlmaWNhdGlvblRvcGljRm9ySWRlbnRpdHkoXG4gICAgaWRlbnRpdHk6IHN0cmluZyxcbiAgICBub3RpZmljYXRpb25UeXBlOiBOb3RpZmljYXRpb25UeXBlLFxuICAgIG5vdGlmaWNhdGlvblRvcGljOiBUb3BpY1xuICApOiB2b2lkIHtcbiAgICBjb25zdCBhZGRUb3BpYyA9IG5ldyBBd3NDdXN0b21SZXNvdXJjZSh0aGlzLCBgQWRkJHtub3RpZmljYXRpb25UeXBlfVRvcGljLSR7aWRlbnRpdHl9YCwge1xuICAgICAgb25DcmVhdGU6IHtcbiAgICAgICAgc2VydmljZTogJ1NFUycsXG4gICAgICAgIGFjdGlvbjogJ3NldElkZW50aXR5Tm90aWZpY2F0aW9uVG9waWMnLFxuICAgICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgICAgSWRlbnRpdHk6IGlkZW50aXR5LFxuICAgICAgICAgIE5vdGlmaWNhdGlvblR5cGU6IG5vdGlmaWNhdGlvblR5cGUsXG4gICAgICAgICAgU25zVG9waWM6IG5vdGlmaWNhdGlvblRvcGljLnRvcGljQXJuXG4gICAgICAgIH0sXG4gICAgICAgIHBoeXNpY2FsUmVzb3VyY2VJZDogUGh5c2ljYWxSZXNvdXJjZUlkLm9mKGAke2lkZW50aXR5fS1zZXQtJHtub3RpZmljYXRpb25UeXBlfS10b3BpY2ApXG4gICAgICB9LFxuICAgICAgcG9saWN5OiBnZW5lcmF0ZVNlc1BvbGljeUZvckN1c3RvbVJlc291cmNlKCdTZXRJZGVudGl0eU5vdGlmaWNhdGlvblRvcGljJylcbiAgICB9KTtcblxuICAgIGFkZFRvcGljLm5vZGUuYWRkRGVwZW5kZW5jeShub3RpZmljYXRpb25Ub3BpYyk7XG4gIH1cbn1cblxuZnVuY3Rpb24gaXNUcnVlT3JVbmRlZmluZWQocHJvcD86IGJvb2xlYW4pOiBib29sZWFuIHtcbiAgcmV0dXJuIHByb3AgPT09IHVuZGVmaW5lZCB8fCBwcm9wO1xufVxuIl19