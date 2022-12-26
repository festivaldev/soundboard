import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter);

const routes = [
	{
		path: '/',
		name: 'master',
		component: () => import(/* webpackChunkName: "master" */ './views/Master.vue')
	},
	{
		path: '/client',
		name: 'client',
		component: () => import(/* webpackChunkName: "client" */ './views/Client.vue')
	}
]

const router = new VueRouter({
	routes
});

router.beforeEach(async (to, from, next) => {
	if (!window.electron && to.path !== "/client") {
		return next({
			path: "/client",
			replace: true
		});
	}

	return next();
});

export default router
