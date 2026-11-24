# Security

Reference material, read when the task touches secrets, auth, input, or uploads.

## Secrets

Never display or commit secret values. Redact values and show structure only when needed. Never put secrets in environment variables or setup scripts (both are stored as plain text); API keys go through the credential form.

Files that need extra care: `.env` / `.env.*`, `credentials.json`, `secrets.json`, `.aws/credentials`, `*.pem`, `*.key`, `*.p12`, `*.pfx`, `*_rsa`, `*_ecdsa`.

## Coding defaults

- Validate user input at system boundaries
- Use parameterized queries; never build SQL with string concatenation
- Use framework escaping and sanitization for HTML output
- Don't expose stack traces or sensitive data to end users
- Use established crypto libraries rather than custom crypto

## Don't switch these off without being asked

CORS, CSP, HTTPS/TLS, certificate validation, input sanitization, rate limiting, and security headers (X-Frame-Options, X-Content-Type-Options). If one is in the way of the task, say so and let the user decide.

Relaxed CORS and mocked services are fine in local development; anything served publicly counts as production.

## When unsure

Choose the more secure option, say which call you made and why, and prefer defence in depth over a single control.
