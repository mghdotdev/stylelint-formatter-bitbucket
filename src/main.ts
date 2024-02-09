import { Formatter, LintResult } from 'stylelint';
import pretty from 'stylelint-formatter-pretty';
import { getEnv } from './util';

const BITBUCKET_WORKSPACE = getEnv('BITBUCKET_WORKSPACE');
const BITBUCKET_REPO_SLUG = getEnv('BITBUCKET_REPO_SLUG');
const BITBUCKET_COMMIT = getEnv('BITBUCKET_COMMIT');
const BITBUCKET_API_AUTH = getEnv('BITBUCKET_API_AUTH');

const processResults = (results: LintResult[]) => {

};

const formatter: Formatter = results => {
	processResults(results);

	return pretty(results);
};

export = formatter;
