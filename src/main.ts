import { addIcon, App, Editor, FileView, MarkdownView, MenuItem, Menu, TFile, Plugin, WorkspaceLeaf, PluginSettingTab, Setting, TAbstractFile } from 'obsidian';
import * as consts from 'src/consts';
import * as leaflet from 'leaflet';
import { CommentView } from 'src/commentView';
import { PluginSettings, DEFAULT_SETTINGS } from 'src/settings';

var noteText = "";

export default class CommentViewPlugin extends Plugin {


	settings: PluginSettings;

	initLeaf(): void {
			if (this.app.workspace.getLeavesOfType("comment-pane-view").length) {
				return;
			}
			this.app.workspace.getRightLeaf(false).setViewState({
				type: "comment-pane-view",
			});
		}

	async onload() {
		// this.addSettingTab(new InitiativeTrackerSettings(this));
		this.registerView("comment-pane-view", (leaf: WorkspaceLeaf) => {
			return new CommentView(leaf, this.settings, this);
		});

		await this.loadSettings();
		if (this.app.workspace.layoutReady) {
			initLeaf();
    } else {
	      this.registerEvent(
	          this.app.workspace.on(
	              "layout-ready",
	          	async () => {
								initLeaf();
							}));
        }
		// await this.app.workspace.getRightLeaf(false).setViewState({
		// 					type: "comment-pane-view"
		// 			});
		console.log(this.app.metadataCache)



		this.addCommand({
			id: 'open-comment-view',
			name: 'Open Comment View',
			callback: () => {
				// this.addTrackerView();
				this.app.workspace.getLeaf().setViewState({type: consts.COMMENT_VIEW_NAME});
			},
		});

		this.addSettingTab(new SettingsTab(this.app, this));

	}

	onunload() {
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	// async addTrackerView() {
	// 	if (this.app.workspace.getLeavesOfType(consts.COMMENT_PANE_VIEW).length) {
	// 			return;
	// 	}
	// 	await this.app.workspace.getRightLeaf(false).setViewState({
	// 			type: consts.COMMENT_PANE_VIEW
	// 	});
	// }

}


class SettingsTab extends PluginSettingTab {
	plugin: CommentViewPlugin;

	// constructor(app: App, plugin: CommentViewPlugin) {
	// 	super(app, plugin);
	// 	this.plugin = plugin;
	// }

	display(): void {
		let { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Settings for the comments plugin.'});



	}
}
