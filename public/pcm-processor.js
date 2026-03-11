// pcm-processor.js
class PCMProcessor extends AudioWorkletProcessor {
    constructor(options) {
        super()

        this.config = options.processorOptions || {
            inputSampleRate: 48000,
            outputSampleRate: 8000,
            inputSampleBits: 16,
            outputSampleBits: 16,
        }

        this.resampleBuffer = []
        this.resampleOffset = 0
    }

    process(inputs, outputs, parameters) {
        const input = inputs[ 0 ]
        if (!input || input.length === 0) return true

        const inputData = input[ 0 ]

        // 采样率转换
        let resampledData
        if (this.config.inputSampleRate === this.config.outputSampleRate) {
            resampledData = inputData
        } else {
            resampledData = this.resampleLinear(
                inputData,
                this.config.inputSampleRate,
                this.config.outputSampleRate,
            )
        }

        // 位深转换
        let outputBuffer
        if (this.config.outputSampleBits === 8) {
            outputBuffer = this.floatTo8BitPCM(resampledData)
        } else {
            const int16Array = this.floatTo16BitPCM(resampledData)
            outputBuffer = new Uint8Array(int16Array.buffer)
        }

        // 发送处理后的数据
        if (outputBuffer && outputBuffer.length > 0) {
            this.port.postMessage({ buffer: outputBuffer.buffer }, [ outputBuffer.buffer ])
        }

        return true
    }

    resampleLinear(input, inputRate, outputRate) {
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

    floatTo8BitPCM(float32Array) {
        const uint8Array = new Uint8Array(float32Array.length)
        for (let i = 0; i < float32Array.length; i++) {
            const sample = Math.max(-1, Math.min(1, float32Array[ i ]))
            uint8Array[ i ] = Math.floor((sample + 1) * 127.5)
        }
        return uint8Array
    }

    floatTo16BitPCM(float32Array) {
        const int16Array = new Int16Array(float32Array.length)
        for (let i = 0; i < float32Array.length; i++) {
            const sample = Math.max(-1, Math.min(1, float32Array[ i ]))
            int16Array[ i ] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF
        }
        return int16Array
    }
}

registerProcessor('pcm-processor', PCMProcessor)