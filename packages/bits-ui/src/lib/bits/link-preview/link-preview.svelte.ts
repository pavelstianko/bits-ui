import { afterSleep, onDestroyEffect, useRefById } from "svelte-toolbelt";
import { Context, watch } from "runed";
import { on } from "svelte/events";
import { getAriaExpanded, getDataOpenClosed } from "$lib/internal/attrs.js";
import type { ReadableBoxedValues, WritableBoxedValues } from "$lib/internal/box.svelte.js";
import { isElement, isFocusVisible, isTouch } from "$lib/internal/is.js";
import type { BitsFocusEvent, BitsPointerEvent, WithRefProps } from "$lib/internal/types.js";
import { getTabbableCandidates } from "$lib/internal/focus.js";
import { useGraceArea } from "$lib/internal/use-grace-area.svelte.js";

const LINK_PREVIEW_CONTENT_ATTR = "data-link-preview-content";
const LINK_PREVIEW_TRIGGER_ATTR = "data-link-preview-trigger";

type LinkPreviewRootStateProps = WritableBoxedValues<{
	open: boolean;
}> &
	ReadableBoxedValues<{
		openDelay: number;
		closeDelay: number;
	}>;

class LinkPreviewRootState {
	readonly opts: LinkPreviewRootStateProps;
	hasSelection = $state(false);
	isPointerDownOnContent = $state(false);
	containsSelection = $state(false);
	timeout: number | null = null;
	contentNode = $state<HTMLElement | null>(null);
	contentMounted = $state(false);
	triggerNode = $state<HTMLElement | null>(null);
	isOpening = false;

	constructor(opts: LinkPreviewRootStateProps) {
		this.opts = opts;

		watch(
			() => this.opts.open.current,
			(isOpen) => {
				if (!isOpen) {
					this.hasSelection = false;
					return;
				}

				const handlePointerUp = () => {
					this.containsSelection = false;
					this.isPointerDownOnContent = false;

					afterSleep(1, () => {
						const isSelection = document.getSelection()?.toString() !== "";

						if (isSelection) {
							this.hasSelection = true;
						} else {
							this.hasSelection = false;
						}
					});
				};

				const unsubListener = on(document, "pointerup", handlePointerUp);

				if (!this.contentNode) return;
				const tabCandidates = getTabbableCandidates(this.contentNode);

				for (const candidate of tabCandidates) {
					candidate.setAttribute("tabindex", "-1");
				}

				return () => {
					unsubListener();
					this.hasSelection = false;
					this.isPointerDownOnContent = false;
				};
			}
		);
	}

	clearTimeout() {
		if (this.timeout) {
			window.clearTimeout(this.timeout);
			this.timeout = null;
		}
	}

	handleOpen() {
		this.clearTimeout();
		if (this.opts.open.current) return;
		this.isOpening = true;
		this.timeout = window.setTimeout(() => {
			if (this.isOpening) {
				this.opts.open.current = true;
				this.isOpening = false;
			}
		}, this.opts.openDelay.current);
	}

	immediateClose() {
		this.clearTimeout();
		this.isOpening = false;
		this.opts.open.current = false;
	}

	handleClose() {
		this.isOpening = false;
		this.clearTimeout();

		if (!this.isPointerDownOnContent && !this.hasSelection) {
			this.timeout = window.setTimeout(() => {
				this.opts.open.current = false;
			}, this.opts.closeDelay.current);
		}
	}
}

type LinkPreviewTriggerStateProps = WithRefProps;

class LinkPreviewTriggerState {
	readonly opts: LinkPreviewTriggerStateProps;
	readonly root: LinkPreviewRootState;

	constructor(opts: LinkPreviewTriggerStateProps, root: LinkPreviewRootState) {
		this.opts = opts;
		this.root = root;
		this.onpointerenter = this.onpointerenter.bind(this);
		this.onpointerleave = this.onpointerleave.bind(this);
		this.onfocus = this.onfocus.bind(this);
		this.onblur = this.onblur.bind(this);

		useRefById({
			...opts,
			onRefChange: (node) => {
				this.root.triggerNode = node;
			},
		});
	}

	onpointerenter(e: BitsPointerEvent) {
		if (isTouch(e)) return;
		this.root.handleOpen();
	}

	onpointerleave(e: BitsPointerEvent) {
		if (isTouch(e)) return;
		if (!this.root.contentMounted) {
			this.root.immediateClose();
		}
	}

