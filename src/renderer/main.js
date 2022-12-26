import Vue from 'vue'
import App from './App.vue'
import router from './router'
// import store from './store'

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

import VirtualCollection from 'vue-virtual-collection'
Vue.use(VirtualCollection)

if (window.electron) {
	Vue.prototype.$fileEncoder = window.electron.fileEncoder;
	Vue.prototype.$dialog = window.electron.dialog;
	Vue.prototype.$storage = window.electron.storage;
	Vue.prototype.$remoteControl = window.electron.remoteControl;
}

Vue.config.productionTip = false

new Vue({
	router,
	// store,
	render: h => h(App)
}).$mount('#app')
