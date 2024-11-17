import { ItemView, WorkspaceLeaf } from 'obsidian';
import { VIEW_TYPE_OB_COMMENTS } from './constants'
import { debounce } from './utils'

export class CommentsView extends ItemView {

    constructor(leaf: WorkspaceLeaf) {
        super(leaf);
        this.redraw = this.redraw.bind(this);
        this.redraw_debounced = this.redraw_debounced.bind(this);
        this.containerEl = this.containerEl;
        this.registerEvent(this.app.workspace.on("layout-ready", this.redraw_debounced));
        this.registerEvent(this.app.workspace.on("file-open", this.redraw_debounced));
        this.registerEvent(this.app.workspace.on("quick-preview", this.redraw_debounced));
        this.registerEvent(this.app.vault.on("delete", this.redraw));
    }

    getViewType(): string {
        return VIEW_TYPE_OB_COMMENTS;
    }

    getDisplayText(): string {
        return "Comments";
    }

    getIcon(): string {
        return "lines-of-text";
    }

    onClose(): Promise<void> {
        return Promise.resolve();
    }

    async onOpen(): Promise<void> {
        this.redraw();
    }

    redraw_debounced = debounce(function () {
        this.redraw();
    }, 1000);

    async redraw() {
        let active_leaf = this.app.workspace.getActiveFile();
        this.containerEl.empty();
        this.containerEl.setAttribute('class', 'comment-panel')

        // Condition if current leaf is present
        if (active_leaf) {
            let page_content = await this.app.vault.read(active_leaf);
            // Convert into HTML element
            let page_html = document.createElement('Div')
            page_html.innerHTML = page_content;
            // Use HTML parser to find the desired elements
            // Get all .ob-comment elements
            let comment_list = page_html.querySelectorAll<HTMLElement>("label[class='ob-comment']");

            let El = document.createElement("h3");
            El.setAttribute('class', 'comment-count')
            this.containerEl.appendChild(El);
            El.setText('Comments: ' + comment_list.length);

            for (let i = 0; i < comment_list.length; i++) {
                let div = document.createElement('Div');
                div.setAttribute('class', 'comment-pannel-bubble')

                let labelEl = document.createElement("label");
                let pEl = document.createElement("p");
                pEl.setAttribute('class', 'comment-pannel-p1')

                // Extract the text before the * in the comment (the content before the checkbox)
                let commentText = comment_list[i].innerHTML.split('[')[0].trim(); // Get everything before the *
                let fullComment = comment_list[i].querySelector('input[type=checkbox]+span').innerHTML; // Get the full comment text

                // Add the extracted text to the right panel as a highlighted comment
                pEl.setText(commentText || '--');
                pEl.setAttribute('class', 'comment-pannel-p3'); // Ensure it gets the correct style

                // Add click event listener to reveal full comment
                pEl.addEventListener('click', () => {
                    // Toggle between showing the regular text and the full comment
                    if (pEl.textContent === commentText) {
                        pEl.setText(fullComment || '--');
                    } else {
                        pEl.setText(commentText || '--');
                    }
                });

                labelEl.appendChild(pEl);

                // Append the rest of the structure as before
                let inputEl = document.createElement("input");
                inputEl.setAttribute('type', 'checkbox');
                inputEl.setAttribute('style', 'display:none;');
                labelEl.appendChild(inputEl);

                // Create the remaining sections
                pEl = document.createElement("p");
                pEl.setAttribute('class', 'comment-pannel-p2');
                pEl.setText(commentText || '--');
                labelEl.appendChild(pEl);
                div.appendChild(labelEl);

                // Add the label to the panel
                this.containerEl.appendChild(div);
            }
        }
    }
}
