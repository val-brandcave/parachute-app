# `vendor/` — a stopgap, not the plan

`realwired-ui-0.1.0.tgz` is a packed build of
[`val-brandcave/realwired-design-system`](https://github.com/val-brandcave/realwired-design-system).

It is committed here so that **anyone who checks out this branch can `npm install` and run it**,
without needing the design-system repo cloned next to this one.

## Why a tarball rather than a registry

The design system is not published to GitHub Packages yet — doing so needs a token with the
`write:packages` scope, which was not available when this branch was made. A tarball is the closest
honest stand-in: `npm install ./vendor/realwired-ui-0.1.0.tgz` copies files into `node_modules`
exactly the way a registry install would, so the integration being demonstrated here is the real one
rather than a symlink that behaves differently.

It also avoids the trap a `file:` path would have introduced. npm symlinks a local directory
dependency, and Node would then resolve React from the *library's* `node_modules` rather than this
app's — two copies of React, and hooks that fail in ways that take a day to trace.

## Replacing it

Once the package is published, this whole directory goes away:

```bash
npm uninstall @realwired/ui
npm install @realwired/ui@^0.1.0
rm -rf vendor
```

Nothing else in the app changes. The import specifiers are already
`@realwired/ui` and `@realwired/ui/themes/parachute.css`.

## Refreshing it during development

```bash
cd ../../realwired-design-system && pnpm build
cd packages/ui && npm pack --pack-destination ../../../parachute/app/vendor
cd ../../../parachute/app && npm install ./vendor/realwired-ui-0.1.0.tgz
```
