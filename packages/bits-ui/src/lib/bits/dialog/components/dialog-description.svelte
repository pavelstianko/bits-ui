<script lang="ts">
	import { box, mergeProps } from "svelte-toolbelt";
	import { DialogDescriptionState } from "../dialog.svelte.js";
	import type { DialogDescriptionProps } from "../types.js";
	import { createId } from "$lib/internal/create-id.js";

	const uid = $props.id();

	let {
		id = createId(uid),
		children,
		child,
		ref = $bindable(null),
		...restProps
	}: DialogDescriptionProps = $props();

	const descriptionState = DialogDescriptionState.create({
		id: box.with(() => id),
		ref: box.with(
			() => ref,
			(v) => (ref = v)
		),
	});

	const mergedProps = $derived(mergeProps(restProps, descriptionState.props));
</script>

{#if child}
	{@render child({ props: mergedProps })}
{:else}
	<div {...mergedProps}>
		{@render children?.()}
	</div>
{/if}
