import * as assert from 'assert';
import * as vscode from 'vscode';

import { RepoType, SourceItem } from '../../types';
import {
	parseUrl,
	createSelectionInfo
}  from '../../url';

suite('Linkback Test Suite', () => {
	vscode.window.showInformationMessage('Starting test suite');

	test('Parse github url', () => {
		const testUrl = 'git@github.com:org1/repo1.git';
		const results = parseUrl(testUrl);
		assert(results.repoType === RepoType.gitHub);
		assert(results.url === 'https://github.com/org1/repo1');
	});

	test('Parse gitlab url', () => {
		const testUrl = 'git@gitlab.com:org1/repo1.git';
		const results = parseUrl(testUrl);
		assert(results.repoType === RepoType.gitLab);
		assert(results.url === 'https://gitlab.com/org1/repo1');
	});

	test('Parse other github url', () => {
		const testUrl = 'git@clone.github.org:org1/repo1.git';
		const results = parseUrl(testUrl);
		assert(results.repoType === RepoType.gitHub);
		assert(results.url === 'https://clone.github.org/org1/repo1');
	});

	test('Parse other gitlab url', () => {
		const testUrl = 'git@clone.gitlab.gov:org-name/repo-name_123.git';
		const results = parseUrl(testUrl);
		assert(results.repoType === RepoType.gitHub);
		assert(results.url === 'https://clone.gitlab.org/org-name/repo-name_123');
	});

	test('Parse other git host url', () => {
		const testUrl = 'git@gitbucket.com:org-name/repo-name_123.git';
		const results = parseUrl(testUrl);
		assert(results.repoType === RepoType.other);
		assert(results.url === 'https://gitbucket.com/org-name/repo-name_123');
	});

	test('Parse non-git url', () => {
		const testUrl = 'google.com';
		assert.throws(() => parseUrl(testUrl), new Error(`Ill-formed url: ${testUrl}`));
	});

	test('Parse malformed git url', () => {
		const testUrl = 'git@githost.com/org/repo';
		assert.throws(() => parseUrl(testUrl), new Error(`Ill-formed url: ${testUrl}`));
	});

	test('Create github selection info', () => {
		const sourceItem: SourceItem = {
			filepath: 'test',
			selection: {
				start: {
					line: 1,
				},
				end: {
					line: 100,
				}
			},
		}
		const selectionInfo = createSelectionInfo(sourceItem, RepoType.gitHub);
		assert(selectionInfo === '#L1-L100');
	});

	test('Create gitlab selection info', () => {
		const sourceItem: SourceItem = {
			filepath: 'test',
			selection: {
				start: {
					line: 1,
				},
				end: {
					line: 100,
				}
			},
		}
		const selectionInfo = createSelectionInfo(sourceItem, RepoType.gitLab);
		assert(selectionInfo === '#L1-100');
	});

	test('Create other selection info', () => {
		const sourceItem: SourceItem = {
			filepath: 'test',
			selection: {
				start: {
					line: 1,
				},
				end: {
					line: 100,
				}
			},
		}
		const selectionInfo = createSelectionInfo(sourceItem, RepoType.other);
		assert(selectionInfo === '#L1-L100');
	});
});
