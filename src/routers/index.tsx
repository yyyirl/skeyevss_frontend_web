import React from 'react'
import { type RouteConfig, type RouteConfigComponentProps } from 'react-router-config'
import sites from './sites'
import Login from '#pages/signin/login'
import Layout from '#components/layout'
import routeMaps from './constants'

const routes: RouteConfig = [
	{
		title: `${ import.meta.env.VITE_TITLE }-${ routeMaps.login.title }`,
		path: routeMaps.login.path,
		exact: true,
		render: () => <Login />
	},
	{
		title: import.meta.env.VITE_TITLE,
		path: '/',
		render: (props: RouteConfigComponentProps<any>): React.ReactElement => <Layout
			{ ...props }
			routes={ sites as RouteConfig[] }
		/>
	}
]
export default routes
