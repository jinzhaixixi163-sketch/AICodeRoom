import { afterEach, describe, expect, it } from "vitest";
import { appI18n } from "./instance";
import { hasZhCNLegacyUi, uiText } from "./localized-ui";

afterEach(async () => {
	await appI18n.changeLanguage("en");
});

describe("legacy UI localization", () => {
	it("translates AO-owned chat chrome in Simplified Chinese", async () => {
		await appI18n.changeLanguage("zh-CN");
		expect(uiText("Start the conversation")).toBe("开始对话");
		expect(uiText("No orchestrator is running for this project.")).toBe("此项目当前没有运行中的编排器。");
	});

	it("keeps source copy for English and unknown provider content", async () => {
		await appI18n.changeLanguage("en");
		expect(uiText("Start the conversation")).toBe("Start the conversation");
		await appI18n.changeLanguage("zh-CN");
		expect(uiText("Provider-specific message")).toBe("Provider-specific message");
	});

	it("localizes dynamic AO status messages without translating provider names", async () => {
		await appI18n.changeLanguage("zh-CN");
		expect(uiText("Configured orchestrator agent is codex; running agent is claude-code.")).toBe(
			"配置的编排器智能体是 codex，当前运行的是 claude-code。",
		);
		expect(uiText("Failed to terminate session (503)")).toBe("终止会话失败（状态码 503）");
	});

	it("exposes exact-map coverage for regression checks", () => {
		expect(hasZhCNLegacyUi("Approval required")).toBe(true);
		expect(hasZhCNLegacyUi("Provider-specific message")).toBe(false);
	});
});
