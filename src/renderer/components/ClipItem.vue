<template>
	<div class="clip-wrapper position-relative rounded bg-light p-3 square">
		<div
			class="clip-container rounded position-absolute w-100 h-100 d-flex flex-column justify-content-center p-3"
			:class="{
				'bg-primary': playbackState == 1,
				'bg-warning': playbackState == 2
			}"
		>

			<div class="clip-name-container overflow-hidden" :class="{'marquee': needsClipNameMarquee || needsArtistNameMarquee}">
				<div class="clip-name d-flex flex-nowrap mx-3">
					<span class="flex-fill d-block text-center text-nowrap clip-name-primary">{{ clip.name }}</span>
					<span class="flex-fill d-block text-center text-nowrap clip-name-secondary" v-if="needsClipNameMarquee">{{ clip.name }}</span>
				</div>

				<div class="clip-artist-name text-muted d-flex flex-nowrap mx-3" v-if="clip.artist?.length">
					<span class="flex-fill d-block text-center text-nowrap clip-artist-name-primary">{{ clip.artist || "&nbsp;" }}</span>
					<span class="flex-fill d-block text-center text-nowrap clip-artist-name-secondary" v-if="needsArtistNameMarquee">{{ clip.artist || "&nbsp;" }}</span>
				</div>
			</div>

			<div class="clip-play-area position-absolute w-100 h-100" />

			<div class="clip-indicator-area position-absolute w-100 h-100 d-flex align-items-start p-1">
				<button
					class="clip-favorite-button btn p-0 px-1 me-auto text-muted"
					:class="{'visible': isFavorite || isInFavoriteSection}"
					type="button"
					style="pointer-events: all"
					@click="toggleFavorite"
				>
					<i class="bi bi-star-fill text-warning" v-if="isFavorite || isInFavoriteSection" />
					<i class="bi bi-star" v-else />
				</button>

				<button
					class="clip-playback-indicator btn p-0 px-1 me-auto text-muted d-none"
					:class="{'visible': isFavorite || isInFavoriteSection}"
					type="button"
				>
					<i class="bi bi-arrow-right" v-if="clip.playbackMode == 0" />
					<i class="bi bi-box-arrow-right" v-if="clip.playbackMode == 1" />
					<i class="bi bi-pause-btn" v-if="clip.playbackMode == 2" />
					<i class="bi bi-power" v-if="clip.playbackMode == 3" />
					<i class="bi bi-repeat" v-if="clip.playbackMode == 4" />
				</button>

				<div class="dropdown clip-options-dropdown" style="pointer-events: all">
					<button class="btn p-0 px-1 text-muted" type="button" data-bs-toggle="dropdown" aria-expanded="false">
						<i class="bi bi-three-dots" />
					</button>
					<ul class="dropdown-menu no-drag">
						<li><h6 class="dropdown-header">Play Mode</h6></li>
						<li>
							<a class="dropdown-item d-flex" href="#" @click.prevent="() => setPlaybackMode(0)">
								<label class="flex-fill">Trigger</label>
								<i class="bi bi-check-lg ms-2 text-primary" v-show="clip.playbackMode === 0" />
							</a>
						</li>
						<li>
							<a class="dropdown-item d-flex" href="#" @click.prevent="() => setPlaybackMode(1)">
								<label class="flex-fill">Hold</label>
								<i class="bi bi-check-lg ms-2 text-primary" v-show="clip.playbackMode === 1" />
							</a>
						</li>
						<li>
							<a class="dropdown-item d-flex" href="#" @click.prevent="() => setPlaybackMode(2)">
								<label class="flex-fill">Play/Pause</label>
								<i class="bi bi-check-lg ms-2 text-primary" v-show="clip.playbackMode === 2" />
							</a>
						</li>
						<li>
							<a class="dropdown-item d-flex" href="#" @click.prevent="() => setPlaybackMode(3)">
								<label class="flex-fill">On/Off</label>
								<i class="bi bi-check-lg ms-2 text-primary" v-show="clip.playbackMode === 3" />
							</a>
						</li>
						<li>
							<a class="dropdown-item d-flex" href="#" @click.prevent="() => setPlaybackMode(4)">
								<label class="flex-fill">Loop</label>
								<i class="bi bi-check-lg ms-2 text-primary" v-show="clip.playbackMode === 4" />
							</a>
						</li>
						<template v-if="!isInFavoriteSection">
							<li><hr class="dropdown-divider" /></li>
							<li><a class="dropdown-item text-danger" href="#" @click.prevent="deleteClip">Delete</a></li>
						</template>
					</ul>
				</div>
			</div>
		</div>
	</div>
