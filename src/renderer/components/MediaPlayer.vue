<template>
	<div class="d-none">
		<audio
			v-for="(clip, clipId, index) in queue"
			:key="clipId"

			:data-clip-id="clipId"
			:ref="clipId"

			@loadeddata="clipLoaded"
			@play="clipStarted"
			@pause="clipPaused"
			@ended="clipEnded"
		>
			<source :src="clip.base64" />
		</audio>
	</div>
</template>

<script>
import PLAYBACK_MODE from '@/scripts/PlaybackMode'
import PLAYBACK_STATE from '@/scripts/PlaybackState'

export default {
	props: {
		value: null,
		sinkId: {
			type: String,
			default: "default"
		},
		volume: {
			type: String | Number,
			default: 1.0
		}
	},
	data() {
		return {
			queue: {}
		}
	},
	methods: {
		async play(clipData) {
			if (!this.queue[clipData.id]) {
				let base64 = clipData.base64 || await this.$fileEncoder.getEncodedFile(clipData);

				this.queue[clipData.id] = {
					...clipData,
					base64,
					playbackState: PLAYBACK_STATE.Stopped
				}

				this.$emit("input", this.queue);
			} else {
				this.$refs[clipData.id][0].currentTime = 0;
				this.$refs[clipData.id][0].play();
			}
		},
		playPause(clipId) {
			if (this.$refs[clipId]) {
				if (!this.$refs[clipId][0].paused) {
					this.$refs[clipId][0].pause();
				} else {
					this.$refs[clipId][0].play();
				}
			}
		},
		stop(clipId) {
			delete this.queue[clipId];
			this.$emit("input", this.queue);
		},

		clipLoaded(e) {
			e.target.setSinkId(this.sinkId);
			e.target.volume = this.volume;

			e.target.play();
		},
		clipStarted(e) {
			this.queue[e.target.getAttribute("data-clip-id")].playbackState = PLAYBACK_STATE.Playing;

			this.$emit("input", this.queue);
		},
		clipPaused(e) {
			if (e.target.currentTime < e.target.duration) {
				this.queue[e.target.getAttribute("data-clip-id")].playbackState = PLAYBACK_STATE.Paused;
				this.$emit("input", this.queue);
			}
		},
		clipEnded(e) {
			let clip = this.queue[e.target.getAttribute("data-clip-id")];

			if (clip.playbackMode == PLAYBACK_MODE.Loop) {
				e.target.currentTime = 0;
				e.target.play()
			} else {
				delete this.queue[clip.id];
				this.$emit("input", this.queue);
			}
		}
	},
	watch: {
		value(newValue, oldValue) {
			this.queue = {...newValue}
		},
		sinkId(newValue, oldValue) {
			Object.values(this.queue).forEach((clip, index) => {
				this.$refs[clip.id][0].setSinkId(newValue)
			});
		},
		volume(newValue, oldValue) {
			Object.values(this.queue).forEach((clip, index) => {
				this.$refs[clip.id][0].volume = newValue
			});
		}
	}
}
</script>