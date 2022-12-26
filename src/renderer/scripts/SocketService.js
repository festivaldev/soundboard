import Vue from "vue";

export const SocketService = new Vue({
	data: {
		url: null,
		socket: null,

		connectionPromiseResolve: null,
		connectionPromiseReject: null,

		reconnectInterval: null
	},
	methods: {
		connect(url) {
			if (this.socket && (this.socket.readyState === WebSocket.CONNECTING || this.socket.readyState === WebSocket.OPEN)) return;

			this.url = url;
			this.socket = new WebSocket(url);
			this.socket.addEventListener("open", this.onOpen);
			this.socket.addEventListener("close", this.onClose);
			this.socket.addEventListener("error", this.onError);
			this.socket.addEventListener("message", data => this.onMessage(data));

			return new Promise((resolve, reject) => {
				this.connectionPromiseResolve = resolve;
				this.connectionPromiseReject = reject;
			});
		},
		close() {
			if (this.socket) {
				this.socket.close();
				this.socket = null;
			}
		},

		onOpen(event) {
			console.info("[WebSocket] WebSocket opened");
			this.$emit("connected", event);

			if (this.reconnectInterval) {
				clearInterval(this.reconnectInterval);
				this.reconnectInterval = null;
			}

			if (this.connectionPromiseResolve) {
				this.connectionPromiseResolve();

				this.connectionPromiseResolve = null;
				this.connectionPromiseReject = null;
			}

			this.$emit("open", event);
		},
		onClose(event) {
			if (!event.wasClean) {
				console.info("[WebSocket] WebSocket closed, reconnecting");

				if (!this.reconnectInterval) {
					this.reconnectInterval = setInterval(() => {
						this.connect(this.url);
					}, 3000);
				}
			} else {
				console.info("[WebSocket] WebSocket closed");
			}

			this.socket = null;

			this.$emit("close", event);
		},
		onError(error) {
			console.log(error);
			this.socket.close();
			this.socket = null;

			if (this.connectionPromiseReject) {
				this.connectionPromiseReject();

				this.connectionPromiseResolve = null;
				this.connectionPromiseReject = null;
			}

			this.$emit("error", error);
		},
		onMessage(event) {
			try {
				this.$emit("message", JSON.parse(event.data));
				return;
			} catch (error) {}

			this.$emit("message", event.data);
		},
		send(data) {
			if (!this.socket || this.socket.readyState != WebSocket.OPEN) return;

			try {
				this.socket.send(JSON.stringify(data));
				return;
			} catch (error) {}

			this.socket.send(data);
		}
	}
});