</template>

<style lang="less">
.clip-container {
	top: 0;
	left: 0;
	background-color: var(--bs-light);
	transition: background-color ease-out 0.2s;
	cursor: pointer;

	&:not(:hover) {
		.clip-favorite-button,
		.clip-options-dropdown button[data-bs-toggle]:not(.show) {
			visibility: hidden;
		}
	}

	.clip-name-container {
		position: relative;
		margin: 0 -1em;
		pointer-events: none;
		z-index: 0;
		user-select: none;
		-moz-user-select: none;
		-webkit-user-select: none;
		color: inherit;

		&.marquee {
			background: inherit;

			&:before {
				content: '';
				position: absolute;
				top: 0;
				left: 0;
				height: 100%;
				width: 1em;
				background: inherit;
				// background-image: linear-gradient(to right, var(--bs-light), var(--bs-light) 50%, rgba(var(--bs-light-rgb), 0));
				mask-image: linear-gradient(to left, transparent, black 50%, black);
				z-index: 2;
			}

			&:after {
				content: '';
				position: absolute;
				top: 0;
				right: 0;
				height: 100%;
				width: 1em;
				background: inherit;
				// background-image: linear-gradient(to left, var(--bs-light), var(--bs-light) 50%, rgba(var(--bs-light-rgb), 0));
				mask-image: linear-gradient(to right, transparent, black 50%, black);
				z-index: 2;
			}
		}

		.clip-name-secondary,
		.clip-artist-name-secondary {
			margin-left: 30px;
		}
	}

	.clip-play-area {
		top: 0;
		left: 0;
	}

	.clip-indicator-area {
		top: 0;
		left: 0;
		pointer-events: none;

		.clip-favorite-button {
			position: absolute;
			top: .25rem;
			left: .25rem;
		}

		.clip-playback-indicator {
			position: absolute;
			bottom: .25rem;
			left: .25rem;
		}

		.clip-options-dropdown {
			position: absolute;
			top: .25rem;
			right: .25rem;
		}
	}

	&.bg-primary {
		color: #fff;

		.text-muted {
			color: #ebebef99 !important;
		}
	}
}

.edit-mode {
	.clip-play-area {
		pointer-events: none;
	}
}
</style>

<script>
import anime from 'animejs'

import PLAYBACK_MODE from '@/scripts/PlaybackMode'
import PLAYBACK_STATE from '@/scripts/PlaybackState'

const debounce = (context, func, delay) => {
	let timeout;

	return () => {
		if (timeout) {
			clearTimeout(timeout);
		}

		timeout = setTimeout(() => {
			func.apply(context);
		}, delay);
	};
};

