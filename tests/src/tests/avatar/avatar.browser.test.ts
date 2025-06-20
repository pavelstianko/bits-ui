import { userEvent } from "@vitest/browser/context";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import AvatarTest from "./avatar-test.svelte";

const src = "https://github.com/huntabyte.png";

function setup(props: { src: string }) {
	const user = userEvent;
	const t = render(AvatarTest, { ...props });
	return {
		...t,
		user,
	};
}

describe("Data Attributes", () => {
	it("should have bits data attrs", async () => {
		const t = setup({ src });
		const root = t.getByTestId("root");
		const image = t.getByTestId("image");
		const fallback = t.getByTestId("fallback");
		expect(root).toHaveAttribute("data-avatar-root");
		expect(image).toHaveAttribute("data-avatar-image");
		expect(fallback).toHaveAttribute("data-avatar-fallback");
	});
});

describe("Rendering Behavior", () => {
	it("should render the image with the correct src", async () => {
		const t = setup({ src });
		const avatar = t.getByAltText("huntabyte");
		expect(avatar).toHaveAttribute("src", "https://github.com/huntabyte.png");
	});

	it("should render the fallback when an invalid image src is provided", async () => {
		const t = setup({ src: "invalid" });
		const avatar = t.getByAltText("huntabyte");
		expect(avatar).not.toBeVisible();
		const fallback = t.getByText("HJ");
		expect(fallback).toBeVisible();
	});

	it("should remove the avatar when the src is removed", async () => {
		const t = setup({ src });
		const avatar = t.getByAltText("huntabyte");
		expect(avatar).toHaveAttribute("src", "https://github.com/huntabyte.png");
		const clearButton = t.getByTestId("clear-button");
		await t.user.click(clearButton);
		expect(avatar).not.toBeVisible();
		expect(t.getByText("HJ")).toBeVisible();
	});

	it("should not have invalid style on the fallback if the image is not loaded", async () => {
		const t = setup({ src: "invalid" });
		const fallback = t.getByText("HJ");
		expect(fallback).not.toHaveStyle({ display: "undefined" });
	});
});
