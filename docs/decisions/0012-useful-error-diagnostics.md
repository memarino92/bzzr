# Useful error diagnostics with targeted redaction

Status: Accepted · Date: 2026-10-13

Supersedes the message/type/request-context filtering policy in
[ADR 0011](0011-error-monitoring.md). Other integration decisions remain in effect.

## Context

Replacing every exception message with a generic label discards the primary
diagnostic developers need. Restricting types to built-in JavaScript errors also
loses provider-specific error classifications. We need useful reports without
collecting room payloads or capability credentials.

## Decision

Preserve diagnostic messages, custom exception types, stack locations, and error
mechanisms. Scrub recognizable credential fields, bearer tokens, capability/hash
values, cookie headers, and URL credentials/query strings. Normalize room URL
segments. Retain HTTP method, sanitized URL, User-Agent, and selected browser,
OS, runtime and device model/version fields so browser-specific failures can be
investigated. Exclude device names, identifiers and arbitrary context.

Continue excluding request bodies, cookies/authorization headers, user records,
React props, local variables, snapshots and arbitrary extras. No replay, tracing,
session tracking, logs or automatic breadcrumbs are enabled by this change.

Test both halves of the policy: realistic messages/types must survive actual SDK
delivery, and credential fixtures must be removed without erasing nearby prose.

## Consequences

Reports retain the error's explanation and environment rather than a generic
placeholder. Pattern-based scrubbing cannot identify arbitrary unlabeled private
values: application code must not interpolate names, credentials or full payloads
into errors. Review telemetry when adding new integrations or diagnostic context.
The [runbook](../sentry.md) describes the current collection policy.