export default {
	props: ["clip", "isFavorite", "isInFavoriteSection", "sinkId", "volume", "playbackState"],
	data() {
		return {
			clipData: { ...this.clip },

			// playbackState: 0,

			needsClipNameMarquee: false,
			needsArtistNameMarquee: false,

			clipNameAnimation: null,
			artistNameAnimation: null,

			clipNameAnimationPlaying: false,
			artistNameAnimationPlaying: false,
		}
	},
	mounted() {
		this.$el.addEventListener("mouseenter", () => {
			this.updateMarquee();

			if (this.needsClipNameMarquee) {
				this.clipNameAnimationPlaying = true;
				this.clipNameAnimation.play();
			}

			if (this.needsArtistNameMarquee) {
				this.artistNameAnimationPlaying = true;
				this.artistNameAnimation.play();
			}
		});

		this.$el.addEventListener("mouseleave", () => {
			// if (this.needsClipNameMarquee) {
			// 	this.clipNameAnimation.reset();
			// }

			// if (this.needsArtistNameMarquee) {
			// 	this.artistNameAnimation.reset();
			// }

			this.clipNameAnimationPlaying = false;
			this.artistNameAnimationPlaying = false;
		});

		this.updateMarquee();
		window.addEventListener("resize", debounce(this, this.updateMarquee.bind(this), 100));

		let playArea = this.$el.querySelector(".clip-play-area");

		playArea.addEventListener("contextmenu", (e) => { e.preventDefault() });
		playArea.addEventListener("ontouchend" in window ? "touchstart" : "mousedown", this.play.bind(this));
		playArea.addEventListener("ontouchend" in window ? "touchend" : "mouseup", () => {
			this.stop();
		});
	},
	methods: {
		toggleFavorite() {
			this.$emit("favorited", this.clip.id);
		},
		deleteClip() {
			this.$emit("deleted", this.clip.id);
		},
		setPlaybackMode(mode) {
			this.stop(true);
			this.clipData.playbackMode = mode;

			this.$emit("updated", this.clip.id, this.clipData);
		},

		updateMarquee() {
			this.needsClipNameMarquee = this.clip.name?.length && this.$el.querySelector(".clip-name").clientWidth < this.$el.querySelector(".clip-name-primary").clientWidth;
			this.needsArtistNameMarquee = this.clip.artist?.length && this.$el.querySelector(".clip-artist-name").clientWidth < this.$el.querySelector(".clip-artist-name-primary").clientWidth;

			if (this.needsClipNameMarquee) {
				if (!this.clipNameAnimation) {
					this.clipNameAnimation = new anime.timeline({
						duration: ((this.$el.querySelector(".clip-name-primary").scrollWidth + 30) / 45) * 1000, // length / (px/s) * 1000ms
						easing: "linear",
						autoplay: false,
						loop: true,
						loopComplete: () => {
							if (!this.clipNameAnimationPlaying) {
								this.clipNameAnimation.reset();
							}
						}
					}).add({
						targets: this.$el.querySelector(".clip-name"),
						translateX: [0, -(this.$el.querySelector(".clip-name-primary").scrollWidth + 30)]
					}).add({
						targets: [],
						translateX: [0, 0],
						duration: 2000
					});
				}
			} else {
				this.clipNameAnimation?.reset();
			}

			if (this.needsArtistNameMarquee) {
				if (!this.artistNameAnimation) {
					this.artistNameAnimation = new anime.timeline({
						duration: ((this.$el.querySelector(".clip-artist-name-primary").scrollWidth + 30) / 45) * 1000, // length / (px/s) * 1000ms
						easing: "linear",
						autoplay: false,
						loop: true,
						loopComplete: () => {
							if (!this.artistNameAnimationPlaying) {
								this.artistNameAnimation.reset();
							}
						}
					}).add({
						targets: this.$el.querySelector(".clip-artist-name"),
						translateX: [0, -(this.$el.querySelector(".clip-artist-name-primary").scrollWidth + 30)]
					}).add({
						targets: [],
						translateX: [0, 0],
						duration: 2000
					});
				}
			} else {
				this.artistNameAnimation?.reset();
			}
		},

		play(e) {
			e.preventDefault();

			if (e?.button == 2 || e?.touches?.length > 1) {
				this.stop(true);
				return;
			}

			switch (this.clip.playbackMode) {
				case PLAYBACK_MODE.PlayPause:
					if (this.playbackState == PLAYBACK_STATE.Playing) {
						this.$emit("pause", this.clip.id);
					} else {
						this.$emit("play", this.clip.id);
					}
					break;
				case PLAYBACK_MODE.OnOff:
				case PLAYBACK_MODE.Loop:
					if (this.playbackState == PLAYBACK_STATE.Playing) {
						this.$emit("stop", this.clip.id);
					} else {
						this.$emit("play", this.clip.id);
					}
					break;
				default:
					this.$emit("play", this.clip.id, 0);
					break;
			}
		},
		pause() {
			this.$emit("pause", this.clip.id);
		},
		stop(force) {
			if (this.clip.playbackMode == PLAYBACK_MODE.Hold || force) {
				this.$emit("stop", this.clip.id);
			}
		}
	},
	watch: {
		clip(value, oldValue) {
			this.stop();
			this.clipData = { ...value }
		},
	}
}
</script>