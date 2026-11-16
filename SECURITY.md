# Security Policy

## Supported versions

Only the latest release on the `main` branch receives security fixes. The installer and the skill both update from `main`, so upgrading means re-running the install command.

| Version | Supported |
| ------- | --------- |
| 0.5.x   | Yes       |
| < 0.5   | No        |

## Reporting a vulnerability

Please do not open a public issue for security problems. Report privately through GitHub's private vulnerability reporting: open the repository's **Security** tab and choose **Report a vulnerability**.

Include the affected version, steps to reproduce, and the impact you observed. We aim to acknowledge reports within 3 business days.

## Credentials

This skill reads your HiAPI API key from the `HIAPI_API_KEY` environment variable. It never writes the key to disk or logs it. Keys and example values in this repository are placeholders, not real credentials.
