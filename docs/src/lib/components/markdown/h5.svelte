<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import { cn } from "$lib/utils/styles.js";

	let { class: className, children, ...restProps }: HTMLAttributes<HTMLHeadingElement> = $props();
</script>

<h5 class={cn("mt-8 scroll-m-20 text-lg font-semibold tracking-tight", className)} {...restProps}>
	{@render children?.()}
</h5>
