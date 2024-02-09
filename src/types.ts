export enum Severities {
	MEDIUM = 'MEDIUM',
	HIGH = 'HIGH'
};

export interface BitBucketAnnotationItem {
	external_id: string
	line: number
	path: string
	summary: string
	annotation_type: 'BUG'
	severity: Severities
};

export interface BitBucketReportData {
	logo_url: string
	title: string
	reporter: string
	report_type: string
	details: string
	result: 'FAILED' | 'PASSED'
};
