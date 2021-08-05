import { addIcon, App, Editor, FileView, MarkdownView, Modal, MenuItem, Menu, TFile, Plugin, WorkspaceLeaf, PluginSettingTab, Setting, TAbstractFile } from 'obsidian';
import * as consts from 'src/consts';
import * as leaflet from 'leaflet';

import { CommentsView } from 'src/CommentsView';
// import { createNewComment } from 'src/newComment';
import { PluginSettings, DEFAULT_SETTINGS } from 'src/settings';
import { getFrontMatterLocation, matchInlineLocation, verifyLocation } from 'src/markers';

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		let {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		let {contentEl} = this;
		contentEl.empty();
	}
}

export default class CommentsViewPlugin extends Plugin {
	settings: CommentPluginSettings;

	initLeaf(): void {
			// if (this.app.workspace.getLeavesOfType("comments-pane-view").length) {
			// 	return;
			// }
			this.app.workspace.getRightLeaf(false).setViewState({
				type: "comments-pane-view",
			});
		}

	async onload() {
		// addIcon('globe', consts.RIBBON_ICON);

		// const { workspace } = this.app;
		// const activeView = workspace.getActiveViewOfType(MarkdownView);
		// let textBox = createDiv({
		// 		'text': "no text"
		// 	})
		// if (activeView) {
		// 		const fileContents = await this.app.vault.cachedRead(activeView.file);
		// 		vault.modify(activeView, fileContents+"test")
		// 	}



		await this.loadSettings();

		this.registerView("comments-pane-view", (leaf: WorkspaceLeaf) => {
			return new CommentsView(leaf, this.settings, this);
		});

		if (this.app.workspace.layoutReady) {
			initLeaf();
		} else {
				this.registerEvent(
						this.app.workspace.on(
								"layout-ready",
							async () => {
								this.app.workspace.getRightLeaf(false).setViewState({
									type: "comments-pane-view",
								});
							}));
		}



		this.addCommand({
			id: 'comments-pane-view',
			name: 'Open Comments View',
			checkCallback: (checking: boolean) => {
					let leaf = this.app.workspace.activeLeaf;
					if (leaf) {
						if (!checking) {
							// new SampleModal(this.app).open();
						}
						return true;
					}
					return false;
				}
			// callback: () => {
			//
			// 	// createNewComment()
			// 	// this.console.log("active view" + activeView);
			// 	// initLeaf();
			// 	// if (activeView) {
			// 	//   this.console.log(vault.cachedRead(activeView.file));
			// 	// }
			// },
		});

		this.addSettingTab(new SettingsTab(this.app, this));

	}



	private async openMapWithLocation(location: leaflet.LatLng) {
		await this.app.workspace.getLeaf().setViewState({
			type: consts.COMMENT_VIEW_NAME,
			state: {
				mapCenter: location,
				mapZoom: this.settings.zoomOnGoFromNote
			} as any});
	}

	private getLocationOnEditorLine(editor: Editor, view: FileView): leaflet.LatLng {
		const line = editor.getLine(editor.getCursor().line);
		const match = matchInlineLocation(line)?.next()?.value;
		let selectedLocation = null;
		if (match)
			selectedLocation = new leaflet.LatLng(parseFloat(match[1]), parseFloat(match[2]));
		else
		{
			const fmLocation = getFrontMatterLocation(view.file, this.app);
			if (line.indexOf('location') > -1 && fmLocation)
				selectedLocation = fmLocation;
		}
		if (selectedLocation) {
			verifyLocation(selectedLocation);
			return selectedLocation;
		}
		return null;
	}

	onunload() {
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}


class SettingsTab extends PluginSettingTab {
	plugin: CommentsViewPlugin;

