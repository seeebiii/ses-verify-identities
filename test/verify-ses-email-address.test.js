"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = require("@aws-cdk/assert");
const cdk = require("@aws-cdk/core");
const lib_1 = require("../lib");
test('ensure custom resource exists to verify email address', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');
    const emailAddress = 'hello@example.org';
    new lib_1.VerifySesEmailAddress(stack, 'VerifyExampleEmail', {
        emailAddress: emailAddress
    });
    assert_1.expect(stack).to(assert_1.countResources('Custom::AWS', 1));
    // ensure create properties are as expected
    assert_1.expect(stack).to(assert_1.haveResourceLike('Custom::AWS', {
        Create: {
            service: 'SES',
            action: 'verifyEmailIdentity',
            parameters: {
                EmailAddress: emailAddress
            }
        }
    }));
    // ensure delete properties are as expected
    assert_1.expect(stack).to(assert_1.haveResourceLike('Custom::AWS', {
        Delete: {
            service: 'SES',
            action: 'deleteIdentity',
            parameters: {
                Identity: emailAddress
            }
        }
    }));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmVyaWZ5LXNlcy1lbWFpbC1hZGRyZXNzLnRlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ2ZXJpZnktc2VzLWVtYWlsLWFkZHJlc3MudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLDRDQUF3RjtBQUN4RixxQ0FBcUM7QUFDckMsZ0NBQStDO0FBRS9DLElBQUksQ0FBQyx1REFBdUQsRUFBRSxHQUFHLEVBQUU7SUFDakUsTUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUM7SUFDMUIsTUFBTSxLQUFLLEdBQUcsSUFBSSxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxXQUFXLENBQUMsQ0FBQztJQUM5QyxNQUFNLFlBQVksR0FBRyxtQkFBbUIsQ0FBQztJQUV6QyxJQUFJLDJCQUFxQixDQUFDLEtBQUssRUFBRSxvQkFBb0IsRUFBRTtRQUNyRCxZQUFZLEVBQUUsWUFBWTtLQUMzQixDQUFDLENBQUM7SUFFSCxlQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLHVCQUFjLENBQUMsYUFBYSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFFdEQsMkNBQTJDO0lBQzNDLGVBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQ2pCLHlCQUFnQixDQUFDLGFBQWEsRUFBRTtRQUM5QixNQUFNLEVBQUU7WUFDTixPQUFPLEVBQUUsS0FBSztZQUNkLE1BQU0sRUFBRSxxQkFBcUI7WUFDN0IsVUFBVSxFQUFFO2dCQUNWLFlBQVksRUFBRSxZQUFZO2FBQzNCO1NBQ0Y7S0FDRixDQUFDLENBQ0gsQ0FBQztJQUVGLDJDQUEyQztJQUMzQyxlQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUNqQix5QkFBZ0IsQ0FBQyxhQUFhLEVBQUU7UUFDOUIsTUFBTSxFQUFFO1lBQ04sT0FBTyxFQUFFLEtBQUs7WUFDZCxNQUFNLEVBQUUsZ0JBQWdCO1lBQ3hCLFVBQVUsRUFBRTtnQkFDVixRQUFRLEVBQUUsWUFBWTthQUN2QjtTQUNGO0tBQ0YsQ0FBQyxDQUNILENBQUM7QUFDSixDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGNvdW50UmVzb3VyY2VzLCBleHBlY3QgYXMgZXhwZWN0Q0RLLCBoYXZlUmVzb3VyY2VMaWtlIH0gZnJvbSAnQGF3cy1jZGsvYXNzZXJ0JztcbmltcG9ydCAqIGFzIGNkayBmcm9tICdAYXdzLWNkay9jb3JlJztcbmltcG9ydCB7IFZlcmlmeVNlc0VtYWlsQWRkcmVzcyB9IGZyb20gJy4uL2xpYic7XG5cbnRlc3QoJ2Vuc3VyZSBjdXN0b20gcmVzb3VyY2UgZXhpc3RzIHRvIHZlcmlmeSBlbWFpbCBhZGRyZXNzJywgKCkgPT4ge1xuICBjb25zdCBhcHAgPSBuZXcgY2RrLkFwcCgpO1xuICBjb25zdCBzdGFjayA9IG5ldyBjZGsuU3RhY2soYXBwLCAnVGVzdFN0YWNrJyk7XG4gIGNvbnN0IGVtYWlsQWRkcmVzcyA9ICdoZWxsb0BleGFtcGxlLm9yZyc7XG5cbiAgbmV3IFZlcmlmeVNlc0VtYWlsQWRkcmVzcyhzdGFjaywgJ1ZlcmlmeUV4YW1wbGVFbWFpbCcsIHtcbiAgICBlbWFpbEFkZHJlc3M6IGVtYWlsQWRkcmVzc1xuICB9KTtcblxuICBleHBlY3RDREsoc3RhY2spLnRvKGNvdW50UmVzb3VyY2VzKCdDdXN0b206OkFXUycsIDEpKTtcblxuICAvLyBlbnN1cmUgY3JlYXRlIHByb3BlcnRpZXMgYXJlIGFzIGV4cGVjdGVkXG4gIGV4cGVjdENESyhzdGFjaykudG8oXG4gICAgaGF2ZVJlc291cmNlTGlrZSgnQ3VzdG9tOjpBV1MnLCB7XG4gICAgICBDcmVhdGU6IHtcbiAgICAgICAgc2VydmljZTogJ1NFUycsXG4gICAgICAgIGFjdGlvbjogJ3ZlcmlmeUVtYWlsSWRlbnRpdHknLFxuICAgICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgICAgRW1haWxBZGRyZXNzOiBlbWFpbEFkZHJlc3NcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pXG4gICk7XG5cbiAgLy8gZW5zdXJlIGRlbGV0ZSBwcm9wZXJ0aWVzIGFyZSBhcyBleHBlY3RlZFxuICBleHBlY3RDREsoc3RhY2spLnRvKFxuICAgIGhhdmVSZXNvdXJjZUxpa2UoJ0N1c3RvbTo6QVdTJywge1xuICAgICAgRGVsZXRlOiB7XG4gICAgICAgIHNlcnZpY2U6ICdTRVMnLFxuICAgICAgICBhY3Rpb246ICdkZWxldGVJZGVudGl0eScsXG4gICAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgICBJZGVudGl0eTogZW1haWxBZGRyZXNzXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KVxuICApO1xufSk7XG4iXX0=