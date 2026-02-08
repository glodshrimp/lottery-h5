import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const routes = [
    {
        path: '/',
        name: 'CheckIn',
        component: () => import('../views/CheckIn.vue'),
        meta: { title: '签到' }
    },
    {
        path: '/admin',
        name: 'Admin',
        component: () => import('../views/Admin.vue'),
        meta: { title: '抽奖管理' }
    },
    {
        path: '/display',
        name: 'Display',
        component: () => import('../views/Display.vue'),
        meta: { title: '抽奖大屏' }
    }
]

const router = new VueRouter({
    mode: 'hash',
    base: process.env.BASE_URL,
    routes
})

router.beforeEach((to, from, next) => {
    document.title = to.meta.title ? `${to.meta.title} - 幸运抽奖` : '幸运抽奖'
    next()
})

export default router
