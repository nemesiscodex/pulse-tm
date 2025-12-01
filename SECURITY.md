## Security Policy

Thank you for helping keep Pulse and its users safe.

### Supported Versions

Pulse is currently in early development. The latest published version on npm (and the `master` branch on GitHub) is considered supported for security fixes.

### Reporting a Vulnerability

If you believe you have found a security vulnerability, please **do not** open a public GitHub issue.

Instead, contact the maintainer directly:

- Email: `nemesiscodex@gmail.com`

Please include:

- A description of the issue and potential impact
- Steps to reproduce, if possible
- Any relevant environment details (OS, Bun version, Pulse version)

You can also use GitHub Security Advisories if available on the repository.

The maintainer will review your report as quickly as possible and coordinate a fix and release if needed.

### Data Storage and Privacy

Pulse stores your task data **locally** on your machine in YAML files:

- Directory: `.pulse/` in your home directory or project root
- One file per tag: `.pulse/<tag>.yml`
- Base tag: `.pulse/base.yml`

No task data is sent to any remote server by default.

When using the MCP server (`pulse mcp`), AI tools that you connect to Pulse may read or modify your local tasks according to their own configuration and privacy policies. Review those tools carefully before granting access.




