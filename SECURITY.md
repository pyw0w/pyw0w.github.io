# Security Policy

## Supported Versions
Security fixes are applied to:
- the current `main` branch
- the latest GitHub Pages deployment built from `main`

Older branches and historical releases may not receive fixes.

## Reporting a Vulnerability
Please do not open a public GitHub issue for security vulnerabilities.

Instead:
1. Use GitHub private vulnerability reporting for this repository if it is available.
2. If private reporting is not available, contact the maintainer privately through GitHub.

Please include:
- a clear description of the issue and expected impact
- affected route, page, component, or dependency
- reproduction steps or a minimal proof of concept
- screenshots, logs, or request/response details if relevant
- any suggested fix or mitigation, if known

## Response Process
- Initial acknowledgment target: within 7 days
- Valid reports will be investigated privately
- A fix will be prepared before public disclosure when possible

## Scope
The most relevant reports for this project include:
- XSS or unsafe HTML rendering
- open redirects or route handling issues
- dependency vulnerabilities affecting the deployed site
- accidental exposure of secrets, tokens, or sensitive build/deploy data
