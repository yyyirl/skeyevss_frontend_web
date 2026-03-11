import React from 'react'
import ReactDOM from 'react-dom/client'
import { renderRoutes, type RouteConfig } from 'react-router-config'
import { BrowserRouter as BR } from 'react-router-dom'

import 'dayjs/locale/zh-cn'
import dayjs from 'dayjs'

import { RecoilRoot } from 'recoil'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import 'animate.css'
import 'owl.carousel/dist/assets/owl.carousel.css'
import 'owl.carousel/dist/assets/owl.theme.default.css'

import '#assets/css/common.css'
import '#assets/scss/base.scss'

import routes from '#routers'
import { isChrome87OrEarlier } from '#utils/functions'

dayjs.locale('zh-cn')

console.log(import.meta.env.VITE_ENV)
console.log(import.meta.env.VITE_BUILD_DATE)

if (isChrome87OrEarlier()) {
	window.alert(`您好，您的浏览器版本过低，无法兼容，请您使用最新版本的火狐浏览器或谷歌浏览器，带给您更加流畅安全的访问体验
请访问 https://www.firefox.com.cn 下载最新版本火狐浏览器或者
访问 https://www.google.cn/chrome 下载最新版本谷歌浏览器`)
}

NProgress.configure({ easing: 'ease', showSpinner: false })

// TODO 版本兼容
const BrowserRouter = BR as any

const root = document.getElementById('root')
if (root === null) {
	throw new Error('root is null')
}

ReactDOM.createRoot(root).render(
	<BrowserRouter>
		<RecoilRoot>
			{ renderRoutes(routes as RouteConfig[]) }
		</RecoilRoot>
	</BrowserRouter>
)
