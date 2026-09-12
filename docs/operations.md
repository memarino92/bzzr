# Operations and cost model

## Resource envelope

| Resource          | Bound                                                  |
| ----------------- | ------------------------------------------------------ |
| Room code         | 6 symbols, 32-symbol alphabet (30 bits)                |
| Participants      | 60 occupied seats, host included                       |
| Spectators        | 120 current sessions, separate from players            |
| Connections       | 3 per player or spectator; at most 540 per room        |
| Name              | 24 Unicode code points                                 |
| JSON request      | 1,024 bytes, enforced while reading the stream         |
| WebSocket command | 512 bytes, text only                                   |
| Commands          | 20 / 10 seconds per socket                             |
| Create attempts   | 10 / minute per edge IP key                            |
| Room API requests | 120 / minute per edge IP key                           |
| Room retention    | 2h inactivity, maximum 24h lifetime                    |
| Retained rounds   | Current round only                                     |
| Reconnect         | 8 retries, exponential delay capped at 15s plus jitter |

A classroom sharing one public IP may need a higher room-API limit (joining a
new browser normally uses a join, session lookup, and socket upgrade). Keep the
ceiling intentional and exercise the abuse tests when changing it.

Edge rate limits are local to a Cloudflare location and may be eventually
consistent. They are not a global quota or complete bot defense.
[Cloudflare rate-limit behavior](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)

## Why idle rooms are inexpensive

Room placement distributes coordination across independent objects. The hibernation
API retains connections without continuously running JavaScript. Client ping/pong
auto-responses do not wake the room. There are no server heartbeats or sweeps.
A single alarm handles each room's next expiry; deleteAll clears storage metadata.

A changed action writes the bounded room record and sets its expiry alarm.
Duplicate buzzes, reads, spectator joins, explicit departures, presence changes, and reconnects do not extend retention.
Broadcast work is proportional to connected sockets and snapshot size; the roster
and spectator caps bound it. Storage size does not grow with the number of played questions.

## Estimate from traffic, then measure

For R rooms with P participants and Q rounds, assuming everyone buzzes once:

- Game messages are roughly R × Q × (P + 1), plus locks and end commands.
- Initial HTTP/upgrade traffic is roughly proportional to R × P.
- Accepted mutations issue one record write and one alarm update; joins add writes.
- Each state update fans out to all connected sockets. At full participation,
  per-round broadcast traffic grows roughly with P².
- Stored records are proportional to live rooms and participant count; cleanup
  removes ended records.

These are workload estimates, not a price quote or load-test result. DO billing
meters requests, active duration, and SQLite reads/writes/storage; Worker requests,
CPU, and observability have their own limits. Check current plan allowances and
pricing before forecasting. Hibernation-eligible idle rooms avoid duration charges;
setAlarm is a billed write.
[Durable Object pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/)

## Observe and respond

Wrangler enables observability with 10% head sampling. Use Cloudflare request,
error, CPU/duration, WebSocket, and storage metrics. Application error logs use a
fixed event name and exclude request bodies and credentials. Platform invocation
logs may include public room URLs and infrastructure metadata; configure their
retention in the Cloudflare account. The two-hour room TTL does not erase platform
logs, backups, or browser cookies.

Watch sustained 429s, 5xx rates, reconnect spikes, CPU growth, and storage that
does not fall after the room TTL. /health is liveness, not a deep DO dependency
probe. Full synthetic probes create and end a dedicated room.

For abuse, adjust edge rate limits/WAF controls before adding a global application
bottleneck. For unexpected storage growth, check alarms and failed cleanup first.
For an incident, capture aggregate errors and timings, not tokens or user names.
An account-level billing alert and usage limits require dashboard configuration;
the repository cannot guarantee a maximum bill.