	onfocus(e: BitsFocusEvent) {
		if (!isFocusVisible(e.currentTarget)) return;
		this.root.handleOpen();
	}

	onblur(_: BitsFocusEvent) {
		this.root.handleClose();
	}

	props = $derived.by(
		() =>
			({
				id: this.opts.id.current,
				"aria-haspopup": "dialog",
				"aria-expanded": getAriaExpanded(this.root.opts.open.current),
				"data-state": getDataOpenClosed(this.root.opts.open.current),
				"aria-controls": this.root.contentNode?.id,
				role: "button",
				[LINK_PREVIEW_TRIGGER_ATTR]: "",
				onpointerenter: this.onpointerenter,
				onfocus: this.onfocus,
				onblur: this.onblur,
				onpointerleave: this.onpointerleave,
			}) as const
	);
}

type LinkPreviewContentStateProps = WithRefProps &
	ReadableBoxedValues<{
		onInteractOutside: (e: PointerEvent) => void;
		onEscapeKeydown: (e: KeyboardEvent) => void;
	}>;

class LinkPreviewContentState {
	readonly opts: LinkPreviewContentStateProps;
	readonly root: LinkPreviewRootState;

	constructor(opts: LinkPreviewContentStateProps, root: LinkPreviewRootState) {
		this.opts = opts;
		this.root = root;
		this.onpointerdown = this.onpointerdown.bind(this);
		this.onpointerenter = this.onpointerenter.bind(this);
		this.onfocusout = this.onfocusout.bind(this);

		useRefById({
			...opts,
			onRefChange: (node) => {
				this.root.contentNode = node;
			},
			deps: () => this.root.opts.open.current,
		});

		useGraceArea({
			triggerNode: () => this.root.triggerNode,
			contentNode: () => this.opts.ref.current,
			enabled: () => this.root.opts.open.current,
			onPointerExit: () => {
				this.root.handleClose();
			},
		});

		onDestroyEffect(() => {
			this.root.clearTimeout();
		});
	}

	onpointerdown(e: BitsPointerEvent) {
		const target = e.target;
		if (!isElement(target)) return;

		if (e.currentTarget.contains(target)) {
			this.root.containsSelection = true;
		}
		this.root.hasSelection = true;
		this.root.isPointerDownOnContent = true;
	}

	onpointerenter(e: BitsPointerEvent) {
		if (isTouch(e)) return;
		this.root.handleOpen();
	}

	onfocusout(e: BitsFocusEvent) {
		e.preventDefault();
	}

	onInteractOutside = (e: PointerEvent) => {
		this.opts.onInteractOutside.current(e);
		if (e.defaultPrevented) return;
		this.root.handleClose();
	};

	onEscapeKeydown = (e: KeyboardEvent) => {
		this.opts.onEscapeKeydown.current?.(e);
		if (e.defaultPrevented) return;
		this.root.handleClose();
	};

	onOpenAutoFocus = (e: Event) => {
		e.preventDefault();
	};

	onCloseAutoFocus = (e: Event) => {
		e.preventDefault();
	};

	snippetProps = $derived.by(() => ({ open: this.root.opts.open.current }));

	props = $derived.by(
		() =>
			({
				id: this.opts.id.current,
				tabindex: -1,
				"data-state": getDataOpenClosed(this.root.opts.open.current),
				[LINK_PREVIEW_CONTENT_ATTR]: "",
				onpointerdown: this.onpointerdown,
				onpointerenter: this.onpointerenter,
				onfocusout: this.onfocusout,
			}) as const
	);

	popperProps = {
		onInteractOutside: this.onInteractOutside,
		onEscapeKeydown: this.onEscapeKeydown,
		onOpenAutoFocus: this.onOpenAutoFocus,
		onCloseAutoFocus: this.onCloseAutoFocus,
	};
}

const LinkPreviewRootContext = new Context<LinkPreviewRootState>("LinkPreview.Root");

export function useLinkPreviewRoot(props: LinkPreviewRootStateProps) {
	return LinkPreviewRootContext.set(new LinkPreviewRootState(props));
}

export function useLinkPreviewTrigger(props: LinkPreviewTriggerStateProps) {
	return new LinkPreviewTriggerState(props, LinkPreviewRootContext.get());
}

export function useLinkPreviewContent(props: LinkPreviewContentStateProps) {
	return new LinkPreviewContentState(props, LinkPreviewRootContext.get());
}
