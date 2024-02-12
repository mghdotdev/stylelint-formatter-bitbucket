import type { Response } from 'node-fetch';
import fetch from 'node-fetch';
import { relative } from 'path';
import { Formatter, LintResult } from 'stylelint';
import pretty from 'stylelint-formatter-pretty';
import { BitBucketAnnotationItem, BitBucketReportData, Severities } from './types';
import { checkResponseStatus, getEnv, pluralize } from './util';

const BITBUCKET_WORKSPACE = getEnv('BITBUCKET_WORKSPACE');
const BITBUCKET_REPO_SLUG = getEnv('BITBUCKET_REPO_SLUG');
const BITBUCKET_COMMIT = getEnv('BITBUCKET_COMMIT');
const BITBUCKET_API_AUTH = getEnv('BITBUCKET_API_AUTH');

const MAX_ANNOTATIONS_PER_REQUEST = 100;

const httpClient = (() => {
	const urlPrefix = 'https://api.bitbucket.org';
	const headers = {
		'Authorization': BITBUCKET_API_AUTH,
		'Content-Type': 'application/json',
		'Accept': 'application/json'
	};

	return async (urlSuffix: string, method: 'POST' | 'PUT' | 'DELETE' = 'POST', body?: any) => {
		const response = await fetch(urlPrefix + urlSuffix, {
			method,
			headers,
			...body
				? {
					body: JSON.stringify(body)
				}
				: {}
		});

		return response;
	};
})();

const generateReport = (results: LintResult[]): BitBucketReportData => {
	const {errorCount, warningCount} = results.reduce(
		(acc, current) => {
			acc.errorCount += current.warnings.filter(warning => warning.severity === 'error').length;
			acc.warningCount += current.warnings.filter(warning => warning.severity === 'warning').length;

			return acc;
		},
		{
			errorCount: 0,
			warningCount: 0
		}
	);
	const problemCount = errorCount + warningCount;

	const details = [
		`${problemCount} ${pluralize('problem', problemCount)}`,
		`${errorCount} ${pluralize('error', errorCount)}`,
		`${warningCount} ${pluralize('warning', warningCount)}`
	].join('\n');

	const result = errorCount > 0 ? 'FAILED' : 'PASSED';

	return {
		title: 'Stylelint Bitbucket Reporter',
		logo_url: 'https://stylelint.io/img/light.svg',
		reporter: 'Stylelint',
		report_type: 'TEST',
		details,
		result
	};
};

const generateAnnotations = (results: LintResult[], reportId: string): BitBucketAnnotationItem[] => {
	return results.reduce<BitBucketAnnotationItem[]>((acc, result) => {
		const relativePath = relative(process.cwd(), result.source);

		return [
			...acc,
			...result.warnings.map((warning, i) => {
				const {line, text, severity, rule} = warning;

				return <BitBucketAnnotationItem> {
					external_id: `${reportId}-${relativePath}-${line}-${rule ?? ''}-${i}`,
					line,
					path: relativePath,
					summary: text,
					annotation_type: 'BUG',
					severity: severity === 'error'
						? Severities.HIGH
						: Severities.MEDIUM
				};
			})
		];
	}, []);
};

const deleteReport = (reportId: string): Promise<Response> => {
	return httpClient(`/2.0/repositories/${BITBUCKET_WORKSPACE}/${BITBUCKET_REPO_SLUG}/commit/${BITBUCKET_COMMIT}/reports/${reportId}`, 'DELETE');
};

const createReport = (reportId: string, reportData: BitBucketReportData): Promise<Response> => {
	return httpClient(`/2.0/repositories/${BITBUCKET_WORKSPACE}/${BITBUCKET_REPO_SLUG}/commit/${BITBUCKET_COMMIT}/reports/${reportId}`, 'PUT', reportData);
};

const createAnnotations = async (reportId: string, annotations: BitBucketAnnotationItem[]): Promise<Response> => {
	const chunk = annotations.slice(0, MAX_ANNOTATIONS_PER_REQUEST);
	const response = await httpClient(`/2.0/repositories/${BITBUCKET_WORKSPACE}/${BITBUCKET_REPO_SLUG}/commit/${BITBUCKET_COMMIT}/reports/${reportId}/annotations`, 'POST', chunk);

	if (annotations.length > MAX_ANNOTATIONS_PER_REQUEST) {
		return createAnnotations(reportId, annotations.slice(MAX_ANNOTATIONS_PER_REQUEST));
	}

	return response;
};

const processResults = async (results: LintResult[]) => {
	const reportId = `stylelint-${BITBUCKET_COMMIT}`;
	const report = generateReport(results);
	const annotations = generateAnnotations(results, reportId);

	try {
		console.log('✍🏼 Deleting previous report...');
		const response = await deleteReport(reportId)
		checkResponseStatus(response);
		console.log('✅ Previous report deleted!');
	}
	catch (error: any) {
		console.log('❌ Report deletion failed!');

		if (error.response) {
			console.error(error.message, await error.response.text());
		}
		else {
			console.error(error);
		}

		throw error;
	}

	try {
		console.log('✍🏼 Creating a new report...');
		const response = await createReport(reportId, report);
		checkResponseStatus(response);
		console.log('✅ New report created');
	}
	catch (error: any) {
		console.log('❌ Report creation failed');

		if (error.response) {
			console.error(error.message, await error.response.text());
		}
		else {
			console.error(error);
		}

		throw error;
	}

	try {
		if (annotations.length > 0) {
			console.log('✍🏼 Adding new annotations...');
			const response = await createAnnotations(reportId, annotations);
			checkResponseStatus(response);
			console.log('✅ Annotations added!');
		}
		else {
			console.log('⚠️ No annotations found!', annotations);
		}
	}
	catch (error: any) {
		console.log('❌ Annotations adding failed!');

		if (error.response) {
			console.error(error.message, await error.response.text());
		}
		else {
			console.error(error);
		}

		throw error;
	}
};

const formatter: Formatter = results => {
	void processResults(results);

	return pretty(results);
};

export = formatter;
