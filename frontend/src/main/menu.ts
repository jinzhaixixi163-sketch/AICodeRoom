import type { MenuItemConstructorOptions } from "electron";
import type { AppLocale } from "../shared/ui-locale";

type AppMenuOptions = {
	appName: string;
	locale: AppLocale;
	platform: NodeJS.Platform;
	onToggleDevTools?: () => void;
};

const ENGLISH_LABELS = {
	about: "About",
	bringAllToFront: "Bring All to Front",
	closeWindow: "Close Window",
	copy: "Copy",
	cut: "Cut",
	edit: "Edit",
	file: "File",
	help: "Help",
	hide: "Hide",
	hideOthers: "Hide Others",
	minimize: "Minimize",
	paste: "Paste",
	quit: "Quit",
	redo: "Redo",
	reload: "Reload",
	resetZoom: "Actual Size",
	selectAll: "Select All",
	services: "Services",
	showAll: "Show All",
	toggleDevTools: "Toggle Developer Tools",
	toggleFullscreen: "Toggle Full Screen",
	undo: "Undo",
	view: "View",
	window: "Window",
	zoom: "Zoom",
	zoomIn: "Zoom In",
	zoomOut: "Zoom Out",
} as const;

const CHINESE_LABELS: Record<keyof typeof ENGLISH_LABELS, string> = {
	about: "关于",
	bringAllToFront: "前置全部窗口",
	closeWindow: "关闭窗口",
	copy: "复制",
	cut: "剪切",
	edit: "编辑",
	file: "文件",
	help: "帮助",
	hide: "隐藏",
	hideOthers: "隐藏其他应用",
	minimize: "最小化",
	paste: "粘贴",
	quit: "退出",
	redo: "重做",
	reload: "重新加载",
	resetZoom: "实际大小",
	selectAll: "全选",
	services: "服务",
	showAll: "全部显示",
	toggleDevTools: "切换开发者工具",
	toggleFullscreen: "切换全屏",
	undo: "撤销",
	view: "显示",
	window: "窗口",
	zoom: "缩放",
	zoomIn: "放大",
	zoomOut: "缩小",
};

export function buildAppMenuTemplate(options: AppMenuOptions): MenuItemConstructorOptions[] {
	const labels = options.locale === "zh-CN" ? CHINESE_LABELS : ENGLISH_LABELS;
	const devtoolsItem: MenuItemConstructorOptions = options.onToggleDevTools
		? {
				label: labels.toggleDevTools,
				accelerator: options.platform === "darwin" ? "Command+Option+I" : "Ctrl+Shift+I",
				click: options.onToggleDevTools,
			}
		: { role: "toggleDevTools", label: labels.toggleDevTools };
	const editMenu: MenuItemConstructorOptions = {
		label: labels.edit,
		submenu: [
			{ role: "undo", label: labels.undo },
			{ role: "redo", label: labels.redo },
			{ type: "separator" },
			{ role: "cut", label: labels.cut },
			{ role: "copy", label: labels.copy },
			{ role: "paste", label: labels.paste },
			{ role: "selectAll", label: labels.selectAll },
		],
	};
	const viewMenu: MenuItemConstructorOptions = {
		label: labels.view,
		submenu: [
			{ role: "reload", label: labels.reload },
			devtoolsItem,
			{ type: "separator" },
			{ role: "resetZoom", label: labels.resetZoom },
			{ accelerator: options.platform === "darwin" ? "Command+=" : "Ctrl+=", role: "zoomIn", label: labels.zoomIn },
			{
				accelerator: options.platform === "darwin" ? "Command+Plus" : "Ctrl+Plus",
				acceleratorWorksWhenHidden: true,
				role: "zoomIn",
				visible: false,
			},
			{ accelerator: options.platform === "darwin" ? "Command+-" : "Ctrl+-", role: "zoomOut", label: labels.zoomOut },
			{ type: "separator" },
			{ role: "togglefullscreen", label: labels.toggleFullscreen },
		],
	};
	const windowMenu: MenuItemConstructorOptions = {
		label: labels.window,
		submenu: [
			{ role: "minimize", label: labels.minimize },
			...(options.platform === "darwin"
				? [
						{ role: "zoom", label: labels.zoom } as MenuItemConstructorOptions,
						{ type: "separator" } as MenuItemConstructorOptions,
						{ role: "front", label: labels.bringAllToFront } as MenuItemConstructorOptions,
					]
				: [{ role: "close", label: labels.closeWindow } as MenuItemConstructorOptions]),
		],
	};
	const standardMenus: MenuItemConstructorOptions[] = [
		{ label: labels.file, submenu: [{ role: "close", label: labels.closeWindow }] },
		editMenu,
		viewMenu,
		windowMenu,
		{ label: labels.help, submenu: [] },
	];

	if (options.platform !== "darwin") return standardMenus;
	return [
		{
			label: options.appName,
			submenu: [
				{ role: "about", label: `${labels.about} ${options.appName}` },
				{ type: "separator" },
				{ role: "services", label: labels.services },
				{ type: "separator" },
				{ role: "hide", label: `${labels.hide} ${options.appName}` },
				{ role: "hideOthers", label: labels.hideOthers },
				{ role: "unhide", label: labels.showAll },
				{ type: "separator" },
				{ role: "quit", label: `${labels.quit} ${options.appName}` },
			],
		},
		...standardMenus,
	];
}

export function buildWindowsAppMenuTemplate(onToggleDevTools?: () => void): MenuItemConstructorOptions[] {
	return buildAppMenuTemplate({ appName: "AICodeRoom", locale: "en", platform: "win32", onToggleDevTools });
}
