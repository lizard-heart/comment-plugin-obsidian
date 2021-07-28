# Comment Plugin

This plugin will add a comment view to obsidian that shows the "comments" stored in the selected note. Comments have a username and text content. Comments can also be "replied" to.

## Installation
First, clone or download this repository. You will need to move this obsidian-comment-plugin folder YOUR_OBSIDIAN_VAULT/.obsidian/plugins or whatever the path to your obsidian plugin folder is. To find this folder, you can also go to Installed Plugins in Obsidian and click the folder icon called Open Plugins Folder. Then reload Obsidian, go to installed plugins, and turn the comment plugin on.

### Making changes
If you want to make any changes, open the folder in terminal or command prompt and run the `npm  i` command. NodeJS needs to be installed. Then the `npm run dev` command will automatically compile the typescript files and create new `main.js` and `manifest.json` files. Make your changes to the .ts files when you are done, replace the old `main.js` and `manifest.json` file with the new ones in the `dist` directory.

## How to use
- In the plugin settings, you can specify the username you would like to show up with any comments you write.
- To open the comment view, open the command palette and use the Open Comment View command. This will show the comments for the note you have open.
- Click the plus button to add a new comment.
- Any comments are stored at the bottom of each note.
