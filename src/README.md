# Source Structure

This project uses a feature-based architecture.

Core folders:

- `app`: application composition, providers, and global setup.
- `navigation`: React Navigation stacks and route typings.
- `store`: Redux Toolkit store, typed hooks, and root state helpers.
- `services`: external integrations such as Firebase.
- `shared`: reusable UI, theme, and utility code.
- `features`: domain modules grouped by product capability.

Feature folders should keep their own screens, components, services, store logic,
and types close together. Shared code should only move to `shared` after it is
used by more than one feature.
