import { Effect, PolicyStatement } from '@aws-cdk/aws-iam';
import { AwsCustomResourcePolicy } from '@aws-cdk/custom-resources';

export function generateSesPolicyForCustomResource(...methods: string[]): AwsCustomResourcePolicy {
  // for some reason the default policy is generated as `email:<method>` which does not work -> hence we need to provide our own
  return AwsCustomResourcePolicy.fromStatements([
    new PolicyStatement({
      actions: methods.map((method) => 'ses:' + method),
      effect: Effect.ALLOW,
      // PolicySim says ses:SetActiveReceiptRuleSet does not allow specifying a resource, hence use '*'
      resources: ['*'],
    }),
  ]);
}
