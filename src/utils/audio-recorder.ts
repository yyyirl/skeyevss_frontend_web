interface RecordingCallbacks {
	onData: (data: Blob) => void
	onVolume: (volume: number) => void
	onError: (error: string) => void
}

interface AudioRecorderConfig {
	inputSampleRate: number // 输入采样率
	inputSampleBits: 8 | 16 // 输入采样位数
	outputSampleRate: number // 输出采样率
	outputSampleBits: 8 | 16 // 输出采样位数
}

export default class AudioRecorder {
	private mediaStream: MediaStream | undefined
	private audioContext: AudioContext | undefined
	private sourceNode: MediaStreamAudioSourceNode | undefined
	private processor: ScriptProcessorNode | undefined
	private analyser: AnalyserNode | undefined
	private dataArray: Uint8Array | undefined
	private animationId: number | undefined
	private chunks: ArrayBuffer[] = []
	private isRecording: boolean = false
	private useWorklet: boolean = false
	private readonly resampleBuffer: Float32Array[] = []
	private readonly resampleOffset: number = 0
	private readonly maxInputSamples = 1024

	// 新增：20ms发送控制
	private readonly sendIntervalMs: number = 20
	private lastSendTime: number = 0
	private audioBuffer: ArrayBuffer[] = []
	private sendTimer: number | null = null

	constructor(
		private readonly callbacks: RecordingCallbacks,
		private readonly config: AudioRecorderConfig = {
			inputSampleRate: 48000,
			inputSampleBits: 16,
			outputSampleRate: 8000,
			outputSampleBits: 16
		},
		sendIntervalMs: number = 20 // 新增参数
	) {
		this.sendIntervalMs = sendIntervalMs
	}

	async start(): Promise<void> {
		try {
			this.mediaStream = await navigator.mediaDevices.getUserMedia({
				audio: {
					sampleRate: this.config.inputSampleRate,
					channelCount: 1,
					echoCancellation: true,
					noiseSuppression: true
				}
			})

			this.audioContext = new AudioContext({
				sampleRate: this.config.inputSampleRate
			})

			if (this.audioContext.state === 'suspended') {
				await this.audioContext.resume()
			}

			this.useWorklet = typeof this.audioContext.audioWorklet !== 'undefined'

			if (this.useWorklet) {
				await this.startWithWorklet()
			} else {
				await this.startWithScriptProcessor()
			}

			this.startVolumeMonitoring()

			this.isRecording = true
			this.lastSendTime = Date.now()

			// 启动定时发送
			this.startSending()
		} catch (error: unknown) {
			this.isRecording = false
			this.stopVolumeAnalysis()
			const errorMessage = error instanceof Error ? error.message : '麦克风访问失败'
			this.callbacks.onError(errorMessage === '麦克风设备读取失败' ? '' : errorMessage)
		}
	}

	private async startWithWorklet(): Promise<void> {
		if (this.audioContext === undefined || this.mediaStream === undefined) {
			return
		}

		try {
			await this.audioContext.audioWorklet.addModule('/pcm-processor.js')
		} catch (error) {
			console.warn('AudioWorklet加载失败，降级到ScriptProcessorNode', error)
			await this.startWithScriptProcessor()
			return
		}

		this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream)
		this.analyser = this.audioContext.createAnalyser()
		this.analyser.fftSize = 256
		this.analyser.smoothingTimeConstant = 0.3

		const workletNode = new AudioWorkletNode(this.audioContext, 'pcm-processor', {
			processorOptions: {
				inputSampleRate: this.config.inputSampleRate,
				outputSampleRate: this.config.outputSampleRate,
				inputSampleBits: this.config.inputSampleBits,
				outputSampleBits: this.config.outputSampleBits,
				sendIntervalMs: this.sendIntervalMs
			}
		})

		workletNode.port.onmessage = (event: MessageEvent) => {
			if (!this.isRecording) return

			const pcmData = new Uint8Array(event.data.buffer as ArrayBuffer)
			// 累积数据，不立即发送
			this.audioBuffer.push(pcmData.buffer)
		}

