# @seeebiii/ses-verify-identities

This package provides two constructs helping you to verify identities in [AWS SES](https://aws.amazon.com/ses/) using the [AWS CDK](https://aws.amazon.com/cdk/).

For more information about verifying identities in AWS SES, [read the documentation](https://docs.aws.amazon.com/ses/latest/DeveloperGuide/verify-domains.html).

## Install

At the moment only a TypeScript construct is supported.

**Note:** The versioning of this construct is aligned with the AWS CDK versioning.
This (hopefully) reduces confusion when managing your CDK dependencies.

### npm

```
npm i --save-dev @seeebiii/ses-verify-identities
```

## Usage

Verify a domain:

```
new VerifySesDomain(this, 'SesDomainVerification', {
  domainName: 'example.org'
});
```

Verify an email address: 

```
new VerifySesEmailAddress(this, 'SesEmailVerification', {
  emailAddress: 'hello@example.org'
})
```

## Contributing

I'm happy to receive any contributions!
Just open an issue or pull request :)

These commands should help you while developing:

 * `npm run build`      compile typescript to js
 * `npm run watch`      watch for changes and compile
 * `npm run test`       perform the jest unit tests
 * `npm run lint`       validate code against best practices
 * `npm run prettier`   format code as configured in config

## Author

[Sebastian Hesse](https://www.sebastianhesse.de) - Freelancer for serverless cloud projects on AWS.

## License

MIT License

Copyright (c) 2020 [Sebastian Hesse](https://www.sebastianhesse.de)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
