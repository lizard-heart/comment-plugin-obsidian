import { debounce, App, TAbstractFile, Editor, ButtonComponent, MarkdownView, ItemView, Modal, MenuItem, Menu, TFile, TextComponent, DropdownComponent, WorkspaceLeaf } from 'obsidian';
import * as leaflet from 'leaflet';
// import { parseYaml, Plugin, WorkspaceLeaf } from "obsidian";
// Ugly hack for obsidian-leaflet compatability, see https://github.com/esm7/obsidian-map-view/issues/6
// @ts-ignore
import * as leafletFullscreen from 'leaflet-fullscreen';
import '@fortawesome/fontawesome-free/js/all.min';
import 'leaflet/dist/leaflet.css';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import 'leaflet-geosearch/dist/geosearch.css';

import * as consts from 'src/consts';
import { PluginSettings, DEFAULT_SETTINGS } from 'src/settings';
// import { MarkersMap, FileMarker, buildMarkers, getIconFromOptions, buildAndAppendFileMarkers } from 'src/markers';
import CommentsViewPlugin from 'src/main';
import * as utils from 'src/utils';
import {
    DEFAULT_SETTINGS,
    INTIATIVE_TRACKER_VIEW,
    registerIcons
} from "./views";
// import TrackerView from "./view";

let globalFileContents = "UH OH THERE WAS AN ERROR WHERE YOUR FILE GOT DELETED UNDOING, SAVING YOUR FILE AND TRYING AGAIN"
let localUserName = ""
let replyComment = ""

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);

	}

	onOpen() {
		let {contentEl} = this;
		contentEl.createEl("h1", { text: "Reply to comment" });
		contentEl.createEl("input",{ attr: { id: "my-id" } })
		console.log(document.getElementById('my-id').value)
		// contentEl.createEl("button", { text: "Post" });
		this.contentEl.createDiv("modal-button-container", (buttonsEl) => {
			buttonsEl
				.createEl("button", { text: "Post comment" })
				.addEventListener("click", () => this.close());
			});


	}

	onClose() {

      let {contentEl} = this;
      const { workspace } = this.app;
      const activeView = workspace.getActiveViewOfType(MarkdownView);
      if (replyComment == "NONE") {
        if (activeView) {
          this.app.vault.modify(activeView.file, globalFileContents+"\n - " + localUserName + ": " + document.getElementById('my-id').value);
            // const fileContents = this.app.vault.cachedRead(activeView.file);
            // this.app.vault.modify(activeView.file, globalFileContents+"\n - " + localUserName + ": " + document.getElementById('my-id').value);
          };
      } else {
        if (activeView) {
          // console.log("should be replying to " + replyComment)
          this.app.vault.modify(activeView.file, globalFileContents.split(replyComment)[0]+replyComment + "- ________" + localUserName + ": " + document.getElementById('my-id').value + "\n" + globalFileContents.split(replyComment)[1]);
        }
      }
	}
}

// type MapState = {
// 	mapZoom: number;
// 	mapCenter: leaflet.LatLng;
// 	tags: string[];
// 	version: number;
// }

let allComments = []

export class CommentsView extends ItemView {
	private settings: PluginSettings;
	// The private state needs to be updated solely via updateMapToState
	private state: MapState;
	private display = new class {
		map: leaflet.Map;
		markers: MarkersMap = new Map();
		commentsDiv: HTMLDivElement;
		tagsBox: TextComponent;
	};
	private plugin: CommentsViewPlugin;
	private defaultState: MapState;
	private newPaneLeaf: WorkspaceLeaf;
	private isOpen: boolean = false;

	public onAfterOpen: (map: leaflet.Map, markers: MarkersMap) => any = null;

