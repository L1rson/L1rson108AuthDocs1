# Hardware and Attestation Docs

This is a plain static documentation site for Android hardware backed security, TEE, StrongBox, Android key attestation, Meta Quest Attestation API, Meta User Verification, nonce handling, server validation, and practical security policy.

## Files

index.html contains the documentation.

styles.css contains the complete design.

app.js contains search, navigation, and mobile menu behavior.

vercel.json contains the small Vercel configuration.

## Deploy with Vercel CLI

```text
npm i -g vercel
cd attestation-docs
vercel --prod
```

## Deploy with GitHub

Create a repository, upload these files, import the repository in Vercel, select Other for the framework preset, leave the build command empty, and deploy.

## Edit content

Open index.html and search for the section heading you want to change. Each topic is inside a section with an id. Add another section using the same structure and add a matching link in the sidebar navigation.
