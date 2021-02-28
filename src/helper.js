"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSesPolicyForCustomResource = void 0;
const custom_resources_1 = require("@aws-cdk/custom-resources");
const aws_iam_1 = require("@aws-cdk/aws-iam");
function generateSesPolicyForCustomResource(...methods) {
    // for some reason the default policy is generated as `email:<method>` which does not work -> hence we need to provide our own
    return custom_resources_1.AwsCustomResourcePolicy.fromStatements([
        new aws_iam_1.PolicyStatement({
            actions: methods.map((method) => 'ses:' + method),
            effect: aws_iam_1.Effect.ALLOW,
            // PolicySim says ses:SetActiveReceiptRuleSet does not allow specifying a resource, hence use '*'
            resources: ['*']
        })
    ]);
}
exports.generateSesPolicyForCustomResource = generateSesPolicyForCustomResource;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGVscGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaGVscGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLGdFQUFvRTtBQUNwRSw4Q0FBMkQ7QUFFM0QsU0FBZ0Isa0NBQWtDLENBQUMsR0FBRyxPQUFpQjtJQUNyRSw4SEFBOEg7SUFDOUgsT0FBTywwQ0FBdUIsQ0FBQyxjQUFjLENBQUM7UUFDNUMsSUFBSSx5QkFBZSxDQUFDO1lBQ2xCLE9BQU8sRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1lBQ2pELE1BQU0sRUFBRSxnQkFBTSxDQUFDLEtBQUs7WUFDcEIsaUdBQWlHO1lBQ2pHLFNBQVMsRUFBRSxDQUFDLEdBQUcsQ0FBQztTQUNqQixDQUFDO0tBQ0gsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQVZELGdGQVVDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQXdzQ3VzdG9tUmVzb3VyY2VQb2xpY3kgfSBmcm9tICdAYXdzLWNkay9jdXN0b20tcmVzb3VyY2VzJztcbmltcG9ydCB7IEVmZmVjdCwgUG9saWN5U3RhdGVtZW50IH0gZnJvbSAnQGF3cy1jZGsvYXdzLWlhbSc7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZW5lcmF0ZVNlc1BvbGljeUZvckN1c3RvbVJlc291cmNlKC4uLm1ldGhvZHM6IHN0cmluZ1tdKTogQXdzQ3VzdG9tUmVzb3VyY2VQb2xpY3kge1xuICAvLyBmb3Igc29tZSByZWFzb24gdGhlIGRlZmF1bHQgcG9saWN5IGlzIGdlbmVyYXRlZCBhcyBgZW1haWw6PG1ldGhvZD5gIHdoaWNoIGRvZXMgbm90IHdvcmsgLT4gaGVuY2Ugd2UgbmVlZCB0byBwcm92aWRlIG91ciBvd25cbiAgcmV0dXJuIEF3c0N1c3RvbVJlc291cmNlUG9saWN5LmZyb21TdGF0ZW1lbnRzKFtcbiAgICBuZXcgUG9saWN5U3RhdGVtZW50KHtcbiAgICAgIGFjdGlvbnM6IG1ldGhvZHMubWFwKChtZXRob2QpID0+ICdzZXM6JyArIG1ldGhvZCksXG4gICAgICBlZmZlY3Q6IEVmZmVjdC5BTExPVyxcbiAgICAgIC8vIFBvbGljeVNpbSBzYXlzIHNlczpTZXRBY3RpdmVSZWNlaXB0UnVsZVNldCBkb2VzIG5vdCBhbGxvdyBzcGVjaWZ5aW5nIGEgcmVzb3VyY2UsIGhlbmNlIHVzZSAnKidcbiAgICAgIHJlc291cmNlczogWycqJ11cbiAgICB9KVxuICBdKTtcbn1cbiJdfQ==