	constructor(leaf: WorkspaceLeaf, settings: PluginSettings, plugin: CommentsViewPlugin) {
		super(leaf);
		this.navigation = true;
    this.registerEvent(this.app.workspace.on("file-open", (_: any) => this.redraw()));
    this.registerEvent(
      this.app.vault.on("modify", (_: any) => this.redraw())
    );
		this.settings = settings;
		this.plugin = plugin;
		// Create the default state by the configuration
		// this.defaultState = {
		// 	mapZoom: this.settings.defaultZoom || consts.DEFAULT_ZOOM,
		// 	mapCenter: this.settings.defaultMapCenter || consts.DEFAULT_CENTER,
		// 	tags: this.settings.defaultTags || consts.DEFAULT_TAGS,
		// 	version: 0
		// };
		// this.setState = async (state: MapState, result) => {
		// 	if (state) {
		// 		console.log(`Received setState:`, state);
		// 		// We give the given state priority by setting a high version
		// 		state.version = 100;
		// 		await this.updateMapToState(state);
		// 	}
		// }
		// this.getState = (): MapState => {
		// 	return this.state;
		// }

		this.app.vault.on('delete', file => this.updateMarkersWithRelationToFile(file.path, null, true));
		this.app.vault.on('rename', (file, oldPath) => this.updateMarkersWithRelationToFile(oldPath, file, true));
		this.app.metadataCache.on('changed', file => this.updateMarkersWithRelationToFile(file.path, file, false));
	}

	getViewType() { return "comment-pane-view"; }
	getDisplayText() { return 'Comment View'; }


	async onOpen() {
    await this.redraw()
    super.onOpen()
  }

	onClose() {
		this.isOpen = false;
		return super.onClose();
	}

	getFileListByQuery(tags: string[]): TFile[] {
		let results: TFile[] = [];
		const allFiles = this.app.vault.getFiles();
		for (const file of allFiles) {
			var match = true;
			if (tags && tags.length > 0) {
				// A tags query exist, file defaults to non-matching and we'll add it if it has one of the tags
				match = false;
				const fileCache = this.app.metadataCache.getFileCache(file);
				if (fileCache && fileCache.tags) {
					const tagsMatch = fileCache.tags.some(tagInFile => tags.indexOf(tagInFile.tag) > -1);
					if (tagsMatch)
						match = true;
				}
			}
			if (match)
				results.push(file);
		}
		return results;
	}

	// updateMapMarkers(newMarkers: FileMarker[]) {
	//
	// }

	// async autoFitMapToMarkers() {
	//
	// 	// if (this.display.markers.size > 0) {
	// 	// 	const locations: leaflet.LatLng[] = Array.from(this.display.markers.values()).map(fileMarker => fileMarker.location);
	// 	// 	console.log(`Auto fit by state:`, this.state);
	// 	// 	this.display.map.fitBounds(leaflet.latLngBounds(locations));
	// 	// }
	// }

