"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerifySesEmailAddress = void 0;
const core_1 = require("@aws-cdk/core");
const custom_resources_1 = require("@aws-cdk/custom-resources");
const helper_1 = require("./helper");
/**
 * A construct to verify an SES email address identity. It initiates a verification so that SES sends a verification email to the desired email address. This means the owner of the email address still needs to act by clicking the link in the verification email.
 *
 * @example
 *
 * new VerifySesEmailAddress(this, 'SesEmailVerification', {
 *   emailAddress: 'hello@example.org'
 * })
 */
class VerifySesEmailAddress extends core_1.Construct {
    constructor(parent, name, props) {
        super(parent, name);
        const emailAddress = props.emailAddress;
        new custom_resources_1.AwsCustomResource(this, 'VerifyEmailIdentity' + emailAddress, {
            onCreate: {
                service: 'SES',
                action: 'verifyEmailIdentity',
                parameters: {
                    EmailAddress: emailAddress
                },
                physicalResourceId: custom_resources_1.PhysicalResourceId.of('verify-' + emailAddress)
            },
            onDelete: {
                service: 'SES',
                action: 'deleteIdentity',
                parameters: {
                    Identity: emailAddress
                }
            },
            policy: helper_1.generateSesPolicyForCustomResource('VerifyEmailIdentity', 'DeleteIdentity')
        });
    }
}
exports.VerifySesEmailAddress = VerifySesEmailAddress;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmVyaWZ5LXNlcy1lbWFpbC1hZGRyZXNzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidmVyaWZ5LXNlcy1lbWFpbC1hZGRyZXNzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLHdDQUEwQztBQUMxQyxnRUFBa0Y7QUFDbEYscUNBQThEO0FBUzlEOzs7Ozs7OztHQVFHO0FBQ0gsTUFBYSxxQkFBc0IsU0FBUSxnQkFBUztJQUNsRCxZQUFZLE1BQWlCLEVBQUUsSUFBWSxFQUFFLEtBQWlDO1FBQzVFLEtBQUssQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFFcEIsTUFBTSxZQUFZLEdBQUcsS0FBSyxDQUFDLFlBQVksQ0FBQztRQUV4QyxJQUFJLG9DQUFpQixDQUFDLElBQUksRUFBRSxxQkFBcUIsR0FBRyxZQUFZLEVBQUU7WUFDaEUsUUFBUSxFQUFFO2dCQUNSLE9BQU8sRUFBRSxLQUFLO2dCQUNkLE1BQU0sRUFBRSxxQkFBcUI7Z0JBQzdCLFVBQVUsRUFBRTtvQkFDVixZQUFZLEVBQUUsWUFBWTtpQkFDM0I7Z0JBQ0Qsa0JBQWtCLEVBQUUscUNBQWtCLENBQUMsRUFBRSxDQUFDLFNBQVMsR0FBRyxZQUFZLENBQUM7YUFDcEU7WUFDRCxRQUFRLEVBQUU7Z0JBQ1IsT0FBTyxFQUFFLEtBQUs7Z0JBQ2QsTUFBTSxFQUFFLGdCQUFnQjtnQkFDeEIsVUFBVSxFQUFFO29CQUNWLFFBQVEsRUFBRSxZQUFZO2lCQUN2QjthQUNGO1lBQ0QsTUFBTSxFQUFFLDJDQUFrQyxDQUFDLHFCQUFxQixFQUFFLGdCQUFnQixDQUFDO1NBQ3BGLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQXpCRCxzREF5QkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdAYXdzLWNkay9jb3JlJztcbmltcG9ydCB7IEF3c0N1c3RvbVJlc291cmNlLCBQaHlzaWNhbFJlc291cmNlSWQgfSBmcm9tICdAYXdzLWNkay9jdXN0b20tcmVzb3VyY2VzJztcbmltcG9ydCB7IGdlbmVyYXRlU2VzUG9saWN5Rm9yQ3VzdG9tUmVzb3VyY2UgfSBmcm9tICcuL2hlbHBlcic7XG5cbmV4cG9ydCBpbnRlcmZhY2UgVmVyaWZ5U2VzRW1haWxBZGRyZXNzUHJvcHMge1xuICAvKipcbiAgICogVGhlIGVtYWlsIGFkZHJlc3MgdG8gYmUgdmVyaWZpZWQsIGUuZy4gJ2hlbGxvQGV4YW1wbGUub3JnJy5cbiAgICovXG4gIGVtYWlsQWRkcmVzczogc3RyaW5nO1xufVxuXG4vKipcbiAqIEEgY29uc3RydWN0IHRvIHZlcmlmeSBhbiBTRVMgZW1haWwgYWRkcmVzcyBpZGVudGl0eS4gSXQgaW5pdGlhdGVzIGEgdmVyaWZpY2F0aW9uIHNvIHRoYXQgU0VTIHNlbmRzIGEgdmVyaWZpY2F0aW9uIGVtYWlsIHRvIHRoZSBkZXNpcmVkIGVtYWlsIGFkZHJlc3MuIFRoaXMgbWVhbnMgdGhlIG93bmVyIG9mIHRoZSBlbWFpbCBhZGRyZXNzIHN0aWxsIG5lZWRzIHRvIGFjdCBieSBjbGlja2luZyB0aGUgbGluayBpbiB0aGUgdmVyaWZpY2F0aW9uIGVtYWlsLlxuICpcbiAqIEBleGFtcGxlXG4gKlxuICogbmV3IFZlcmlmeVNlc0VtYWlsQWRkcmVzcyh0aGlzLCAnU2VzRW1haWxWZXJpZmljYXRpb24nLCB7XG4gKiAgIGVtYWlsQWRkcmVzczogJ2hlbGxvQGV4YW1wbGUub3JnJ1xuICogfSlcbiAqL1xuZXhwb3J0IGNsYXNzIFZlcmlmeVNlc0VtYWlsQWRkcmVzcyBleHRlbmRzIENvbnN0cnVjdCB7XG4gIGNvbnN0cnVjdG9yKHBhcmVudDogQ29uc3RydWN0LCBuYW1lOiBzdHJpbmcsIHByb3BzOiBWZXJpZnlTZXNFbWFpbEFkZHJlc3NQcm9wcykge1xuICAgIHN1cGVyKHBhcmVudCwgbmFtZSk7XG5cbiAgICBjb25zdCBlbWFpbEFkZHJlc3MgPSBwcm9wcy5lbWFpbEFkZHJlc3M7XG5cbiAgICBuZXcgQXdzQ3VzdG9tUmVzb3VyY2UodGhpcywgJ1ZlcmlmeUVtYWlsSWRlbnRpdHknICsgZW1haWxBZGRyZXNzLCB7XG4gICAgICBvbkNyZWF0ZToge1xuICAgICAgICBzZXJ2aWNlOiAnU0VTJyxcbiAgICAgICAgYWN0aW9uOiAndmVyaWZ5RW1haWxJZGVudGl0eScsXG4gICAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgICBFbWFpbEFkZHJlc3M6IGVtYWlsQWRkcmVzc1xuICAgICAgICB9LFxuICAgICAgICBwaHlzaWNhbFJlc291cmNlSWQ6IFBoeXNpY2FsUmVzb3VyY2VJZC5vZigndmVyaWZ5LScgKyBlbWFpbEFkZHJlc3MpXG4gICAgICB9LFxuICAgICAgb25EZWxldGU6IHtcbiAgICAgICAgc2VydmljZTogJ1NFUycsXG4gICAgICAgIGFjdGlvbjogJ2RlbGV0ZUlkZW50aXR5JyxcbiAgICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICAgIElkZW50aXR5OiBlbWFpbEFkZHJlc3NcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIHBvbGljeTogZ2VuZXJhdGVTZXNQb2xpY3lGb3JDdXN0b21SZXNvdXJjZSgnVmVyaWZ5RW1haWxJZGVudGl0eScsICdEZWxldGVJZGVudGl0eScpXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==