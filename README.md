# @seeebiii/ses-verify-identities

This package provides two constructs helping you to verify identities in [AWS SES](https://aws.amazon.com/ses/) using the [AWS CDK](https://aws.amazon.com/cdk/).

For more information about verifying identities in AWS SES, [read the documentation](https://docs.aws.amazon.com/ses/latest/DeveloperGuide/verify-domains.html).

## Install

### npm

```shell
npm i -D @seeebiii/ses-verify-identities
```

See more details on npmjs.com: https://www.npmjs.com/package/@seeebiii/ses-verify-identities

### Maven

```xml
<dependency>
  <groupId>de.sebastianhesse.cdk-constructs</groupId>
  <artifactId>ses-verify-identities</artifactId>
  <version>3.0.3</version>
</dependency>
```

See more details on mvnrepository.com: https://mvnrepository.com/artifact/de.sebastianhesse.cdk-constructs/ses-verify-identities/

### Python

```shell
pip install ses-verify-identities
```

See more details on PyPi: https://pypi.org/project/ses-verify-identities/

### Dotnet / C#

You can find the details here: https://www.nuget.org/packages/Ses.Verify.Identities/

## Usage

Examples below are based on TypeScript.
See [API.md](API.md) for a full reference.

### Verify a Domain

```typescript
new VerifySesDomain(this, 'SesDomainVerification', {
  domainName: 'example.org'
});
```

#### Options

 * `domainName` A domain name to be used for the SES domain identity, e.g. 'example.org'
 * `hostedZoneName` A hostedZone name to be matched with Route 53 record. e.g. 'example.org'. Default: same as domainName.
 * `addTxtRecord` Whether to automatically add a TXT record to the hosed zone of your domain. This only works if your domain is managed by Route53. Otherwise disable it. Default: `true`.
 * `addMxRecord` Whether to automatically add a MX record to the hosted zone of your domain. This only works if your domain is managed by Route53. Otherwise disable it. Default: `true`.
 * `addDkimRecord` Whether to automatically add DKIM records to the hosted zone of your domain. This only works if your domain is managed by Route53. Otherwise disable it. Default: `true`.
 * `notificationTopic` An SNS topic where bounces, complaints or delivery notifications can be sent to. If none is provided, a new topic will be created and used for all different notification types.
 * `notificationTypes` Select for which notification types you want to configure a topic. Default: `[Bounce, Complaint]`.
 * `region` An optional AWS region to validate the domain. Default: The custom resource will be created in the stack region.

### Verify an Email Address

```typescript
new VerifySesEmailAddress(this, 'SesEmailVerification', {
  emailAddress: 'hello@example.org'
});
```

#### Options

 * `emailAddress` The email address to be verified, e.g. `hello@example.org`.
 * `region` An optional AWS region to validate the email address. Default: The custom resource will be created in the stack region.

## Contributing

I'm happy to receive any contributions!
Just open an issue or pull request :)

These commands should help you while developing:

 * `npx projen`         synthesize changes in [.projenrc.js](.projenrc.js) to the project
 * `npm run build`      compile typescript to js
 * `npm run watch`      watch for changes and compile
 * `npm run test`       perform the jest unit tests
 * `npm run lint`       validate code against best practices

## Author

[Sebastian Hesse](https://www.sebastianhesse.de) - Freelancer for serverless cloud projects on AWS.

## License

MIT License

Copyright (c) 2020 [Sebastian Hesse](https://www.sebastianhesse.de)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
