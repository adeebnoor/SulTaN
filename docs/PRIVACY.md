# Privacy and data handling — public beta 0.6

## Local projects

SULTAN runs in your browser. Project data is saved under `sultan.strategy.builder.v0.5`, retained for backward compatibility with earlier exports. Language preference uses `sultan.language`. There is one active local draft per browser/origin. The app does not send project fields to an application server or AI model.

Local storage is not encryption, an access-control system, or a backup. Anyone with access to the browser profile may be able to read it. Other pages on the same hosting origin can potentially access that origin's storage. Private browsing, storage limits, device changes, or browser cleanup may remove or prevent saves. Export the JSON file and handle it according to your organization's rules.

The Method & privacy page includes **Clear local draft**. Clearing the draft does not delete files you exported, messages you sent, hosting logs, or GitHub issues. Switching the interface language does not translate or overwrite your project values.

## Network requests and feedback

The app contains no telemetry or analytics. A hosting provider still receives ordinary requests to serve the page and may keep its own logs. The provider's policies apply.

The feedback dialog constructs a message from feedback fields only: category, summary, description, optional reproduction steps, interface language, and app version. It does not append organization names, project JSON, scores, roadmap content, screenshots, device fingerprints, or browser history.

**Prepare email** opens your configured mail application with a draft addressed to `adeeb.noor@gmail.com`. You review and send it there. A working mail application is required; copying the text is an alternative. The site cannot confirm delivery.

**Open public GitHub draft** requires explicit acknowledgement that the issue is public. It opens GitHub for review and submission, not a background API call. A GitHub account is required. Do not include confidential, personal, or security-sensitive information. Your GitHub profile and issue content are visible under GitHub's policies.

Feedback typed into the dialog is held in page memory, not saved as project data. This site provides no protected vulnerability-reporting backend. Use a private, appropriately sanitized email for security reports.

## Not an enterprise data environment

The beta has no authentication, cloud collaboration, evidence verification, protected signatures, or tamper-resistant audit records. No claim of regulatory compliance, official accreditation, or institutional approval is made. Use fictional, public, or suitably de-identified planning content only.
