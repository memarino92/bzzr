# 0006: Storybook owns simulated play

- Status: Accepted
- Date: 2026-09-10
- Supersedes: the isolated demo route decision in ADR 0005

## Context

The mobile play layout is the only live experience. Public Storybook provides the
place to explore fictional states and controls without joining a room.

## Decision

Remove the simulated play application route and define its stateful examples inside
stories. Name the presentation Game/Play and publish examples under Pages/Play examples.
Keep live browser journeys against the production build and run simulation journeys
against Storybook. Add fixed mobile and short-wide viewports with containment checks.
Size the buzzer using its panel's width and height so host controls cannot overlap it.

## Consequences

The former demo URL returns 404. Simulated state is absent from the production route
graph. Browser validation starts Storybook as well as the app. Existing ADR 0005 is
retained as historical context; server authority and device preferences are unchanged.
