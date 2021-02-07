# API Reference

**Classes**

Name|Description
----|-----------
[VerifySesDomain](#ses-verify-identities-verifysesdomain)|A construct to verify a SES domain identity.
[VerifySesEmailAddress](#ses-verify-identities-verifysesemailaddress)|A construct to verify an SES email address identity.


**Interfaces**

Name|Description
----|-----------
[IVerifySesDomainProps](#ses-verify-identities-iverifysesdomainprops)|*No description*
[IVerifySesEmailAddressProps](#ses-verify-identities-iverifysesemailaddressprops)|*No description*



## class VerifySesDomain  <a id="ses-verify-identities-verifysesdomain"></a>

A construct to verify a SES domain identity.

It initiates a domain verification and can automatically create appropriate records in Route53 to verify the domain. Also, it's possible to attach a notification topic for bounces, complaints or delivery notifications.

__Implements__: [IConstruct](#constructs-iconstruct), [IConstruct](#aws-cdk-core-iconstruct), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable)
__Extends__: [Construct](#aws-cdk-core-construct)

### Initializer




```ts
new VerifySesDomain(parent: Construct, name: string, props: IVerifySesDomainProps)
```

* **parent** (<code>[Construct](#aws-cdk-core-construct)</code>)  *No description*
* **name** (<code>string</code>)  *No description*
* **props** (<code>[IVerifySesDomainProps](#ses-verify-identities-iverifysesdomainprops)</code>)  *No description*


### Methods


#### getHostedZone(domainName) <a id="ses-verify-identities-verifysesdomain-gethostedzone"></a>



```ts
getHostedZone(domainName: string): IHostedZone
```

* **domainName** (<code>string</code>)  *No description*

__Returns__:
* <code>[IHostedZone](#aws-cdk-aws-route53-ihostedzone)</code>



## class VerifySesEmailAddress  <a id="ses-verify-identities-verifysesemailaddress"></a>

A construct to verify an SES email address identity.

It initiates a verification so that SES sends a verification email to the desired email address. This means the owner of the email address still needs to act by clicking the link in the verification email.

__Implements__: [IConstruct](#constructs-iconstruct), [IConstruct](#aws-cdk-core-iconstruct), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable)
__Extends__: [Construct](#aws-cdk-core-construct)

### Initializer




```ts
new VerifySesEmailAddress(parent: Construct, name: string, props: IVerifySesEmailAddressProps)
```

* **parent** (<code>[Construct](#aws-cdk-core-construct)</code>)  *No description*
* **name** (<code>string</code>)  *No description*
* **props** (<code>[IVerifySesEmailAddressProps](#ses-verify-identities-iverifysesemailaddressprops)</code>)  *No description*




## interface IVerifySesDomainProps  <a id="ses-verify-identities-iverifysesdomainprops"></a>




### Properties


Name | Type | Description 
-----|------|-------------
**domainName** | <code>string</code> | A domain name to be used for the SES domain identity, e.g. 'example.org'.
**addDkimRecords**? | <code>boolean</code> | Whether to automatically add DKIM records to the hosted zone of your domain.<br/>__*Optional*__
**addMxRecord**? | <code>boolean</code> | Whether to automatically add a MX record to the hosted zone of your domain.<br/>__*Optional*__
**addTxtRecord**? | <code>boolean</code> | Whether to automatically add a TXT record to the hosed zone of your domain.<br/>__*Optional*__
**notificationTopic**? | <code>[Topic](#aws-cdk-aws-sns-topic)</code> | An SNS topic where bounces, complaints or delivery notifications can be sent to.<br/>__*Optional*__
**notificationTypes**? | <code>Array<string></code> | Select for which notification types you want to configure a topic.<br/>__*Optional*__



## interface IVerifySesEmailAddressProps  <a id="ses-verify-identities-iverifysesemailaddressprops"></a>




### Properties


Name | Type | Description 
-----|------|-------------
**emailAddress** | <code>string</code> | The email address to be verified, e.g. 'hello@example.org'.



