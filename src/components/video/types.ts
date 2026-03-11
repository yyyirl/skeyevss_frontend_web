export interface PlayRef {
	onScreenshot: () => void
	setCurrentTime: (duration: number) => void
	startRecord: () => Promise<any>
	stopRecordAndSave: () => Promise<any>
}