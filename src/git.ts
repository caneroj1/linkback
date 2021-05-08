import * as child_process from 'child_process';
import * as path from 'path';

import {
    SourceItem
} from './types';

async function executeCommand(command: string): Promise<string | undefined> {
	console.debug(`Executing: ${command}`);
	const results: string | undefined = await new Promise((resolve) => {
		child_process.exec(command, (err, stdout) => {
			if (err) {
				console.error(err);
				resolve(undefined);
			} else {
				const output = stdout.trim();
				resolve(output);
			}
		});
	});
	return results;
}

export async function getRepoRootPath(item: SourceItem): Promise<string | undefined> {
	console.debug(`Getting repo root path for ${item.filepath}`);
	const directory = path.dirname(item.filepath);

	// change the current directory to the containing directory of the open file
	// and use git rev-parse to get the path to the current git repo (if there is one)
	const command = `cd ${directory} && git rev-parse --show-toplevel`;

	const results = await executeCommand(command);
	return results;
}

export async function getRepoRemoteUrl(repoPath: string): Promise<string | undefined> {
	console.debug(`Getting repo remote url for ${repoPath}`);

	// change the current directory to the repo root and then use git remote get-url
	// to get the url of the repository (if there is one)
	const command = `cd ${repoPath} && git remote get-url origin`;

	const results = await executeCommand(command);
	return results;
}

export async function getCurrentBranch(repoPath: string): Promise<string | undefined> {
	console.debug(`Getting current branch for repo ${repoPath}`);

    // change the current directory to the repo root and then use git branch --show-current
	// to get the name of the current git branch
	const command = `cd ${repoPath} && git branch --show-current`;

	const results = await executeCommand(command);
	return results;
}