  async redraw() {
    const { workspace } = this.app;
    const activeView = workspace.getActiveViewOfType(MarkdownView);
    localUserName = this.plugin.settings.usernameString
    this.contentEl.empty();
    if (activeView) {
        const fileContents = await this.app.vault.cachedRead(activeView.file);
        if (fileContents.includes("# Comments")) {
          // this.app.vault.modify(activeView.file, fileContents+"test")
        } else {
          this.app.vault.modify(activeView.file, fileContents+"\n # Comments \n - initial comment")
        }
    }
    // this.postCommentToFile();
    let commentBox = await this.getCommentList();
    console.log(allComments);
    // let commentBox = createDiv({
    // 	'text': "text"
    // }, (el: HTMLDivElement) => {
    // 	el.style.position = 'topright';
    // 	el.style.zIndex = '3';
    // });
    // let replyButton = new ButtonComponent(commentBox);
    // replyButton
    // 	.setButtonText("Reply")
    // 	.setTooltip('Reply to this comment');
      // .onClick(() => this.autoFitMapToMarkers());

      this.contentEl.createDiv("modal-button-container", (buttonsEl) => {
        buttonsEl
          .createEl("button", { text: "New comment" })
          .addEventListener("click", () => {
            replyComment = "NONE"
            new SampleModal(this.app).open();
          });
        });

    var arr = [9,8,7,6,5,4]
    var i:number;
    for (i=1;i<allComments.length;i++) {
      let currentcommenttext = allComments[i].toString()
      let newText = createDiv({
        'text': currentcommenttext
      });
      let newReplyButton = new ButtonComponent(newText);
      globalFileContents = await this.app.vault.cachedRead(activeView.file);
      newReplyButton.onClick(() => {
        replyComment = currentcommenttext
        console.log("reply comment" + replyComment)
        new SampleModal(this.app).open();
      })
        .setButtonText("Reply")
        .setTooltip('Reply to this comment');
      this.contentEl.append(newText);
      // this.onload()
    }

    // let commentBox2 = createDiv({
    // 	'text': "______reply to comment"
    // }, (el: HTMLDivElement) => {
    // 	el.style.position = 'topright';
    // 	el.style.zIndex = '3';
    // });
    // let replyButton2 = new ButtonComponent(commentBox2);
    // replyButton2
    // 	.setButtonText("Reply")
    // 	.setTooltip('Reply to this comment');
        // .onClick(() => this.autoFitMapToMarkers());

    //
    // let commentBox3 = createDiv({
    // 	'text': "another comment"
    // }, (el: HTMLDivElement) => {
    // 	el.style.position = 'topright';
    // 	el.style.zIndex = '3';
    // });
    // let replyButton3 = new ButtonComponent(commentBox3);
    // replyButton3
    // 	.setButtonText("Reply")
    // 	.setTooltip('Reply to this comment');

    var that = this;
    this.isOpen = true;
    this.state = this.defaultState;
    let newComment = createDiv({
      'cls': 'graph-controls',
      'text': 'New Comment'
    }, (el: HTMLDivElement) => {
      // el.style.position = 'fixed';
      el.style.zIndex = '2';
    });
    this.display.tagsBox = new TextComponent(newComment);
    this.display.tagsBox.setPlaceholder('Comment text');
    this.display.tagsBox.onChange(async (tagsBox: string) => {
      that.state.tags = tagsBox.split(',').filter(t => t.length > 0);
    });

    let fitButton = new ButtonComponent(newComment);
    fitButton
      .setButtonText("Post the comment")
      .setTooltip('Add your comment to the thread')
      // .onClick(() => this.autoFitMapToMarkers());

    this.contentEl.style.padding = '100px 100px';
    // this.contentEl.append(newComment);
    // this.contentEl.append(commentBox);
    // this.contentEl.append(commentBox2);
    // this.contentEl.append(commentBox3);

    this.display.commentsDiv = createDiv({cls: 'map'}, (el: HTMLDivElement) => {
      el.style.zIndex = '1';
      el.style.width = '100%';
      el.style.height = '100%';
    });
    this.contentEl.append(this.display.commentsDiv);
    console.log("testing")
  }

