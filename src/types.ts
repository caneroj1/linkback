export enum RepoType {
	GitHub,
	GitLab,
	Other,
}

export type RepoParseResult = {
	url: string,
	repoType: RepoType,
}

export type SourceLocation = {
	line: number,
}

export type SourceSelection = {
	start: SourceLocation,
	end: SourceLocation,
}

export type SourceItem = {
	filepath: string,
	selection: SourceSelection | undefined,
}
