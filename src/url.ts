import {
	RepoType,
	RepoParseResult,
	SourceItem
} from './types';

import {
	getCurrentBranch,
	getRepoRemoteUrl,
	getRepoRootPath
} from './git';

function repoPathToFile(repoPath: string, item: SourceItem): string {
	return item.filepath.replace(repoPath, '');
}

// gitlab: #L6-10
// github: #L6-L10
function createSelectionInfo(item: SourceItem, repoType: RepoType): string {
	if (item.selection === undefined) {
		return '';
	}

	const startLine = item.selection.start.line + 1;
	const endLine = item.selection.end.line + 1;

	switch (repoType) {
		case RepoType.GitLab:
			return `#L${startLine}-${endLine}`;
		case RepoType.GitHub:
		case RepoType.Other:
			return `#L${startLine}-L${endLine}`;
	}
}

// git@github.com:org/repo.git
function parseUrl(repoUrl: string): RepoParseResult {
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

	let repoType = RepoType.Other;
	if (hostName.includes('github')) {
		repoType = RepoType.GitHub;
	} else if (hostName.includes('gitlab')) {
		repoType = RepoType.GitLab;
	}

	return {
		url,
		repoType
	};
}

export async function buildUrl(item: SourceItem): Promise<string | undefined> {
	console.debug('Building url for source item: ', item);
	try {
		const repoPath = await getRepoRootPath(item);
		if (!repoPath) {
			throw new Error('Could not obtain repo root path');
		}

		const branch = await getCurrentBranch(repoPath);
		if (!branch) {
			throw new Error('Could not get current branch');
		}

		const repoUrl = await getRepoRemoteUrl(repoPath);
		if (!repoUrl) {
			throw new Error(`Could not obtain repo url`);
		}

		const pathToFile = repoPathToFile(repoPath, item);
		const parseResult = parseUrl(repoUrl);
		const selectionInfo = createSelectionInfo(item, parseResult.repoType);
		const finalUrl = `${parseResult.url}/blob/${branch}${pathToFile}${selectionInfo}`;

		console.debug(`Final url: ${finalUrl}`);
		return finalUrl;
	} catch (e: any) {
		console.error(`Unable to construct repo url: ${e.message}`);
	}
	return;
}