	constructor(app: App, plugin: CommentsViewPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		let { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Settings for the comments view plugin.'});

		new Setting(containerEl)
			.setName('Username')
			.setDesc('Set the username to appear with all your comments')
			.addText(component => { component
					.setValue(this.plugin.settings.usernameString || '')
					.onChange(async (value: string) => {
						this.plugin.settings.usernameString = value;
						await this.plugin.saveSettings();
					})
				});
		//
		// new Setting(containerEl)
		// 	.setName('Default action for map marker click')
		// 	.setDesc('How should the corresponding note be opened when clicking a map marker? Either way, CTRL reverses the behavior.')
		// 	.addDropdown(component => { component
		// 		.addOption('samePane', 'Open in same pane (replace map view)')
		// 		.addOption('secondPane', 'Open in a 2nd pane and keep reusing it')
		// 		.addOption('alwaysNew', 'Always open a new pane')
		// 		.setValue(this.plugin.settings.markerClickBehavior || 'samePane')
		// 		.onChange(async (value: any) => {
		// 			this.plugin.settings.markerClickBehavior = value;
		// 			this.plugin.saveSettings();
		// 		})
		// 	});
		//
		// new Setting(containerEl)
		// 	.setName('New pane split direction')
		// 	.setDesc('Which way should the pane be split when opening in a new pane.')
		// 	.addDropdown(component => { component
		// 		.addOption('horizontal', 'Horizontal')
		// 		.addOption('vertical', 'Vertical')
		// 		.setValue(this.plugin.settings.newPaneSplitDirection || 'horizontal')
		// 			.onChange(async (value: any) => {
		// 				this.plugin.settings.newPaneSplitDirection = value;
		// 				this.plugin.saveSettings();
		// 			})
		// 	});
		//
		// new Setting(containerEl)
		// 	.setName('New note name format')
		// 	.setDesc('Date/times in the format can be wrapped in {{date:...}}, e.g. "note-{{date:YYYY-MM-DD}}".')
		// 	.addText(component => { component
		// 		.setValue(this.plugin.settings.newNoteNameFormat || DEFAULT_SETTINGS.newNoteNameFormat)
		// 		.onChange(async (value: string) => {
		// 			this.plugin.settings.newNoteNameFormat = value;
		// 			this.plugin.saveSettings();
		// 		})
		// 	});
		// new Setting(containerEl)
		// 	.setName('New note location')
		// 	.setDesc('Location for notes created from the map.')
		// 	.addText(component => { component
		// 		.setValue(this.plugin.settings.newNotePath || '')
		// 		.onChange(async (value: string) => {
		// 			this.plugin.settings.newNotePath = value;
		// 			this.plugin.saveSettings();
		// 		})
		// 	});
		// new Setting(containerEl)
		// 	.setName('Template file location')
		// 	.setDesc('Choose the file to use as a template, e.g. "templates/map-log.md".')
		// 	.addText(component => { component
		// 		.setValue(this.plugin.settings.newNoteTemplate || '')
		// 		.onChange(async (value: string) => {
		// 			this.plugin.settings.newNoteTemplate = value;
		// 			this.plugin.saveSettings();
		// 		})
		// 	});
		//
		// new Setting(containerEl)
		// 	.setName('Default zoom for "show on map" action')
		// 	.setDesc('When jumping to the map from a note, what should be the display zoom?')
		// 	.addSlider(component => {component
		// 		.setLimits(1, 18, 1)
		// 		.setValue(this.plugin.settings.zoomOnGoFromNote)
		// 			.onChange(async (value) => {
		// 				this.plugin.settings.zoomOnGoFromNote = value;
		// 				await this.plugin.saveSettings();
		// 			})
		// 	});
		//
		// new Setting(containerEl)
		// 	.setName('Map source (advanced)')
		// 	.setDesc('Source for the map tiles, see the documentation for more details. Requires to close & reopen the map.')
		// 	.addText(component => {component
		// 		.setValue(this.plugin.settings.tilesUrl)
		// 		.onChange(async (value) => {
		// 			this.plugin.settings.tilesUrl = value;
		// 			await this.plugin.saveSettings();
		// 		})
		// 	});
		//
		// new Setting(containerEl)
		// 	.setName('Edit the marker icons (advanced)')
		// 	.setDesc("Refer to the plugin documentation for more details.")
		// 	.addTextArea(component => component
		// 		.setValue(JSON.stringify(this.plugin.settings.markerIcons, null, 2))
		// 		.onChange(async value => {
		// 			try {
		// 				const newMarkerIcons = JSON.parse(value);
		// 				this.plugin.settings.markerIcons = newMarkerIcons;
		// 				await this.plugin.saveSettings();
		// 			} catch (e) {
		// 			}
		// 		}));

	}
}
