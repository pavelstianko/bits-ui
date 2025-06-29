---
title: Portal
description: A component that renders its children in a portal, preventing layout issues in complex UI structures.
---

<script>
    import { ComponentPreviewV2, PortalDemo, APISection } from '$lib/components'

	let { schemas } = $props()
</script>

## Overview

The Portal component is a utility component that renders its children in a portal, preventing layout issues in complex UI structures. This component is used for the various Bits UI component that have a `Portal` sub-component.

## Usage

### Default behavior

By default, the `Portal` component will render its children in the `body` element.

```svelte
<script lang="ts">
  import { Portal } from "bits-ui";
</script>

<Portal>
  <div>This content will be portalled to the body</div>
</Portal>
```

### Custom target

You can use the `to` prop to specify a custom target element or selector to render the content to.

```svelte
<script lang="ts">
  import { Portal } from "bits-ui";
</script>

<div id="custom-target"></div>

<div>
  <Portal to="#custom-target">
    <div>This content will be portalled to the #custom-target element</div>
  </Portal>
</div>
```

### Disable

You can use the `disabled` prop to disable the portal behavior.

```svelte
<script lang="ts">
  import { Portal } from "bits-ui";
</script>

<Portal disabled>
  <div>This content will not be portalled</div>
</Portal>
```

### Overriding the default target

The default target can modified using the `defaultPortalTo` prop of the [`BitsConfig`](/docs/utilities/bits-config) component.

This will change the default target for all `Portal` components within its scope.

<ComponentPreviewV2 size="xs" name="portal-demo" componentName="Portal">

{#snippet preview()}
<PortalDemo />
{/snippet}

</ComponentPreviewV2>

<APISection {schemas} />
