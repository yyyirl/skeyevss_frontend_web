import React, { useEffect } from 'react'
import { type XRouteComponentProps } from '#routers/sites'
import useFetchState from '#repositories/models'
import { VssSevState } from '#repositories/apis/base'
import { Setting as SSetting } from '#repositories/models/recoil-state'

interface VssSevItem {
	title: string
	num: number
}

const Main: React.FC<XRouteComponentProps> = () => {
	const settingState = new SSetting().shared()
	const vssSseUrl = settingState?.vssSseUrl ?? ''
	const [ records, setRecords ] = useFetchState<VssSevItem[]>([])

	useEffect(
		() => {
			if (vssSseUrl === '') {
				return
			}

			const es = VssSevState(
				vssSseUrl,
				res => {
					const { data } = JSON.parse(res.data) as { data: VssSevItem[] }
					setRecords(data)
				}
			)

			return () => {
				es.close()
			}
		},
		[ vssSseUrl ]
	)

	return <div className="sip-logs">
		<div className="item">
			{
				records.map(
					(item, index) => <p key={ index }><span>{ item.title }</span>: <span>{ item.num }</span></p>
				)
			}
		</div>
	</div>
}

export default Main