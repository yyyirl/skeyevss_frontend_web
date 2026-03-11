import React, { useEffect, useRef } from 'react'
import { Button, Checkbox, ConfigProvider, Form, Input, theme as ANTDTheme } from 'antd'
import type { FormInstance } from 'antd/es/form'
import zhCN from 'antd/locale/zh_CN'
import dayjs from 'dayjs'
import { useHistory } from 'react-router-dom'
import useFetchState from '#repositories/models'
import { Profile, Theme } from '#repositories/models/recoil-state'
import { type BaseConfigs, baseConfigs } from '#repositories/apis/base'
import { Enter } from '#utils/events'
import Icon from '#components/icon'
import { ReactComponent as Lock } from '#assets/svg/lock.svg'
import { ReactComponent as User } from '#assets/svg/user.svg'
import { type LoginFieldType, passwordRule, success, usernameRule, wrapperCol } from './model'
import { login } from './apis'
import { isEmpty } from '#utils/functions'

const { Item } = Form

const Main: React.FC = () => {
	const theme = new Theme()
	const themeParams = { algorithm: theme.state === Theme.dark ? ANTDTheme.darkAlgorithm : undefined }
	const history = useHistory()
	const profile = new Profile()
	const formRef = useRef<LoginFieldType | null>(null)
	const ref = useRef<FormInstance | null>(null)
	// 提交按钮加载
	const [ loading, setLoading ] = useFetchState(false)
	const [ baseConfigsState, setBaseConfigsState ] = useFetchState<BaseConfigs>({
		title: '后台',
		website: ''
	})
	// 回车提交
	const EnterKeyDown = (e: React.KeyboardEvent): void => {
		Enter({
			e,
			callback: () => {
				if (ref.current === null) {
					return
				}
				ref.current.submit()
			}
		})
	}
	// 提交登录
	const submit = (values: LoginFieldType): void => {
		formRef.current = values
		setLoading(true)
		void login({
			username: formRef.current?.username ?? '',
			password: formRef.current?.password ?? '',
			remember: formRef.current?.remember ?? false
		}).then(
			res => {
				if (res.data === undefined) {
					return
				}
				success({
					history, data: res.data, profile
				})
			}
		).finally(
			() => {
				setLoading(false)
			}
		)
	}

	useEffect(
		() => {
			// 获取设置
			void baseConfigs().then(
				res => {
					setBaseConfigsState(res.data)
				}
			)
		},
		[]
	)

	useEffect(
		() => {
			if (!isEmpty(baseConfigsState[ 'showcase-password' ]) && !isEmpty(baseConfigsState[ 'showcase-username' ])) {
				ref.current?.setFieldValue('username', baseConfigsState[ 'showcase-username' ])
				ref.current?.setFieldValue('password', baseConfigsState[ 'showcase-password' ])
			}
		},
		[ baseConfigsState ]
	)

	return <ConfigProvider locale={ zhCN } theme={ themeParams }>
		<div
			className={ `relative login-container ${ theme.state === Theme.dark ? 'layout-dark' : '' }` }
			onKeyDown={
				e => {
					EnterKeyDown(e)
				}
			}
		>
			<div className="abs-center login-box">
				<h3 className="font-center title">欢迎登陆{ baseConfigsState.title.replace('管理系统', '') }管理系统</h3>
				<Form
					name="basic"
					onFinish={ submit }
					autoComplete="on"
					ref={ ref }
				>
					<Item<LoginFieldType>
						name="username"
						rules={ usernameRule('请输入用户名') }
						wrapperCol={ wrapperCol }
					>
						<Input
							className="username"
							allowClear
							prefix={ <Icon tap><User /></Icon> }
							placeholder="请输入用户名"
						/>
					</Item>
					<Item<LoginFieldType>
						name="password"
						rules={ passwordRule('请输入密码') }
						wrapperCol={ wrapperCol }
					>
						<Input.Password
							className="password"
							prefix={ <Icon><Lock /></Icon> }
							visibilityToggle={ { visible: false } }
							placeholder="请输入密码"
						/>
					</Item>
					<Item wrapperCol={ wrapperCol } className="mb0">
						<Button
							type="primary"
							htmlType="submit"
							className="submit background-button"
							loading={ loading }
						>登录</Button>
					</Item>
					<Item<LoginFieldType> name="remember" valuePropName="checked" wrapperCol={ wrapperCol } className="mb0 convenient-ext">
						<div className="wh100 flex">
							<Checkbox className="color-cb remember">记住我</Checkbox>
						</div>
					</Item>
				</Form>
			</div>
			<div data-v-e81f8c56="" className="copyright-box">
				<span>Copyright © { dayjs().format('YYYY') }</span>
				{
					isEmpty(baseConfigsState.website)
						? <></>
						: <a target="_target" href={ `http://${ baseConfigsState.website }` } className="icon-box"> { baseConfigsState.website }</a>
				}
				<span> All Rights Reserved</span></div>
		</div>
	</ConfigProvider>
}

export default Main