		this.sourceNode.connect(this.analyser)
		this.sourceNode.connect(workletNode)
		workletNode.connect(this.audioContext.destination)
	}

	private async startWithScriptProcessor(): Promise<void> {
		if (this.audioContext === undefined || this.mediaStream === undefined) {
			return
		}

		this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream)
		this.analyser = this.audioContext.createAnalyser()
		this.analyser.fftSize = 256
		this.analyser.smoothingTimeConstant = 0.3

		const bufferSize = 4096
		this.processor = this.audioContext.createScriptProcessor(bufferSize, 1, 1)

		this.processor.onaudioprocess = (event: AudioProcessingEvent) => {
			if (!this.isRecording) return

			const inputData = event.inputBuffer.getChannelData(0)
			const processedData = this.processAudioData(
				inputData,
				this.config.inputSampleRate,
				this.config.outputSampleRate,
				this.config.inputSampleBits,
				this.config.outputSampleBits
			)

			if (processedData !== null) {
				// 累积数据，不立即发送
				this.audioBuffer.push(processedData.buffer)
				this.chunks.push(processedData.buffer)
			}
		}

		this.sourceNode.connect(this.analyser)
		this.sourceNode.connect(this.processor)
		this.processor.connect(this.audioContext.destination)
	}

	// 新增：启动定时发送
	private startSending(): void {
		const sendFunc = (): void => {
			if (!this.isRecording) return

			// 发送累积的数据
			this.sendAccumulatedData()
			// 继续下一次
			this.sendTimer = window.setTimeout(sendFunc, this.sendIntervalMs)
		}

		// 立即开始
		this.sendTimer = window.setTimeout(sendFunc, this.sendIntervalMs)
	}

	// 新增：发送累积的数据
	private sendAccumulatedData(): void {
		if (this.audioBuffer.length === 0) return

		const totalBytes = this.audioBuffer.reduce((acc, chunk) => acc + chunk.byteLength, 0)
		// 如果数据量太少，等待更多数据
		if (totalBytes < 320 && this.sendIntervalMs === 20) { // 20ms * 8000Hz = 160样本 = 320字节（16位）
			return
		}

		// 合并数据
		const mergedData = new Uint8Array(totalBytes)
		let offset = 0

		for (const chunk of this.audioBuffer) {
			const chunkArray = new Uint8Array(chunk)
			mergedData.set(chunkArray, offset)
			offset += chunkArray.length
		}

		this.callbacks.onData(new Blob([ mergedData ], { type: 'audio/pcm' }))
		this.audioBuffer = []
	}

	private processAudioData(
		inputData: Float32Array,
		inputRate: number,
		outputRate: number,
		inputBits: number,
		outputBits: number
	): Uint8Array | null {
		const resampledData: Float32Array = inputRate === outputRate
			? inputData
			: this.resampleLinear(
				inputData,
				inputRate,
				outputRate
			)
		if (outputBits === 8) {
			return this.floatTo8BitPCM(resampledData)
		}

		return new Uint8Array(this.floatTo16BitPCM(resampledData).buffer)
	}

	private resampleLinear(input: Float32Array, inputRate: number, outputRate: number): Float32Array {
		const ratio = inputRate / outputRate
		const outputLength = Math.floor(input.length / ratio)
		const output = new Float32Array(outputLength)

		for (let i = 0; i < outputLength; i++) {
			const inputIndex = i * ratio
			const index = Math.floor(inputIndex)
			const fraction = inputIndex - index

			if (index + 1 < input.length) {
				output[ i ] = input[ index ] * (1 - fraction) + input[ index + 1 ] * fraction
			} else {
				output[ i ] = input[ index ]
			}
		}

		return output
	}

	private floatTo8BitPCM(float32Array: Float32Array): Uint8Array {
		const uint8Array = new Uint8Array(float32Array.length)
		for (let i = 0; i < float32Array.length; i++) {
			const sample = Math.max(-1, Math.min(1, float32Array[ i ]))
			uint8Array[ i ] = Math.floor((sample + 1) * 127.5)
		}
		return uint8Array
	}

	private floatTo16BitPCM(float32Array: Float32Array): Int16Array {
		const int16Array = new Int16Array(float32Array.length)
		for (let i = 0; i < float32Array.length; i++) {
			const sample = Math.max(-1, Math.min(1, float32Array[ i ]))
			int16Array[ i ] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF
		}

		return int16Array
	}

	stop(): Blob | null {
		this.isRecording = false
		this.stopVolumeAnalysis()

		// 停止定时器
		if (this.sendTimer !== null) {
			window.clearTimeout(this.sendTimer)
			this.sendTimer = null
		}

		// 发送剩余的数据
		this.sendAccumulatedData()

		if (this.mediaStream === undefined || this.audioContext === undefined) {
			return null
		}

		this.mediaStream.getTracks().forEach(track => {
			track.stop()
		})

		if (this.processor !== undefined) {
			this.processor.disconnect()
			this.processor.onaudioprocess = null
		}

		if (this.analyser !== undefined) {
			this.analyser.disconnect()
		}

		if (this.sourceNode !== undefined) {
			this.sourceNode.disconnect()
		}

		if (this.audioContext.state !== 'closed') {
			void this.audioContext.close()
		}

		if (this.chunks.length > 0) {
			const totalBytes = this.chunks.reduce((acc, chunk) => acc + chunk.byteLength, 0)
			const mergedData = new Uint8Array(totalBytes)
			let offset = 0

			for (const chunk of this.chunks) {
				const chunkArray = new Uint8Array(chunk)
				mergedData.set(chunkArray, offset)
				offset += chunkArray.length
			}

			this.chunks = []
			return new Blob([ mergedData ], { type: 'audio/pcm' })
		}

		return null
	}

	private startVolumeMonitoring(): void {
		if (this.analyser === undefined) {
			return
		}

		const bufferLength = this.analyser.frequencyBinCount
		this.dataArray = new Uint8Array(bufferLength)

		const analyseVolume = (): void => {
			if (this.analyser === undefined || this.dataArray === undefined) {
				return
			}

			this.analyser.getByteFrequencyData(this.dataArray)
			let sum = 0
			for (let i = 0; i < this.dataArray.length; i++) {
				sum += this.dataArray[ i ]
			}

			const average = sum / this.dataArray.length
			const normalizedVolume = Math.min(Math.max(average / 128, 0), 1)
			this.callbacks.onVolume(normalizedVolume * 100)

			if (this.isRecording) {
				this.animationId = window.requestAnimationFrame(analyseVolume)
			}
		}

		this.animationId = window.requestAnimationFrame(analyseVolume)
	}

	private stopVolumeAnalysis(): void {
		if (this.animationId !== undefined) {
			window.cancelAnimationFrame(this.animationId)
			this.animationId = undefined
		}
	}
}