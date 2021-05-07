// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as child_process from 'child_process';
import * as path from 'path';

type SourceLocation = {
	line: number,
};

type SourceSelection = {
	start: SourceLocation,
	end: SourceLocation,
};

type SourceItem = {
	filepath: string,
	selection: SourceSelection | undefined,
};

async function executeCommand(command: string): Promise<string | undefined> {
	console.debug(`Executing: ${command}`);
	const results: string | undefined = await new Promise((resolve) => {
		child_process.exec(command, (err, stdout) => {
			if (err) {
				console.error(err);
				resolve(undefined);
			} else {
				// TODO
				// inspect output when there is no git repo
				const output = stdout.trim();
				console.log(output);
				resolve(output);
			}
		});
	});
	return results;
}

async function getRepoRootPath(item: SourceItem): Promise<string | undefined> {
	console.debug(`Getting repo root path for ${item.filepath}`);
	const directory = path.dirname(item.filepath);

	// change the current directory to the containing directory of the open file
	// and use git rev-parse to get the path to the current git repo (if there is one)
	const command = `cd ${directory} && git rev-parse --show-toplevel`;

	const results = await executeCommand(command);
	return results;
}

async function getRepoRemoteUrl(repoPath: string): Promise<string | undefined> {
	console.debug(`Getting repo remote url for ${repoPath}`);

	// change the current directory to the repo root and then use git remote get-url
	// to get the url of the repository (if there is one)
	const command = `cd ${repoPath} && git remote get-url origin`;

	const results = await executeCommand(command);
	return results;
}

async function getCurrentBranch(repoPath: string): Promise<string | undefined> {
	console.debug(`Getting current branch for repo ${repoPath}`);

	const command = `cd ${repoPath} && git branch --show-current`;

	const results = await executeCommand(command);
	return results;
}

function repoPathToFile(repoPath: string, item: SourceItem): string {
	return item.filepath.replace(repoPath, '');
}

// #L6-10
function createSelectionInfo(item: SourceItem): string {
	if (item.selection === undefined) {
		return '';
	}

	return `#L${item.selection.start.line}-${item.selection.end.line}`;
}

// git@github.com:org/repo.git
function parseUrl(repoUrl: string): string {
	console.debug(`Parsing url: ${repoUrl}`);

	const urlRegex = /^git@(?<hostName>\w+.\w+)$/
	const [prefix, repository] = repoUrl.split(':');

	const regexResults = urlRegex.exec(prefix);
	if (regexResults === null || regexResults.groups === undefined) {
		throw new Error(`Ill-formed url: ${repoUrl}`);
	}
	const hostName = regexResults.groups.hostName;

	if (!repository.endsWith('.git')) {
		throw new Error(`Ill-formed url: ${repoUrl}`);
	}

	const orgAndRepo = repository.replace('.git', '');

	const url = `https://${hostName}/${orgAndRepo}`;
	console.debug(`Parsed url: ${url}`);

	return url;
}

async function buildUrl(item: SourceItem): Promise<string | undefined> {
	console.debug('Building url for source item: ', item);
	try {
		const repoPath = await getRepoRootPath(item);
		if (!repoPath) {
			console.debug('Could not obtain repo root path');
			return;
		}

		const branch = await getCurrentBranch(repoPath);
		if (!branch) {
			console.debug('Could not get current branch');
			return;
		}

		const repoUrl = await getRepoRemoteUrl(repoPath);
		if (!repoUrl) {
			console.debug(`Could not obtain repo url`);
			return;
		}

		const pathToFile = repoPathToFile(repoPath, item);
		const baseUrl = parseUrl(repoUrl);
		const selectionInfo = createSelectionInfo(item);
		const finalUrl = `${baseUrl}/blob/${branch}${pathToFile}${selectionInfo}`;

		console.debug(`Final url: ${finalUrl}`);
		return finalUrl;
	} catch (e) {
		console.error(e);
	}
	return;
}

function linkBack(item: SourceItem) {
	const url = await buildUrl(item);
	if (!url) {
		return;
	}

	console.debug(`Launching: ${url}`);
	vscode.env.openExternal(vscode.Uri.parse(url));
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

// this method is called when your extension is deactivated
export function deactivate() {}
