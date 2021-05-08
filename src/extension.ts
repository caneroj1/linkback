// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import {
	SourceItem
} from './types';

import {
	buildUrl
} from './url';

async function linkBack(item: SourceItem) {
	try {
		const url = await buildUrl(item);
		console.debug(`Launching: ${url}`);
		vscode.env.openExternal(vscode.Uri.parse(url));
	} catch (e: any) {
		console.error(e);
		vscode.window.showErrorMessage(e.message);
	}
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	console.log('"linkback" now active');

	const openFileDisposable = vscode.commands.registerCommand('linkback.openFile', async () => {
		if (!vscode.window.activeTextEditor) {
			return;
		}

		const editor = vscode.window.activeTextEditor;
		const document = editor.document;

		const sourceItem: SourceItem = {
			filepath: document.fileName,
			selection: undefined,
		};

		linkBack(sourceItem);
	});

	context.subscriptions.push(openFileDisposable);

	const openFileSelectionDisposable = vscode.commands.registerCommand('linkback.openFileSelection', async () => {
		if (!vscode.window.activeTextEditor) {
			return;
		}

		const editor = vscode.window.activeTextEditor;
		const document = editor.document;
		const selection = editor.selection;

		const sourceItem: SourceItem = {
			filepath: document.fileName,
			selection: {
				start: {
					line: selection.start.line,
				},
				end: {
					line: selection.end.line,
				},
			},
		};

		linkBack(sourceItem);
	});

	context.subscriptions.push(openFileSelectionDisposable);
}

export function deactivate() { }