	async goToFile(file: TFile, useCtrlKeyBehavior: boolean, fileLocation?: number, highlight?: boolean) {
		let leafToUse = this.app.workspace.activeLeaf;
		const defaultDifferentPane = this.settings.markerClickBehavior != 'samePane';
		// Having a pane to reuse means that we previously opened a note in a new pane and that pane still exists (wasn't closed)
		const havePaneToReuse = this.newPaneLeaf && this.newPaneLeaf.view && this.settings.markerClickBehavior != 'alwaysNew';
		if (havePaneToReuse || (defaultDifferentPane && !useCtrlKeyBehavior) || (!defaultDifferentPane && useCtrlKeyBehavior)) {
			// We were instructed to use a different pane for opening the note.
			// We go here in the following cases:
			// 1. An existing pane to reuse exists (the user previously opened it, with or without Ctrl).
			//    In this case we use the pane regardless of the default or of Ctrl, assuming that if a user opened a pane
			//    once, she wants to retain it until it's closed. (I hope no one will treat this as a bug...)
			// 2. The default is to use a different pane and Ctrl is not pressed.
			// 3. The default is to NOT use a different pane and Ctrl IS pressed.
			const someOpenMarkdownLeaf = this.app.workspace.getLeavesOfType('markdown');
			if (havePaneToReuse) {
				// We have an existing pane, that pane still has a view (it was not closed), and the settings say
				// to use a 2nd pane. That's the only case on which we reuse a pane
				this.app.workspace.setActiveLeaf(this.newPaneLeaf);
				leafToUse = this.newPaneLeaf;
			} else if (someOpenMarkdownLeaf.length > 0 && this.settings.markerClickBehavior != 'alwaysNew') {
				// We don't have a pane to reuse but the user wants a new pane and there is currently an open
				// Markdown pane. Let's take control over it and hope it's the right thing to do
				this.app.workspace.setActiveLeaf(someOpenMarkdownLeaf[0]);
				leafToUse = someOpenMarkdownLeaf[0];
				this.newPaneLeaf = leafToUse;
			} else {
				// We need a new pane. We split it the way the settings tell us
				this.newPaneLeaf = this.app.workspace.splitActiveLeaf(this.settings.newPaneSplitDirection || 'horizontal');
				leafToUse = this.newPaneLeaf;
			}
		}
		await leafToUse.openFile(file);
		const editor = this.getEditor();
		if (editor) {
			if (fileLocation) {
				let pos = editor.offsetToPos(fileLocation);
				if (highlight) {
					editor.setSelection({ch: 0, line: pos.line}, {ch: 1000, line: pos.line});
				} else {
					editor.setCursor(pos);
					editor.refresh();
				}
			}
			editor.focus();
		}

	}

	async goToMarker(marker: FileMarker, useCtrlKeyBehavior: boolean, highlight: boolean) {
		return this.goToFile(marker.file, useCtrlKeyBehavior, marker.fileLocation, highlight);
	}

	async getCommentList() {
		const { workspace } = this.app;
		const activeView = workspace.getActiveViewOfType(MarkdownView);
		let textBox = createDiv({
				'text': "no text"
			})
		if (activeView) {
				const fileContents = await this.app.vault.cachedRead(activeView.file);
				allComments = (fileContents.split("# Comments")[1]).split("- ")
				// console.log(allComments)
				textBox = createDiv({
						'text': (fileContents.split("# Comments")[1]).split("- ")[1]
					})
				// const allComments = textBox.Text()
				}
		}

		async postCommentToFile() {
			console.log("testing")
			// const { workspace } = this.app;
			// const activeView = workspace.getActiveViewOfType(MarkdownView);
			// if (activeView) {
			// 		const fileContents = await this.app.vault.cachedRead(activeView.file);
			// 		this.app.vault.modify(activeView.file, fileContents+document.getElementById('my-id').value);
			// };
		}

	getAllTagNames() : string[] {
		let tags: string[] = [];
		const allFiles = this.app.vault.getFiles();
		for (const file of allFiles) {
			const fileCache = this.app.metadataCache.getFileCache(file);
			if (fileCache && fileCache.tags) {
				const fileTagNames = getAllTags(fileCache) || [];
				tags = tags.concat(fileTagNames.filter(tagName => tags.indexOf(tagName) < 0));
			}
		}
		tags = tags.sort();
		return tags;
	}

	getEditor() : Editor {
		let view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (view)
			return view.editor;
		return null;
	}

	private async updateMarkersWithRelationToFile(fileRemoved: string, fileAddedOrChanged: TAbstractFile, skipMetadata: boolean) {
		if (!this.display.map || !this.isOpen)
			return;
		let newMarkers: FileMarker[] = [];
		for (let [markerId, fileMarker] of this.display.markers) {
			if (fileMarker.file.path !== fileRemoved)
				newMarkers.push(fileMarker);
		}
		if (fileAddedOrChanged && fileAddedOrChanged instanceof TFile)
			await buildAndAppendFileMarkers(newMarkers, fileAddedOrChanged, this.settings, this.app)
		// this.updateMapMarkers(newMarkers);
	}

}
