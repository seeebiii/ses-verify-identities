# API Reference

**Classes**

Name|Description
----|-----------
[VerifySesDomain](#seeebiii-ses-verify-identities-verifysesdomain)|A construct to verify a SES domain identity.
[VerifySesEmailAddress](#seeebiii-ses-verify-identities-verifysesemailaddress)|A construct to verify an SES email address identity.


**Structs**

Name|Description
----|-----------
[IVerifySesDomainProps](#seeebiii-ses-verify-identities-iverifysesdomainprops)|*No description*
[IVerifySesEmailAddressProps](#seeebiii-ses-verify-identities-iverifysesemailaddressprops)|*No description*



## class VerifySesDomain  <a id="seeebiii-ses-verify-identities-verifysesdomain"></a>

A construct to verify a SES domain identity.

It initiates a domain verification and can automatically create
appropriate records in Route53 to verify the domain. Also, it's possible to attach a notification topic for bounces,
complaints or delivery notifications.

__Implements__: [IConstruct](#constructs-iconstruct), [IDependable](#constructs-idependable)
__Extends__: [Construct](#constructs-construct)

### Initializer




```ts
new VerifySesDomain(parent: Construct, name: string, props: IVerifySesDomainProps)
```

* **parent** (<code>[Construct](#constructs-construct)</code>)  *No description*
* **name** (<code>string</code>)  *No description*
* **props** (<code>[IVerifySesDomainProps](#seeebiii-ses-verify-identities-iverifysesdomainprops)</code>)  *No description*
  * **domainName** (<code>string</code>)  A domain name to be used for the SES domain identity, e.g. 'sub-domain.example.org'. 
  * **addDkimRecords** (<code>boolean</code>)  Whether to automatically add DKIM records to the hosted zone of your domain. __*Default*__: true
  * **addMxRecord** (<code>boolean</code>)  Whether to automatically add a MX record to the hosted zone of your domain. __*Default*__: true
  * **addTxtRecord** (<code>boolean</code>)  Whether to automatically add a TXT record to the hosed zone of your domain. __*Default*__: true
  * **hostedZoneId** (<code>string</code>)  Optional: A hosted zone id to be used for retrieving the Route53 hosted zone for adding new records. __*Optional*__
  * **hostedZoneName** (<code>string</code>)  A hosted zone name to be used for retrieving the Route53 hosted zone for adding new record, e.g. 'example.org'. If you also provide hostedZoneId, it is assumed that these values are correct and no lookup happens. __*Default*__: same as domainName
  * **notificationTopic** (<code>[aws_sns.ITopic](#aws-cdk-lib-aws-sns-itopic)</code>)  An SNS topic where bounces, complaints or delivery notifications can be sent to. __*Default*__: new topic will be created
  * **notificationTypes** (<code>Array<string></code>)  Select for which notification types you want to configure a topic. __*Default*__: [Bounce, Complaint]




## class VerifySesEmailAddress  <a id="seeebiii-ses-verify-identities-verifysesemailaddress"></a>

A construct to verify an SES email address identity.

It initiates a verification so that SES sends a verification email to the desired email address. This means the owner of the email address still needs to act by clicking the link in the verification email.

__Implements__: [IConstruct](#constructs-iconstruct), [IDependable](#constructs-idependable)
__Extends__: [Construct](#constructs-construct)

### Initializer




```ts
new VerifySesEmailAddress(parent: Construct, name: string, props: IVerifySesEmailAddressProps)
```

* **parent** (<code>[Construct](#constructs-construct)</code>)  *No description*
* **name** (<code>string</code>)  *No description*
* **props** (<code>[IVerifySesEmailAddressProps](#seeebiii-ses-verify-identities-iverifysesemailaddressprops)</code>)  *No description*
  * **emailAddress** (<code>string</code>)  The email address to be verified, e.g. 'hello@example.org'. 
  * **region** (<code>string</code>)  An optional AWS region to validate the email address. __*Default*__: The custom resource will be created in the stack region
  * **removalPolicy** (<code>[RemovalPolicy](#aws-cdk-lib-removalpolicy)</code>)  Whether to DESTROY or RETAIN the email address on removal. __*Default*__: RETAIN




## struct IVerifySesDomainProps  <a id="seeebiii-ses-verify-identities-iverifysesdomainprops"></a>






Name | Type | Description 
-----|------|-------------
**domainName** | <code>string</code> | A domain name to be used for the SES domain identity, e.g. 'sub-domain.example.org'.
**addDkimRecords**? | <code>boolean</code> | Whether to automatically add DKIM records to the hosted zone of your domain.<br/>__*Default*__: true
**addMxRecord**? | <code>boolean</code> | Whether to automatically add a MX record to the hosted zone of your domain.<br/>__*Default*__: true
**addTxtRecord**? | <code>boolean</code> | Whether to automatically add a TXT record to the hosed zone of your domain.<br/>__*Default*__: true
**hostedZoneId**? | <code>string</code> | Optional: A hosted zone id to be used for retrieving the Route53 hosted zone for adding new records.<br/>__*Optional*__
**hostedZoneName**? | <code>string</code> | A hosted zone name to be used for retrieving the Route53 hosted zone for adding new record, e.g. 'example.org'. If you also provide hostedZoneId, it is assumed that these values are correct and no lookup happens.<br/>__*Default*__: same as domainName
**notificationTopic**? | <code>[aws_sns.ITopic](#aws-cdk-lib-aws-sns-itopic)</code> | An SNS topic where bounces, complaints or delivery notifications can be sent to.<br/>__*Default*__: new topic will be created
**notificationTypes**? | <code>Array<string></code> | Select for which notification types you want to configure a topic.<br/>__*Default*__: [Bounce, Complaint]



## struct IVerifySesEmailAddressProps  <a id="seeebiii-ses-verify-identities-iverifysesemailaddressprops"></a>






Name | Type | Description 
-----|------|-------------
**emailAddress** | <code>string</code> | The email address to be verified, e.g. 'hello@example.org'.
**region**? | <code>string</code> | An optional AWS region to validate the email address.<br/>__*Default*__: The custom resource will be created in the stack region
**removalPolicy**? | <code>[RemovalPolicy](#aws-cdk-lib-removalpolicy)</code> | Whether to DESTROY or RETAIN the email address on removal.<br/>__*Default*__: RETAIN



