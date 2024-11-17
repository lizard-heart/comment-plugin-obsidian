import { App, PluginSettingTab, Setting } from 'obsidian'
import CommentsPlugin from './main'

export default class CommentsSettingTab extends PluginSettingTab {
    plugin: CommentsPlugin;

    constructor(app: App, plugin: CommentsPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        let { containerEl } = this;

        containerEl.empty();
        containerEl.createEl('h2', { text: 'Comments Plugin Settings' });

    }
}